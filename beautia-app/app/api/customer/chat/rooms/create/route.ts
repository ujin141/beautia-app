export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import Shop from '@/models/Shop';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 채팅방 생성 (고객이 매장과 채팅 시작)
 */
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { partnerId, shopId } = body;
    
    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    
    // 기존 채팅방 확인 (customerId + partnerId 조합, shopId가 있으면 shopId도 확인)
    let room = await ChatRoom.findOne({
      customerId: customerId,
      partnerId: partnerId,
      ...(shopId ? { shopId: shopId } : {}),
    });
    
    // shopId가 없거나 매칭되지 않으면, customerId + partnerId만으로도 확인
    if (!room) {
      room = await ChatRoom.findOne({
        customerId: customerId,
        partnerId: partnerId,
      });
    }
    
    if (room) {
      // 기존 채팅방이 있으면 활성화하고 반환
      if (!room.isActive) {
        room.isActive = true;
        await room.save();
      }
      
      // 매장 정보 조회
      let shopName = room.shopName || '매장';
      let shopImageUrl = '';
      
      if (shopId || room.shopId) {
        try {
          const shop = await Shop.findById(shopId || room.shopId);
          if (shop) {
            shopName = shop.name;
            shopImageUrl = shop.imageUrls && shop.imageUrls.length > 0 
              ? shop.imageUrls[0] 
              : '';
          }
        } catch (error) {
          console.error('매장 정보 조회 오류:', error);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: room._id.toString(),
          customerId: room.customerId,
          partnerId: room.partnerId,
          shopId: room.shopId || shopId || '',
          shopName: shopName,
          shopImageUrl: shopImageUrl,
          lastMessage: room.lastMessage || '',
          lastMessageAt: room.lastMessageAt || room.updatedAt,
          unreadCount: room.unreadCount || 0,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        },
      });
    }
    
    // 새 채팅방 생성
    let shopName = '매장';
    let shopImageUrl = '';
    
    if (shopId) {
      try {
        const shop = await Shop.findById(shopId);
        if (shop) {
          shopName = shop.name;
          shopImageUrl = shop.imageUrls && shop.imageUrls.length > 0 
            ? shop.imageUrls[0] 
            : '';
        }
      } catch (error) {
        console.error('매장 정보 조회 오류:', error);
      }
    }
    
    room = new ChatRoom({
      customerId: customerId,
      partnerId: partnerId,
      shopId: shopId || undefined,
      shopName: shopName,
      unreadCount: 0,
      partnerUnreadCount: 0,
      isActive: true,
    });
    
    await room.save();
    
    return NextResponse.json({
      success: true,
      data: {
        id: room._id.toString(),
        customerId: room.customerId,
        partnerId: room.partnerId,
        shopId: room.shopId || '',
        shopName: shopName,
        shopImageUrl: shopImageUrl,
        lastMessage: '',
        lastMessageAt: room.createdAt,
        unreadCount: 0,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '채팅방 생성 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
