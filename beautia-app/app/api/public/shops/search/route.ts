import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export const runtime = 'nodejs';

/**
 * 매장 검색 API
 * - 검색어로 매장 이름, 카테고리, 주소 검색
 * - 필터 옵션: 도시, 카테고리
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 필터 조건 구성
    const filter: any = {};
    
    // 검색어 필터 (매장 이름, 카테고리, 주소에서 검색)
    if (query && query.trim().length > 0) {
      const searchRegex = { $regex: query.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { address: searchRegex },
        { description: searchRegex },
      ];
      
      // 메뉴 이름에서도 검색
      filter.$or.push({
        'menus.name': searchRegex,
      });
    }
    
    // 도시 필터
    if (city && city !== 'ALL') {
      filter.address = filter.address 
        ? { ...filter.address, $regex: city, $options: 'i' }
        : { $regex: city, $options: 'i' };
    }
    
    // 카테고리 필터 (대소문자 구분 없이)
    if (category && category !== 'All' && category !== 'null') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    
    // 매장 조회
    const shops = await Shop.find(filter)
      .sort({ 
        isRecommended: -1, // 추천 매장 우선
        rating: -1, 
        reviewCount: -1,
        createdAt: -1 
      })
      .skip(offset)
      .limit(limit)
      .lean();
    
    // 전체 개수 조회 (페이징용)
    const total = await Shop.countDocuments(filter);
    
    // 데이터 가공
    const formattedShops = shops.map((shop: any) => ({
      id: shop._id.toString(),
      partnerId: shop.partnerId,
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone || '',
      rating: shop.rating || 0,
      reviewCount: shop.reviewCount || 0,
      imageUrl: shop.imageUrls && shop.imageUrls.length > 0 
        ? shop.imageUrls[0] 
        : 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
      imageUrls: shop.imageUrls || [],
      description: shop.description || shop.menus?.[0]?.name || shop.name,
      menus: (shop.menus || []).map((menu: any, index: number) => ({
        id: menu.id || `menu-${shop._id}-${index}`,
        shopId: shop._id.toString(),
        name: menu.name,
        price: menu.price,
        time: menu.time,
        duration: menu.time,
        category: shop.category,
      })),
      // 프론트엔드 호환성을 위한 services 필드
      services: (shop.menus || []).map((menu: any, index: number) => ({
        id: menu.id || `menu-${shop._id}-${index}`,
        shopId: shop._id.toString(),
        name: menu.name,
        price: menu.price,
        duration: menu.time,
        time: menu.time,
        category: shop.category,
      })),
      businessHours: shop.businessHours || { openTime: '10:00', closeTime: '20:00', holidays: [] },
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedShops,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + formattedShops.length < total,
      },
    });
  } catch (error) {
    console.error('매장 검색 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '매장 검색 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
