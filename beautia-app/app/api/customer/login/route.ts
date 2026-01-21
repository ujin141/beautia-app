export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import CustomerUser from '@/models/CustomerUser';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-customer-salt').digest('hex');
}

// 비밀번호 확인
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// POST: 고객 로그인
export async function POST(request: NextRequest) {
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
    const user = await CustomerUser.findOne({ email: email.toLowerCase() });
    
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

    // 세션 토큰 생성
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 유효

    // 토큰을 activeTokens에 추가
    if (!user.activeTokens) {
      user.activeTokens = [];
    }
    user.activeTokens.push({
      token: sessionToken,
      createdAt: new Date(),
      expiresAt: expiresAt,
      lastUsedAt: new Date(),
    });

    // 최대 10개의 토큰만 유지 (오래된 것부터 제거)
    if (user.activeTokens.length > 10) {
      user.activeTokens.sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      user.activeTokens = user.activeTokens.slice(-10);
    }

    await user.save();
    
    // 사용자 정보 반환 (비밀번호 제외)
    const userObj = user.toObject();
    const { passwordHash, __v, activeTokens, ...userWithoutPassword } = userObj;

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: userWithoutPassword._id.toString(),
        ...userWithoutPassword,
        _id: undefined,
        joinDate: userWithoutPassword.joinDate.toISOString(),
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
        lastLoginAt: userWithoutPassword.lastLoginAt?.toISOString(),
      },
      token: sessionToken,
    });
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
