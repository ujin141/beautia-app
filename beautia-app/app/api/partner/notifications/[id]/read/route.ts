import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationRead from '@/models/NotificationRead';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

// PATCH: 알림 읽음 처리
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // 파트너 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('partner_token')?.value;
    
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
    
    const resolvedParams = await Promise.resolve(params);
    const notificationId = resolvedParams.id;
    
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 알림 ID입니다.' },
        { status: 400 }
      );
    }
    
    const partnerId = verification.partnerId.toString();
    
    // 읽음 상태 업데이트 또는 생성
    const notificationRead = await NotificationRead.findOneAndUpdate(
      {
        notificationId: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(partnerId),
        userType: 'partner',
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );
    
    return NextResponse.json({
      success: true,
      message: '알림을 읽음 처리했습니다.',
      data: {
        notificationId: notificationId,
        isRead: notificationRead.isRead,
        readAt: notificationRead.readAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '알림 읽음 처리에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 여러 알림 일괄 읽음 처리
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 파트너 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('partner_token')?.value;
    
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
    
    const body = await request.json();
    const { notificationIds } = body;
    
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '알림 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const partnerId = verification.partnerId.toString();
    
    // 유효한 ObjectId만 필터링
    const validNotificationIds = notificationIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));
    
    if (validNotificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '유효한 알림 ID가 없습니다.' },
        { status: 400 }
      );
    }
    
    // 일괄 읽음 처리
    const now = new Date();
    const bulkOps = validNotificationIds.map((notificationId) => ({
      updateOne: {
        filter: {
          notificationId,
          userId: new mongoose.Types.ObjectId(partnerId),
          userType: 'partner',
        },
        update: {
          $set: {
            isRead: true,
            readAt: now,
          },
        },
        upsert: true,
      },
    }));
    
    await NotificationRead.bulkWrite(bulkOps);
    
    return NextResponse.json({
      success: true,
      message: `${validNotificationIds.length}개의 알림을 읽음 처리했습니다.`,
      data: {
        count: validNotificationIds.length,
      },
    });
  } catch (error) {
    console.error('알림 일괄 읽음 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '알림 읽음 처리에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
