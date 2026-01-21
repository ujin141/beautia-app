// 공개 광고 조회 API (앱에서 사용)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Shop from '@/models/Shop';

async function handleGet(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const adType = searchParams.get('type'); // main_banner, category_top, search_powerlink
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const now = new Date();
    
    // 필터 조건
    const filter: any = {
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (adType) {
      filter.type = adType;
    }

    // 활성 광고 조회
    const ads = await Ad.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // 샵 정보와 함께 조회
    const adsWithShop = await Promise.all(
      ads.map(async (ad: any) => {
        const shop = await Shop.findById(ad.shopId).lean();
        if (!shop) return null;

        return {
          id: ad._id.toString(),
          type: ad.type,
          shopId: ad.shopId.toString(),
          shop: {
            id: shop._id.toString(),
            name: (shop as any).name,
            category: (shop as any).category,
            address: (shop as any).address,
            rating: (shop as any).rating || 0,
            reviewCount: (shop as any).reviewCount || 0,
            imageUrl: (shop as any).imageUrls?.[0] || (shop as any).imageUrl || '',
          },
          keywords: ad.keywords || [],
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
        };
      })
    );

    // null 제거
    const validAds = adsWithShop.filter((ad) => ad !== null);

    // 카테고리 필터링
    let filteredAds = validAds;
    if (category) {
      filteredAds = validAds.filter((ad: any) => 
        ad.shop.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    return successResponse({
      ads: filteredAds,
      count: filteredAds.length,
    });
  } catch (error) {
    console.error('광고 조회 오류:', error);
    return successResponse({
      ads: [],
      count: 0,
    });
  }
}

export const GET = withGetHandler(handleGet);
