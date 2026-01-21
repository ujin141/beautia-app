// Kakao OAuth 리다이렉트 처리
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
    // 첫 번째 단계: 카카오 로그인 페이지로 리다이렉트
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/kakao`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY || ''}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,account_email`;
    return NextResponse.redirect(kakaoAuthUrl);
  }

  try {
    // 카카오 토큰 교환
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/kakao`;
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY || '',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('카카오 토큰 교환 실패:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        redirectUri,
        hasClientId: !!process.env.KAKAO_REST_API_KEY,
      });
      throw new Error(`토큰 교환 실패: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('카카오 사용자 정보 가져오기 실패:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        error: errorText,
      });
      throw new Error(`사용자 정보 가져오기 실패: ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();
    const kakaoAccount = userInfo.kakao_account;

    // 소셜 로그인 API로 전달
    const socialLoginResponse = await fetch(
      new URL('/api/auth/social', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'kakao',
          idToken: access_token,
          email: kakaoAccount?.email || '',
          name: kakaoAccount?.profile?.nickname || '',
          picture: kakaoAccount?.profile?.profile_image_url,
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
    console.error('카카오 로그인 오류:', error);
    return NextResponse.redirect(
      new URL(
        `/customer/login?error=${encodeURIComponent(error.message || '로그인 실패')}`,
        request.url
      )
    );
  }
}
