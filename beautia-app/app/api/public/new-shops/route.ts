import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

/**
 * 신규 매장 조회 API
 * - 최근 등록된 매장 순으로 반환
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const shops = await Shop.find({
      // 필요한 경우 승인된 매장만 필터링 (예: status: 'approved')
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
    
    // 데이터 가공
    const formattedShops = shops.map((shop: any) => ({
      id: shop._id.toString(),
      partnerId: shop.partnerId,
      name: shop.name,
      category: shop.category,
      address: shop.address,
      rating: shop.rating || 0,
      reviewCount: shop.reviewCount || 0,
      imageUrl: shop.imageUrls && shop.imageUrls.length > 0 
        ? shop.imageUrls[0] 
        : 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
      imageUrls: shop.imageUrls || [],
      description: shop.description || shop.menus?.[0]?.name || shop.name,
      isNew: true, // 신규 매장 표시
      createdAt: shop.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedShops,
    });
  } catch (error) {
    console.error('신규 매장 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '신규 매장 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
