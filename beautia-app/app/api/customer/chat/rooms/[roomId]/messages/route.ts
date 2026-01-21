export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import ChatMessage from '@/models/ChatMessage';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';
import CustomerUser from '@/models/CustomerUser';

/**
 * 채팅방의 메시지 목록 조회 및 메시지 전송
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
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
    
    const params = await Promise.resolve(context.params);
    const roomId = params.roomId;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const before = request.nextUrl.searchParams.get('before'); // 페이지네이션용
    
    // 채팅방 확인
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    if (room.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 메시지 조회
    const query: any = { roomId: roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // 읽지 않은 메시지를 읽음 처리
    const unreadMessages = messages.filter(m => !m.isRead && m.senderType === 'partner');
    if (unreadMessages.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { isRead: true, readAt: new Date() }
      );
      
      // 채팅방의 unreadCount 업데이트
      const newUnreadCount = Math.max(0, (room.unreadCount || 0) - unreadMessages.length);
      await ChatRoom.findByIdAndUpdate(roomId, {
        $set: { unreadCount: newUnreadCount },
      });
    }
    
    // 메시지 형식 변환 (최신순이지만 반환은 오래된 순)
    const formattedMessages = messages
      .reverse()
      .map(msg => ({
        id: msg._id.toString(),
        roomId: msg.roomId,
        senderId: msg.senderId,
        senderType: msg.senderType,
        senderName: msg.senderName,
        message: msg.message,
        messageType: msg.messageType,
        imageUrl: msg.imageUrl || '',
        isRead: msg.isRead,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
      }));
    
    return NextResponse.json({
      success: true,
      data: formattedMessages,
      meta: {
        total: formattedMessages.length,
        hasMore: messages.length === limit,
        roomId: roomId,
      },
    });
  } catch (error) {
    console.error('메시지 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '메시지 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * 메시지 전송
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
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
    
    const params = await Promise.resolve(context.params);
    const roomId = params.roomId;
    const body = await request.json();
    const { message, messageType = 'text', imageUrl } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '메시지 내용을 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // 채팅방 확인
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    if (room.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 고객 정보 조회
    const customerUser = await CustomerUser.findById(customerId);
    const senderName = customerUser?.name || customer.email || '고객';
    
    // 메시지 생성
    const chatMessage = new ChatMessage({
      roomId: roomId,
      senderId: customerId,
      senderType: 'customer',
      senderName: senderName,
      message: message.trim(),
      messageType: messageType,
      imageUrl: imageUrl || undefined,
      isRead: false,
    });
    
    await chatMessage.save();
    
    // 채팅방 업데이트 (마지막 메시지, 파트너 unreadCount 증가)
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message.trim(),
      lastMessageAt: new Date(),
      $inc: { partnerUnreadCount: 1 },
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: chatMessage._id.toString(),
        roomId: chatMessage.roomId,
        senderId: chatMessage.senderId,
        senderType: chatMessage.senderType,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        messageType: chatMessage.messageType,
        imageUrl: chatMessage.imageUrl || '',
        isRead: chatMessage.isRead,
        createdAt: chatMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '메시지 전송 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
