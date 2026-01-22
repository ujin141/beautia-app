// 광고 포인트 충전 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withPostHandler } from '@/lib/api-handler';
import { withPartnerAuth } from '@/lib/partner-auth';
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required, number } from '@/lib/api-validator';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import AdTransaction from '@/models/AdTransaction';
import PlatformRevenue from '@/models/PlatformRevenue';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function handlePost(request: NextRequest) {
  await connectDB();

  // 토큰에서 파트너 ID 가져오기
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('partner_token')?.value;

  if (!token) {
    return validationErrorResponse('인증 토큰이 필요합니다.');
  }

  const verification = await verifyPartnerToken(token);
  if (!verification.valid || !verification.partnerId) {
    return validationErrorResponse('유효하지 않은 토큰입니다.');
  }

  // 요청 본문 검증
  const body = await request.json();
  const validation = validateRequestBody(body, {
    amount: [required('amount'), number('amount', { min: 1000, message: '최소 충전 금액은 1,000원입니다.' })],
    currency: [required('currency')],
  });

  if (!validation.valid) {
    return validationErrorResponse(validation.error || '유효하지 않은 요청입니다.');
  }

  const { amount, currency } = body;

  if (!stripe) {
    return serverErrorResponse(new Error('Stripe가 설정되지 않았습니다.'));
  }

  // 플랫폼 수수료 설정 (10%)
  const COMMISSION_RATE = 0.1; // 10% 수수료
  const platformCommission = Math.floor(amount * COMMISSION_RATE);
  const pointsToGive = amount - platformCommission; // 실제로 주는 포인트

  try {
    // 파트너 정보 조회
    const partnerUser = await PartnerUser.findById(verification.partnerId);
    if (!partnerUser) {
      return NextResponse.json(
        { success: false, error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Stripe Customer 생성 또는 조회
    let stripeCustomerId = partnerUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: partnerUser.email,
        name: partnerUser.name,
        metadata: {
          partnerId: partnerUser._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      partnerUser.stripeCustomerId = stripeCustomerId;
      await partnerUser.save();
    }

    // Stripe Checkout 세션 생성
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `광고 포인트 ${amount.toLocaleString()}P 충전`,
              description: 'BEAUTIA 마케팅 포인트 충전',
            },
            unit_amount: amount, // 실제 금액 (원 단위)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${NEXT_PUBLIC_BASE_URL}/partner/dashboard/marketing?charge=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${NEXT_PUBLIC_BASE_URL}/partner/dashboard/marketing?charge=cancelled`,
      metadata: {
        partnerId: partnerUser._id.toString(),
        type: 'marketing_points_charge',
        points: pointsToGive.toString(), // 실제로 주는 포인트 (수수료 제외)
        originalAmount: amount.toString(), // 원본 금액
        commission: platformCommission.toString(), // 플랫폼 수수료
      },
    });

    // 거래 내역 생성 (pending 상태)
    const transaction = new AdTransaction({
      partnerId: partnerUser._id,
      type: 'charge',
      amount: amount,
      description: `광고 포인트 ${pointsToGive.toLocaleString()}P 충전 (수수료 ${platformCommission.toLocaleString()}원)`,
      stripeSessionId: session.id,
      status: 'pending',
    });
    await transaction.save();

    // 플랫폼 수익 기록 (pending 상태, 결제 완료 후 completed로 변경)
    const platformRevenue = new PlatformRevenue({
      type: 'marketing_charge',
      partnerId: partnerUser._id,
      amount: platformCommission,
      originalAmount: amount,
      commissionRate: COMMISSION_RATE,
      currency: currency.toLowerCase(),
      description: `포인트 충전 수수료 (${amount.toLocaleString()}원 중 ${platformCommission.toLocaleString()}원)`,
      transactionId: transaction._id,
      status: 'pending',
    });
    await platformRevenue.save();

    return successResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
    }, '결제 페이지로 이동합니다.');
  } catch (error) {
    console.error('포인트 충전 오류:', error);
    return serverErrorResponse(error as Error, '포인트 충전 중 오류가 발생했습니다.');
  }
}

export const POST = withPartnerAuth(withPostHandler(handlePost));
