import { NextRequest } from 'next/server';
import { withGetHandler, withPostHandler } from '@/lib/api-handler';
import { withAdminAuth } from '@/lib/admin-auth';
import { successResponse, validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import Settlement from '@/models/Settlement';
import Booking from '@/models/Booking';
import PartnerUser from '@/models/PartnerUser';
import Stripe from 'stripe';

// Stripe 초기화 (상태 확인용)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// GET: 정산 목록 조회
async function handleGet(request: NextRequest) {
  const settlements = await Settlement.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return settlements.map((settlement: any) => ({
    _id: settlement._id.toString(),
    partnerId: settlement.partnerId,
    partnerName: settlement.partnerName,
    shopName: settlement.shopName,
    period: settlement.period,
    periodStart: settlement.periodStart.toISOString(),
    periodEnd: settlement.periodEnd.toISOString(),
    totalSales: settlement.totalSales,
    fee: settlement.fee,
    payout: settlement.payout,
    bookingCount: settlement.bookingCount,
    status: settlement.status,
    createdAt: settlement.createdAt.toISOString(),
  }));
}

// POST: 정산 생성
async function handlePost(request: NextRequest) {
  const body = await request.json();
  const { periodStart, periodEnd } = body;

  // 유효성 검사
  const validation = validateRequestBody(body, [
    required('periodStart', '정산 시작일을 입력해주세요.'),
    required('periodEnd', '정산 종료일을 입력해주세요.'),
  ]);

  if (!validation.valid) {
    return validationErrorResponse(validation.error!, validation.details);
  }

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  // 모든 파트너 조회
  const partners = await PartnerUser.find({}).lean();

  const settlements = [];

  for (const partner of partners) {
    // Stripe Connect 계정이 있는 파트너만 정산 생성
    if (!partner.stripeConnectAccountId) {
      continue; // Stripe Connect 계정이 없으면 스킵
    }

    // Stripe Connect 계정 상태 확인
    let connectAccountEnabled = false;
    if (stripe) {
      try {
        const account = await stripe.accounts.retrieve(partner.stripeConnectAccountId);
        connectAccountEnabled = account.details_submitted === true && account.payouts_enabled === true;
      } catch (error) {
        console.error(`파트너 ${partner._id} Stripe 계정 조회 실패:`, error);
        continue; // 계정 조회 실패 시 스킵
      }
    }

    if (!connectAccountEnabled) {
      continue; // Stripe Connect 계정이 활성화되지 않았으면 스킵
    }

    // 해당 기간의 예약 조회
    const bookings = await Booking.find({
      partnerId: partner._id.toString(),
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0],
      },
      status: { $in: ['confirmed', 'completed'] },
      paymentStatus: 'paid',
    }).lean();

    if (bookings.length === 0) continue;

    const totalSales = bookings.reduce((sum, b: any) => sum + (b.price || 0), 0);
    const feeRate = 0.1; // 10% 수수료 (실제로는 설정에서 가져와야 함)
    const fee = Math.floor(totalSales * feeRate);
    const payout = totalSales - fee;

    const period = `${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`;

    // 중복 체크
    const existing = await Settlement.findOne({
      partnerId: partner._id.toString(),
      periodStart: startDate,
      periodEnd: endDate,
    });

    if (existing) {
      continue; // 이미 존재하면 스킵
    }

    const settlement = new Settlement({
      partnerId: partner._id.toString(),
      partnerName: partner.name || partner.email,
      shopName: partner.shopName || '알 수 없음',
      period,
      periodStart: startDate,
      periodEnd: endDate,
      totalSales,
      fee,
      payout,
      bookingCount: bookings.length,
      status: 'pending',
      notes: 'Stripe Connect를 통한 정산',
    });

    await settlement.save();
    settlements.push(settlement);
  }

  return successResponse(
    settlements.map(s => ({
      _id: s._id.toString(),
      partnerName: s.partnerName,
      shopName: s.shopName,
      period: s.period,
      payout: s.payout,
    })),
    `${settlements.length}개의 정산이 생성되었습니다.`
  );
}

export const GET = withAdminAuth(withGetHandler(handleGet));
export const POST = withAdminAuth(withPostHandler(handlePost));
