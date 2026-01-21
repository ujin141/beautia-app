export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withIpRateLimit } from '@/lib/rate-limiter';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-salt').digest('hex');
}

// 비밀번호 확인
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * @swagger
 * /api/partner/login:
 *   post:
 *     tags: [Partner]
 *     summary: 파트너 로그인
 *     description: 파트너 계정으로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// POST: 파트너 로그인
async function handleLogin(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    // 필수 필드 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await PartnerUser.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 로그인 시간 업데이트
    user.lastLoginAt = new Date();

    // Shop 정보 조회 (파트너의 매장 정보)
    const shop = await Shop.findOne({ partnerId: user._id.toString() }).lean();
    
    // 세션 토큰 생성 (SHA-256 해시)
    const sessionToken = crypto
      .createHash('sha256')
      .update(`${user._id}-${user.email}-${Date.now()}-${Math.random()}-${process.env.PARTNER_TOKEN_SECRET || 'beautia-partner-secret'}`)
      .digest('hex');

    // 토큰 만료 시간 설정 (7일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 활성 토큰에 추가
    if (!user.activeTokens) {
      user.activeTokens = [];
    }
    
    // 최대 5개의 활성 토큰만 유지 (오래된 것 제거)
    // 먼저 만료된 토큰 제거
    user.activeTokens = user.activeTokens.filter(
      (t: any) => new Date(t.expiresAt) > new Date()
    );
    
    // 여전히 5개 이상이면 가장 오래된 것 제거
    if (user.activeTokens.length >= 5) {
      user.activeTokens = user.activeTokens
        .sort((a: any, b: any) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 4);
    }

    user.activeTokens.push({
      token: sessionToken,
      createdAt: new Date(),
      expiresAt,
    });

    await user.save();
    
    // 사용자 정보 반환 (비밀번호 제외)
    const userObj = user.toObject();
    const { passwordHash, __v, ...userWithoutPassword } = userObj;

    // 클라이언트가 기대하는 형식으로 변환
    const userData = {
      id: userWithoutPassword._id.toString(),
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      phone: userWithoutPassword.phone || '',
      shopName: shop?.name || '',
      category: shop?.category || '',
      address: shop?.address || undefined,
      applicationId: userWithoutPassword.applicationId || '',
      status: 'active' as const,
      createdAt: userWithoutPassword.createdAt.toISOString(),
      lastLoginAt: userWithoutPassword.lastLoginAt?.toISOString(),
    };

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: userData,
      token: sessionToken,
    });

    // 쿠키에 토큰 저장 (미들웨어에서 확인용)
    response.cookies.set('partner_token', sessionToken, {
      httpOnly: false, // 클라이언트에서도 접근 가능 (localStorage와 동기화)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('로그인 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// 로그인 API는 레이트 리미팅 적용 (15분에 5회)
export const POST = withIpRateLimit(handleLogin, 5, 15 * 60 * 1000);
