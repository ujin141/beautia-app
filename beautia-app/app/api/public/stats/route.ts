export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Shop from '@/models/Shop';
import Review from '@/models/Review';

/**
 * 홈 화면 실시간 통계 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 현재 시간 기준으로 오늘 예약 중인 수 (pending, confirmed 상태)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const bookingNowCount = await Booking.countDocuments({
      status: { $in: ['pending', 'confirmed'] },
      date: {
        $gte: todayStart.toISOString().split('T')[0],
        $lt: todayEnd.toISOString().split('T')[0],
      },
    });
    
    // 검증된 매장 수 (isVerified가 true이거나 rating이 4.5 이상)
    const verifiedShopsCount = await Shop.countDocuments({
      $or: [
        { isVerified: true },
        { rating: { $gte: 4.5 } },
      ],
    });
    
    // 전체 평균 평점 계산
    const shopsWithRating = await Shop.find({
      rating: { $exists: true, $gt: 0 },
    }).select('rating').lean();
    
    let avgRating = 4.8; // 기본값
    if (shopsWithRating.length > 0) {
      const totalRating = shopsWithRating.reduce((sum, shop) => sum + (shop.rating || 0), 0);
      avgRating = totalRating / shopsWithRating.length;
      avgRating = Math.round(avgRating * 10) / 10; // 소수점 첫째자리까지
    }
    
    return NextResponse.json({
      success: true,
      data: {
        bookingNow: bookingNowCount,
        verifiedShops: verifiedShopsCount,
        avgRating: avgRating,
      },
    });
  } catch (error) {
    console.error('홈 화면 통계 조회 오류:', error);
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
