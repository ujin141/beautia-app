import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

// GET: 모든 예약 목록 조회 (어드민용)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // 필터 조건 구성
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    let bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // 검색 필터 적용 (예약번호, 고객명, 파트너명)
    if (search) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter((b: any) => 
        b._id.toString().includes(searchLower) ||
        b.userName?.toLowerCase().includes(searchLower) ||
        b.shopName?.toLowerCase().includes(searchLower) ||
        b.userPhone?.includes(search)
      );
    }

    // _id를 id로 변환 및 포맷팅
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id.toString(),
      userId: booking.userId,
      userName: booking.userName,
      userPhone: booking.userPhone,
      shopId: booking.shopId,
      shopName: booking.shopName,
      partnerId: booking.partnerId,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      price: booking.price,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      aiRiskScore: booking.aiRiskScore || 0,
      aiRiskReason: booking.aiRiskReason,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
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
