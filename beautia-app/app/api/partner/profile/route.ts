import { NextRequest } from 'next/server';
import { withGetHandler, withPatchHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse, notFoundResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import { withCache, createCacheKey } from '@/lib/cache';
import PartnerUser from '@/models/PartnerUser';

/**
 * @swagger
 * /api/partner/profile:
 *   get:
 *     tags: [Partner]
 *     summary: 파트너 프로필 조회
 *     description: 파트너 프로필 정보를 조회합니다.
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
 *         description: 프로필 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 파트너를 찾을 수 없음
 *   patch:
 *     tags: [Partner]
 *     summary: 파트너 프로필 업데이트
 *     description: 파트너 프로필 정보를 업데이트합니다.
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
 *             properties:
 *               partnerId:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 파트너를 찾을 수 없음
 */
// GET: 파트너 프로필 조회
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

  // 캐시 키 생성 (프로필은 자주 변경되지 않으므로 5분 캐시)
  const cacheKey = createCacheKey('partner:profile', partnerId || '');

  return await withCache(cacheKey, async () => {
    const user = await PartnerUser.findById(partnerId).lean();

    if (!user) {
      return notFoundResponse('파트너를 찾을 수 없습니다.');
    }

    const userObj = user as any;
    return {
      id: userObj._id.toString(),
      email: userObj.email,
      name: userObj.name,
      phone: userObj.phone || '',
      lastLoginAt: userObj.lastLoginAt?.toISOString(),
      createdAt: userObj.createdAt.toISOString(),
      updatedAt: userObj.updatedAt.toISOString(),
    };
  }, 5 * 60 * 1000); // 5분 캐시
}

// PATCH: 파트너 프로필 업데이트
async function handlePatch(request: NextRequest) {
  const body = await request.json();
  const { partnerId, name, phone } = body;

  // 필수 필드 검증
  if (!partnerId) {
    return validationErrorResponse('파트너 ID가 필요합니다.');
  }

  const updates: any = {};
  if (name !== undefined) {
    if (!name.trim()) {
      return validationErrorResponse('이름을 입력해주세요.');
    }
    updates.name = name.trim();
  }
  if (phone !== undefined) {
    updates.phone = phone.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return validationErrorResponse('변경할 정보가 없습니다.');
  }

  const updatedUser = await PartnerUser.findByIdAndUpdate(
    partnerId,
    updates,
    { new: true }
  ).lean();

  if (!updatedUser) {
    return notFoundResponse('파트너를 찾을 수 없습니다.');
  }

  const userObj = updatedUser as any;
  return successResponse(
    {
      id: userObj._id.toString(),
      email: userObj.email,
      name: userObj.name,
      phone: userObj.phone || '',
      lastLoginAt: userObj.lastLoginAt?.toISOString(),
      createdAt: userObj.createdAt.toISOString(),
      updatedAt: userObj.updatedAt.toISOString(),
    },
    '프로필이 업데이트되었습니다.'
  );
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
export const PATCH = withPartnerAuth(withPatchHandler(handlePatch));
