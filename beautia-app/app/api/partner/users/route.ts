export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-salt').digest('hex');
}

// 비밀번호 확인
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// POST: 파트너 계정 생성 (신청 승인 시)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, name, phone, shopName, category, address, applicationId, tempPassword } = body;

    // 필수 필드 검증
    if (!email || !name || !phone || !shopName || !category || !applicationId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await PartnerUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 이미 계정이 생성된 신청서인지 확인
    const existingUserByApp = await PartnerUser.findOne({ applicationId });
    if (existingUserByApp) {
      return NextResponse.json(
        { error: '이미 계정이 생성된 신청서입니다.' },
        { status: 400 }
      );
    }

    // 임시 비밀번호 생성 (제공되지 않으면)
    const password = tempPassword || `temp${Math.random().toString(36).substr(2, 8)}`;

    // 새 사용자 생성
    const newUser = new PartnerUser({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      phone,
      applicationId,
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: '파트너 계정이 생성되었습니다.',
      userId: newUser._id.toString(),
      email: newUser.email,
      tempPassword: password, // 처음 생성 시에만 반환 (보안상 실제로는 이메일로 전송해야 함)
    }, { status: 201 });
  } catch (error) {
    console.error('파트너 계정 생성 오류:', error);
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

// GET: 이메일로 사용자 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    const user = await PartnerUser.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 해시는 제외하고 반환
    const userObj = user.toObject();
    const { passwordHash, __v, ...userWithoutPassword } = userObj;

    return NextResponse.json({
      success: true,
      user: {
        id: userWithoutPassword._id.toString(),
        ...userWithoutPassword,
        _id: undefined,
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
        lastLoginAt: userWithoutPassword.lastLoginAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
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

// PATCH: 파트너 비밀번호 변경
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: '이메일과 새 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const user = await PartnerUser.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 업데이트
    user.passwordHash = hashPassword(newPassword);
    await user.save();

    // 비밀번호 해시는 제외하고 반환
    const userObj = user.toObject();
    const { passwordHash, __v, ...userWithoutPassword } = userObj;

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
      user: {
        id: userWithoutPassword._id.toString(),
        ...userWithoutPassword,
        _id: undefined,
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
        lastLoginAt: userWithoutPassword.lastLoginAt?.toISOString(),
      },
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
