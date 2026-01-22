import { NextRequest, NextResponse } from 'next/server';

// 통화 환율 (KRW 기준, 실시간으로 업데이트 가능)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 0.00075, // 1 KRW = 0.00075 USD (약 1,333 KRW = 1 USD)
  JPY: 0.11,    // 1 KRW = 0.11 JPY (약 9 KRW = 1 JPY)
  THB: 0.026,   // 1 KRW = 0.026 THB (약 38 KRW = 1 THB)
  CNY: 0.0054,  // 1 KRW = 0.0054 CNY (약 185 KRW = 1 CNY)
};

// 실제 프로덕션에서는 외부 환율 API 사용 권장 (예: exchangerate-api.com, fixer.io)
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // 무료 환율 API 사용 (선택사항)
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/KRW');
    // if (response.ok) {
    //   const data = await response.json();
    //   return {
    //     USD: data.rates.USD || EXCHANGE_RATES.USD,
    //     JPY: data.rates.JPY || EXCHANGE_RATES.JPY,
    //     THB: data.rates.THB || EXCHANGE_RATES.THB,
    //     CNY: data.rates.CNY || EXCHANGE_RATES.CNY,
    //   };
    // }
  } catch (error) {
    console.error('환율 API 오류:', error);
  }
  
  // 기본값 반환
  return EXCHANGE_RATES;
}

export async function GET(request: NextRequest) {
  try {
    const rates = await getExchangeRates();
    
    return NextResponse.json({
      success: true,
      rates,
      base: 'KRW',
    });
  } catch (error) {
    console.error('환율 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '환율 조회 중 오류가 발생했습니다.',
        rates: EXCHANGE_RATES, // 기본값 반환
      },
      { status: 500 }
    );
  }
}
