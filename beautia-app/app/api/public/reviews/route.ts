import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';

/**
 * 리뷰 티커 API (전환율 최적화)
 * - 평점 4점 이상의 검증된 리뷰만
 * - 최신 리뷰 우선
 * - 긍정적 감정 리뷰 우선
 * - 파트너 답변이 있는 리뷰 우선 (신뢰도 향상)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const minRating = parseInt(searchParams.get('minRating') || '4');
    
    // 검증된 리뷰 조회 (평점 4점 이상, 긍정적 감정 우선)
    // 더 많은 리뷰를 가져와서 정렬 후 필터링
    const reviews = await Review.find({
      rating: { $gte: minRating }, // 4점 이상만
      sentiment: { $in: ['positive', 'neutral'] }, // 긍정적 또는 중립적
    })
      .sort({ 
        // 정렬 우선순위:
        // 1. 파트너 답변이 있는 리뷰 우선 (신뢰도 향상)
        reply: -1,
        // 2. 최신 리뷰 우선
        createdAt: -1,
        // 3. 평점 높은 순
        rating: -1,
      })
      .limit(limit * 2); // 필터링 전 더 많이 가져오기
    
    // 추가 필터링 및 정렬
    const sortedReviews = reviews
      .filter(review => {
        // 최소 평점 확인
        return review.rating >= minRating;
      })
      .sort((a, b) => {
        // 1순위: 파트너 답변이 있는 리뷰
        if (a.reply && !b.reply) return -1;
        if (!a.reply && b.reply) return 1;
        
        // 2순위: 최신 리뷰
        if (a.createdAt > b.createdAt) return -1;
        if (a.createdAt < b.createdAt) return 1;
        
        // 3순위: 평점 높은 순
        return b.rating - a.rating;
      })
      .slice(0, limit); // 최종 limit만큼만
    
    // 데이터 가공 (프론트엔드 호환성)
    const formattedReviews = sortedReviews.map(review => ({
      id: review._id.toString(),
      shopId: review.shopId,
      shopName: review.shopName || '매장',
      userId: review.userId,
      userName: review.userName,
      user: review.userName, // 프론트엔드 호환성
      rating: review.rating,
      content: review.content,
      text: review.content, // 프론트엔드 호환성 (티커에서 사용)
      date: review.date || review.createdAt.toISOString().split('T')[0],
      sentiment: review.sentiment || 'positive',
      reply: review.reply,
      hasReply: !!review.reply, // 파트너 답변 여부
      replyDate: review.replyDate,
      createdAt: review.createdAt.toISOString(),
      loc: 'Seoul', // 위치 정보 (향후 확장 가능)
      flag: '🇰🇷', // 국가 플래그 (향후 확장 가능)
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedReviews,
      meta: {
        total: formattedReviews.length,
        averageRating: formattedReviews.length > 0 
          ? (formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length).toFixed(1)
          : '0.0',
        withReply: formattedReviews.filter(r => r.hasReply).length,
      },
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
