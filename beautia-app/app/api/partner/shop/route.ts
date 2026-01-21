// 파트너 샵 정보 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

// GET: 파트너의 샵 정보 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const all = searchParams.get('all') === 'true'; // 모든 샵 조회 여부

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (token) {
      const verification = await verifyPartnerToken(token);
      if (!verification.valid || !verification.partnerId) {
        return NextResponse.json(
          { success: false, error: '인증이 필요합니다.' },
          { status: 401 }
        );
      }
      // 토큰에서 가져온 partnerId 우선 사용
      const verifiedPartnerId = verification.partnerId.toString();
      if (partnerId && partnerId !== verifiedPartnerId) {
        return NextResponse.json(
          { success: false, error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    } else if (!partnerId) {
      return NextResponse.json(
        { success: false, error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const finalPartnerId = token ? (await verifyPartnerToken(token!)).partnerId?.toString() : partnerId;

    if (all) {
      // 모든 샵 조회
      const shops = await Shop.find({ 
        partnerId: new mongoose.Types.ObjectId(finalPartnerId!) 
      }).lean();

      return NextResponse.json({
        success: true,
        data: shops.map((shop: any) => ({
          id: shop._id.toString(),
          _id: shop._id.toString(),
          name: shop.name,
          category: shop.category,
          address: shop.address,
          phone: shop.phone,
          email: shop.email,
          description: shop.description,
          imageUrls: shop.imageUrls || [],
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          businessHours: shop.businessHours,
          city: shop.city,
          isRecommended: shop.isRecommended,
        })),
      });
    } else {
      // 단일 샵 조회 (기존 로직)
      const shop = await Shop.findOne({ 
        partnerId: new mongoose.Types.ObjectId(finalPartnerId!) 
      }).lean();

      if (!shop) {
        return NextResponse.json(
          { success: false, error: '샵을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: shop._id.toString(),
          name: shop.name,
          category: shop.category,
          address: shop.address,
          phone: shop.phone,
          email: shop.email,
          description: shop.description,
          imageUrls: shop.imageUrls || [],
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          businessHours: shop.businessHours,
          city: shop.city,
          isRecommended: shop.isRecommended,
        },
      });
    }
  } catch (error: any) {
    console.error('샵 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '샵 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
