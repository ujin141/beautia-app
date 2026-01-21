import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

// GET: 전체 리뷰 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      shopId: review.shopId,
      shopName: review.shopName || '알 수 없음',
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      content: review.content,
      date: review.date || review.createdAt.toISOString().split('T')[0],
      sentiment: review.sentiment || 'neutral',
      reply: review.reply,
      replyDate: review.replyDate,
    }));

    return NextResponse.json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return NextResponse.json(
      { error: '리뷰 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
