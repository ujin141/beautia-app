// 어드민 샵 목록 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

// GET: 샵 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const shops = await Shop.find({})
      .select('_id name category partnerId')
      .sort({ name: 1 })
      .limit(500)
      .lean();

    const formattedShops = shops.map((shop: any) => ({
      id: shop._id.toString(),
      name: shop.name,
      category: shop.category,
      partnerId: shop.partnerId?.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedShops,
    });
  } catch (error: any) {
    console.error('샵 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '샵 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
