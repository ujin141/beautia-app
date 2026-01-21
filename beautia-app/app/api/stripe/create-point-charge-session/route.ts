import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import { getPartnerUser } from '@/lib/auth';

// Stripe 초기화 (환경 변수 확인)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다. Stripe 결제가 작동하지 않을 수 있습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: 마케팅 포인트 충전용 Stripe Checkout Session 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 요청 본문 안전하게 파싱
    let body: any = {};
    try {
      const bodyText = await request.text();
      if (bodyText.trim()) {
        body = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.error('요청 본문 파싱 오류:', parseError);
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }
    
    const { amount, currency = 'krw', partnerId } = body;
    
    console.log('포인트 충전 요청:', { amount, currency, partnerId });

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '충전할 금액이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다. STRIPE_SECRET_KEY를 확인해주세요.' },
        { status: 500 }
      );
    }

    // 통화 유효성 검증
    const validCurrencies = ['krw', 'usd', 'jpy', 'eur', 'gbp', 'cny', 'thb'];
    const selectedCurrency = validCurrencies.includes(currency.toLowerCase()) 
      ? currency.toLowerCase() 
      : 'krw';
    
    console.log('사용할 통화:', selectedCurrency, '요청 통화:', currency);

    // 금액 계산 및 검증
    let stripeAmount = amount;
    
    // 통화별 최소 단위 변환
    if (selectedCurrency === 'krw' || selectedCurrency === 'jpy') {
      stripeAmount = Math.round(amount); // 원/엔 단위 그대로
    } else {
      // 환율 변환
      const exchangeRates: { [key: string]: number } = {
        usd: 0.00075,
        eur: 0.00069,
        jpy: 0.11,
        gbp: 0.00059,
        cny: 0.0054,
        thb: 0.027,
      };
      
      const rate = exchangeRates[selectedCurrency] || 1;
      const convertedAmount = amount * rate;
      stripeAmount = Math.round(convertedAmount * 100); // 센트 단위
    }
    
    // 최소 금액 검증
    const minAmounts: { [key: string]: number } = {
      krw: 100,
      jpy: 100,
      usd: 50,
      eur: 50,
      gbp: 30,
      cny: 300,
      thb: 1800,
    };
    
    const minAmount = minAmounts[selectedCurrency] || 100;
    if (stripeAmount < minAmount) {
      return NextResponse.json(
        { 
          error: `최소 충전 금액은 ${minAmount} ${selectedCurrency.toUpperCase()}입니다.`,
          minAmount,
          currency: selectedCurrency,
        },
        { status: 400 }
      );
    }

    // 성공/취소 URL 설정
    const baseUrl = request.nextUrl.origin;
    const successUrl = `${baseUrl}/partner/dashboard/marketing?charge_success=true&amount=${amount}`;
    const cancelUrl = `${baseUrl}/partner/dashboard/marketing`;

    // PartnerUser에서 Stripe Customer ID 확인
    const PartnerUser = (await import('@/models/PartnerUser')).default;
    const partner = await PartnerUser.findById(partnerId);
    
    let customerId = partner?.stripeCustomerId;
    
    // Stripe Customer가 없으면 생성
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: partner?.email,
        name: partner?.name,
        metadata: {
          partnerId: partnerId,
        },
      });
      customerId = customer.id;
      
      // PartnerUser에 Customer ID 저장
      await PartnerUser.findByIdAndUpdate(partnerId, {
        stripeCustomerId: customerId,
      });
    }

    // Stripe Checkout Session 생성 (Customer 연결하여 결제 수단 저장 가능)
    console.log('Stripe Checkout Session 생성:', {
      currency: selectedCurrency,
      unit_amount: stripeAmount,
      amount: amount,
    });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: selectedCurrency,
            product_data: {
              name: '마케팅 포인트 충전',
              description: `${amount.toLocaleString()} 포인트 충전`,
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: `point_charge_${partnerId}_${Date.now()}`,
      metadata: {
        type: 'point_charge',
        partnerId: partnerId,
        amount: amount.toString(),
        currency: selectedCurrency,
      },
      // 결제 수단 저장 허용 (Checkout에서 "나중에 사용하기 위해 저장" 옵션 제공)
      payment_method_options: {
        card: {
          setup_future_usage: 'on_session',
        },
      },
    });
    
    console.log('Stripe Checkout Session 생성 완료:', {
      sessionId: session.id,
      url: session.url,
      currency: session.currency,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe 포인트 충전 Session 생성 오류:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      errorDetails = {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
        statusCode: stripeError.statusCode,
      };
      errorMessage = stripeError.message || errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: '포인트 충전 세션 생성에 실패했습니다.',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          ...errorDetails,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined
      },
      { status: 500 }
    );
  }
}
