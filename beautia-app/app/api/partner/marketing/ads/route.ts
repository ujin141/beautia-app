// 광고 구매/활성화 및 목록 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler, withPostHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required, number, string, numberRange } from '@/lib/api-validator';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';
import Ad from '@/models/Ad';
import AdTransaction from '@/models/AdTransaction';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import { ObjectId } from 'mongodb';

// GET: 활성 광고 목록 조회
async function handleGet(request: NextRequest) {
  await connectDB();

  // 토큰에서 파트너 ID 가져오기
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('partner_token')?.value;

  if (!token) {
    return validationErrorResponse('인증 토큰이 필요합니다.');
  }

  const verification = await verifyPartnerToken(token);
  if (!verification.valid || !verification.partnerId) {
    return validationErrorResponse('유효하지 않은 토큰입니다.');
  }

  // 파트너의 샵 찾기
  const shop = await Shop.findOne({ partnerId: new ObjectId(verification.partnerId) });
  if (!shop) {
    return notFoundResponse('샵을 찾을 수 없습니다.');
  }

  // 활성 광고 목록 조회
  const ads = await Ad.find({
    partnerId: new ObjectId(verification.partnerId),
    shopId: shop._id,
    status: { $in: ['active', 'paused'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse({
    ads: ads.map((ad: any) => ({
      id: ad._id.toString(),
      type: ad.type,
      status: ad.status,
      startDate: ad.startDate,
      endDate: ad.endDate,
      cost: ad.cost,
      dailyCost: ad.dailyCost,
      costPerClick: ad.costPerClick,
      costPerAction: ad.costPerAction,
      budget: ad.budget,
      keywords: ad.keywords,
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      createdAt: ad.createdAt,
    })),
  });
}

// POST: 광고 구매/활성화
async function handlePost(request: NextRequest) {
  await connectDB();

  // 토큰에서 파트너 ID 가져오기
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('partner_token')?.value;

  if (!token) {
    return validationErrorResponse('인증 토큰이 필요합니다.');
  }

  const verification = await verifyPartnerToken(token);
  if (!verification.valid || !verification.partnerId) {
    return validationErrorResponse('유효하지 않은 토큰입니다.');
  }

  // 요청 본문 검증
  const body = await request.json();
  const validation = validateRequestBody(body, {
    adType: [required('adType'), string('adType', { enum: ['main_banner', 'category_top', 'search_powerlink', 'local_push'] })],
  });

  if (!validation.valid) {
    return validationErrorResponse(validation.error || '유효하지 않은 요청입니다.');
  }

  const { adType, duration, budget, keywords } = body;

  try {
    // 파트너 정보 조회
    const partnerUser = await PartnerUser.findById(verification.partnerId);
    if (!partnerUser) {
      return notFoundResponse('파트너를 찾을 수 없습니다.');
    }

    // 파트너의 샵 찾기
    const shop = await Shop.findOne({ partnerId: new ObjectId(verification.partnerId) });
    if (!shop) {
      return notFoundResponse('샵을 찾을 수 없습니다.');
    }

    // 광고 타입별 비용 계산
    let cost = 0;
    let dailyCost: number | undefined;
    let costPerClick: number | undefined;
    let costPerAction: number | undefined;
    let endDate: Date;

    const startDate = new Date();

    switch (adType) {
      case 'main_banner':
        dailyCost = 30000;
        const bannerDuration = duration || 7; // 기본 7일
        cost = dailyCost * bannerDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + bannerDuration);
        break;

      case 'category_top':
        dailyCost = 15000;
        const categoryDuration = duration || 7; // 기본 7일
        cost = dailyCost * categoryDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + categoryDuration);
        break;

      case 'search_powerlink':
        costPerClick = 500;
        // 예산이 있으면 예산 사용, 없으면 기본 10,000원
        const powerlinkBudget = budget || 10000;
        cost = powerlinkBudget;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // 기본 30일
        break;

      case 'local_push':
        costPerAction = 50;
        // 기본 100건
        const pushCount = budget ? Math.floor(budget / costPerAction) : 100;
        cost = pushCount * costPerAction;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // 기본 30일
        break;

      default:
        return validationErrorResponse('지원하지 않는 광고 타입입니다.');
    }

    // 포인트 확인
    const currentPoints = partnerUser.marketingPoints || 0;
    if (currentPoints < cost) {
      return validationErrorResponse(`포인트가 부족합니다. 필요: ${cost.toLocaleString()}P, 보유: ${currentPoints.toLocaleString()}P`);
    }

    // 포인트 차감 (atomic operation)
    const updatedPartner = await PartnerUser.findByIdAndUpdate(
      verification.partnerId,
      {
        $inc: { marketingPoints: -cost },
      },
      { new: true }
    );

    if (!updatedPartner) {
      return serverErrorResponse(new Error('파트너 정보 업데이트 실패'));
    }

    // 광고 생성
    const ad = new Ad({
      partnerId: new ObjectId(verification.partnerId),
      shopId: shop._id,
      type: adType,
      status: 'active',
      startDate,
      endDate,
      cost,
      dailyCost,
      costPerClick,
      costPerAction,
      budget: budget || cost,
      keywords: keywords || [],
      impressions: 0,
      clicks: 0,
    });

    await ad.save();

    // 거래 내역 생성
    const transaction = new AdTransaction({
      partnerId: new ObjectId(verification.partnerId),
      type: 'spend',
      amount: cost,
      description: `${adType} 광고 구매`,
      adId: ad._id,
      status: 'completed',
    });
    await transaction.save();

    return successResponse(
      {
        adId: ad._id.toString(),
        remainingPoints: updatedPartner.marketingPoints || 0,
        startDate: ad.startDate,
        endDate: ad.endDate,
      },
      '광고가 활성화되었습니다.',
      201
    );
  } catch (error) {
    console.error('광고 구매 오류:', error);
    return serverErrorResponse(error as Error, '광고 구매 중 오류가 발생했습니다.');
  }
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
export const POST = withPartnerAuth(withPostHandler(handlePost));
