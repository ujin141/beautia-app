import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import PartnerUser from '@/models/PartnerUser';

// GET: 파트너의 매장 설정 조회
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

    let shop = await Shop.findOne({ partnerId }).lean();

    // Shop이 없으면 기본값 반환
    if (!shop) {
      return NextResponse.json({
        success: true,
        data: {
          menus: [],
          businessHours: {
            openTime: '10:00',
            closeTime: '20:00',
            holidays: [],
          },
        },
      });
    }

    const shopObj: any = shop;
    return NextResponse.json({
      success: true,
      data: {
        id: shopObj._id.toString(),
        menus: shopObj.menus || [],
        businessHours: shopObj.businessHours || {
          openTime: '10:00',
          closeTime: '20:00',
          holidays: [],
        },
      },
    });
  } catch (error) {
    console.error('매장 설정 조회 오류:', error);
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

// PUT: 파트너의 매장 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { partnerId, menus, businessHours } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Shop 찾기 또는 생성
    let shop = await Shop.findOne({ partnerId });

    if (!shop) {
      // PartnerUser에서 정보 가져오기 (partnerId는 ObjectId 또는 문자열)
      let partnerUser;
      try {
        const mongoose = (await import('mongoose')).default;
        if (mongoose.Types.ObjectId.isValid(partnerId)) {
          partnerUser = await PartnerUser.findById(partnerId).lean();
        } else {
          partnerUser = await PartnerUser.findOne({ email: partnerId }).lean();
        }
      } catch (e) {
        // partnerId가 ObjectId 형식이 아닐 수 있음
        partnerUser = await PartnerUser.findOne({ email: partnerId }).lean();
      }
      
      let shopName = '새 매장';
      let category = 'Hair';
      let address = '';

      // PartnerApplication에서 정보 가져오기 (applicationId가 있는 경우)
      if (partnerUser?.applicationId) {
        const PartnerApplication = (await import('@/models/PartnerApplication')).default;
        const application = await PartnerApplication.findById(partnerUser.applicationId).lean();
        if (application) {
          shopName = application.shopName || shopName;
          category = application.category || category;
          address = application.address || address;
        }
      } else if (partnerUser?.email) {
        // applicationId가 없으면 email로 직접 찾기
        const PartnerApplication = (await import('@/models/PartnerApplication')).default;
        const application = await PartnerApplication.findOne({ email: partnerUser.email }).lean();
        if (application) {
          shopName = application.shopName || shopName;
          category = application.category || category;
          address = application.address || address;
        }
      }

      // 새 Shop 생성
      shop = new Shop({
        partnerId,
        name: shopName,
        category,
        address,
        menus: menus || [],
        businessHours: businessHours || {
          openTime: '10:00',
          closeTime: '20:00',
          holidays: [],
        },
      });
    } else {
      // 기존 Shop 업데이트
      if (menus) shop.menus = menus;
      if (businessHours) shop.businessHours = businessHours;
    }

    await shop.save();

    const shopObj = shop.toObject();
    return NextResponse.json({
      success: true,
      message: '매장 설정이 저장되었습니다.',
      data: {
        id: shopObj._id.toString(),
        menus: shopObj.menus,
        businessHours: shopObj.businessHours,
      },
    });
  } catch (error) {
    console.error('매장 설정 저장 오류:', error);
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
