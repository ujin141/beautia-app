// Stripe 환불 API
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: 환불 처리
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { bookingId, amount, reason } = body;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 예약 정보 조회
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 환불된 예약인지 확인
    if (booking.paymentStatus === 'refunded') {
      return NextResponse.json(
        { error: '이미 환불된 예약입니다.' },
        { status: 400 }
      );
    }

    // 결제 정보 조회
    const payment = await Payment.findOne({ 
      bookingId: bookingId,
      status: { $in: ['completed', 'refunded'] }
    }).sort({ createdAt: -1 }); // 가장 최근 결제 정보

    if (!payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Stripe PaymentIntent ID 확인
    const paymentIntentId = payment.stripePaymentIntentId;
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Stripe 결제 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 환불 금액 결정 (지정되지 않으면 전체 금액 환불)
    const refundAmount = amount || booking.price;
    
    // 보증금 결제인 경우 보증금만 환불
    const actualRefundAmount = booking.paymentType === 'deposit' || booking.paymentType === 'direct'
      ? (booking.depositAmount || 0)
      : refundAmount;

    // 환불 처리
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: actualRefundAmount,
      reason: reason || 'requested_by_customer',
      metadata: {
        bookingId: bookingId,
        userId: booking.userId.toString(),
        shopName: booking.shopName || '',
        serviceName: booking.serviceName || '',
      },
    });

    // Payment 상태 업데이트
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'refunded',
    });

    // Booking 결제 상태 업데이트
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'refunded',
    });

    return NextResponse.json({
      success: true,
      message: '환불이 완료되었습니다.',
      data: {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        bookingId: bookingId,
      },
    });
  } catch (error) {
    console.error('환불 처리 오류:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
