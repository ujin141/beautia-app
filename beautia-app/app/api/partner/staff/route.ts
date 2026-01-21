// 파트너 스태프 관리 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

// GET: 스태프 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId'); // 샵 ID로 필터링 (선택사항)
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const filter: any = {
      partnerId: new mongoose.Types.ObjectId(verification.partnerId),
    };

    if (activeOnly) {
      filter.isActive = true;
    }

    const staffList = await Staff.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const formattedStaff = staffList.map((staff: any) => ({
      id: staff._id.toString(),
      name: staff.name,
      role: staff.role || '',
      specialty: staff.specialty || '',
      phone: staff.phone || '',
      email: staff.email || '',
      profileImage: staff.profileImage || '',
      color: staff.color || '#8B5CF6',
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedStaff,
    });
  } catch (error: any) {
    console.error('스태프 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스태프 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 스태프 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, role, specialty, phone, email, profileImage, color, isActive = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: '이름이 필요합니다.' },
        { status: 400 }
      );
    }

    const staff = new Staff({
      partnerId: new mongoose.Types.ObjectId(verification.partnerId),
      name: name.trim(),
      role: role?.trim() || undefined,
      specialty: specialty?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      profileImage: profileImage || undefined,
      color: color || '#8B5CF6',
      isActive: Boolean(isActive),
    });

    await staff.save();

    return NextResponse.json({
      success: true,
      data: {
        id: staff._id.toString(),
        name: staff.name,
        role: staff.role,
        specialty: staff.specialty,
        phone: staff.phone,
        email: staff.email,
        profileImage: staff.profileImage,
        color: staff.color,
        isActive: staff.isActive,
      },
    });
  } catch (error: any) {
    console.error('스태프 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스태프 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
