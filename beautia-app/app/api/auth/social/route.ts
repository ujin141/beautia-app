// 소셜 로그인 API
// Google, Apple 등 소셜 로그인 처리

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withPostHandler } from '@/lib/api-handler';
import { successResponse, validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import connectDB from '@/lib/mongodb';
import CustomerUser from '@/models/CustomerUser';
import PartnerUser from '@/models/PartnerUser';
import crypto from 'crypto';

// Google OAuth 토큰 검증
async function verifyGoogleToken(idToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
} | null> {
  try {
    // 간단한 검증 (실제로는 Google의 공개키로 검증해야 함)
    // 프로덕션에서는 Google의 토큰 검증 API 사용 권장
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch (error) {
    console.error('Google 토큰 검증 오류:', error);
    return null;
  }
}

// POST: 소셜 로그인
async function handlePost(request: NextRequest) {
  await connectDB();

  const body = await request.json();
  const { provider, idToken, email, name, picture } = body;

  // 유효성 검사 - Google의 경우 idToken이 없어도 email과 name으로 처리 가능
  const validation = validateRequestBody(
    { provider },
    [
      required('provider', '소셜 로그인 제공자가 필요합니다.'),
    ]
  );

  if (!validation.valid) {
    return validationErrorResponse(validation.error!, validation.details);
  }

  // Google의 경우 idToken이 없어도 email과 name이 있으면 처리 가능
  if (provider === 'google' && !idToken && (!email || !name)) {
    return validationErrorResponse(
      '입력값이 올바르지 않습니다.',
      { idToken: 'ID 토큰 또는 이메일과 이름이 필요합니다.' }
    );
  }

  // 다른 provider의 경우 idToken 필수
  if (provider !== 'google' && !idToken) {
    return validationErrorResponse(
      '입력값이 올바르지 않습니다.',
      { idToken: 'ID 토큰이 필요합니다.' }
    );
  }

  try {
    let userInfo: { sub: string; email: string; name: string; picture?: string } | null = null;

    // 제공자별 토큰 검증
    if (provider === 'google') {
      // idToken이 있으면 검증, 없으면 email과 name으로 처리
      if (idToken) {
        userInfo = await verifyGoogleToken(idToken);
        if (!userInfo) {
          // 토큰 검증 실패 시 email과 name으로 처리
          if (!email || !name) {
            return NextResponse.json(
              { error: '유효하지 않은 Google 토큰이며, 이메일과 이름이 필요합니다.' },
              { status: 401 }
            );
          }
          // email과 name으로 사용자 정보 생성
          userInfo = {
            sub: `google_${crypto.createHash('sha256').update(email).digest('hex').substring(0, 16)}`,
            email,
            name,
            picture,
          };
        }
      } else {
        // idToken이 없으면 email과 name으로 처리
        if (!email || !name) {
          return NextResponse.json(
            { error: '이메일과 이름이 필요합니다.' },
            { status: 400 }
          );
        }
        userInfo = {
          sub: `google_${crypto.createHash('sha256').update(email).digest('hex').substring(0, 16)}`,
          email,
          name,
          picture,
        };
      }
    } else if (provider === 'kakao') {
      // 카카오톡 토큰 검증 (액세스 토큰으로 사용자 정보 가져오기)
      try {
        const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          // API 호출 실패 시 클라이언트에서 전달한 정보 사용
          if (!email && !name) {
            return NextResponse.json(
              { error: '카카오톡 로그인 정보가 올바르지 않습니다.' },
              { status: 400 }
            );
          }
          userInfo = {
            sub: `kakao_${crypto.createHash('sha256').update(idToken).digest('hex').substring(0, 16)}`,
            email: email || `${idToken.substring(0, 8)}@kakao.com`,
            name: name || '카카오 사용자',
            picture: picture,
          };
        } else {
          const kakaoUserInfo = await userInfoResponse.json();
          const kakaoAccount = kakaoUserInfo.kakao_account;
          userInfo = {
            sub: `kakao_${kakaoUserInfo.id}`,
            email: kakaoAccount?.email || email || '',
            name: kakaoAccount?.profile?.nickname || name || '카카오 사용자',
            picture: kakaoAccount?.profile?.profile_image_url || picture,
          };
        }
      } catch (error) {
        // 에러 발생 시 클라이언트에서 전달한 정보 사용
        if (!email && !name) {
          return NextResponse.json(
            { error: '카카오톡 로그인 정보가 올바르지 않습니다.' },
            { status: 400 }
          );
        }
        userInfo = {
          sub: `kakao_${crypto.createHash('sha256').update(idToken).digest('hex').substring(0, 16)}`,
          email: email || `${idToken.substring(0, 8)}@kakao.com`,
          name: name || '카카오 사용자',
          picture: picture,
        };
      }
    } else if (provider === 'line') {
      // 라인 토큰 검증 (액세스 토큰으로 사용자 정보 가져오기)
      try {
        // ID 토큰이 있으면 디코딩
        if (idToken.includes('.')) {
          const payload = JSON.parse(
            Buffer.from(idToken.split('.')[1], 'base64').toString()
          );
          userInfo = {
            sub: `line_${payload.sub || payload.userId || crypto.createHash('sha256').update(idToken).digest('hex').substring(0, 16)}`,
            email: payload.email || email || '',
            name: payload.name || name || '라인 사용자',
            picture: payload.picture || picture,
          };
        } else {
          // 액세스 토큰으로 프로필 가져오기
          const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            userInfo = {
              sub: `line_${profile.userId}`,
              email: email || '',
              name: profile.displayName || name || '라인 사용자',
              picture: profile.pictureUrl || picture,
            };
          } else {
            throw new Error('프로필 가져오기 실패');
          }
        }
      } catch (error) {
        // 에러 발생 시 클라이언트에서 전달한 정보 사용
        if (!email && !name) {
          return NextResponse.json(
            { error: '라인 로그인 정보가 올바르지 않습니다.' },
            { status: 400 }
          );
        }
        userInfo = {
          sub: `line_${crypto.createHash('sha256').update(idToken).digest('hex').substring(0, 16)}`,
          email: email || `${idToken.substring(0, 8)}@line.com`,
          name: name || '라인 사용자',
          picture: picture,
        };
      }
    } else if (provider === 'facebook') {
      // 페이스북 토큰 검증 (액세스 토큰으로 사용자 정보 가져오기)
      try {
        const userInfoResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${idToken}`
        );

        if (!userInfoResponse.ok) {
          throw new Error('사용자 정보 가져오기 실패');
        }

        const fbUserInfo = await userInfoResponse.json();
        userInfo = {
          sub: `facebook_${fbUserInfo.id}`,
          email: fbUserInfo.email || email || '',
          name: fbUserInfo.name || name || '페이스북 사용자',
          picture: fbUserInfo.picture?.data?.url || picture,
        };
      } catch (error) {
        // 에러 발생 시 클라이언트에서 전달한 정보 사용
        if (!email && !name) {
          return NextResponse.json(
            { error: '페이스북 로그인 정보가 올바르지 않습니다.' },
            { status: 400 }
          );
        }
        userInfo = {
          sub: `facebook_${crypto.createHash('sha256').update(idToken).digest('hex').substring(0, 16)}`,
          email: email || `${idToken.substring(0, 8)}@facebook.com`,
          name: name || '페이스북 사용자',
          picture: picture,
        };
      }
    } else if (provider === 'apple') {
      // Apple 토큰 검증 (구현 필요)
      // 일단 제공된 이메일/이름 사용
      if (!email) {
        return NextResponse.json(
          { error: 'Apple 로그인에는 이메일이 필요합니다.' },
          { status: 400 }
        );
      }
      userInfo = {
        sub: `apple_${crypto.createHash('sha256').update(email).digest('hex')}`,
        email,
        name: name || email.split('@')[0],
      };
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 소셜 로그인 제공자입니다.' },
        { status: 400 }
      );
    }

    // 사용자 찾기 또는 생성
    let user = await CustomerUser.findOne({ email: userInfo.email });
    let userType: 'partner' | 'customer' = 'customer';

    // 고객 사용자가 없으면 파트너 확인
    if (!user) {
      user = await PartnerUser.findOne({ email: userInfo.email });
      if (user) {
        userType = 'partner';
      }
    }

    // 사용자가 없으면 새로 생성 (고객으로 생성)
    if (!user) {
      user = new CustomerUser({
        email: userInfo.email,
        name: userInfo.name,
        profileImage: userInfo.picture,
        socialProvider: provider,
        socialId: userInfo.sub,
        emailVerified: true,
        // 소셜 로그인 사용자는 passwordHash 없음
      });
      await user.save();
    } else {
      // 소셜 정보 업데이트
      if (!(user as any).socialProvider) {
        (user as any).socialProvider = provider;
        (user as any).socialId = userInfo.sub;
        if (userInfo.picture && !(user as any).profileImage) {
          (user as any).profileImage = userInfo.picture;
        }
        await user.save();
      }
    }

    // 세션 토큰 생성 (간단한 토큰)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 유효
    
    // 토큰 저장 (고객 또는 파트너)
    if (userType === 'customer') {
      const customerUser = user as any;
      if (!customerUser.activeTokens) {
        customerUser.activeTokens = [];
      }
      customerUser.activeTokens.push({
        token,
        createdAt: new Date(),
        expiresAt,
      });
      await customerUser.save();
    } else {
      const partnerUser = user as any;
      if (!partnerUser.activeTokens) {
        partnerUser.activeTokens = [];
      }
      partnerUser.activeTokens.push({
        token,
        createdAt: new Date(),
        expiresAt,
      });
      await partnerUser.save();
    }

    return successResponse(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: userType,
          profileImage: (user as any).profileImage,
        },
        token,
      },
      '소셜 로그인 성공'
    );
  } catch (error: any) {
    console.error('소셜 로그인 오류:', error);
    return NextResponse.json(
      { error: error.message || '소셜 로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export const POST = withPostHandler(handlePost);
