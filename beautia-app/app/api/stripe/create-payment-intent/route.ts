// PaymentIntent 생성 API
// 모바일 앱에서 PaymentSheet를 사용하기 위한 PaymentIntent 생성

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: PaymentIntent 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { bookingId, amount, currency = 'krw', userId } = body;
    
    if (!amount) {
      return NextResponse.json(
        { error: '금액이 필요합니다.' },
        { status: 400 }
      );
    }

    // 예약 정보 조회 (bookingId가 있는 경우)
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return NextResponse.json(
          { error: '예약을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 이미 결제된 예약인지 확인
      if (booking.paymentStatus === 'paid') {
        return NextResponse.json(
          { error: '이미 결제가 완료된 예약입니다.' },
          { status: 400 }
        );
      }
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 통화별 최소 단위 변환
    let stripeAmount = amount;
    const selectedCurrency = currency.toLowerCase();
    
    if (selectedCurrency === 'krw' || selectedCurrency === 'jpy') {
      stripeAmount = Math.round(amount);
    } else {
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
      stripeAmount = Math.round(convertedAmount * 100);
    }

    // PaymentIntent 생성
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: selectedCurrency,
      metadata: {
        bookingId: bookingId || '',
        userId: userId || booking?.userId?.toString() || '',
        shopName: booking?.shopName || '',
        serviceName: booking?.serviceName || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Publishable key 반환 (환경 변수에서 가져오기)
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
    
    if (!publishableKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY가 설정되지 않았습니다.');
    }
    
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: publishableKey,
      // 디버깅 정보 (개발 환경에서만)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          hasPublishableKey: !!publishableKey,
          keyPrefix: publishableKey ? publishableKey.substring(0, 10) : 'none',
        },
      }),
    });
  } catch (error) {
    console.error('PaymentIntent 생성 오류:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
