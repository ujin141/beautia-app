import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 도시별 샵 통계 및 샵 목록 조회
    const cities = ['Seoul', 'Tokyo', 'Bangkok', 'Singapore'];
    
    const cityData = await Promise.all(
      cities.map(async (cityName) => {
        // 해당 도시의 샵 조회
        const shops = await Shop.find({
          address: { $regex: cityName, $options: 'i' },
        })
          .sort({ isRecommended: -1, rating: -1, reviewCount: -1 })
          .limit(3); // 각 도시당 상위 3개 샵
        
        // 통계 계산
        const allShops = await Shop.find({
          address: { $regex: cityName, $options: 'i' },
        });
        
        const totalShops = allShops.length;
        const avgRating = 
          allShops.length > 0
            ? allShops.reduce((sum, shop) => sum + (shop.rating || 0), 0) / allShops.length
            : 0;
        
        return {
          id: cityName.toLowerCase(),
          name: cityName.toUpperCase(),
          totalShops,
          avgRating: Math.round(avgRating * 10) / 10,
          shops: shops.map((shop) => ({
            id: shop._id.toString(),
            name: shop.name,
            category: shop.category,
            address: shop.address,
            rating: shop.rating || 0,
            reviewCount: shop.reviewCount || 0,
            imageUrl: shop.imageUrls && shop.imageUrls.length > 0 
              ? shop.imageUrls[0] 
              : 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
          })),
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: cityData,
    });
  } catch (error) {
    console.error('도시별 샵 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '도시별 샵 정보를 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
