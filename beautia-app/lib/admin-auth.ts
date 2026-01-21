// 어드민 API 인증 미들웨어

import { NextRequest, NextResponse } from 'next/server';

/**
 * 어드민 API 요청 인증 확인
 * 클라이언트에서 전달된 토큰을 검증합니다.
 * MongoDB는 Node.js 런타임에서만 사용 가능하므로 동적 import 사용
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('admin_token')?.value ||
                request.nextUrl.searchParams.get('token');

  // 모든 환경에서 엄격한 검사
  if (!token) {
    return {
      authorized: false,
      error: '인증 토큰이 필요합니다.',
    };
  }

  // 토큰 형식 검증 (최소한의 길이와 형식 확인)
  if (token.length < 10) {
    return {
      authorized: false,
      error: '유효하지 않은 토큰입니다.',
    };
  }

  // 데이터베이스에서 토큰 검증 (동적 import로 Edge Runtime 번들링 방지)
  const { verifyAdminToken } = await import('./admin-token-verifier');
  const verification = await verifyAdminToken(token);
  
  if (!verification.valid) {
    return {
      authorized: false,
      error: verification.error || '유효하지 않은 토큰입니다.',
    };
  }
  
  // 토큰 검증 통과
  return { authorized: true };
}

/**
 * 어드민 API 인증 미들웨어
 * 인증이 실패하면 401 에러 반환
 */
export function withAdminAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // OPTIONS 요청은 CORS preflight이므로 통과
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 });
    }

    // 모든 환경에서 엄격한 인증 필수 (비동기 검증)
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { 
          error: auth.error || '인증에 실패했습니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    return handler(request);
  };
}

/**
 * 어드민 페이지 인증 확인 (서버 컴포넌트용)
 */
export async function requireAdminAuthServer(): Promise<{ authorized: boolean; redirect?: string }> {
  // 서버 사이드에서는 쿠키나 세션을 확인
  // 현재는 클라이언트 사이드 인증만 사용하므로 항상 허용
  // TODO: 서버 사이드 세션/쿠키 검증 구현
  
  return { authorized: true };
}
