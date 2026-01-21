import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge Runtime에서는 데이터베이스 접근이 불가능하므로
// 미들웨어에서는 토큰 존재 여부만 확인하고,
// 실제 토큰 검증은 각 API 라우트에서 수행합니다.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 어드민 경로 보호 (로그인 페이지 제외)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // 쿠키나 Authorization 헤더에서 토큰 확인
    const adminToken = request.cookies.get('admin_token')?.value ||
                       request.headers.get('authorization')?.replace('Bearer ', '');
    
    // 모든 환경에서 엄격하게 검사 (개발 환경도 포함)
    if (!adminToken) {
      // API 요청이면 401 반환
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      
      // 페이지 요청이면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Edge Runtime에서는 데이터베이스 접근이 불가능하므로
    // 실제 토큰 검증은 각 API 라우트에서 수행합니다.
    // 여기서는 토큰 존재 여부만 확인합니다.
  }

  // 파트너 대시보드 경로 보호 (로그인 페이지 제외)
  if (pathname.startsWith('/partner/dashboard') && pathname !== '/partner/login') {
    // 쿠키나 Authorization 헤더에서 토큰 확인
    const partnerToken = request.cookies.get('partner_token')?.value ||
                         request.headers.get('authorization')?.replace('Bearer ', '');
    
    // 모든 환경에서 엄격하게 검사
    if (!partnerToken) {
      if (pathname.startsWith('/api/partner')) {
        return NextResponse.json(
          { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      
      // 페이지 요청이면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/partner/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Edge Runtime에서는 데이터베이스 접근이 불가능하므로
    // 실제 토큰 검증은 각 API 라우트에서 수행합니다.
    // 여기서는 토큰 존재 여부만 확인합니다.
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 지정
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/partner/dashboard/:path*',
    '/api/partner/:path*',
  ],
};
