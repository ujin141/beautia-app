// Apple OAuth 리다이렉트 처리
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 에러 처리
  if (error) {
    return NextResponse.redirect(
      new URL(`/customer/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    // 첫 번째 단계: Apple 로그인 페이지로 리다이렉트
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=${process.env.APPLE_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/apple`)}&response_type=code%20id_token&scope=email%20name&response_mode=form_post`;
    return NextResponse.redirect(appleAuthUrl);
  }

  try {
    // Apple 토큰 교환
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/apple`,
        client_id: process.env.APPLE_CLIENT_ID || '',
        client_secret: process.env.APPLE_CLIENT_SECRET || '', // JWT 형식의 클라이언트 시크릿
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();
    const { id_token } = tokenData;

    // ID 토큰에서 사용자 정보 추출
    const payload = JSON.parse(
      Buffer.from(id_token.split('.')[1], 'base64').toString()
    );

    // 소셜 로그인 API로 전달
    const socialLoginResponse = await fetch(
      new URL('/api/auth/social', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'apple',
          idToken: id_token,
          email: payload.email || '',
          name: payload.name || payload.email?.split('@')[0] || '',
        }),
      }
    );

    const socialLoginData = await socialLoginResponse.json();

    // 응답 구조: { success: true, data: { user: {...}, token: '...' } }
    // 또는 중첩된 경우: { success: true, data: { success: true, data: { token: '...' } } }
    const token = socialLoginData.data?.data?.token || socialLoginData.data?.token;
    const user = socialLoginData.data?.data?.user || socialLoginData.data?.user;

    if (socialLoginData.success && token && user) {
      // 쿠키에 토큰 저장
      const response = NextResponse.redirect(
        new URL(`/?social_login=success&user=${encodeURIComponent(JSON.stringify(user))}`, request.url)
      );
      response.cookies.set('customer_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30일
      });

      return response;
    } else {
      throw new Error(socialLoginData.error || '로그인 실패');
    }
  } catch (error: any) {
    console.error('Apple 로그인 오류:', error);
    return NextResponse.redirect(
      new URL(
        `/customer/login?error=${encodeURIComponent(error.message || '로그인 실패')}`,
        request.url
      )
    );
  }
}
