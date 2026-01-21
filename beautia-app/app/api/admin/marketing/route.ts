import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// 광고 스키마
const AdSchema = new mongoose.Schema({
  partnerId: { type: String, required: true, index: true },
  partnerName: { type: String, required: true },
  adType: { type: String, enum: ['main_banner', 'category_top', 'search_powerlink', 'local_push', 'coupon'], required: true },
  adName: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  cost: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'active', 'completed', 'rejected'], default: 'waiting' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const Ad = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

// GET: 광고 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    let ads = await Ad.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      ads = ads.filter((ad: any) => 
        ad.partnerName?.toLowerCase().includes(searchLower) ||
        ad.adName?.toLowerCase().includes(searchLower)
      );
    }

    const formattedAds = ads.map((ad: any) => ({
      id: ad._id.toString(),
      partnerId: ad.partnerId,
      partnerName: ad.partnerName,
      adType: ad.adType,
      adName: ad.adName,
      startDate: ad.startDate?.toISOString(),
      endDate: ad.endDate?.toISOString(),
      cost: ad.cost,
      status: ad.status,
      createdAt: ad.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedAds,
    });
  } catch (error) {
    console.error('광고 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '광고 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 광고 상태 변경
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { adId, status } = body;

    if (!adId || !status) {
      return NextResponse.json(
        { error: '광고 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!['waiting', 'active', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const ad = await Ad.findByIdAndUpdate(
      adId,
      { status },
      { new: true }
    );

    if (!ad) {
      return NextResponse.json(
        { error: '광고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '광고 상태가 변경되었습니다.',
      data: {
        id: ad._id.toString(),
        status: ad.status,
      },
    });
  } catch (error) {
    console.error('광고 상태 변경 오류:', error);
    return NextResponse.json(
      { error: '광고 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
