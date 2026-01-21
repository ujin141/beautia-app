// 어드민 프로모션 관리 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import Shop from '@/models/Shop';
import PartnerUser from '@/models/PartnerUser';
import mongoose from 'mongoose';

// GET: 프로모션 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // all, active, inactive, expired
    const type = searchParams.get('type'); // discount, flash_sale, package, coupon
    const search = searchParams.get('search'); // 파트너명, 샵명, 프로모션 제목 검색

    const filter: any = {};

    // 상태 필터
    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'expired') {
        filter.endDate = { $lt: now };
      }
    }

    // 타입 필터
    if (type && type !== 'all') {
      filter.type = type;
    }

    // 프로모션 조회
    let promotions = await Promotion.find(filter)
      .populate('shopId', 'name category partnerId')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // 파트너 정보 추가
    const promotionsWithPartner = await Promise.all(
      promotions.map(async (promo: any) => {
        if (promo.shopId?.partnerId) {
          const partner = await PartnerUser.findById(promo.shopId.partnerId).lean();
          return {
            ...promo,
            partnerName: partner?.name || partner?.email || 'Unknown',
            partnerId: partner?._id?.toString() || promo.shopId.partnerId.toString(),
          };
        }
        return {
          ...promo,
          partnerName: 'Unknown',
          partnerId: null,
        };
      })
    );

    // 검색 필터
    let filteredPromotions = promotionsWithPartner;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPromotions = promotionsWithPartner.filter((promo: any) => {
        return (
          promo.partnerName?.toLowerCase().includes(searchLower) ||
          promo.shopId?.name?.toLowerCase().includes(searchLower) ||
          promo.title?.toLowerCase().includes(searchLower) ||
          promo.code?.toLowerCase().includes(searchLower)
        );
      });
    }

    // 응답 포맷팅
    const formattedPromotions = filteredPromotions.map((promo: any) => {
      const now = new Date();
      const isExpired = new Date(promo.endDate) < now;
      const isActive = promo.isActive && !isExpired && new Date(promo.startDate) <= now;
      const isGlobal = !promo.shopId; // shopId가 없으면 전역 쿠폰

      return {
        id: promo._id.toString(),
        shopId: promo.shopId?._id?.toString() || promo.shopId?.toString() || null,
        shopName: isGlobal ? '전역 쿠폰 (모든 샵)' : (promo.shopId?.name || 'Unknown'),
        partnerId: promo.partnerId,
        partnerName: isGlobal ? '전역' : (promo.partnerName || 'Unknown'),
        title: promo.title,
        description: promo.description,
        type: promo.type,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: isActive,
        minPurchaseAmount: promo.minPurchaseAmount,
        maxDiscountAmount: promo.maxDiscountAmount,
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount || 0,
        code: promo.code || null, // 쿠폰 코드 명시적으로 포함
        createdAt: promo.createdAt,
        status: isExpired ? 'expired' : isActive ? 'active' : 'inactive',
        isGlobal: isGlobal,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPromotions,
    });
  } catch (error: any) {
    console.error('프로모션 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프로모션 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 프로모션 상태 변경 (활성화/비활성화)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { promotionId, isActive } = body;

    if (!promotionId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '프로모션 ID와 활성화 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const promotion = await Promotion.findByIdAndUpdate(
      promotionId,
      { isActive },
      { new: true }
    );

    if (!promotion) {
      return NextResponse.json(
        { success: false, error: '프로모션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `프로모션이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      data: {
        id: promotion._id.toString(),
        isActive: promotion.isActive,
      },
    });
  } catch (error: any) {
    console.error('프로모션 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프로모션 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 프로모션 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      shopId,
      title,
      description,
      type,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive = true,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      code,
    } = body;

    // 필수 필드 검증
    if (!title || !description || !type || !discountType || !discountValue || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // shopId가 null, undefined, 빈 문자열이면 전역 쿠폰 (어떤 샵에서도 사용 가능)
    let shop = null;
    
    // shopId가 명시적으로 제공되고 유효한 경우만 처리
    if (shopId && shopId !== 'null' && shopId !== 'undefined' && shopId !== '') {
      shop = await Shop.findById(shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, error: '샵을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 날짜 유효성 검증
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: '종료일은 시작일보다 늦어야 합니다.' },
        { status: 400 }
      );
    }

    // 쿠폰 코드 처리: 사용자가 입력한 코드를 사용하거나, 비어있으면 자동 생성
    let finalCode: string | undefined = undefined;
    
    if (code && code.trim() !== '') {
      // 사용자가 입력한 코드가 있으면
      finalCode = code.trim().toUpperCase(); // 앞뒤 공백 제거 및 대문자 변환
      
      // 코드 형식 검증 (영문자, 숫자, 하이픈만 허용)
      if (finalCode && !/^[A-Z0-9\-]+$/.test(finalCode)) {
        return NextResponse.json(
          { success: false, error: '쿠폰 코드는 영문자, 숫자, 하이픈(-)만 사용할 수 있습니다.' },
          { status: 400 }
        );
      }
      
      // 코드 길이 검증
      if (finalCode && (finalCode.length < 3 || finalCode.length > 50)) {
        return NextResponse.json(
          { success: false, error: '쿠폰 코드는 3자 이상 50자 이하여야 합니다.' },
          { status: 400 }
        );
      }
      
      // 중복 확인 (모든 프로모션 타입에서 유니크해야 함)
      const existingPromotion = await Promotion.findOne({ code: finalCode });
      if (existingPromotion) {
        return NextResponse.json(
          { success: false, error: `이미 사용 중인 쿠폰 코드입니다: ${finalCode}` },
          { status: 400 }
        );
      }
    } else if (type === 'coupon') {
      // 쿠폰 타입이고 코드가 없으면 자동 생성
      let generatedCode: string;
      let attempts = 0;
      do {
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        generatedCode = `BEAUTIA-${randomPart}`;
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { success: false, error: '쿠폰 코드 생성에 실패했습니다. 다시 시도해주세요.' },
            { status: 500 }
          );
        }
      } while (await Promotion.findOne({ code: generatedCode }));
      finalCode = generatedCode;
    }
    // 쿠폰 타입이 아니고 코드가 없으면 finalCode는 undefined로 유지 (코드 없이 생성 가능)

    // 프로모션 생성 데이터 준비
    const promotionData: any = {
      title,
      description,
      type,
      discountType,
      discountValue: Number(discountValue),
      startDate: start,
      endDate: end,
      isActive: Boolean(isActive),
      minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      code: finalCode, // 사용자가 입력한 코드 또는 자동 생성된 코드 (없으면 undefined)
      usedCount: 0,
    };

    // shopId가 있으면 추가 (없으면 전역 쿠폰 - shopId 필드를 아예 포함하지 않음)
    if (shop && shop._id) {
      promotionData.shopId = shop._id;
    }
    // shopId가 없으면 필드를 아예 추가하지 않거나 null로 명시적으로 설정
    // Mongoose는 undefined와 null을 다르게 처리하므로, 명시적으로 null로 설정하는 것이 안전할 수 있음
    // 하지만 스키마에서 required: false이고 default: undefined이므로 필드를 포함하지 않는 것이 좋음

    // 프로모션 생성 및 저장
    const promotion = new Promotion(promotionData);
    
    // 저장 전 validation 체크 (디버깅용)
    try {
      await promotion.validate();
    } catch (validationError: any) {
      console.error('프로모션 validation 오류:', validationError);
      return NextResponse.json(
        { success: false, error: validationError.message || '프로모션 데이터 검증에 실패했습니다.' },
        { status: 400 }
      );
    }
    
    await promotion.save();

    // 파트너 정보 조회 (샵이 있는 경우만)
    let partner = null;
    if (shop && shop.partnerId) {
      partner = await PartnerUser.findById(shop.partnerId).lean();
    }

    return NextResponse.json({
      success: true,
      message: shop ? '프로모션이 생성되었습니다.' : '전역 쿠폰이 생성되었습니다.',
      data: {
        id: promotion._id.toString(),
        shopId: (promotion.shopId as any)?.toString() || null,
        shopName: shop?.name || '전역 쿠폰',
        partnerId: partner?._id?.toString() || null,
        partnerName: partner?.name || partner?.email || (shop ? 'Unknown' : null),
        title: promotion.title,
        type: promotion.type,
        isActive: promotion.isActive,
        code: promotion.code || null,
      },
    });
  } catch (error: any) {
    console.error('프로모션 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프로모션 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 프로모션 삭제
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const promotionId = searchParams.get('id');

    if (!promotionId) {
      return NextResponse.json(
        { success: false, error: '프로모션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const promotion = await Promotion.findByIdAndDelete(promotionId);

    if (!promotion) {
      return NextResponse.json(
        { success: false, error: '프로모션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로모션이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('프로모션 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프로모션 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
