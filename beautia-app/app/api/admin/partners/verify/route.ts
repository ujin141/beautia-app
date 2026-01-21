import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';

export const runtime = 'nodejs';

/**
 * PATCH: 파트너 검증 상태 변경
 */
async function handlePatch(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { partnerId, email, isVerified } = body;

    if (!email && !partnerId) {
      return NextResponse.json(
        { success: false, error: '파트너 ID 또는 이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파트너 찾기
    const partner = partnerId
      ? await PartnerUser.findById(partnerId)
      : await PartnerUser.findOne({ email: email?.toLowerCase() });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: '파트너를 찾을 수 없습니다. 파트너 계정이 생성되지 않았을 수 있습니다.' },
        { status: 404 }
      );
    }

    // 검증 상태 업데이트
    partner.isVerified = isVerified !== undefined ? isVerified : !partner.isVerified;
    await partner.save();

    return NextResponse.json({
      success: true,
      data: {
        id: partner._id.toString(),
        email: partner.email,
        isVerified: partner.isVerified,
      },
    });
  } catch (error) {
    console.error('파트너 검증 상태 변경 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '검증 상태 변경 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export const PATCH = withAdminAuth(handlePatch);
