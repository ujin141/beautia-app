import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyAdminToken } from '@/lib/admin-token-verifier';

// GET: 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 어드민 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const verification = await verifyAdminToken(token);
    if (!verification.valid || !verification.adminId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif._id.toString(),
      title: notif.title,
      content: notif.content,
      type: notif.type,
      target: notif.target,
      isActive: notif.isActive,
      createdAt: notif.createdAt.toISOString(),
      expiresAt: notif.expiresAt ? notif.expiresAt.toISOString() : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: formattedNotifications,
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return NextResponse.json(
      { error: '알림 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 알림 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 어드민 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const verification = await verifyAdminToken(token);
    if (!verification.valid || !verification.adminId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { title, content, type, target, expiresAt, isActive, link } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const notification = new Notification({
      title,
      content,
      type: type || 'info',
      target: target || 'all',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: isActive !== undefined ? isActive : true,
      link: link || undefined,
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: '알림이 생성되었습니다.',
      data: {
        id: notification._id.toString(),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        target: notification.target,
        isActive: notification.isActive,
        createdAt: notification.createdAt.toISOString(),
        expiresAt: notification.expiresAt ? notification.expiresAt.toISOString() : undefined,
      },
    });
  } catch (error) {
    console.error('알림 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
