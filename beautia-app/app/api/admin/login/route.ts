export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withIpRateLimit } from '@/lib/rate-limiter';
import connectDB from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import crypto from 'crypto';

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: 어드민 로그인
 *     description: 관리자 계정으로 로그인합니다.
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
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// POST: 어드민 로그인
async function handleLogin(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 어드민 사용자 조회
    const admin = await AdminUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!admin) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증 (간단한 해시 비교 - 실제로는 bcrypt 사용 권장)
    const passwordHash = crypto
      .createHash('sha256')
      .update(password + (process.env.ADMIN_PASSWORD_SALT || 'beautia-admin-salt'))
      .digest('hex');

    if (admin.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 마지막 로그인 시간 업데이트
    admin.lastLoginAt = new Date();

    // 토큰 생성 (SHA-256 해시)
    const token = crypto
      .createHash('sha256')
      .update(`${admin._id}-${admin.email}-${Date.now()}-${Math.random()}-${process.env.ADMIN_TOKEN_SECRET || 'beautia-admin-secret'}`)
      .digest('hex');

    // 토큰 만료 시간 설정 (7일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 활성 토큰에 추가
    if (!admin.activeTokens) {
      admin.activeTokens = [];
    }
    
    // 최대 5개의 활성 토큰만 유지 (오래된 것 제거)
    // 먼저 만료된 토큰 제거
    admin.activeTokens = admin.activeTokens.filter(
      (t: any) => new Date(t.expiresAt) > new Date()
    );
    
    // 여전히 5개 이상이면 가장 오래된 것 제거
    if (admin.activeTokens.length >= 5) {
      admin.activeTokens = admin.activeTokens
        .sort((a: any, b: any) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 4);
    }

    admin.activeTokens.push({
      token,
      createdAt: new Date(),
      expiresAt,
    });

    await admin.save();

    // 사용자 정보 반환 (비밀번호 제외)
    const userData = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || [],
    };

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        token,
        user: userData,
      },
    });

    // 쿠키에 토큰 저장 (미들웨어에서 확인용)
    response.cookies.set('admin_token', token, {
      httpOnly: false, // 클라이언트에서도 접근 가능 (localStorage와 동기화)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('어드민 로그인 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '로그인 처리 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// 어드민 로그인 API는 레이트 리미팅 적용 (15분에 5회)
export const POST = withIpRateLimit(handleLogin, 5, 15 * 60 * 1000);
