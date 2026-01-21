export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerUser from '@/models/CustomerUser';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

// GET: 고객 프로필 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    const user = await CustomerUser.findById(customerId).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userObj = user as any;
    return NextResponse.json({
      success: true,
      data: {
        id: userObj._id.toString(),
        email: userObj.email,
        name: userObj.name,
        phone: userObj.phone || '',
        profileImage: userObj.profileImage || '',
        joinDate: userObj.joinDate.toISOString(),
        createdAt: userObj.createdAt.toISOString(),
        lastLoginAt: userObj.lastLoginAt ? new Date(userObj.lastLoginAt).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('고객 프로필 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH: 고객 프로필 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, phone } = body;
    const userId = customer.id || customer._id?.toString();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name !== undefined) {
      updates.name = name;
    }
    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '변경할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const updatedUser = await CustomerUser.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userObj = updatedUser as any;
    return NextResponse.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        id: userObj._id.toString(),
        email: userObj.email,
        name: userObj.name,
        phone: userObj.phone || '',
        joinDate: userObj.joinDate.toISOString(),
        createdAt: userObj.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('고객 프로필 업데이트 오류:', error);
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
