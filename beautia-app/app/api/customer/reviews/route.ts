export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 내 리뷰 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 총 개수 조회
    const totalCount = await Review.countDocuments({
      userId: customerId,
    });
    
    // 리뷰 조회
    const reviews = await Review.find({
      userId: customerId,
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
    
    // 데이터 가공
    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      shopId: review.shopId,
      shopName: review.shopName || '매장',
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      content: review.content,
      date: review.date || (review.createdAt ? new Date(review.createdAt).toISOString().split('T')[0] : ''),
      sentiment: review.sentiment || 'positive',
      reply: review.reply,
      hasReply: !!review.reply,
      replyDate: review.replyDate,
      createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedReviews,
      meta: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('내 리뷰 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '리뷰 목록을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
