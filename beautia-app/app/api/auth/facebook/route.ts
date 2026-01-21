// Facebook OAuth 리다이렉트 처리
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
    // 첫 번째 단계: Facebook 로그인 페이지로 리다이렉트
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID || ''}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/facebook`)}&scope=email,public_profile&state=random_state`;
    return NextResponse.redirect(facebookAuthUrl);
  }

  try {
    // Facebook 토큰 교환
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID || '');
    tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET || '');
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/facebook`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 사용자 정보 가져오기
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${access_token}`
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
          provider: 'facebook',
          idToken: access_token,
          email: userInfo.email || '',
          name: userInfo.name || '',
          picture: userInfo.picture?.data?.url,
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
    console.error('페이스북 로그인 오류:', error);
    return NextResponse.redirect(
      new URL(
        `/customer/login?error=${encodeURIComponent(error.message || '로그인 실패')}`,
        request.url
      )
    );
  }
}
