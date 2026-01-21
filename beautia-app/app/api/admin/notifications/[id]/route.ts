import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import { verifyAdminToken } from '@/lib/admin-token-verifier';

// PUT: 알림 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    const notificationId = id;
    const body = await request.json();
    const { title, content, type, target, expiresAt, isActive, link } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (type) updateData.type = type;
    if (target) updateData.target = target;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (link !== undefined) updateData.link = link || null;
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      updateData,
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림이 수정되었습니다.',
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
    console.error('알림 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    const notificationId = id;
    
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: '알림 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 알림 ID입니다.' },
        { status: 400 }
      );
    }
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { 
        success: false,
        error: '알림 삭제에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
