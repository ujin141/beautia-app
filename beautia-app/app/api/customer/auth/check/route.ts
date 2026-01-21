// 소셜 로그인 후 쿠키에서 토큰 확인 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 가져오기
    const token = request.cookies.get('customer_token')?.value;

    if (!token) {
      return unauthorizedResponse('인증 토큰이 없습니다.');
    }

    // 토큰 반환 (클라이언트에서 localStorage에 저장하기 위해)
    return successResponse({ token }, '인증 토큰 확인 완료');
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return unauthorizedResponse('인증 확인 중 오류가 발생했습니다.');
  }
}
