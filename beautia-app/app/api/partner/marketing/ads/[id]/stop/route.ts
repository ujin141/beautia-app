// 광고 중지 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withPostHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import Ad from '@/models/Ad';
import AdTransaction from '@/models/AdTransaction';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import { ObjectId } from 'mongodb';

async function handlePost(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const adId = params.id;

  try {
    // 광고 찾기
    const ad = await Ad.findOne({
      _id: new ObjectId(adId),
      partnerId: new ObjectId(verification.partnerId),
    });

    if (!ad) {
      return notFoundResponse('광고를 찾을 수 없습니다.');
    }

    if (ad.status === 'cancelled' || ad.status === 'completed') {
      return validationErrorResponse('이미 종료된 광고입니다.');
    }

    // 남은 기간 계산 및 환불 금액 계산
    const now = new Date();
    const endDate = new Date(ad.endDate);
    const startDate = new Date(ad.startDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let refundedPoints = 0;

    if (remainingDays > 0 && ad.dailyCost) {
      // 노출형 광고: 남은 일수에 대한 비용 환불
      refundedPoints = Math.floor(ad.dailyCost * remainingDays);
    } else if (ad.budget && ad.costPerClick) {
      // 검색 파워링크: 사용하지 않은 예산 환불 (간단하게 50% 환불)
      const usedBudget = ad.clicks * ad.costPerClick;
      refundedPoints = Math.max(0, Math.floor((ad.budget - usedBudget) * 0.5));
    } else if (ad.costPerAction) {
      // 지역 푸시: 사용하지 않은 비용 환불 (간단하게 50% 환불)
      refundedPoints = Math.floor(ad.cost * 0.5);
    }

    // 광고 상태 변경
    ad.status = 'cancelled';
    await ad.save();

    // 포인트 환불
    if (refundedPoints > 0) {
      const updatedPartner = await PartnerUser.findByIdAndUpdate(
        verification.partnerId,
        {
          $inc: { marketingPoints: refundedPoints },
        },
        { new: true }
      );

      if (!updatedPartner) {
        return serverErrorResponse(new Error('파트너 정보 업데이트 실패'));
      }

      // 환불 거래 내역 생성
      const transaction = new AdTransaction({
        partnerId: new ObjectId(verification.partnerId),
        type: 'refund',
        amount: refundedPoints,
        description: `${ad.type} 광고 중지 환불`,
        adId: ad._id,
        status: 'completed',
      });
      await transaction.save();

      return successResponse({
        refundedPoints,
        remainingPoints: updatedPartner.marketingPoints || 0,
      }, '광고가 중지되었고 포인트가 환불되었습니다.');
    } else {
      return successResponse({
        refundedPoints: 0,
      }, '광고가 중지되었습니다.');
    }
  } catch (error) {
    console.error('광고 중지 오류:', error);
    return serverErrorResponse(error as Error, '광고 중지 중 오류가 발생했습니다.');
  }
}

export const POST = withPartnerAuth(withPostHandler(handlePost));
