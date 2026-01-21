import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';

// GET: 파트너 계좌 정보 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let partner;
    try {
      const mongoose = (await import('mongoose')).default;
      if (mongoose.Types.ObjectId.isValid(partnerId)) {
        partner = await PartnerUser.findById(partnerId).lean();
      } else {
        partner = await PartnerUser.findOne({ email: partnerId }).lean();
      }
    } catch (e) {
      partner = await PartnerUser.findOne({ email: partnerId }).lean();
    }

    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bankName: partner.accountInfo?.bankName || '',
        accountNumber: partner.accountInfo?.accountNumber || '',
        accountHolder: partner.accountInfo?.accountHolder || '',
        verified: partner.accountInfo?.verified || false,
      },
    });
  } catch (error) {
    console.error('계좌 정보 조회 오류:', error);
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

// PUT: 파트너 계좌 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { partnerId, bankName, accountNumber, accountHolder } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: '은행명, 계좌번호, 예금주명을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    let partner;
    try {
      const mongoose = (await import('mongoose')).default;
      if (mongoose.Types.ObjectId.isValid(partnerId)) {
        partner = await PartnerUser.findById(partnerId);
      } else {
        partner = await PartnerUser.findOne({ email: partnerId });
      }
    } catch (e) {
      partner = await PartnerUser.findOne({ email: partnerId });
    }

    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 계좌 정보 업데이트 (인증 상태는 false로 초기화)
    partner.accountInfo = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      verified: false, // 새로 등록한 계좌는 인증 전
    };

    await partner.save();

    const partnerObj = partner.toObject();
    return NextResponse.json({
      success: true,
      message: '계좌 정보가 저장되었습니다. 검토 후 인증됩니다.',
      data: {
        bankName: partnerObj.accountInfo?.bankName || '',
        accountNumber: partnerObj.accountInfo?.accountNumber || '',
        accountHolder: partnerObj.accountInfo?.accountHolder || '',
        verified: partnerObj.accountInfo?.verified || false,
      },
    });
  } catch (error) {
    console.error('계좌 정보 업데이트 오류:', error);
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
