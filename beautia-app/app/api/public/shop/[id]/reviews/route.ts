import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: shopId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!shopId) {
      return NextResponse.json(
        { 
          success: false,
          error: '매장 ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }
    
    // 리뷰 조회
    const reviews = await Review.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    // 전체 리뷰 수
    const totalCount = await Review.countDocuments({ shopId });
    
    // 데이터 가공
    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      shopId: review.shopId,
      shopName: review.shopName,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      content: review.content,
      date: review.date,
      sentiment: review.sentiment || 'neutral',
      reply: review.reply,
      replyDate: review.replyDate,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedReviews,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '리뷰 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
