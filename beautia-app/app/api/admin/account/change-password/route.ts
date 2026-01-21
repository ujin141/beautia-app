export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import crypto from 'crypto';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + (process.env.ADMIN_PASSWORD_SALT || 'beautia-admin-salt')).digest('hex');
}

// 비밀번호 확인
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// PATCH: 어드민 비밀번호 변경
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { adminId, currentPassword, newPassword } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: '관리자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const admin = await AdminUser.findById(adminId);

    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 비밀번호 확인
    if (!verifyPassword(currentPassword, admin.passwordHash)) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 새 비밀번호 설정
    admin.passwordHash = hashPassword(newPassword);
    await admin.save();

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
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
