import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: shopId } = await params;
    
    if (!shopId) {
      return NextResponse.json(
        { 
          success: false,
          error: '매장 ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }
    
    // 매장 조회
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return NextResponse.json(
        { 
          success: false,
          error: '매장을 찾을 수 없습니다.' 
        },
        { status: 404 }
      );
    }
    
    // 데이터 가공 (프론트엔드 형식에 맞춤)
    const formattedShop = {
      id: shop._id.toString(),
      partnerId: shop.partnerId,
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      description: shop.description || '',
      imageUrl: shop.imageUrls && shop.imageUrls.length > 0 
        ? shop.imageUrls[0] 
        : 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
      imageUrls: shop.imageUrls || [],
      portfolioImages: shop.portfolioImages || [],
      rating: shop.rating || 0,
      reviewCount: shop.reviewCount || 0,
      services: shop.menus.map((menu: any, index: number) => ({
        id: menu.id || `menu-${shop._id}-${index}`,
        shopId: shop._id.toString(),
        name: menu.name,
        price: menu.price,
        duration: menu.time,
        category: menu.category || shop.category,
      })),
      businessHours: shop.businessHours || {
        openTime: '10:00',
        closeTime: '20:00',
        holidays: [],
      },
    };
    
    return NextResponse.json({
      success: true,
      data: formattedShop,
    });
  } catch (error) {
    console.error('매장 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '매장 정보를 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
