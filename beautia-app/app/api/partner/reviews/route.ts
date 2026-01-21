import { NextRequest } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import { withCache, createCacheKey } from '@/lib/cache';
import Review from '@/models/Review';

/**
 * @swagger
 * /api/partner/reviews:
 *   get:
 *     tags: [Partner]
 *     summary: 파트너 리뷰 목록 조회
 *     description: 파트너의 리뷰 목록을 조회합니다.
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
 *         description: 리뷰 목록 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */

// GET: 파트너의 리뷰 목록 조회
async function handleGet(request: NextRequest) {
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

  // 캐시 키 생성 (리뷰는 자주 변경되지 않으므로 3분 캐시)
  const cacheKey = createCacheKey('partner:reviews', partnerId || '');

  return await withCache(cacheKey, async () => {
    const reviews = await Review.find({ partnerId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      shopId: review.shopId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      content: review.content,
      sentiment: review.sentiment || 'neutral',
      reply: review.reply,
      date: review.createdAt.toISOString().split('T')[0],
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    }));

    return {
      reviews: formattedReviews,
      count: formattedReviews.length,
    };
  }, 3 * 60 * 1000); // 3분 캐시
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
