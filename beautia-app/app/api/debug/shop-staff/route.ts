// 디버깅용: Shop과 Staff의 partnerId 매칭 확인 API
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await connectDB();

    // 쿼리 파라미터에서 shopId 가져오기 (이 라우트는 동적 라우트가 아님)
    const shopId = request.nextUrl.searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // Shop 정보 조회
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 모든 활성 Staff 조회
    const allStaffs = await Staff.find({ isActive: true }).lean();
    
    // Shop의 partnerId와 매칭되는 Staff 찾기
    const shopPartnerId = shop.partnerId?.toString();
    const matchedStaffs = allStaffs.filter((staff: any) => {
      const staffPartnerId = staff.partnerId?.toString();
      return staffPartnerId === shopPartnerId;
    });

    return NextResponse.json({
      success: true,
      data: {
        shop: {
          id: shop._id.toString(),
          name: shop.name,
          partnerId: shopPartnerId,
          partnerIdType: typeof shop.partnerId,
        },
        totalActiveStaffs: allStaffs.length,
        matchedStaffs: matchedStaffs.length,
        allStaffs: allStaffs.map((staff: any) => ({
          id: staff._id.toString(),
          name: staff.name,
          partnerId: staff.partnerId?.toString(),
          partnerIdType: typeof staff.partnerId,
          isActive: staff.isActive,
          matches: staff.partnerId?.toString() === shopPartnerId,
        })),
        matchedStaffDetails: matchedStaffs.map((staff: any) => ({
          id: staff._id.toString(),
          name: staff.name,
          role: staff.role,
          specialty: staff.specialty,
        })),
      },
    });
  } catch (error: any) {
    console.error('디버깅 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
