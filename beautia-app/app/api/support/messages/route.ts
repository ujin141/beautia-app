import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SupportMessage from '@/models/SupportMessage';
import CustomerUser from '@/models/CustomerUser';
import PartnerUser from '@/models/PartnerUser';

export const runtime = 'nodejs';

/**
 * POST: 지원 메시지 전송
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { type, userId, userName, message, userEmail, userPhone } = body;

    if (!type || !userId || !userName || !message) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 조회 (이메일, 전화번호 자동 채우기)
    let email = userEmail;
    let phone = userPhone;

    if (type === 'customer') {
      const customer = await CustomerUser.findById(userId).lean();
      if (customer) {
        email = email || customer.email;
        phone = phone || customer.phone;
      }
    } else if (type === 'partner') {
      const partner = await PartnerUser.findById(userId).lean();
      if (partner) {
        email = email || partner.email;
        phone = phone || partner.phone;
      }
    }

    const supportMessage = new SupportMessage({
      type,
      userId,
      userName,
      message,
      userEmail: email,
      userPhone: phone,
      isRead: false,
    });

    await supportMessage.save();

    return NextResponse.json({
      success: true,
      message: '메시지가 전송되었습니다.',
      data: {
        id: supportMessage._id.toString(),
        createdAt: supportMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error('지원 메시지 전송 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET: 지원 메시지 목록 조회 (사용자용)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (!type || !userId) {
      return NextResponse.json(
        { success: false, error: 'type과 userId가 필요합니다.' },
        { status: 400 }
      );
    }

    const messages = await SupportMessage.find({
      type,
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedMessages = messages.map((msg: any) => ({
      id: msg._id.toString(),
      message: msg.message,
      replyMessage: msg.replyMessage,
      isRead: msg.isRead,
      repliedAt: msg.repliedAt,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages,
    });
  } catch (error: any) {
    console.error('지원 메시지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
