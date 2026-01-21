import { NextRequest } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import { withCache, createCacheKey } from '@/lib/cache';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import Shop from '@/models/Shop';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/partner/stats:
 *   get:
 *     tags: [Partner]
 *     summary: 파트너 대시보드 통계 조회
 *     description: 파트너의 예약, 매출, 리뷰 등 통계 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 파트너 ID
 *     responses:
 *       200:
 *         description: 통계 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalSales:
 *                           type: number
 *                           description: 오늘 매출
 *                         reservationCount:
 *                           type: number
 *                           description: 이번 달 예약 수
 *                         reviewCount:
 *                           type: number
 *                           description: 리뷰 수
 *                         customerCount:
 *                           type: number
 *                           description: 고객 수
 *                         salesGrowth:
 *                           type: number
 *                           description: 매출 성장률 (%)
 *                         reservationGrowth:
 *                           type: number
 *                           description: 예약 성장률 (%)
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET: 파트너 대시보드 통계
async function handleGet(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const partnerId = searchParams.get('partnerId');

  // 유효성 검사
  const validation = validateRequestBody(
    { partnerId },
    [required('partnerId', '파트너 ID가 필요합니다.')]
  );

  if (!validation.valid) {
    return validationErrorResponse(validation.error!, validation.details);
  }

  // 캐시 키 생성
  const cacheKey = createCacheKey('partner:stats', partnerId || '', new Date().toISOString().split('T')[0]);

  // 캐시된 데이터 조회 (1분 TTL)
  return await withCache(cacheKey, async () => {
    // 파트너의 매장 ID 목록 가져오기
    const shops = await Shop.find({ partnerId }).select('_id').lean();
    const shopIds = shops.map(s => s._id.toString());

    // 날짜 범위 설정 (오늘 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // 오늘 예약 및 매출 (date 필드가 문자열이므로 직접 비교)
    const todayStr = today.toISOString().split('T')[0];
    const todayBookings = await Booking.find({
      partnerId,
      date: todayStr,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const todaySales = todayBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 이번 달 예약 및 매출
    const thisMonthBookings = await Booking.find({
      partnerId,
      createdAt: { $gte: thisMonthStart },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const thisMonthSales = thisMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 지난 달 예약 및 매출
    const lastMonthBookings = await Booking.find({
      partnerId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const lastMonthSales = lastMonthBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    // 예약 수
    const reservationCount = thisMonthBookings.length;
    const lastMonthReservationCount = lastMonthBookings.length;

    // 고객 수 (고유 userId)
    const uniqueCustomers = new Set(thisMonthBookings.map(b => b.userId)).size;

    // 리뷰 수
    const totalReviews = await Review.countDocuments({ partnerId });
    const thisMonthReviews = await Review.countDocuments({
      partnerId,
      createdAt: { $gte: thisMonthStart },
    });

    // 평균 평점
    const reviews = await Review.find({ partnerId }).select('rating').lean();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // 매장 정보
    const shopInfo = shops.length > 0 ? {
      shopId: shops[0]._id.toString(),
      shopName: shops[0].name || '',
      shopRating: shops[0].rating || 0,
      shopReviewCount: shops[0].reviewCount || 0,
    } : null;

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

    // 이번 주 매출
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // 이번 주 월요일
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.find({
      partnerId,
      createdAt: { $gte: thisWeekStart },
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const thisWeekSales = thisWeekBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);

    return {
      totalSales: todaySales,
      thisMonthSales,
      thisWeekSales,
      reservationCount,
      reviewCount: totalReviews,
      thisMonthReviewCount: thisMonthReviews,
      customerCount: uniqueCustomers,
      salesGrowth: parseFloat(salesGrowth as string),
      reservationGrowth: parseFloat(reservationGrowth as string),
      avgRating: Math.round(avgRating * 10) / 10,
      avgBookingAmount: Math.round(avgBookingAmount),
      shopInfo,
    };
  }, 60 * 1000); // 1분 캐시
}

// 인증 미들웨어 적용
export const GET = withPartnerAuth(withGetHandler(handleGet));
