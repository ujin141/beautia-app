import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import NotificationRead from '@/models/NotificationRead';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';
import mongoose from 'mongoose';

// GET: 고객용 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 고객 인증 확인
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
    
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const now = new Date();
    
    // 고객용 알림 조회 (target이 'all' 또는 'users'인 것만)
    const query: any = {
      isActive: true,
      $or: [
        { target: 'all' },
        { target: 'users' },
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
      ],
    };
    
    const adminNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const customerId = customer.id || customer._id?.toString();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    // 읽음 상태 조회
    const notificationIds = adminNotifications.map((n: any) => n._id);
    const readStatuses = await NotificationRead.find({
      notificationId: { $in: notificationIds },
      userId: new mongoose.Types.ObjectId(customerId),
      userType: 'customer',
    }).lean();
    
    const readStatusMap = new Map(
      readStatuses.map((rs: any) => [
        rs.notificationId.toString(),
        { isRead: rs.isRead, readAt: rs.readAt },
      ])
    );
    
    // 기존 고객 알림도 조회 (예약, 프로모션 등)
    // TODO: 기존 고객 알림과 어드민 알림을 병합
    
    const formattedNotifications = adminNotifications.map((notif: any) => {
      const readStatus = readStatusMap.get(notif._id.toString());
      return {
        id: notif._id.toString(),
        type: notif.type,
        title: notif.title,
        message: notif.content,
        link: notif.link || null,
        isRead: readStatus?.isRead || false,
        readAt: readStatus?.readAt ? readStatus.readAt.toISOString() : null,
        metadata: {
          target: notif.target,
          source: 'admin', // 어드민에서 생성된 알림임을 표시
        },
        createdAt: notif.createdAt.toISOString(),
      };
    });
    
    // 읽지 않은 알림 개수 계산
    const unreadCount = formattedNotifications.filter((n: any) => !n.isRead).length;
    
    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('고객 알림 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '알림 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
