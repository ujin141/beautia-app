import { NextRequest } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import Booking from '@/models/Booking';

// GET: 파트너의 정산 및 매출 데이터
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

  // 날짜 범위 설정
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7);

  // 이번 달 모든 예약
  const thisMonthBookings = await Booking.find({
    partnerId,
    createdAt: { $gte: thisMonthStart },
  }).lean();

  // 결제 완료된 예약만 필터링
  const paidBookings = thisMonthBookings.filter(b => b.paymentStatus === 'paid');
  
  // 총 매출
  const totalSales = paidBookings.reduce((sum, b) => sum + b.price, 0);
  
  // 총 결제 건수
  const totalPayments = paidBookings.length;

  // 미정산 잔액 (결제 완료되었지만 아직 확정되지 않은 건)
  const unconfirmedBookings = thisMonthBookings.filter(
    b => b.paymentStatus === 'paid' && b.status === 'pending'
  );
  const unsettledBalance = unconfirmedBookings.reduce((sum, b) => sum + b.price, 0);

  // 다음 정산 예정액 (다음 주 월요일 기준)
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
  const lastWeekEnd = new Date(nextMonday);
  lastWeekEnd.setDate(nextMonday.getDate() - 1);

  const nextSettlementBookings = await Booking.find({
    partnerId,
    createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
    paymentStatus: 'paid',
    status: { $in: ['confirmed', 'completed'] },
  }).lean();

  const nextSettlementAmount = nextSettlementBookings.reduce((sum, b) => sum + b.price, 0);
  // 수수료 5% 공제
  const nextSettlementAfterFee = Math.floor(nextSettlementAmount * 0.95);

  // 최근 정산 내역 (주간 단위)
  const settlements = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekBookings = await Booking.find({
      partnerId,
      createdAt: { $gte: weekStart, $lte: weekEnd },
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const weekTotal = weekBookings.reduce((sum, b) => sum + b.price, 0);
    const fee = Math.floor(weekTotal * 0.05);
    const final = weekTotal - fee;

    if (weekTotal > 0) {
      settlements.push({
        date: weekEnd.toISOString().split('T')[0],
        period: `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        total: weekTotal,
        fee,
        final,
        status: 'complete',
      });
    }
  }

  return {
    nextSettlement: {
      amount: nextSettlementAfterFee,
      date: nextMonday.toISOString().split('T')[0],
    },
    monthlySales: totalSales,
    totalPayments,
    unsettledBalance,
    settlements,
  };
}

export const GET = withPartnerAuth(withGetHandler(handleGet));
