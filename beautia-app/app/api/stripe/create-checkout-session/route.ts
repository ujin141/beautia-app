import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

// Stripe 초기화 (환경 변수 확인)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다. Stripe 결제가 작동하지 않을 수 있습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: Stripe Checkout Session 생성
export async function POST(request: NextRequest) {
  // 요청 본문 안전하게 파싱 (catch 블록에서도 접근 가능하도록 외부에 선언)
  let body: any = {};
  
  try {
    await connectDB();
    
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
    const { bookingId, userId, currency = 'krw' } = body;
    
    // 통화 유효성 검증
    const validCurrencies = ['krw', 'usd', 'jpy', 'eur', 'gbp', 'cny', 'thb'];
    const selectedCurrency = validCurrencies.includes(currency.toLowerCase()) 
      ? currency.toLowerCase() 
      : 'krw';

    if (!bookingId || !userId) {
      return NextResponse.json(
        { error: '예약 ID와 사용자 ID가 필요합니다.' },
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

    // 이미 결제된 예약인지 확인
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: '이미 결제가 완료된 예약입니다.' },
        { status: 400 }
      );
    }

    // 성공/취소 URL 설정
    const baseUrl = request.nextUrl.origin;
    const successUrl = `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`;
    const cancelUrl = `${baseUrl}/booking?booking_id=${bookingId}`;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다. STRIPE_SECRET_KEY를 확인해주세요.' },
        { status: 500 }
      );
    }

    // 금액 계산 및 검증
    let amount = booking.price;
    
    // 통화별 최소 단위 변환 (Stripe는 각 통화의 최소 단위 사용)
    // KRW, JPY: 원/엔 단위 그대로 (소수점 없음)
    // USD, EUR 등: 센트/센트 단위로 변환 (소수점 2자리)
    if (selectedCurrency === 'krw' || selectedCurrency === 'jpy') {
      amount = Math.round(amount); // 원/엔 단위 그대로
    } else {
      // 환율 변환 (더 정확한 환율 사용)
      // 실제로는 실시간 환율 API 사용 권장
      // 환율 (lib/i18n.ts의 CURRENCIES와 동일한 값 사용)
      const exchangeRates: { [key: string]: number } = {
        usd: 0.00075,  // 1 KRW = 0.00075 USD (약 1,333 KRW = 1 USD)
        eur: 0.00069,  // 1 KRW = 0.00069 EUR (약 1,449 KRW = 1 EUR)
        jpy: 0.11,     // 1 KRW = 0.11 JPY (약 9 KRW = 1 JPY)
        gbp: 0.00059,  // 1 KRW = 0.00059 GBP
        cny: 0.0054,   // 1 KRW = 0.0054 CNY
        thb: 0.027,    // 1 KRW = 0.027 THB
      };
      
      console.log('환율 변환:', {
        originalAmount: booking.price,
        currency: selectedCurrency,
        rate: exchangeRates[selectedCurrency],
      });
      
      const rate = exchangeRates[selectedCurrency] || 1;
      const convertedAmount = amount * rate;
      
      // 센트 단위로 변환 (소수점 2자리)
      amount = Math.round(convertedAmount * 100);
    }
    
    // 최소 금액 검증 (통화별)
    const minAmounts: { [key: string]: number } = {
      krw: 100,
      jpy: 100,
      usd: 50,   // $0.50
      eur: 50,   // €0.50
      gbp: 30,   // £0.30
      cny: 300,  // ¥3.00
      thb: 1800, // ฿18.00
    };
    
    const minAmount = minAmounts[selectedCurrency] || 100;
    if (amount < minAmount) {
      return NextResponse.json(
        { 
          error: `최소 결제 금액은 ${minAmount} ${selectedCurrency.toUpperCase()}입니다.`,
          minAmount,
          currency: selectedCurrency,
        },
        { status: 400 }
      );
    }

    // Stripe Checkout Session 생성
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: selectedCurrency,
            product_data: {
              name: `${booking.shopName} - ${booking.serviceName}`,
              description: `예약일: ${booking.date} ${booking.time}`,
            },
            unit_amount: amount, // 통화별 최소 단위 (KRW/JPY: 원/엔, USD/EUR: 센트)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: bookingId,
      metadata: {
        bookingId: bookingId,
        userId: userId,
        shopName: booking.shopName || '',
        serviceName: booking.serviceName || '',
      },
      // customer_email은 이메일 주소가 필요하므로, Booking 모델에 email 필드가 있다면 사용
      // customer_email: booking.userEmail,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe Checkout Session 생성 오류:', error);
    
    // Stripe 오류 상세 정보 추출
    let errorMessage = '서버 오류가 발생했습니다.';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Stripe API 오류인 경우
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
    
    // 요청 정보 로깅 (디버깅용)
    const requestInfo = {
      hasBookingId: !!body.bookingId,
      hasUserId: !!body.userId,
      bookingId: body.bookingId,
      userId: body.userId,
      hasStripeKey: !!stripeSecretKey,
      stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) : 'none',
    };
    
    console.error('오류 상세:', {
      message: errorMessage,
      details: errorDetails,
      request: requestInfo,
      errorType: error?.constructor?.name,
      errorString: String(error),
    });
    
    // 사용자에게 반환할 오류 메시지
    let userMessage = '결제 세션 생성에 실패했습니다.';
    
    // Stripe 인증 오류
    if (errorDetails.type === 'invalid_request_error' || 
        errorDetails.code === 'api_key_expired' ||
        errorMessage.includes('No API key')) {
      userMessage = 'Stripe API 키가 올바르지 않습니다. 관리자에게 문의하세요.';
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          ...errorDetails,
          request: requestInfo,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined
      },
      { status: 500 }
    );
  }
}
