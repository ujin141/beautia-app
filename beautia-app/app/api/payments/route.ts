import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';

// POST: 결제 생성 및 처리
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { bookingId, userId, amount, method, paymentMethodDetail } = body;

    // 필수 필드 검증
    if (!bookingId || !userId || !amount || !method) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 결제 수단 검증
    if (!['card', 'account', 'easy', 'virtual'].includes(method)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 수단입니다.' },
        { status: 400 }
      );
    }

    // 예약 확인
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약 금액 확인
    if (booking.price !== amount) {
      return NextResponse.json(
        { error: '결제 금액이 예약 금액과 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 이미 결제된 예약인지 확인
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: '이미 결제가 완료된 예약입니다.' },
        { status: 400 }
      );
    }

    // 결제 처리 (실제로는 PG사 연동 필요)
    // 모의 결제: 90% 성공률
    const paymentSuccess = Math.random() > 0.1;

    const payment = new Payment({
      bookingId,
      userId,
      amount,
      method,
      status: paymentSuccess ? 'completed' : 'failed',
      paymentMethodDetail,
      completedAt: paymentSuccess ? new Date() : undefined,
    });

    await payment.save();

    if (paymentSuccess) {
      // 예약 상태 업데이트
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid',
      });

      const paymentObj = payment.toObject();
      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다.',
        payment: {
          id: paymentObj._id.toString(),
          ...paymentObj,
          _id: undefined,
          __v: undefined,
          createdAt: paymentObj.createdAt.toISOString(),
          updatedAt: paymentObj.updatedAt.toISOString(),
          completedAt: paymentObj.completedAt?.toISOString(),
        },
      }, { status: 201 });
    } else {
      const paymentObj = payment.toObject();
      return NextResponse.json(
        { 
          error: '결제에 실패했습니다. 다시 시도해주세요.',
          payment: {
            id: paymentObj._id.toString(),
            ...paymentObj,
            _id: undefined,
            __v: undefined,
            createdAt: paymentObj.createdAt.toISOString(),
            updatedAt: paymentObj.updatedAt.toISOString(),
          },
        },
        { status: 402 }
      );
    }
  } catch (error) {
    console.error('결제 처리 오류:', error);
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

// GET: 결제 내역 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bookingId = searchParams.get('bookingId');

    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }
    if (bookingId) {
      filter.bookingId = bookingId;
    }

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const formattedPayments = payments.map((payment: any) => ({
      id: payment._id.toString(),
      ...payment,
      _id: undefined,
      __v: undefined,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      completedAt: payment.completedAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPayments,
      count: formattedPayments.length,
    });
  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
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
