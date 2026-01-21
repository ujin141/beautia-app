export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import CommunityPost from '@/models/CommunityPost';
import CustomerCoupon from '@/models/CustomerCoupon';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 고객 통계 조회 (예약, 리뷰, 좋아요 등)
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
    
    // 예약 개수
    const bookingCount = await Booking.countDocuments({
      userId: customerId,
    });
    
    // 리뷰 개수
    const reviewCount = await Review.countDocuments({
      userId: customerId,
    });
    
    // 커뮤니티 게시물 좋아요 총합 (내가 작성한 게시물의 좋아요)
    const myPosts = await CommunityPost.find({
      userId: customerId,
      isDeleted: false,
    }).select('likes');
    
    const likeCount = myPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
    
    // 쿠폰 개수 (사용 가능한 쿠폰)
    const now = new Date();
    const couponCount = await CustomerCoupon.countDocuments({
      userId: customerId,
      isUsed: false,
      expiresAt: { $gte: now },
    });
    
    // 최근 예약 (3개)
    const recentBookings = await Booking.find({
      userId: customerId,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        bookingCount: bookingCount,
        reviewCount: reviewCount,
        likeCount: likeCount,
        couponCount: couponCount,
        recentBookings: recentBookings.map((booking: any) => ({
          id: booking._id.toString(),
          shopName: booking.shopName || '',
          serviceName: booking.serviceName || '',
          date: booking.date || '',
          time: booking.time || '',
          status: booking.status || 'pending',
          createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('고객 통계 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '통계를 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
