import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Shop from '@/models/Shop';
import PartnerUser from '@/models/PartnerUser';
import Settlement from '@/models/Settlement';
import { withAdminAuth } from '@/lib/admin-auth';

// GET: 어드민 정산/재무 데이터
async function handleGET(request: NextRequest) {
  try {
    await connectDB();

    // 날짜 범위 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 이번 달 모든 예약
    const thisMonthBookings = await Booking.find({
      createdAt: { $gte: thisMonthStart },
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    // 총 거래액 (GMV)
    const totalGMV = thisMonthBookings.reduce((sum, b) => sum + b.price, 0);

    // 수수료 (8.5%)
    const feeRate = 0.085;
    const netRevenue = Math.floor(totalGMV * feeRate);

    // 파트너별 정산 데이터
    const partnerMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      shopName: string;
      totalSales: number;
      fee: number;
      payout: number;
      bookingCount: number;
    }>();

    // 주간 정산 데이터 (1/1 ~ 1/7)
    const weekStart = new Date(today.getFullYear(), 0, 1);
    const weekEnd = new Date(today.getFullYear(), 0, 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekBookings = await Booking.find({
      createdAt: { $gte: weekStart, $lte: weekEnd },
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    // 파트너별 집계
    for (const booking of weekBookings) {
      const partnerId = booking.partnerId;
      if (!partnerMap.has(partnerId)) {
        const partner = await PartnerUser.findById(partnerId).lean();
        const shop = await Shop.findOne({ partnerId }).lean();
        partnerMap.set(partnerId, {
          partnerId,
          partnerName: partner?.name || '알 수 없음',
          shopName: shop?.name || '알 수 없음',
          totalSales: 0,
          fee: 0,
          payout: 0,
          bookingCount: 0,
        });
      }

      const partnerData = partnerMap.get(partnerId)!;
      partnerData.totalSales += booking.price;
      partnerData.bookingCount += 1;
    }

    // 수수료 및 지급액 계산
    const settlementsData = Array.from(partnerMap.values()).map(p => {
      const fee = Math.floor(p.totalSales * feeRate);
      const payout = p.totalSales - fee;
      return {
        ...p,
        fee,
        payout,
        period: `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        status: 'pending' as const,
      };
    }).filter(p => p.totalSales > 0);

    // Settlement 모델에서 기존 정산 내역 조회 및 병합
    const existingSettlements = await Settlement.find({
      periodStart: weekStart,
      periodEnd: weekEnd,
    }).lean();

    const existingMap = new Map(existingSettlements.map(s => [s.partnerId, s]));

    // 기존 정산 내역이 있으면 사용, 없으면 새로 생성
    const settlements = settlementsData.map(s => {
      const existing = existingMap.get(s.partnerId);
      if (existing) {
        return {
          _id: existing._id.toString(),
          settlementId: existing._id.toString(),
          partnerId: existing.partnerId,
          partnerName: existing.partnerName,
          shopName: existing.shopName,
          period: existing.period,
          totalSales: existing.totalSales,
          fee: existing.fee,
          payout: existing.payout,
          status: existing.status,
        };
      }
      return {
        ...s,
        _id: undefined,
        settlementId: undefined,
      };
    });

    // 지급 대기 금액
    const pendingPayout = settlements.reduce((sum, s) => sum + s.payout, 0);
    const partnerCount = settlements.length;

    return NextResponse.json({
      success: true,
      data: {
        totalGMV,
        netRevenue,
        feeRate: feeRate * 100,
        pendingPayout,
        partnerCount,
        settlements: settlements.slice(0, 50), // 최대 50개만 반환
      },
    });
  } catch (error) {
    console.error('정산 데이터 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// 인증 미들웨어 적용
export const GET = withAdminAuth(handleGET);
