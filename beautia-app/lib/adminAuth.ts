import { NextRequest, NextResponse } from 'next/server';

/**
 * 어드민 인증 미들웨어
 * API 라우트에서 사용하는 인증 검증 함수
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string; userId?: string }> {
  try {
    // Authorization 헤더 또는 쿠키에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.replace('Bearer ', '');
    
    // 쿠키에서 토큰 추출 (클라이언트에서 쿠키 사용 시)
    const tokenFromCookie = request.cookies.get('admin_token')?.value;
    
    // 토큰이 없으면 실패
    const token = tokenFromHeader || tokenFromCookie;
    
    if (!token) {
      // Referer를 확인하여 브라우저에서 직접 접근인지 확인
      const referer = request.headers.get('referer');
      const isBrowserRequest = referer && referer.includes('/admin/');
      
      // 브라우저에서 직접 접근 시 클라이언트 사이드 인증에 맡김
      // (레이아웃에서 requireAdminAuth가 처리)
      if (isBrowserRequest) {
        // 개발 환경에서는 허용하되, 프로덕션에서는 엄격하게 검증
        if (process.env.NODE_ENV === 'development') {
          // 개발 환경에서만 임시로 허용 (실제로는 제거해야 함)
          return { authorized: true, userId: 'dev-admin' };
        }
      }
      
      return { 
        authorized: false, 
        error: '인증이 필요합니다. 로그인이 필요합니다.' 
      };
    }

    // 실제 프로덕션 환경에서는 JWT 토큰 검증 또는 세션 검증을 수행해야 함
    // 현재는 토큰이 존재하면 인증된 것으로 간주 (실제 서비스에서는 DB에서 검증 필요)
    
    // TODO: 실제 토큰 검증 로직 구현
    // - JWT 토큰 서명 검증
    // - 토큰 만료 시간 확인
    // - DB에서 관리자 권한 확인
    
    // 임시로 토큰이 있으면 허용
    return { authorized: true, userId: 'admin' };
    
  } catch (error) {
    console.error('어드민 인증 검증 오류:', error);
    return { 
      authorized: false, 
      error: '인증 검증 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 어드민 API 라우트 보호 래퍼
 * 인증이 필요한 API 핸들러를 감싸는 함수
 */
export function withAdminAuth(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { 
          error: authResult.error || '인증이 필요합니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }
    
    return handler(request, ...args);
  };
}
