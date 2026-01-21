export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

// GET: 어드민 프로필 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: '관리자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const admin = await AdminUser.findById(adminId).select('-passwordHash -__v');

    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const adminObj = admin.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        id: adminObj._id.toString(),
        email: adminObj.email,
        name: adminObj.name,
        role: adminObj.role,
        isActive: adminObj.isActive,
        lastLoginAt: adminObj.lastLoginAt?.toISOString() || null,
        createdAt: adminObj.createdAt.toISOString(),
        updatedAt: adminObj.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
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

// PATCH: 어드민 프로필 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { adminId, name } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: '관리자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
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

    admin.name = name.trim();
    await admin.save();

    const adminObj = admin.toObject();
    
    return NextResponse.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        id: adminObj._id.toString(),
        email: adminObj.email,
        name: adminObj.name,
        role: adminObj.role,
        isActive: adminObj.isActive,
        lastLoginAt: adminObj.lastLoginAt?.toISOString() || null,
        createdAt: adminObj.createdAt.toISOString(),
        updatedAt: adminObj.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
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
