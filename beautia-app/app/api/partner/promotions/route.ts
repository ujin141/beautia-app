import { NextRequest } from 'next/server';
import { withGetHandler, withPostHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse, notFoundResponse } from '@/lib/api-response';
import { validateRequestBody, required, objectId } from '@/lib/api-validator';
import { withCache, createCacheKey } from '@/lib/cache';
import Promotion from '@/models/Promotion';
import Shop from '@/models/Shop';
import { ObjectId } from 'mongodb';

/**
 * @swagger
 * /api/partner/promotions:
 *   get:
 *     tags: [Partner]
 *     summary: 프로모션 목록 조회
 *     description: 파트너의 프로모션 목록을 조회합니다. recommended=true로 추천 프로모션만 조회 가능합니다.
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
 *       - in: query
 *         name: recommended
 *         schema:
 *           type: boolean
 *         description: 추천 프로모션만 조회
 *     responses:
 *       200:
 *         description: 프로모션 목록 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *   post:
 *     tags: [Partner]
 *     summary: 프로모션 생성
 *     description: 새로운 프로모션을 생성합니다.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *               - title
 *               - description
 *               - type
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               partnerId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [discount, flash_sale, package, coupon]
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 프로모션 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// GET: 프로모션 목록 조회 (추천 프로모션 포함)
async function handleGet(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const partnerId = searchParams.get('partnerId');
  const recommended = searchParams.get('recommended') === 'true';

  // 유효성 검사
  if (!partnerId) {
    return validationErrorResponse('파트너 ID가 필요합니다.');
  }

  // 파트너의 샵 찾기
  const shop = await Shop.findOne({ partnerId: new ObjectId(partnerId) });
  if (!shop) {
    return notFoundResponse('샵을 찾을 수 없습니다.');
  }

  // 캐시 키 생성
  const cacheKey = createCacheKey('partner:promotions', partnerId, recommended ? 'recommended' : 'all');

  return await withCache(cacheKey, async () => {
    if (recommended) {
      // 추천 프로모션: 현재 활성화된 프로모션 중 효과적인 것들
      const now = new Date();
      const promotions = await Promotion.find({
        shopId: shop._id,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ discountValue: -1, createdAt: -1 })
        .limit(5)
        .lean();

      // AI 기반 추천 로직 (간단한 예시)
      const recommendedPromotions = promotions.map((promo: any) => {
        const daysRemaining = Math.ceil((new Date(promo.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const effectiveness = promo.discountValue * (promo.usedCount || 0) / (daysRemaining || 1);
        
        return {
          ...promo,
          _id: promo._id.toString(),
          shopId: promo.shopId.toString(),
          effectiveness,
          daysRemaining,
          recommendation: effectiveness > 50 ? 'high' : effectiveness > 20 ? 'medium' : 'low',
        };
      });

      return recommendedPromotions;
    } else {
      // 전체 프로모션 목록
      const promotions = await Promotion.find({ shopId: shop._id })
        .sort({ createdAt: -1 })
        .lean();

      return promotions.map((promo: any) => ({
        ...promo,
        _id: promo._id.toString(),
        shopId: promo.shopId.toString(),
      }));
    }
  }, 2 * 60 * 1000); // 2분 캐시
}

// POST: 프로모션 생성
async function handlePost(request: NextRequest) {
  const body = await request.json();
  const { partnerId, shopId, ...promotionData } = body;

  // 유효성 검사
  if (!partnerId) {
    return validationErrorResponse('파트너 ID가 필요합니다.');
  }

  // shopId가 제공된 경우 해당 샵 사용, 없으면 파트너의 첫 번째 샵 사용
  let shop;
  if (shopId) {
    // shopId가 ObjectId 형식인지 확인
    try {
      shop = await Shop.findOne({
        _id: new ObjectId(shopId),
        partnerId: new ObjectId(partnerId),
      });
    } catch (error) {
      shop = await Shop.findOne({
        _id: shopId,
        partnerId: new ObjectId(partnerId),
      });
    }
  } else {
    // shopId가 없으면 파트너의 첫 번째 샵 사용
    shop = await Shop.findOne({ partnerId: new ObjectId(partnerId) });
  }

  if (!shop) {
    return notFoundResponse('샵을 찾을 수 없습니다.');
  }

  // 프로모션 생성
  const promotion = new Promotion({
    ...promotionData,
    shopId: shop._id,
  });

  await promotion.save();

  return successResponse(
    {
      ...promotion.toObject(),
      _id: promotion._id.toString(),
        shopId: promotion.shopId?.toString() || null,
    },
    '프로모션이 생성되었습니다.',
    201
  );
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
export const POST = withPartnerAuth(withPostHandler(handlePost));
