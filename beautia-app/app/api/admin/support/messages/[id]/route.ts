import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';

export const runtime = 'nodejs';

/**
 * PATCH: 메시지 읽음 처리 및 답변
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const auth = await verifyAdminAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: auth.error || '인증에 실패했습니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    await connectDB();

    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    const body = await request.json();
    const { isRead, replyMessage } = body;

    const updateData: any = {};

    if (isRead !== undefined) {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.readAt = new Date();
      }
    }

    if (replyMessage !== undefined) {
      updateData.replyMessage = replyMessage;
      if (replyMessage) {
        updateData.repliedAt = new Date();
        updateData.isRead = true; // 답변 시 자동으로 읽음 처리
        if (!updateData.readAt) {
          updateData.readAt = new Date();
        }
      }
    }

    const message = await SupportMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    if (!message) {
      return NextResponse.json(
        { success: false, error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message._id.toString(),
        isRead: message.isRead,
        readAt: message.readAt,
        repliedAt: message.repliedAt,
        replyMessage: message.replyMessage,
      },
    });
  } catch (error: any) {
    console.error('메시지 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET: 단일 메시지 상세 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const auth = await verifyAdminAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: auth.error || '인증에 실패했습니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    await connectDB();

    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    const message = await SupportMessage.findById(id).lean();

    if (!message) {
      return NextResponse.json(
        { success: false, error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message._id.toString(),
        type: message.type,
        userId: message.userId,
        userName: message.userName,
        userEmail: message.userEmail,
        userPhone: message.userPhone,
        message: message.message,
        isRead: message.isRead,
        readAt: message.readAt,
        repliedAt: message.repliedAt,
        replyMessage: message.replyMessage,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
