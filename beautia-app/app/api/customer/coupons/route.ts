export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerCoupon from '@/models/CustomerCoupon';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 고객 쿠폰 목록 조회 API
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
    const status = searchParams.get('status'); // 'all', 'available', 'used', 'expired'
    
    // 필터 조건
    const filter: any = {
      userId: customerId,
    };
    
    const now = new Date();
    
    if (status === 'available') {
      filter.isUsed = false;
      filter.expiresAt = { $gte: now };
    } else if (status === 'used') {
      filter.isUsed = true;
    } else if (status === 'expired') {
      filter.expiresAt = { $lt: now };
      filter.isUsed = false;
    }
    // 'all'이거나 status가 없으면 모든 쿠폰 조회
    
    // 쿠폰 조회
    const coupons = await CustomerCoupon.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // 데이터 가공
    const formattedCoupons = coupons.map((coupon: any) => ({
      id: coupon._id.toString(),
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      shopId: coupon.shopId?.toString(),
      shopName: coupon.shopName,
      isUsed: coupon.isUsed,
      usedAt: coupon.usedAt ? new Date(coupon.usedAt).toISOString() : null,
      bookingId: coupon.bookingId,
      issuedAt: coupon.issuedAt ? new Date(coupon.issuedAt).toISOString() : new Date().toISOString(),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
      isExpired: coupon.expiresAt ? new Date(coupon.expiresAt) < now : false,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedCoupons,
    });
  } catch (error) {
    console.error('고객 쿠폰 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '쿠폰 목록을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
