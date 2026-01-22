import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import Shop from '@/models/Shop';

/**
 * 타임 딜 (Flash Sale) 조회 API
 * - 현재 진행 중인 타임 딜 목록 반환
 * - 샵 정보 포함
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const now = new Date();
    
    // 진행 중인 타임 딜 조회
    const deals = await Promotion.find({
      type: 'flash_sale',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
    .sort({ endDate: 1 }) // 마감 임박 순
    .limit(limit)
    .populate({
      path: 'shopId',
      select: 'name imageUrls rating reviewCount address',
      model: Shop
    })
    .lean();
    
    // 데이터 가공
    const formattedDeals = deals
      .filter((deal: any) => deal.shopId) // 샵 정보가 있는 것만
      .map((deal: any) => {
        const shop = deal.shopId;
        return {
          id: deal._id.toString(),
          title: deal.title,
          description: deal.description,
          discountType: deal.discountType,
          discountValue: deal.discountValue,
          startDate: deal.startDate,
          endDate: deal.endDate,
          shop: {
            id: shop._id.toString(),
            name: shop.name,
            imageUrl: shop.imageUrls && shop.imageUrls.length > 0 ? shop.imageUrls[0] : '',
            rating: shop.rating || 0,
            reviewCount: shop.reviewCount || 0,
            address: shop.address,
          }
        };
      });
      
    return NextResponse.json({
      success: true,
      data: formattedDeals,
    });
  } catch (error) {
    console.error('타임 딜 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '타임 딜 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
