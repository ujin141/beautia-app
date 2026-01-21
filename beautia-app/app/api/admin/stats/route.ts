import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withAdminAuth } from '@/lib/admin-auth';
import { withCache, createCacheKey } from '@/lib/cache';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import CustomerUser from '@/models/CustomerUser';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';
import PartnerApplication from '@/models/PartnerApplication';

export const runtime = 'nodejs';

/**
 * GET: 어드민 대시보드 통계
 * 전체 플랫폼의 통계 정보를 조회합니다.
 */
async function handleGet(request: NextRequest) {
  await connectDB();

  // 캐시 키 생성 (1분 TTL)
  const cacheKey = createCacheKey('admin:stats', new Date().toISOString().split('T')[0]);
  
  return await withCache(cacheKey, async () => {
    // 날짜 범위 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // 이번 주 월요일
    thisWeekStart.setHours(0, 0, 0, 0);

    // 이번 달 예약 및 매출
    const thisMonthBookings = await Booking.find({
      createdAt: { $gte: thisMonthStart },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const thisMonthSales = thisMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 지난 달 예약 및 매출
    const lastMonthBookings = await Booking.find({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const lastMonthSales = lastMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 오늘 매출
    const todayStr = today.toISOString().split('T')[0];
    const todayBookings = await Booking.find({
      date: todayStr,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const todaySales = todayBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 이번 주 매출
    const thisWeekBookings = await Booking.find({
      createdAt: { $gte: thisWeekStart },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const thisWeekSales = thisWeekBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 예약 수
    const reservationCount = thisMonthBookings.length;
    const lastMonthReservationCount = lastMonthBookings.length;

    // 고객 수
    const totalCustomers = await CustomerUser.countDocuments();
    const activeCustomers = await CustomerUser.countDocuments({ status: 'active' });
    
    // 활성 고객 (최근 30일 내 예약한 고객)
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() - 30);
    const recentBookingUsers = await Booking.distinct('userId', {
      createdAt: { $gte: activeDate },
    });
    const activeCustomerCount = recentBookingUsers.length;

    // 리뷰 수
    const totalReviews = await Review.countDocuments();
    const thisMonthReviews = await Review.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });

    // 위험 예약 수 (AI Risk Score > 70 또는 pending 상태)
    const highRiskBookings = await Booking.countDocuments({
      $or: [
        { status: 'pending', aiRiskScore: { $gt: 70 } },
        { aiRiskScore: { $gt: 70 } },
      ],
    });

    // 파트너 수
    const totalPartners = await PartnerUser.countDocuments();
    const verifiedPartners = await PartnerUser.countDocuments({ isVerified: true });
    const pendingApplications = await PartnerApplication.countDocuments({ status: 'pending' });

    // 매장 수
    const totalShops = await Shop.countDocuments();

    // 성장률 계산
    const salesGrowth = lastMonthSales > 0 
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1)
      : '0';
    
    const reservationGrowth = lastMonthReservationCount > 0
      ? ((reservationCount - lastMonthReservationCount) / lastMonthReservationCount * 100).toFixed(1)
      : '0';

    // 평균 예약 금액
    const avgBookingAmount = thisMonthBookings.length > 0
      ? thisMonthSales / thisMonthBookings.length
      : 0;

    return {
      totalSales: thisMonthSales,
      todaySales,
      thisWeekSales,
      reservationCount,
      reviewCount: totalReviews,
      thisMonthReviewCount: thisMonthReviews,
      customerCount: activeCustomerCount,
      totalCustomerCount: totalCustomers,
      activeCustomerCount,
      highRiskCount: highRiskBookings,
      salesGrowth: parseFloat(salesGrowth as string),
      reservationGrowth: parseFloat(reservationGrowth as string),
      avgBookingAmount: Math.round(avgBookingAmount),
      totalPartners,
      verifiedPartners,
      pendingApplications,
      totalShops,
    };
  }, 60 * 1000); // 1분 캐시
}

// 인증 미들웨어 적용
export const GET = withAdminAuth(withGetHandler(handleGet));
