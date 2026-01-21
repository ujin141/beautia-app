// 광고 노출/클릭 추적 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withPostHandler } from '@/lib/api-handler';
import { successResponse, validationErrorResponse, notFoundResponse } from '@/lib/api-response';
import { validateRequestBody, required, string } from '@/lib/api-validator';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { ObjectId } from 'mongodb';

async function handlePost(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const adId = params.id;

  // 요청 본문 검증
  const body = await request.json();
  const validation = validateRequestBody(body, {
    action: [required('action'), string('action', { enum: ['impression', 'click'] })],
  });

  if (!validation.valid) {
    return validationErrorResponse(validation.error || '유효하지 않은 요청입니다.');
  }

  const { action } = body;

  try {
    // 광고 찾기
    const ad = await Ad.findById(new ObjectId(adId));

    if (!ad) {
      return notFoundResponse('광고를 찾을 수 없습니다.');
    }

    // 활성 광고만 추적
    if (ad.status !== 'active') {
      return successResponse({ message: '비활성 광고입니다.' });
    }

    // 현재 시간이 광고 기간 내인지 확인
    const now = new Date();
    if (now < ad.startDate || now > ad.endDate) {
      return successResponse({ message: '광고 기간이 아닙니다.' });
    }

    // 노출 또는 클릭 수 증가
    if (action === 'impression') {
      await Ad.findByIdAndUpdate(adId, {
        $inc: { impressions: 1 },
      });
    } else if (action === 'click') {
      await Ad.findByIdAndUpdate(adId, {
        $inc: { clicks: 1 },
      });
    }

    return successResponse({ message: '추적 완료' });
  } catch (error) {
    console.error('광고 추적 오류:', error);
    return NextResponse.json(
      { success: false, error: '광고 추적 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export const POST = withPostHandler(handlePost);
