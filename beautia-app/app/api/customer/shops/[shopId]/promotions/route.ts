import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// GET: 매장별 활성 프로모션 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    await connectDB();

    // Next.js 15에서는 params가 Promise입니다
    const { shopId } = await params;

    if (!shopId) {
      return NextResponse.json(
        { error: '매장 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 매장 정보 조회
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return NextResponse.json(
        { error: '매장을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const now = new Date();

    // 해당 샵의 활성 프로모션 조회 + 전역 프로모션 (shopId가 null이거나 undefined인 쿠폰)
    const promotions = await Promotion.find({
      $or: [
        { shopId: new mongoose.Types.ObjectId(shopId) },
        { shopId: null }, // 전역 쿠폰 (어떤 샵에서도 사용 가능)
        { shopId: { $exists: false } }, // shopId 필드가 없는 경우도 포함
      ],
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ discountValue: -1, createdAt: -1 })
      .lean();

    // 프로모션 포맷팅
    const formattedPromotions = promotions.map((promo: any) => {
      const daysRemaining = Math.ceil(
        (new Date(promo.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: promo._id.toString(),
        shopId: promo.shopId ? promo.shopId.toString() : null,
        title: promo.title,
        description: promo.description,
        type: promo.type,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate instanceof Date ? promo.startDate.toISOString() : promo.startDate,
        endDate: promo.endDate instanceof Date ? promo.endDate.toISOString() : promo.endDate,
        code: promo.code || null,
        minPurchaseAmount: promo.minPurchaseAmount || null,
        maxDiscountAmount: promo.maxDiscountAmount || null,
        usageLimit: promo.usageLimit || null,
        usedCount: promo.usedCount || 0,
        daysRemaining,
        isGlobal: !promo.shopId, // shopId가 null이면 전역 쿠폰
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPromotions,
    });
  } catch (error: any) {
    console.error('프로모션 조회 오류:', error);
    return NextResponse.json(
      { error: '프로모션 조회 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
