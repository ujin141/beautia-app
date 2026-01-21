// 광고 포인트 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';

async function handleGet(request: NextRequest) {
  // withPartnerAuth가 이미 인증을 확인했으므로, 토큰만 추출
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('partner_token')?.value ||
                request.nextUrl.searchParams.get('token');

  if (!token) {
    return unauthorizedResponse('인증 토큰이 필요합니다.');
  }

  const verification = await verifyPartnerToken(token);
  if (!verification.valid || !verification.partnerId) {
    return unauthorizedResponse('유효하지 않은 토큰입니다.');
  }

  // 파트너 정보 조회
  const partnerUser = await PartnerUser.findById(verification.partnerId).lean();
  if (!partnerUser) {
    return NextResponse.json(
      { success: false, error: '파트너를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  const points = partnerUser.marketingPoints || 0;
  console.log('포인트 조회:', { partnerId: verification.partnerId, email: partnerUser.email, points, type: typeof points }); // 디버깅용

  // withGetHandler가 successResponse를 다시 래핑하지 않도록 NextResponse 직접 반환
  return NextResponse.json({
    success: true,
    data: {
      points: Number(points) || 0,
    },
  }, { status: 200 });
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
