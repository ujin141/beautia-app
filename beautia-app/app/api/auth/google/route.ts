// Google OAuth 리다이렉트 처리
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
    // 첫 번째 단계: Google 로그인 페이지로 리다이렉트
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`)}&response_type=code&scope=openid%20email%20profile`;
    return NextResponse.redirect(googleAuthUrl);
  }

  try {
    // Google OAuth 토큰 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google 토큰 교환 실패:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      });
      throw new Error(`토큰 교환 실패: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const { id_token, access_token } = tokenData;

    // 사용자 정보 가져오기
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    if (!userInfoResponse.ok) {
      throw new Error('사용자 정보 가져오기 실패');
    }

    const userInfo = await userInfoResponse.json();

    // 소셜 로그인 API로 전달
    const socialLoginResponse = await fetch(
      new URL('/api/auth/social', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          idToken: id_token,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }),
      }
    );

    const socialLoginData = await socialLoginResponse.json();

    console.log('소셜 로그인 응답:', {
      status: socialLoginResponse.status,
      success: socialLoginData.success,
      hasData: !!socialLoginData.data,
      hasNestedData: !!socialLoginData.data?.data,
      hasToken: !!(socialLoginData.data?.data?.token || socialLoginData.data?.token),
      error: socialLoginData.error,
      data: socialLoginData,
    });

    if (!socialLoginResponse.ok) {
      throw new Error(socialLoginData.error || `소셜 로그인 API 오류: ${socialLoginResponse.status}`);
    }

    // 응답 구조: { success: true, data: { user: {...}, token: '...' } }
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
      throw new Error(socialLoginData.error || socialLoginData.message || '로그인 실패');
    }
  } catch (error: any) {
    console.error('Google 로그인 오류:', error);
    return NextResponse.redirect(
      new URL(
        `/customer/login?error=${encodeURIComponent(error.message || '로그인 실패')}`,
        request.url
      )
    );
  }
}
