export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import CustomerCoupon from '@/models/CustomerCoupon';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

/**
 * 쿠폰 코드로 쿠폰 등록 API
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { code } = body;
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '쿠폰 코드를 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // 프로모션에서 쿠폰 코드로 검색
    const promotion = await Promotion.findOne({
      code: code.toUpperCase().trim(),
      type: 'coupon',
      isActive: true,
    });
    
    if (!promotion) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 쿠폰 코드입니다.' },
        { status: 404 }
      );
    }
    
    // 쿠폰 유효성 검사
    const now = new Date();
    if (promotion.startDate > now || promotion.endDate < now) {
      return NextResponse.json(
        { success: false, error: '사용 기간이 만료된 쿠폰입니다.' },
        { status: 400 }
      );
    }
    
    // 이미 등록된 쿠폰인지 확인
    const existingCoupon = await CustomerCoupon.findOne({
      userId: customerId,
      promotionId: promotion._id,
      isUsed: false,
      expiresAt: { $gte: now },
    });
    
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 쿠폰입니다.' },
        { status: 400 }
      );
    }
    
    // 사용 횟수 제한 확인
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return NextResponse.json(
        { success: false, error: '쿠폰이 모두 소진되었습니다.' },
        { status: 400 }
      );
    }
    
    // Shop 정보 가져오기
    const shop = await import('@/models/Shop').then(m => m.default.findById(promotion.shopId));
    
    // 고객 쿠폰 생성
    const customerCoupon = new CustomerCoupon({
      userId: customerId,
      promotionId: promotion._id,
      code: promotion.code || code.toUpperCase().trim(),
      title: promotion.title,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minPurchaseAmount: promotion.minPurchaseAmount,
      maxDiscountAmount: promotion.maxDiscountAmount,
      shopId: promotion.shopId,
      shopName: shop?.name,
      issuedAt: new Date(),
      expiresAt: promotion.endDate,
    });
    
    await customerCoupon.save();
    
    // 프로모션 사용 횟수 증가
    promotion.usedCount = (promotion.usedCount || 0) + 1;
    await promotion.save();
    
    return NextResponse.json({
      success: true,
      data: {
        id: customerCoupon._id.toString(),
        code: customerCoupon.code,
        title: customerCoupon.title,
        description: customerCoupon.description,
        discountType: customerCoupon.discountType,
        discountValue: customerCoupon.discountValue,
        expiresAt: customerCoupon.expiresAt.toISOString(),
      },
      message: '쿠폰이 등록되었습니다.',
    });
  } catch (error) {
    console.error('쿠폰 등록 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '쿠폰 등록 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
