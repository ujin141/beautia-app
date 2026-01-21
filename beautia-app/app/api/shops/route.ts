import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 쿼리 파라미터 확인 (카테고리 필터)
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    // 필터 조건 구성
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    
    // 매장 목록 조회
    const shops = await Shop.find(filter).sort({ rating: -1, reviewCount: -1 });
    
    // 데이터 가공 (필요한 경우)
    const formattedShops = shops.map(shop => ({
      id: shop._id.toString(),
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      description: shop.description,
      imageUrls: shop.imageUrls,
      rating: shop.rating || 0,
      reviewCount: shop.reviewCount || 0,
      menus: shop.menus.map((menu: any) => ({
        id: menu.id,
        name: menu.name,
        price: menu.price,
        time: menu.time,
      })),
    }));
    
    return NextResponse.json({
      success: true,
      shops: formattedShops,
    });
  } catch (error) {
    console.error('매장 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '매장 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
