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
import PlatformRevenue from '@/models/PlatformRevenue';
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
    adType: [required('adType'), string('adType', { 
      enum: [
        'main_banner', 'category_top', 'search_powerlink', 'local_push',
        'search_top', 'trending_first', 'todays_pick_top', 'editors_pick',
        'popular_brands', 'category_banner', 'category_middle',
        'shop_detail_top', 'menu_middle', 'community_middle', 'chat_top'
      ] 
    })],
  });

  if (!validation.valid) {
    return validationErrorResponse(validation.error || '유효하지 않은 요청입니다.');
  }

  const { adType, duration, budget, keywords, category } = body;

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

      // 새로운 광고 타입들
      case 'search_top':
        dailyCost = 12000;
        const searchDuration = duration || 7;
        cost = dailyCost * searchDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + searchDuration);
        break;

      case 'trending_first':
        dailyCost = 15000;
        const trendingDuration = duration || 7;
        cost = dailyCost * trendingDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + trendingDuration);
        break;

      case 'todays_pick_top':
        dailyCost = 20000;
        const todaysPickDuration = duration || 7;
        cost = dailyCost * todaysPickDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + todaysPickDuration);
        break;

      case 'editors_pick':
        dailyCost = 25000;
        const editorsPickDuration = duration || 7;
        cost = dailyCost * editorsPickDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + editorsPickDuration);
        break;

      case 'popular_brands':
        dailyCost = 30000;
        const brandsDuration = duration || 7;
        cost = dailyCost * brandsDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + brandsDuration);
        break;

      case 'category_banner':
        dailyCost = 10000;
        const categoryBannerDuration = duration || 7;
        cost = dailyCost * categoryBannerDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + categoryBannerDuration);
        break;

      case 'category_middle':
        dailyCost = 8000;
        const categoryMiddleDuration = duration || 7;
        cost = dailyCost * categoryMiddleDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + categoryMiddleDuration);
        break;

      case 'shop_detail_top':
        dailyCost = 15000;
        const shopDetailDuration = duration || 7;
        cost = dailyCost * shopDetailDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + shopDetailDuration);
        break;

      case 'menu_middle':
        dailyCost = 10000;
        const menuMiddleDuration = duration || 7;
        cost = dailyCost * menuMiddleDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + menuMiddleDuration);
        break;

      case 'community_middle':
        dailyCost = 8000;
        const communityDuration = duration || 7;
        cost = dailyCost * communityDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + communityDuration);
        break;

      case 'chat_top':
        dailyCost = 10000;
        const chatDuration = duration || 7;
        cost = dailyCost * chatDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + chatDuration);
        break;

      default:
        return validationErrorResponse('지원하지 않는 광고 타입입니다.');
    }

    // 플랫폼 수수료 계산 (10%)
    const COMMISSION_RATE = 0.1;
    const platformCommission = Math.floor(cost * COMMISSION_RATE);
    const actualCost = cost; // 파트너가 지불하는 실제 비용
    const totalCost = cost + platformCommission; // 플랫폼이 받는 총 비용

    // 포인트 확인 (수수료 포함)
    const currentPoints = partnerUser.marketingPoints || 0;
    if (currentPoints < totalCost) {
      return validationErrorResponse(`포인트가 부족합니다. 필요: ${totalCost.toLocaleString()}P (광고 ${cost.toLocaleString()}P + 수수료 ${platformCommission.toLocaleString()}P), 보유: ${currentPoints.toLocaleString()}P`);
    }

    // 포인트 차감 (수수료 포함, atomic operation)
    const updatedPartner = await PartnerUser.findByIdAndUpdate(
      verification.partnerId,
      {
        $inc: { marketingPoints: -totalCost },
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
      category: category || undefined,
      impressions: 0,
      clicks: 0,
    });

    await ad.save();

    // 거래 내역 생성
    const transaction = new AdTransaction({
      partnerId: new ObjectId(verification.partnerId),
      type: 'spend',
      amount: totalCost,
      description: `${adType} 광고 구매 (광고 ${cost.toLocaleString()}P + 수수료 ${platformCommission.toLocaleString()}P)`,
      adId: ad._id,
      status: 'completed',
    });
    await transaction.save();

    // 플랫폼 수익 기록
    const platformRevenue = new PlatformRevenue({
      type: 'marketing_ad',
      partnerId: new ObjectId(verification.partnerId),
      shopId: shop._id,
      amount: platformCommission,
      originalAmount: cost,
      commissionRate: COMMISSION_RATE,
      currency: 'KRW',
      description: `${adType} 광고 구매 수수료 (${cost.toLocaleString()}P 중 ${platformCommission.toLocaleString()}P)`,
      transactionId: transaction._id,
      status: 'completed',
    });
    await platformRevenue.save();

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
