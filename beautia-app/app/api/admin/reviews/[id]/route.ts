import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

// DELETE: 리뷰 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const reviewId = id;
    
    const review = await Review.findByIdAndDelete(reviewId);
    
    if (!review) {
      return NextResponse.json(
        { error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '리뷰가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    return NextResponse.json(
      { error: '리뷰 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
