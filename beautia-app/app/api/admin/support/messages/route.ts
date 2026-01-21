import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';

export const runtime = 'nodejs';

/**
 * GET: 관리자용 지원 메시지 목록 조회
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'all', 'customer', 'partner'
    const status = searchParams.get('status'); // 'all', 'unread', 'read', 'replied'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status === 'unread') {
      filter.isRead = false;
    } else if (status === 'read') {
      filter.isRead = true;
      filter.replyMessage = { $exists: false };
    } else if (status === 'replied') {
      filter.replyMessage = { $exists: true, $ne: null };
    }

    const [messages, total] = await Promise.all([
      SupportMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportMessage.countDocuments(filter),
    ]);

    const formattedMessages = messages.map((msg: any) => ({
      id: msg._id.toString(),
      type: msg.type,
      userId: msg.userId,
      userName: msg.userName,
      userEmail: msg.userEmail,
      userPhone: msg.userPhone,
      message: msg.message,
      isRead: msg.isRead,
      readAt: msg.readAt,
      repliedAt: msg.repliedAt,
      replyMessage: msg.replyMessage,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('지원 메시지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
