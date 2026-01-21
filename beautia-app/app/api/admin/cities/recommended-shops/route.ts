import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

// GET: 도시별 추천 샵 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');

    const filter: any = {};
    const isRecommended = searchParams.get('recommended') === 'true';
    
    if (cityId) {
      filter.city = { $regex: cityId, $options: 'i' };
    }
    
    if (isRecommended) {
      filter.isRecommended = true;
    }

    const shops = await Shop.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formattedShops = shops.map((shop: any) => ({
      id: shop._id.toString(),
      name: shop.name,
      city: shop.city || '',
      address: shop.address,
      imageUrl: (shop.imageUrls && shop.imageUrls.length > 0) ? shop.imageUrls[0] : '',
      isRecommended: shop.isRecommended || false,
      partnerId: shop.partnerId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedShops,
    });
  } catch (error) {
    console.error('추천 샵 조회 오류:', error);
    return NextResponse.json(
      { error: '추천 샵 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 추천 샵 설정/해제
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { shopId, isRecommended } = body;

    if (!shopId || isRecommended === undefined) {
      return NextResponse.json(
        { error: '샵 ID와 추천 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { isRecommended },
      { new: true }
    );

    if (!shop) {
      return NextResponse.json(
        { error: '샵을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `샵이 ${isRecommended ? '추천' : '추천 해제'}되었습니다.`,
      data: {
        id: shop._id.toString(),
        name: shop.name,
        isRecommended: shop.isRecommended,
      },
    });
  } catch (error) {
    console.error('추천 샵 설정 오류:', error);
    return NextResponse.json(
      { error: '추천 샵 설정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
