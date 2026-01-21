import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Booking from '@/models/Booking';

/**
 * 트렌딩 매장 API (전환율 최적화)
 * - 실시간 예약이 활발한 매장 우선
 * - HOT 배지 조건: 최근 7일 예약 5개 이상
 * - 실시간 예약 가능 여부 포함
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 필터 조건 구성
    const filter: any = {};
    
    // 도시 필터 (주소에 포함된 경우)
    if (city && city !== 'ALL') {
      filter.address = { $regex: city, $options: 'i' };
    }
    
    // 카테고리 필터 (대소문자 구분 없이)
    if (category && category !== 'All' && category !== 'null') {
      // 대소문자 구분 없이 검색
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    
    // 활성 광고 조회 (광고 샵을 우선 표시하기 위해)
    const Ad = (await import('@/models/Ad')).default;
    const now = new Date();
    const activeAds = await Ad.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      type: { $in: ['main_banner', 'category_top'] },
    })
      .select('shopId')
      .lean();
    
    const adShopIds = activeAds.map((ad: any) => ad.shopId.toString());
    
    // 트렌딩 샵 조회 (더 많이 가져와서 정렬 후 필터링)
    const shops = await Shop.find(filter)
      .sort({ 
        isRecommended: -1, // 추천 샵 우선
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
    
    // 오늘 날짜로 영업 시간 확인
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayName = dayNames[today.getDay()];
    
    // 매장별 트렌딩 점수 계산 및 HOT 여부 판단
    const shopsWithTrending = shops.map(shop => {
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
      
      // 트렌딩 점수 계산 (예약 활발도 + 평점 + 리뷰 수)
      const trendingScore = (recentBookingCount * 10) + (shop.rating * 2) + (shop.reviewCount * 0.1);
      
      // HOT 배지 조건: 최근 7일 예약 5개 이상
      const isHot = recentBookingCount >= 5;
      
      // 실시간 예약 가능 여부
      const isAvailableNow = isWithinBusinessHours;
      
      return {
        shop,
        recentBookingCount,
        trendingScore,
        isHot,
        isAvailableNow,
      };
    });
    
    // 트렌딩 점수 기준 정렬
    shopsWithTrending.sort((a, b) => {
      const aShopId = a.shop._id.toString();
      const bShopId = b.shop._id.toString();
      const aHasAd = adShopIds.includes(aShopId);
      const bHasAd = adShopIds.includes(bShopId);
      
      // 1순위: 광고 샵 우선
      if (aHasAd && !bHasAd) return -1;
      if (!aHasAd && bHasAd) return 1;
      
      // 2순위: HOT 배지
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      
      // 3순위: 트렌딩 점수
      if (a.trendingScore !== b.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }
      
      // 4순위: 최근 예약 활발도
      if (a.recentBookingCount !== b.recentBookingCount) {
        return b.recentBookingCount - a.recentBookingCount;
      }
      
      // 5순위: 평점
      if (a.shop.rating !== b.shop.rating) {
        return b.shop.rating - a.shop.rating;
      }
      
      // 6순위: 리뷰 수
      return (b.shop.reviewCount || 0) - (a.shop.reviewCount || 0);
    });
    
    // limit만큼만 반환
    const finalShops = shopsWithTrending.slice(0, limit);
    
    // 데이터 가공 (프론트엔드 형식에 맞춤)
    const formattedShops = finalShops.map(({ shop, recentBookingCount, isHot, isAvailableNow }) => ({
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
      isHot: isHot, // HOT 배지 여부
      isAvailableNow: isAvailableNow, // 실시간 예약 가능 여부
      recentBookingCount: recentBookingCount, // 최근 7일 예약 수
      businessHours: shop.businessHours || { openTime: '10:00', closeTime: '20:00', holidays: [] },
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedShops,
      meta: {
        total: formattedShops.length,
        hotShops: formattedShops.filter(s => s.isHot).length,
        availableNow: formattedShops.filter(s => s.isAvailableNow).length,
      },
    });
  } catch (error) {
    console.error('트렌딩 샵 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '트렌딩 샵 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
