import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatMessage from '@/models/ChatMessage';
import CustomerUser from '@/models/CustomerUser';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// GET: 파트너의 메시지 목록 (고객별 그룹화) - ChatRoom 기반
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const partnerId = verification.partnerId.toString();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // 특정 고객과의 대화만 조회

    // 파트너의 채팅방 목록 조회
    let rooms = await ChatRoom.find({
      partnerId: partnerId,
      isActive: true,
      ...(userId ? { customerId: userId } : {}),
    })
      .sort({ 
        lastMessageAt: -1, 
        updatedAt: -1,
        createdAt: -1 
      })
      .lean();

    // 특정 고객과의 대화인 경우 메시지 목록 반환
    if (userId) {
      let room = rooms.find((r: any) => r.customerId === userId);
      if (!room) {
        return NextResponse.json({
          success: true,
          data: {
            customer: null,
            messages: [],
          },
        });
      }

      // 고객 정보 조회
      const customer = await CustomerUser.findById(room.customerId).lean();
      
      // 메시지 목록 조회
      const messages = await ChatMessage.find({
        roomId: room._id.toString(),
      })
        .sort({ createdAt: 1 })
        .lean();

      // 파트너가 읽지 않은 메시지를 읽음 처리
      const unreadMessages = messages.filter((m: any) => 
        !m.isRead && m.senderType === 'customer'
      );
      
      if (unreadMessages.length > 0) {
        await ChatMessage.updateMany(
          { _id: { $in: unreadMessages.map((m: any) => m._id) } },
          { isRead: true, readAt: new Date() }
        );
        
        // 채팅방의 partnerUnreadCount 업데이트
        const newUnreadCount = Math.max(0, (room.partnerUnreadCount || 0) - unreadMessages.length);
        await ChatRoom.findByIdAndUpdate(room._id, {
          $set: { partnerUnreadCount: newUnreadCount },
        });
        
        // 업데이트된 room 정보 다시 조회
        const updatedRoom = await ChatRoom.findById(room._id).lean();
        if (updatedRoom) {
          room = updatedRoom as any;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          customer: {
            userId: room.customerId,
            userName: customer?.name || '고객',
            userPhone: customer?.phone || '',
          },
          messages: messages.map((msg: any) => ({
            id: msg._id.toString(),
            content: msg.message,
            sender: msg.senderType === 'customer' ? 'user' : 'partner',
            createdAt: msg.createdAt.toISOString(),
            read: msg.isRead,
          })),
        },
      });
    }

    // 모든 채팅방 목록 반환 (고객별 그룹화)
    // 최신 상태를 가져오기 위해 다시 조회 (읽음 처리가 반영된 상태)
    const latestRooms = await ChatRoom.find({
      partnerId: partnerId,
      isActive: true,
    })
      .sort({ 
        lastMessageAt: -1, 
        updatedAt: -1,
        createdAt: -1 
      })
      .lean();

    const customerMap = new Map<string, {
      userId: string;
      userName: string;
      userPhone?: string;
      lastMsg: string;
      lastMsgTime: Date;
      unread: number;
    }>();

    for (const room of latestRooms) {
      const roomId = room._id.toString();
      const customerId = room.customerId;

      // 고객 정보 조회
      const customer = await CustomerUser.findById(customerId).lean();

      const lastMessageAt = room.lastMessageAt || room.updatedAt || room.createdAt || new Date();
      const lastMsg = room.lastMessage || '';
      const unread = room.partnerUnreadCount || 0;

      customerMap.set(customerId, {
        userId: customerId,
        userName: customer?.name || '고객',
        userPhone: customer?.phone || '',
        lastMsg: lastMsg,
        lastMsgTime: lastMessageAt instanceof Date ? lastMessageAt : new Date(lastMessageAt),
        unread: unread,
      });
    }

    // 고객별로 정렬 (최근 메시지 기준)
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.lastMsgTime.getTime() - a.lastMsgTime.getTime());

    return NextResponse.json({
      success: true,
      data: customers.map(c => ({
        userId: c.userId,
        userName: c.userName,
        userPhone: c.userPhone,
        lastMsg: c.lastMsg,
        lastMsgTime: c.lastMsgTime.toISOString(),
        unread: c.unread,
      })),
    });
  } catch (error) {
    console.error('메시지 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// POST: 메시지 전송 - ChatRoom 및 ChatMessage 사용
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const partnerId = verification.partnerId.toString();
    const body = await request.json();
    const { userId, content, shopId } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 채팅방 찾기 또는 생성
    let room = await ChatRoom.findOne({
      customerId: userId,
      partnerId: partnerId,
      ...(shopId ? { shopId: shopId } : {}),
    });

    // shopId가 없거나 매칭되지 않으면, customerId + partnerId만으로도 확인
    if (!room) {
      room = await ChatRoom.findOne({
        customerId: userId,
        partnerId: partnerId,
      });
    }

    // 채팅방이 없으면 생성
    if (!room) {
      // 고객 정보 조회
      const customer = await CustomerUser.findById(userId).lean();
      if (!customer) {
        return NextResponse.json(
          { success: false, error: '고객을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // Shop 정보 조회 (shopId가 있는 경우)
      let shopName = '매장';
      if (shopId) {
        try {
          const Shop = (await import('@/models/Shop')).default;
          const shop = await Shop.findById(shopId).lean();
          if (shop) {
            shopName = (shop as any).name || shopName;
          }
        } catch (error) {
          console.error('매장 정보 조회 오류:', error);
        }
      }

      room = new ChatRoom({
        customerId: userId,
        partnerId: partnerId,
        shopId: shopId || undefined,
        shopName: shopName,
        unreadCount: 0,
        partnerUnreadCount: 0,
        isActive: true,
      });
      await room.save();
    } else if (!room.isActive) {
      // 비활성화된 채팅방이면 활성화
      room.isActive = true;
      await room.save();
    }

    // 파트너 정보 조회 (senderName용)
    const PartnerUser = (await import('@/models/PartnerUser')).default;
    const partner = await PartnerUser.findById(partnerId).lean();
    const senderName = partner?.name || '파트너';

    // 메시지 생성
    const chatMessage = new ChatMessage({
      roomId: room._id.toString(),
      senderId: partnerId,
      senderType: 'partner',
      senderName: senderName,
      message: content.trim(),
      messageType: 'text',
      isRead: false,
    });

    await chatMessage.save();

    // 채팅방 업데이트 (마지막 메시지, 고객 unreadCount 증가)
    await ChatRoom.findByIdAndUpdate(room._id, {
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
      $inc: { unreadCount: 1 },
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: '메시지가 전송되었습니다.',
      data: {
        id: chatMessage._id.toString(),
        content: chatMessage.message,
        sender: 'partner',
        createdAt: chatMessage.createdAt.toISOString(),
        read: chatMessage.isRead,
      },
    });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH: 모두 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const partnerId = verification.partnerId.toString();
    const body = await request.json();
    const { action } = body;

    if (action === 'mark_all_read') {
      // 파트너의 모든 채팅방 조회
      const rooms = await ChatRoom.find({
        partnerId: partnerId,
        isActive: true,
      }).lean();

      let totalUnreadMessages = 0;

      // 모든 채팅방의 읽지 않은 메시지 읽음 처리
      for (const room of rooms) {
        const unreadMessages = await ChatMessage.find({
          roomId: room._id.toString(),
          senderType: 'customer',
          isRead: false,
        }).lean();

        if (unreadMessages.length > 0) {
          await ChatMessage.updateMany(
            { _id: { $in: unreadMessages.map((m: any) => m._id) } },
            { isRead: true, readAt: new Date() }
          );

          // 채팅방의 partnerUnreadCount를 0으로 설정
          await ChatRoom.findByIdAndUpdate(room._id, {
            $set: { partnerUnreadCount: 0 },
          });

          totalUnreadMessages += unreadMessages.length;
        }
      }

      return NextResponse.json({
        success: true,
        message: `모든 메시지를 읽음 처리했습니다. (${totalUnreadMessages}개)`,
        data: {
          totalMarkedRead: totalUnreadMessages,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 작업입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('모두 읽음 처리 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
