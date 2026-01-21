import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Booking from '@/models/Booking';

/**
 * 검증된 추천 매장 조회 API (전환율 최적화)
 * - 평점 4.5 이상 또는 isRecommended가 true인 매장
 * - 즉시 예약 가능한 매장 우선 표시
 * - 최근 예약 활발도 고려
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyAvailable = searchParams.get('onlyAvailable') === 'true'; // 즉시 예약 가능만
    const latitude = searchParams.get('latitude'); // 현재 위치 위도
    const longitude = searchParams.get('longitude'); // 현재 위치 경도
    
    // 검증된 추천 매장 조회 (평점 4.5 이상 또는 isRecommended가 true)
    const filter: any = {
      $or: [
        { isRecommended: true },
        { rating: { $gte: 4.5 } },
      ],
      reviewCount: { $gte: 3 }, // 최소 3개 리뷰 이상 (신뢰도 향상)
    };
    
    const shops = await Shop.find(filter)
      .sort({ 
        isRecommended: -1, // 추천 샵 최우선
        rating: -1, 
        reviewCount: -1,
        createdAt: -1 
      })
      .limit(limit * 2); // 필터링 전 더 많이 가져오기
    
    // 각 매장별 최근 예약 활발도 계산 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const shopIds = shops.map(shop => shop._id.toString());
    const recentBookings = await Booking.find({
      shopId: { $in: shopIds },
      status: { $in: ['pending', 'confirmed'] }, // 진행 중인 예약만
      createdAt: { $gte: sevenDaysAgo },
    });
    
    // 매장별 예약 수 계산
    const bookingCountMap: { [key: string]: number } = {};
    recentBookings.forEach(booking => {
      bookingCountMap[booking.shopId] = (bookingCountMap[booking.shopId] || 0) + 1;
    });
    
    // 오늘 날짜로 영업 시간 확인 (간단히 businessHours 기준)
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayName = dayNames[today.getDay()];
    
    // 매장별 즉시 예약 가능 여부 계산
    const shopsWithAvailability = shops.map(shop => {
      const recentBookingCount = bookingCountMap[shop._id.toString()] || 0;
      const businessHours = shop.businessHours || { openTime: '10:00', closeTime: '20:00', holidays: [] };
      const isHoliday = businessHours.holidays?.includes(todayName) || false;
      
      // 영업 시간 체크 (간단 버전 - 실제로는 더 정교하게)
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
      
      const isWithinBusinessHours = !isHoliday && 
        (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
        (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute));
      
      // 즉시 예약 가능 조건: 영업 시간 내 + 최근 예약 활발 (또는 리뷰 많음)
      const isAvailableNow = isWithinBusinessHours && (recentBookingCount > 0 || shop.reviewCount >= 10);
      
      return {
        shop,
        recentBookingCount,
        isAvailableNow,
        isHot: recentBookingCount >= 5, // 최근 7일 예약 5개 이상 = HOT
      };
    });
    
    // 즉시 예약 가능한 매장 우선 정렬
    shopsWithAvailability.sort((a, b) => {
      // 1순위: 즉시 예약 가능 여부
      if (a.isAvailableNow && !b.isAvailableNow) return -1;
      if (!a.isAvailableNow && b.isAvailableNow) return 1;
      
      // 2순위: 추천 여부
      if (a.shop.isRecommended && !b.shop.isRecommended) return -1;
      if (!a.shop.isRecommended && b.shop.isRecommended) return 1;
      
      // 3순위: 최근 예약 활발도
      if (a.recentBookingCount !== b.recentBookingCount) {
        return b.recentBookingCount - a.recentBookingCount;
      }
      
      // 4순위: 평점
      if (a.shop.rating !== b.shop.rating) {
        return b.shop.rating - a.shop.rating;
      }
      
      // 5순위: 리뷰 수
      return (b.shop.reviewCount || 0) - (a.shop.reviewCount || 0);
    });
    
    // 필터링: onlyAvailable이 true면 즉시 예약 가능한 매장만
    let filteredShops = shopsWithAvailability;
    if (onlyAvailable) {
      filteredShops = shopsWithAvailability.filter(item => item.isAvailableNow);
    }
    
    // 거리 계산 함수 (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // 지구 반지름 (km)
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // 데이터 가공 (프론트엔드 형식에 맞춤)
    const formattedShops = filteredShops.map(({ shop, recentBookingCount, isAvailableNow, isHot }) => {
      let distance: number | null = null;
      
      // 현재 위치와 샵 좌표가 모두 있으면 거리 계산
      if (latitude && longitude && shop.latitude && shop.longitude) {
        distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          shop.latitude,
          shop.longitude
        );
      }
      
      return {
        shop,
        recentBookingCount,
        isAvailableNow,
        isHot,
        distance,
      };
    });

    // 거리가 있으면 거리순으로 정렬
    if (latitude && longitude) {
      formattedShops.sort((a, b) => {
        // 거리가 있는 것 우선
        if (a.distance !== null && b.distance === null) return -1;
        if (a.distance === null && b.distance !== null) return 1;
        // 둘 다 거리가 있으면 거리순 정렬
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        // 둘 다 거리가 없으면 기존 정렬 유지
        return 0;
      });
    }

    // limit만큼만 반환
    const limitedShops = formattedShops.slice(0, limit);

    // 최종 데이터 포맷팅
    const finalFormattedShops = limitedShops.map(({ shop, recentBookingCount, isAvailableNow, isHot, distance }) => ({
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
      isRecommended: shop.isRecommended || false,
      isAvailableNow: isAvailableNow, // 즉시 예약 가능 여부
      isHot: isHot, // HOT 배지 여부
      recentBookingCount: recentBookingCount, // 최근 7일 예약 수
      businessHours: shop.businessHours || { openTime: '10:00', closeTime: '20:00', holidays: [] },
      latitude: shop.latitude,
      longitude: shop.longitude,
      distance: distance, // 거리 (km)
    }));
    
    return NextResponse.json({
      success: true,
      data: finalFormattedShops,
      meta: {
        total: finalFormattedShops.length,
        availableNow: finalFormattedShops.filter(item => item.isAvailableNow).length,
      },
    });
  } catch (error) {
    console.error('추천 매장 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '추천 매장 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
