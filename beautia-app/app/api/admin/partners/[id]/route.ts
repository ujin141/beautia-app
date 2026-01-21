import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { withGetHandler } from '@/lib/api-handler';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import PartnerApplication from '@/models/PartnerApplication';

export const runtime = 'nodejs';

/**
 * GET: 파트너 상세 정보 조회
 */
async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    console.log('파트너 상세 조회 시작:', id);

    // 파트너 찾기 (이메일 또는 ID로)
    let partner;
    
    // MongoDB ObjectId 형식인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      partner = await PartnerUser.findById(id).lean();
    } else {
      partner = await PartnerUser.findOne({ email: id.toLowerCase() }).lean();
    }

    if (!partner) {
      console.log('파트너를 찾을 수 없음:', id);
      return NextResponse.json(
        { success: false, error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('파트너 찾음:', partner._id.toString(), partner.email);

    const partnerId = partner._id.toString();

    // 관련 데이터 조회
    const [shops, bookings, reviews, application] = await Promise.all([
      // 매장 정보
      Shop.find({ partnerId }).lean(),
      // 예약 정보 (최근 10개)
      Booking.find({ partnerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // 리뷰 정보 (최근 10개)
      Review.find({ partnerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // 신청서 정보
      partner.applicationId 
        ? PartnerApplication.findById(partner.applicationId).lean().catch(() => null)
        : PartnerApplication.findOne({ email: partner.email }).lean().catch(() => null),
    ]);

    // 통계 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalBookings, totalSales, totalReviews, avgRating] = await Promise.all([
      Booking.countDocuments({ partnerId, status: { $in: ['confirmed', 'completed'] } }),
      Booking.aggregate([
        {
          $match: {
            partnerId,
            status: { $in: ['confirmed', 'completed'] },
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$price' },
          },
        },
      ]),
      Review.countDocuments({ partnerId }),
      Review.aggregate([
        {
          $match: { partnerId },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const thisMonthBookings = await Booking.countDocuments({
      partnerId,
      createdAt: { $gte: thisMonthStart },
      status: { $in: ['confirmed', 'completed'] },
    });

    const thisMonthSales = await Booking.aggregate([
      {
        $match: {
          partnerId,
          createdAt: { $gte: thisMonthStart },
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        partner: {
          id: partner._id.toString(),
          email: partner.email,
          name: partner.name,
          phone: partner.phone,
          isVerified: partner.isVerified || false,
          marketingPoints: partner.marketingPoints || 0,
          stripeConnectAccountStatus: partner.stripeConnectAccountStatus || 'pending',
          lastLoginAt: partner.lastLoginAt,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt,
        },
        application: application ? {
          id: application._id.toString(),
          shopName: application.shopName,
          address: application.address,
          category: application.category,
          status: application.status,
          submittedAt: application.submittedAt,
        } : null,
        shops: shops.map(shop => ({
          id: shop._id.toString(),
          name: shop.name,
          category: shop.category,
          address: shop.address,
          rating: shop.rating || 0,
          reviewCount: shop.reviewCount || 0,
          imageUrl: shop.imageUrl,
        })),
        stats: {
          totalBookings,
          totalSales: totalSales[0]?.total || 0,
          thisMonthBookings,
          thisMonthSales: thisMonthSales[0]?.total || 0,
          totalReviews,
          avgRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : 0,
        },
        recentBookings: bookings.map(booking => ({
          id: booking._id.toString(),
          userName: booking.userName,
          shopName: booking.shopName,
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
          price: booking.price,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
        })),
        recentReviews: reviews.map(review => ({
          id: review._id.toString(),
          userName: review.userName,
          rating: review.rating,
          content: review.content,
          sentiment: review.sentiment,
          reply: review.reply,
          date: review.date,
          createdAt: review.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('파트너 상세 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || '파트너 상세 정보 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Next.js 16에서는 params가 Promise이므로 직접 래핑
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const { verifyAdminAuth } = await import('@/lib/admin-auth');
    const auth = await verifyAdminAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: auth.error || '인증에 실패했습니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // 핸들러 실행
    return await handleGet(request, context);
  } catch (error: any) {
    console.error('파트너 상세 조회 전체 오류:', error);
    console.error('에러 스택:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || '파트너 상세 정보 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
