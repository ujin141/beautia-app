import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';

// Stripe 초기화 (환경 변수 확인)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// 웹훅은 raw body를 필요로 하므로 config 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'No signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // 이벤트 타입별 처리
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const paymentType = metadata.type;

        // 포인트 충전 처리
        if (paymentType === 'point_charge') {
          const partnerId = metadata.partnerId;
          const chargeAmount = parseInt(metadata.amount || '0');

          if (partnerId && chargeAmount > 0) {
            // PartnerUser 모델 import
            const PartnerUser = (await import('@/models/PartnerUser')).default;
            
            // Stripe Customer가 없으면 생성하고 저장
            if (session.customer && typeof session.customer === 'string') {
              await PartnerUser.findByIdAndUpdate(partnerId, {
                stripeCustomerId: session.customer,
              });
            }

            // 저장된 결제 수단이 있으면 기본으로 설정 (첫 번째 결제 수단인 경우)
            if (session.payment_intent && typeof session.payment_intent === 'string') {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
                if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
                  const partner = await PartnerUser.findById(partnerId);
                  // 기본 결제 수단이 없으면 설정
                  if (partner && !partner.defaultPaymentMethodId) {
                    await PartnerUser.findByIdAndUpdate(partnerId, {
                      defaultPaymentMethodId: paymentIntent.payment_method,
                    });
                  }
                }
              } catch (err) {
                console.error('Payment method 설정 오류:', err);
              }
            }
            
            // 파트너 포인트 충전
            await PartnerUser.findByIdAndUpdate(partnerId, {
              $inc: { marketingPoints: chargeAmount },
            });

            // 결제 기록 생성 (포인트 충전용)
            const payment = new Payment({
              bookingId: `point_charge_${partnerId}_${Date.now()}`,
              userId: partnerId,
              amount: session.amount_total || chargeAmount,
              method: 'card',
              status: 'completed',
              paymentMethodDetail: `Stripe Payment: ${session.payment_intent} - Point Charge`,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent?.toString(),
              completedAt: new Date(),
            });

            await payment.save();

            console.log('Point charge completed for partner:', partnerId, 'Amount:', chargeAmount);
          }
        } else {
          // 예약 결제 처리 (기존 로직)
          const bookingId = metadata.bookingId || session.client_reference_id;

          if (!bookingId) {
            console.error('Booking ID not found in session');
            break;
          }

          // 예약 상태 업데이트
          await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: 'paid',
          });

          // 결제 기록 생성
          const payment = new Payment({
            bookingId,
            userId: metadata.userId || '',
            amount: session.amount_total || 0,
            method: 'card',
            status: 'completed',
            paymentMethodDetail: `Stripe Payment: ${session.payment_intent}`,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent?.toString(),
            completedAt: new Date(),
          });

          await payment.save();

          console.log('Payment completed for booking:', bookingId);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata || {};
        const bookingId = metadata.bookingId;
        
        console.log('PaymentIntent succeeded:', paymentIntent.id, 'bookingId:', bookingId);
        
        // Payment 모델에 결제 정보 저장 (PaymentSheet 사용 시)
        if (bookingId && metadata.userId) {
          try {
            // 이미 Payment가 있는지 확인
            const existingPayment = await Payment.findOne({
              bookingId: bookingId,
              stripePaymentIntentId: paymentIntent.id,
            });
            
            if (!existingPayment) {
              // Payment 생성
              const payment = new Payment({
                bookingId: bookingId,
                userId: metadata.userId,
                amount: paymentIntent.amount,
                method: 'card',
                status: 'completed',
                paymentMethodDetail: `Stripe PaymentIntent: ${paymentIntent.id}`,
                stripePaymentIntentId: paymentIntent.id,
                completedAt: new Date(),
              });
              
              await payment.save();
              
              // Booking 결제 상태 업데이트
              await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: paymentIntent.metadata?.paymentType === 'deposit' ? 'deposit_paid' : 'paid',
              });
              
              console.log('Payment created for booking:', bookingId);
            }
          } catch (error) {
            console.error('Payment 생성 오류:', error);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook 처리 오류:', error);
    return NextResponse.json(
      { error: 'Webhook 처리 실패' },
      { status: 500 }
    );
  }
}
