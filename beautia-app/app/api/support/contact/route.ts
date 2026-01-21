import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactMessage from '@/models/ContactMessage';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { type, email, message } = body;

    if (!type || !email || !message) {
      return NextResponse.json(
        { error: '문의 유형, 이메일, 내용을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const entry = new ContactMessage({
      type,
      email,
      message,
    });

    await entry.save();

    return NextResponse.json(
      { success: true, message: '문의가 접수되었습니다.', id: entry._id.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error('문의 저장 오류:', err);
    const errorMessage = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

