export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatMessage from '@/models/ChatMessage';
import Shop from '@/models/Shop';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 고객의 채팅방 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    // 고객의 채팅방 목록 조회 (최신 메시지 순)
    const rooms = await ChatRoom.find({
      customerId: customerId,
      isActive: true,
    })
      .sort({ 
        lastMessageAt: -1, 
        updatedAt: -1,
        createdAt: -1 
      })
      .limit(50)
      .lean(); // lean()으로 성능 향상
    
    // 각 채팅방의 매장 정보 조회
    const roomsWithShopInfo = await Promise.all(
      rooms.map(async (room: any) => {
        let shopName = room.shopName || '매장';
        let shopImageUrl = '';
        
        if (room.shopId) {
          try {
            const shop = await Shop.findById(room.shopId).lean();
            if (shop) {
              shopName = (shop as any).name || shopName;
              shopImageUrl = (shop as any).imageUrls && (shop as any).imageUrls.length > 0 
                ? (shop as any).imageUrls[0] 
                : '';
            }
          } catch (error) {
            console.error('매장 정보 조회 오류:', error);
          }
        }
        
        const lastMessageAt = room.lastMessageAt || room.updatedAt || room.createdAt || new Date();
        const createdAt = room.createdAt || new Date();
        const updatedAt = room.updatedAt || new Date();
        
        return {
          id: room._id?.toString() || '',
          customerId: room.customerId || '',
          partnerId: room.partnerId || '',
          shopId: room.shopId || '',
          shopName: shopName,
          shopImageUrl: shopImageUrl,
          lastMessage: room.lastMessage || '',
          lastMessageAt: lastMessageAt instanceof Date ? lastMessageAt.toISOString() : new Date(lastMessageAt).toISOString(),
          unreadCount: room.unreadCount || 0,
          createdAt: createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString(),
          updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : new Date(updatedAt).toISOString(),
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: roomsWithShopInfo,
      meta: {
        total: roomsWithShopInfo.length,
        unreadTotal: roomsWithShopInfo.reduce((sum, room) => sum + room.unreadCount, 0),
      },
    });
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('오류 상세:', errorMessage);
    return NextResponse.json(
      { 
        success: false,
        error: '채팅방 목록을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 모든 채팅방의 메시지를 읽음 처리
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'mark_all_read') {
      // 고객의 모든 채팅방 조회
      const rooms = await ChatRoom.find({ customerId: customerId, isActive: true });
      
      if (rooms.length === 0) {
        return NextResponse.json({ success: true, message: '읽지 않은 메시지가 없습니다.' });
      }
      
      const roomIds = rooms.map(room => room._id);
      
      // 모든 채팅방의 파트너 메시지를 읽음 처리
      await ChatMessage.updateMany(
        { roomId: { $in: roomIds }, senderType: 'partner', isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
      
      // 모든 채팅방의 unreadCount를 0으로 설정
      await ChatRoom.updateMany(
        { _id: { $in: roomIds } },
        { $set: { unreadCount: 0 } }
      );
      
      return NextResponse.json({ success: true, message: '모든 메시지를 읽음 처리했습니다.' });
    }
    
    return NextResponse.json({ success: false, error: '알 수 없는 액션입니다.' }, { status: 400 });
  } catch (error) {
    console.error('모든 메시지 읽음 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
