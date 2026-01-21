// LINE OAuth 리다이렉트 처리
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
    // 첫 번째 단계: LINE 로그인 페이지로 리다이렉트
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${process.env.LINE_CHANNEL_ID || ''}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/line`)}&state=random_state&scope=profile%20openid%20email`;
    return NextResponse.redirect(lineAuthUrl);
  }

  try {
    // LINE 토큰 교환
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/line`,
        client_id: process.env.LINE_CHANNEL_ID || '',
        client_secret: process.env.LINE_CHANNEL_SECRET || '',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();
    const { id_token, access_token } = tokenData;

    // 사용자 정보 가져오기 (ID 토큰에서)
    let userInfo: any = {};
    if (id_token) {
      // ID 토큰 디코딩 (간단한 방법, 실제로는 JWT 검증 필요)
      const payload = JSON.parse(
        Buffer.from(id_token.split('.')[1], 'base64').toString()
      );
      userInfo = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } else {
      // 액세스 토큰으로 프로필 가져오기
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userInfo = {
          name: profile.displayName,
          picture: profile.pictureUrl,
        };
      }
    }

    // 소셜 로그인 API로 전달
    const socialLoginResponse = await fetch(
      new URL('/api/auth/social', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'line',
          idToken: id_token || access_token,
          email: userInfo.email || '',
          name: userInfo.name || '',
          picture: userInfo.picture,
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
    console.error('라인 로그인 오류:', error);
    return NextResponse.redirect(
      new URL(
        `/customer/login?error=${encodeURIComponent(error.message || '로그인 실패')}`,
        request.url
      )
    );
  }
}
