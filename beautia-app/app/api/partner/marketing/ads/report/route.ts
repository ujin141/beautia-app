// 광고 리포트 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse } from '@/lib/api-response';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import { ObjectId } from 'mongodb';

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

  // 쿼리 파라미터
  const searchParams = request.nextUrl.searchParams;
  const adId = searchParams.get('adId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // 필터 조건
  const filter: any = {
    partnerId: new ObjectId(verification.partnerId),
  };

  if (adId) {
    filter._id = new ObjectId(adId);
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  // 광고 목록 조회
  const ads = await Ad.find(filter).sort({ createdAt: -1 }).lean();

  // 통계 계산
  const totalSpent = ads.reduce((sum, ad: any) => sum + (ad.cost || 0), 0);
  const totalImpressions = ads.reduce((sum, ad: any) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad: any) => sum + (ad.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;

  return successResponse({
    summary: {
      totalSpent,
      totalImpressions,
      totalClicks,
      ctr: Math.round(ctr * 100) / 100, // 소수점 2자리
      cpc: Math.round(cpc),
    },
    ads: ads.map((ad: any) => ({
      id: ad._id.toString(),
      type: ad.type,
      status: ad.status,
      spent: ad.cost || 0,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: ad.impressions > 0 ? Math.round((ad.clicks / ad.impressions) * 100 * 100) / 100 : 0,
      cpc: ad.clicks > 0 ? Math.round((ad.cost || 0) / ad.clicks) : 0,
      startDate: ad.startDate,
      endDate: ad.endDate,
      createdAt: ad.createdAt,
    })),
  });
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
