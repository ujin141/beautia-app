import { NextRequest, NextResponse } from 'next/server';
import { removePartnerToken } from '@/lib/partner-token-verifier';

// POST: 파트너 로그아웃
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더나 쿠키에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (token) {
      // 데이터베이스에서 토큰 제거
      await removePartnerToken(token);
    }

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });

    // 쿠키에서 토큰 제거
    response.cookies.delete('partner_token');

    return response;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return NextResponse.json(
      { 
        error: '로그아웃 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
