import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';
import { withAdminAuth } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// POST: 파트너 수동 등록
async function handlePOST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, phone, email, shopName, address, category, autoApprove, autoCreateAccount } = body;

    // 필수 필드 검증
    if (!name || !phone || !email || !shopName || !category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (이름, 전화번호, 이메일, 매장명, 카테고리는 필수입니다.)' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingApplication = await PartnerApplication.findOne({ email: email.toLowerCase() });
    if (existingApplication) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 신청서 생성
    const newApplication = new PartnerApplication({
      name,
      phone,
      email: email.toLowerCase(),
      shopName,
      address: address || '',
      category,
      status: autoApprove ? 'approved' : 'pending',
      submittedAt: new Date(),
    });

    await newApplication.save();

    // 자동 승인 및 계정 생성 옵션
    let accountCreated = false;
    let tempPassword = null;

    if (autoApprove && autoCreateAccount) {
      try {
        // 파트너 계정 생성 API 호출
        const createUserResponse = await fetch(
          `${request.nextUrl.origin}/api/partner/users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: newApplication.email,
              name: newApplication.name,
              phone: newApplication.phone,
              shopName: newApplication.shopName,
              category: newApplication.category,
              address: newApplication.address || '',
              applicationId: newApplication._id.toString(),
            }),
          }
        );

        if (createUserResponse.ok) {
          const userData = await createUserResponse.json();
          accountCreated = true;
          tempPassword = userData.tempPassword;
        }
      } catch (error) {
        console.error('파트너 계정 생성 오류:', error);
        // 계정 생성 실패해도 신청서는 생성됨
      }
    }

    const appObj = newApplication.toObject();
    return NextResponse.json({
      success: true,
      message: '파트너가 등록되었습니다.',
      data: {
        id: appObj._id.toString(),
        ...appObj,
        _id: undefined,
        __v: undefined,
        submittedAt: appObj.submittedAt.toISOString(),
        createdAt: appObj.createdAt.toISOString(),
        updatedAt: appObj.updatedAt.toISOString(),
      },
      accountCreated,
      ...(tempPassword && { tempPassword }),
    });
  } catch (error) {
    console.error('파트너 등록 오류:', error);
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

// 인증 미들웨어 적용
export const POST = withAdminAuth(handlePOST);

// GET: 파트너 신청 목록 조회
async function handleGET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 필터: pending, approved, rejected

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const applications = await PartnerApplication.find(filter)
      .sort({ submittedAt: -1 })
      .lean();

    // 파트너 계정 정보 조인 (isVerified 포함)
    const formattedApplications = await Promise.all(
      applications.map(async (app: any) => {
        // 파트너 계정 찾기 (이메일 또는 applicationId로)
        const partnerUser = await PartnerUser.findOne({
          $or: [
            { email: app.email.toLowerCase() },
            { applicationId: app._id.toString() }
          ]
        }).lean();

        return {
          id: app._id.toString(),
          ...app,
          _id: undefined,
          __v: undefined,
          isVerified: partnerUser?.isVerified || false,
          submittedAt: app.submittedAt.toISOString(),
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedApplications,
      count: formattedApplications.length,
    });
  } catch (error) {
    console.error('파트너 신청 목록 조회 오류:', error);
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

// 인증 미들웨어 적용
export const GET = withAdminAuth(handleGET);

// PATCH: 신청 상태 변경 (승인/반려)
// PUT: 파트너 정보 수정
async function handlePATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const application = await PartnerApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return NextResponse.json(
        { error: '신청서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 승인 시 자동으로 파트너 계정 생성
    let accountCreated = false;
    let tempPassword = null;
    
    if (status === 'approved') {
      try {
        // 파트너 계정 생성 API 호출
        const createUserResponse = await fetch(
          `${request.nextUrl.origin}/api/partner/users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: application.email,
              name: application.name,
              phone: application.phone,
              shopName: application.shopName,
              category: application.category,
              address: application.address || '',
              applicationId: application._id.toString(),
            }),
          }
        );

        if (createUserResponse.ok) {
          const userData = await createUserResponse.json();
          accountCreated = true;
          tempPassword = userData.tempPassword;
        }
      } catch (error) {
        console.error('파트너 계정 생성 오류:', error);
        // 계정 생성 실패해도 상태 업데이트는 완료됨
      }
    }

    const appObj = application.toObject();
    return NextResponse.json({
      success: true,
      message: '상태가 업데이트되었습니다.',
      data: {
        id: appObj._id.toString(),
        ...appObj,
        _id: undefined,
        __v: undefined,
        submittedAt: appObj.submittedAt.toISOString(),
        createdAt: appObj.createdAt.toISOString(),
        updatedAt: appObj.updatedAt.toISOString(),
      },
      accountCreated,
      ...(tempPassword && { tempPassword }), // 임시 비밀번호 반환 (실제로는 이메일로 전송)
    });
  } catch (error) {
    console.error('신청 상태 업데이트 오류:', error);
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

// 인증 미들웨어 적용
export const PATCH = withAdminAuth(handlePATCH);

// PUT: 파트너 정보 수정
async function handlePUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, name, phone, email, shopName, address, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 업데이트할 필드 구성
    const updates: any = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (shopName) updates.shopName = shopName;
    if (address !== undefined) updates.address = address;
    if (category) updates.category = category;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '수정할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const application = await PartnerApplication.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!application) {
      return NextResponse.json(
        { error: '신청서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const appObj = application.toObject();
    return NextResponse.json({
      success: true,
      message: '파트너 정보가 업데이트되었습니다.',
      data: {
        id: appObj._id.toString(),
        ...appObj,
        _id: undefined,
        __v: undefined,
        submittedAt: appObj.submittedAt.toISOString(),
        createdAt: appObj.createdAt.toISOString(),
        updatedAt: appObj.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('파트너 정보 수정 오류:', error);
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

// 인증 미들웨어 적용
export const PUT = withAdminAuth(handlePUT);

// DELETE: 파트너 신청 삭제
async function handleDELETE(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 신청서 찾기
    const application = await PartnerApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: '신청서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관련 파트너 계정과 매장도 삭제 (있는 경우)
    try {
      const partnerUsers = await PartnerUser.find({
        $or: [
          { email: application.email.toLowerCase() },
          { applicationId: id }
        ]
      });

      // 파트너 계정의 매장 삭제
      for (const partnerUser of partnerUsers) {
        await Shop.deleteMany({ partnerId: partnerUser._id.toString() });
      }

      // 파트너 계정 삭제
      await PartnerUser.deleteMany({
        $or: [
          { email: application.email.toLowerCase() },
          { applicationId: id }
        ]
      });
    } catch (error) {
      console.error('파트너 계정 삭제 오류 (무시됨):', error);
      // 계정 삭제 실패해도 신청서는 삭제
    }

    // 신청서 삭제
    await PartnerApplication.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: '파트너 신청이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('파트너 신청 삭제 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
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

// 인증 미들웨어 적용
export const DELETE = withAdminAuth(handleDELETE);
