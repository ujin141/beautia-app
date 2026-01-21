import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import Shop from '@/models/Shop';
import Review from '@/models/Review';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// GET: 매장별 스태프 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    await connectDB();

    // Next.js 15에서는 params가 Promise입니다
    const { shopId } = await params;

    if (!shopId) {
      return NextResponse.json(
        { error: '매장 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 매장 정보 조회
    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      return NextResponse.json(
        { error: '매장을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Shop의 partnerId로 스태프 목록 조회
    // Shop의 partnerId는 String, Staff의 partnerId는 ObjectId이므로 정규화하여 비교
    const shopPartnerIdString = shop.partnerId?.toString() || '';
    
    console.log('[Shop Staff API] Shop ID:', shopId);
    console.log('[Shop Staff API] Shop name:', shop.name);
    console.log('[Shop Staff API] Shop partnerId (raw):', shop.partnerId);
    console.log('[Shop Staff API] Shop partnerId (string):', shopPartnerIdString);
    
    // ObjectId로 변환 시도 (Shop의 partnerId를 ObjectId로 변환)
    let shopPartnerObjectId: mongoose.Types.ObjectId | null = null;
    try {
      shopPartnerObjectId = new mongoose.Types.ObjectId(shopPartnerIdString);
      console.log('[Shop Staff API] Shop partnerId as ObjectId:', shopPartnerObjectId.toString());
    } catch (error) {
      console.log('[Shop Staff API] ⚠️ Cannot convert shop partnerId to ObjectId:', shopPartnerIdString);
    }
    
    // 가장 확실한 방법: 모든 활성 Staff를 가져와서 partnerId를 String으로 변환하여 비교
    const allStaffs = await Staff.find({ isActive: true }).lean();
    console.log('[Shop Staff API] Total active staffs in DB:', allStaffs.length);
    
    if (allStaffs.length > 0) {
      console.log('[Shop Staff API] All active staffs:', 
        allStaffs.map((s: any) => ({
          id: s._id.toString(),
          name: s.name,
          partnerId: s.partnerId?.toString(),
          partnerIdType: typeof s.partnerId,
          partnerIdIsObjectId: s.partnerId instanceof mongoose.Types.ObjectId,
        }))
      );
    }
    
    // partnerId를 정규화하여 비교
    const staffs = allStaffs.filter((staff: any) => {
      // Staff의 partnerId는 ObjectId이므로 String으로 변환
      const staffPartnerIdString = staff.partnerId?.toString() || '';
      
      // 정규화된 String 비교
      const match = staffPartnerIdString === shopPartnerIdString;
      
      if (match || process.env.NODE_ENV === 'development') {
        console.log('[Shop Staff API] Comparing:', {
          staffName: staff.name,
          staffPartnerId: staffPartnerIdString,
          shopPartnerId: shopPartnerIdString,
          match: match ? '✅ MATCH' : '❌ NO MATCH',
        });
      }
      
      return match;
    }).sort((a: any, b: any) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });
    
    console.log('[Shop Staff API] ✅ Final result: Found', staffs.length, 'matching staffs');
    
    // 경고 로그
    if (staffs.length === 0) {
      if (allStaffs.length === 0) {
        console.log('[Shop Staff API] ⚠️ No active staffs found in database');
      } else {
        console.log('[Shop Staff API] ⚠️ WARNING: Active staffs exist but none match shop partnerId');
        console.log('[Shop Staff API] Shop partnerId to match:', shopPartnerIdString);
        console.log('[Shop Staff API] Available partnerIds in staffs:', 
          Array.from(new Set(allStaffs.map((s: any) => s.partnerId?.toString())))
        );
      }
    }

    // 각 스태프의 평점과 리뷰 수 계산 (향후 Review 모델에 staffId 추가 시 사용)
    // 현재는 기본값 반환
    const staffsWithStats = await Promise.all(
      staffs.map(async (staff) => {
        // TODO: Review 모델에 staffId 필드 추가 후 실제 계산
        // const reviews = await Review.find({ shopId, staffId: staff._id.toString() }).lean();
        // const rating = reviews.length > 0
        //   ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        //   : 0;
        // const reviewCount = reviews.length;

        return {
          id: staff._id.toString(),
          _id: staff._id.toString(),
          name: staff.name,
          role: staff.role || undefined,
          specialty: staff.specialty || staff.role || undefined,
          profileImage: staff.profileImage || undefined,
          phone: staff.phone || undefined,
          email: staff.email || undefined,
          color: staff.color || '#8B5CF6',
          isAvailable: staff.isActive, // 활성 상태를 가용성으로 사용
          rating: 4.5, // 기본값 (향후 계산)
          reviewCount: 0, // 기본값 (향후 계산)
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: staffsWithStats,
    });
  } catch (error) {
    console.error('스태프 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
