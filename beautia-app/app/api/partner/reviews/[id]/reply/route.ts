import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

// POST: 리뷰에 답글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { reply } = body;

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: '답글 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        reply: reply.trim(),
        replyAt: new Date(),
      },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const reviewObj = review.toObject();
    return NextResponse.json({
      success: true,
      message: '답글이 등록되었습니다.',
      data: {
        id: reviewObj._id.toString(),
        ...reviewObj,
        _id: undefined,
        __v: undefined,
        createdAt: reviewObj.createdAt.toISOString(),
        updatedAt: reviewObj.updatedAt.toISOString(),
        replyAt: reviewObj.replyAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('답글 작성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
