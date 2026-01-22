// Stripe Webhook: 포인트 충전 완료 처리
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import AdTransaction from '@/models/AdTransaction';
import PlatformRevenue from '@/models/PlatformRevenue';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

export async function POST(request: NextRequest) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Stripe가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    await connectDB();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Stripe signature가 없습니다.' },
        { status: 400 }
      );
    }

    // Webhook 이벤트 검증
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    // 결제 성공 이벤트 처리
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // 마케팅 포인트 충전인지 확인
      if (session.metadata?.type === 'marketing_points_charge' && session.metadata?.partnerId) {
        const partnerId = session.metadata.partnerId;
        const points = parseInt(session.metadata.points || '0');
        const originalAmount = parseInt(session.metadata.originalAmount || '0');
        const commission = parseInt(session.metadata.commission || '0');

        // 거래 내역 찾기
        const transaction = await AdTransaction.findOne({
          stripeSessionId: session.id,
          status: 'pending',
        });

        if (transaction) {
          // 포인트 추가 (atomic operation)
          const partnerUser = await PartnerUser.findByIdAndUpdate(
            partnerId,
            {
              $inc: { marketingPoints: points },
            },
            { new: true }
          );

          if (partnerUser) {
            // 거래 내역 업데이트
            transaction.status = 'completed';
            transaction.stripePaymentIntentId = session.payment_intent as string;
            await transaction.save();

            // 플랫폼 수익 업데이트 (pending -> completed)
            await PlatformRevenue.findOneAndUpdate(
              { transactionId: transaction._id, status: 'pending' },
              {
                status: 'completed',
                stripePaymentIntentId: session.payment_intent as string,
              }
            );

            console.log(`포인트 충전 완료: 파트너 ${partnerId}, ${points}P (수수료 ${commission}원)`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook 오류:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook 처리 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}
