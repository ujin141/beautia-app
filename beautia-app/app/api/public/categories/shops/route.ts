import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Booking from '@/models/Booking';

/**
 * 특정 카테고리의 매장 목록 조회 API
 * - 카테고리별 매장 조회 (정확한 매칭)
 * - 정렬: 추천 > 평점 > 리뷰 수 > 최근 등록
 * - 페이지네이션 지원
 * - HOT 배지, 실시간 예약 가능 여부 포함
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'trending'; // trending, rating, newest
    
    if (!category || category === 'All' || category === 'null') {
      return NextResponse.json(
        { 
          success: false,
          error: '카테고리를 지정해주세요.' 
        },
        { status: 400 }
      );
    }
    
    // 카테고리별 매장 조회 (정확한 매칭)
    const filter: any = {
      category: category
    };
    
    // 정렬 조건
    let sortCondition: any = {};
    switch (sort) {
      case 'rating':
        sortCondition = { rating: -1, reviewCount: -1, createdAt: -1 };
        break;
      case 'newest':
        sortCondition = { createdAt: -1, rating: -1, reviewCount: -1 };
        break;
      case 'trending':
      default:
        sortCondition = { 
          isRecommended: -1, // 추천 샵 우선
          rating: -1, 
          reviewCount: -1,
          createdAt: -1 
        };
        break;
    }
    
    // 매장 조회
    const shops = await Shop.find(filter)
      .sort(sortCondition)
      .skip(offset)
      .limit(limit);
    
    // 총 개수 조회
    const totalCount = await Shop.countDocuments(filter);
    
    // 각 매장별 최근 예약 활발도 계산 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const shopIds = shops.map(shop => shop._id.toString());
    const recentBookings = await Booking.find({
      shopId: { $in: shopIds },
      status: { $in: ['pending', 'confirmed'] },
      createdAt: { $gte: sevenDaysAgo },
    });
    
    // 매장별 예약 수 계산
    const bookingCountMap: { [key: string]: number } = {};
    recentBookings.forEach(booking => {
      bookingCountMap[booking.shopId] = (bookingCountMap[booking.shopId] || 0) + 1;
    });
    
    // 오늘 날짜로 영업 시간 확인
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayName = dayNames[today.getDay()];
    
    // 매장별 추가 정보 계산
    const shopsWithInfo = shops.map(shop => {
      const recentBookingCount = bookingCountMap[shop._id.toString()] || 0;
      const businessHours = shop.businessHours || { openTime: '10:00', closeTime: '20:00', holidays: [] };
      const isHoliday = businessHours.holidays?.includes(todayName) || false;
      
      // 영업 시간 체크
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
      
      const isWithinBusinessHours = !isHoliday && 
        (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
        (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute));
      
      // HOT 배지 조건: 최근 7일 예약 5개 이상
      const isHot = recentBookingCount >= 5;
      
      // 실시간 예약 가능 여부
      const isAvailableNow = isWithinBusinessHours;
      
      return {
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
        description: shop.description || shop.menus[0]?.name || shop.name,
        menus: shop.menus.map((menu: any, index: number) => ({
          id: menu.id || `menu-${shop._id}-${index}`,
          shopId: shop._id.toString(),
          name: menu.name,
          price: menu.price,
          time: menu.time,
          duration: menu.time,
          category: shop.category,
        })),
        // 프론트엔드 호환성을 위한 services 필드 (menus와 동일)
        services: shop.menus.map((menu: any, index: number) => ({
          id: menu.id || `menu-${shop._id}-${index}`,
          shopId: shop._id.toString(),
          name: menu.name,
          price: menu.price,
          duration: menu.time,
          time: menu.time,
          category: shop.category,
        })),
        isHot: isHot,
        isAvailableNow: isAvailableNow,
        recentBookingCount: recentBookingCount,
        businessHours: businessHours,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: shopsWithInfo,
      meta: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
        category: category,
        hotShops: shopsWithInfo.filter(s => s.isHot).length,
        availableNow: shopsWithInfo.filter(s => s.isAvailableNow).length,
      },
    });
  } catch (error) {
    console.error('카테고리별 매장 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리별 매장 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
