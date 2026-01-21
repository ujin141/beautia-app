import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactMessage from '@/models/ContactMessage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const search = request.nextUrl.searchParams;
    const status = search.get('status');

    const filter: any = {};
    if (status && ['open', 'resolved', 'archived'].includes(status)) {
      filter.status = status;
    }

    const messages = await ContactMessage.find(filter)
      .sort({ submittedAt: -1 })
      .lean();

    const formattedMessages = messages.map((msg: any) => ({
      id: msg._id.toString(),
      ...msg,
      _id: undefined,
      __v: undefined,
      submittedAt: msg.submittedAt.toISOString(),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (err) {
    console.error('문의 목록 조회 오류:', err);
    const errorMessage = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status } = body as {
      id?: string;
      status?: 'open' | 'resolved' | 'archived';
    };

    if (!id || !status || !['open', 'resolved', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      return NextResponse.json(
        { error: '문의 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const msgObj = message.toObject();
    return NextResponse.json({
      success: true,
      message: '상태가 업데이트되었습니다.',
      data: {
        id: msgObj._id.toString(),
        ...msgObj,
        _id: undefined,
        __v: undefined,
        submittedAt: msgObj.submittedAt.toISOString(),
        createdAt: msgObj.createdAt.toISOString(),
        updatedAt: msgObj.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('문의 상태 변경 오류:', err);
    const errorMessage = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

