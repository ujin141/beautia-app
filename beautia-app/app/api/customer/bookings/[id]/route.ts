import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

export const runtime = 'nodejs';

// PATCH: 예약 취소
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const bookingId = id;
    const customerId = customer.id || customer._id?.toString();

    // 예약 조회
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인의 예약인지 확인)
    if (booking.userId !== customerId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 취소되었거나 완료된 예약은 취소 불가
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '이미 취소되었거나 완료된 예약입니다.' },
        { status: 400 }
      );
    }

    // 이미 취소 요청이 있는 경우
    if (booking.status === 'cancellation_requested') {
      return NextResponse.json(
        { success: false, error: '이미 취소 요청이 접수되었습니다. 파트너의 승인을 기다려주세요.' },
        { status: 400 }
      );
    }

    // 예약 취소 요청 처리 (파트너 승인 필요)
    booking.status = 'cancellation_requested';
    await booking.save();

    return NextResponse.json({
      success: true,
      message: '취소 요청이 접수되었습니다. 파트너의 승인을 기다려주세요.',
      data: {
        id: booking._id.toString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      }
    });

  } catch (error) {
    console.error('예약 취소 오류:', error);
    return NextResponse.json(
      { success: false, error: '예약 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 특정 예약 상세 정보 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const bookingId = id;
    const customerId = customer.id || customer._id?.toString();

    // 예약 조회
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    if ((booking as any).userId !== customerId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (booking as any)._id.toString(),
        userId: (booking as any).userId,
        userName: (booking as any).userName,
        shopId: (booking as any).shopId,
        shopName: (booking as any).shopName,
        serviceId: (booking as any).serviceId,
        serviceName: (booking as any).serviceName,
        date: (booking as any).date,
        time: (booking as any).time,
        price: (booking as any).price,
        status: (booking as any).status,
        paymentStatus: (booking as any).paymentStatus,
        staffId: (booking as any).staffId,
        staffName: (booking as any).staffName,
        createdAt: (booking as any).createdAt ? new Date((booking as any).createdAt).toISOString() : new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('예약 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '예약 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
