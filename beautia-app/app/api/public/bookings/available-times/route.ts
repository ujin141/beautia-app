export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

/**
 * GET: 예약 가능한 시간 목록 조회
 * Query Parameters:
 * - shopId: 매장 ID (필수)
 * - date: 예약 날짜 YYYY-MM-DD (필수)
 * - staffId: 스태프 ID (선택, 지정 시 해당 스태프만 체크)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId');

    if (!shopId || !date) {
      return NextResponse.json(
        { success: false, error: 'shopId와 date는 필수입니다.' },
        { status: 400 }
      );
    }

    // 기본 시간 슬롯 (10:00 ~ 19:00, 30분 간격)
    const allTimeSlots = [
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];

    // 해당 날짜의 예약된 시간 조회
    const bookingFilter: any = {
      shopId: shopId,
      date: date,
      status: { $in: ['pending', 'confirmed'] }, // 취소되지 않은 예약만
    };

    // 스태프가 지정된 경우, 같은 스태프의 예약만 체크
    if (staffId) {
      bookingFilter.staffId = staffId;
    }

    const bookedBookings = await Booking.find(bookingFilter).select('time').lean();

    // 예약된 시간 목록
    const bookedTimes = bookedBookings.map((booking: any) => booking.time);

    // 예약 가능한 시간 목록 (예약되지 않은 시간)
    const availableTimes = allTimeSlots.filter((time) => !bookedTimes.includes(time));

    return NextResponse.json({
      success: true,
      data: {
        availableTimes,
        bookedTimes,
        allTimeSlots,
      },
    });
  } catch (error) {
    console.error('예약 가능 시간 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: '예약 가능 시간을 조회하는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
