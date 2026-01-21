// 파트너 스태프 개별 관리 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

// PATCH: 스태프 정보 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { name, role, specialty, phone, email, profileImage, color, isActive } = body;

    const { id } = await params;
    const staff = await Staff.findOne({
      _id: new mongoose.Types.ObjectId(id),
      partnerId: new mongoose.Types.ObjectId(verification.partnerId),
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: '스태프를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트
    if (name !== undefined) staff.name = name.trim();
    if (role !== undefined) staff.role = role?.trim() || undefined;
    if (specialty !== undefined) staff.specialty = specialty?.trim() || undefined;
    if (phone !== undefined) staff.phone = phone?.trim() || undefined;
    if (email !== undefined) staff.email = email?.trim() || undefined;
    if (profileImage !== undefined) staff.profileImage = profileImage || undefined;
    if (color !== undefined) staff.color = color;
    if (isActive !== undefined) staff.isActive = Boolean(isActive);

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
    console.error('스태프 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스태프 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 스태프 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const staff = await Staff.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      partnerId: new mongoose.Types.ObjectId(verification.partnerId),
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: '스태프를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '스태프가 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('스태프 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스태프 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
