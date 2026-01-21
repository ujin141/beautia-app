import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import Stripe from 'stripe';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// GET: 예약 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const bookingObj = booking.toObject();
    return NextResponse.json({
      success: true,
      data: {
        id: bookingObj._id.toString(),
        ...bookingObj,
        _id: undefined,
        __v: undefined,
        createdAt: bookingObj.createdAt.toISOString(),
        updatedAt: bookingObj.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('예약 조회 오류:', error);
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

// PATCH: 예약 상태 변경 (취소, 확인 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, action } = body; // action: 'approve_cancellation' 또는 'reject_cancellation'

    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updates: any = {};
    
    // 취소 요청 승인/거부 처리
    if (action === 'approve_cancellation') {
      if (booking.status !== 'cancellation_requested') {
        return NextResponse.json(
          { error: '취소 요청이 아닌 예약입니다.' },
          { status: 400 }
        );
      }
      updates.status = 'cancelled';
      if (booking.paymentStatus === 'paid') {
        updates.paymentStatus = 'refunded';
      }
    } else if (action === 'reject_cancellation') {
      if (booking.status !== 'cancellation_requested') {
        return NextResponse.json(
          { error: '취소 요청이 아닌 예약입니다.' },
          { status: 400 }
        );
      }
      // 취소 요청 거부 시 원래 상태로 복귀 (확정된 예약이었으면 confirmed로)
      updates.status = 'confirmed';
    } else if (status && ['pending', 'confirmed', 'completed', 'cancelled', 'noshow', 'cancellation_requested'].includes(status)) {
      updates.status = status;
      
      // 취소 시 결제 상태도 변경
      if (status === 'cancelled' && paymentStatus === undefined) {
        updates.paymentStatus = 'refunded';
      }
      
      // 완료 처리 시 자동 환불
      if (status === 'completed' && (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit_paid')) {
        try {
          // 결제 정보 조회
          const payment = await Payment.findOne({ 
            bookingId: id,
            status: { $in: ['completed', 'refunded'] }
          }).sort({ createdAt: -1 });

          if (payment && payment.stripePaymentIntentId && stripe) {
            // 환불 금액 결정
            const refundAmount = booking.paymentType === 'deposit' || booking.paymentType === 'direct'
              ? (booking.depositAmount || 0)
              : booking.price;

            // Stripe 환불 처리
            const refund = await stripe.refunds.create({
              payment_intent: payment.stripePaymentIntentId,
              amount: refundAmount,
              reason: 'requested_by_customer',
              metadata: {
                bookingId: id,
                userId: booking.userId.toString(),
                shopName: booking.shopName || '',
                serviceName: booking.serviceName || '',
                reason: 'booking_completed',
              },
            });

            // Payment 상태 업데이트
            await Payment.findByIdAndUpdate(payment._id, {
              status: 'refunded',
            });

            // Booking 결제 상태 업데이트
            updates.paymentStatus = 'refunded';
            
            console.log(`예약 ${id} 완료 처리 및 환불 완료: ${refund.id}`);
          } else {
            console.warn(`예약 ${id} 환불 불가: 결제 정보 없음`);
          }
        } catch (refundError) {
          console.error('완료 처리 시 환불 오류:', refundError);
          // 환불 실패해도 완료 처리는 진행 (환불은 별도 처리 가능)
          // throw refundError; // 필요시 환불 실패 시 완료 처리도 중단할 수 있음
        }
      }
    }
    
    if (paymentStatus && ['paid', 'unpaid', 'refunded'].includes(paymentStatus)) {
      updates.paymentStatus = paymentStatus;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '변경할 상태를 지정해주세요.' },
        { status: 400 }
      );
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedBooking) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const bookingObj = updatedBooking.toObject();
    return NextResponse.json({
      success: true,
      message: action === 'approve_cancellation' 
        ? '취소 요청이 승인되었습니다.'
        : action === 'reject_cancellation'
        ? '취소 요청이 거부되었습니다.'
        : '예약 상태가 업데이트되었습니다.',
      data: {
        id: bookingObj._id.toString(),
        ...bookingObj,
        _id: undefined,
        __v: undefined,
        createdAt: bookingObj.createdAt.toISOString(),
        updatedAt: bookingObj.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('예약 상태 변경 오류:', error);
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
