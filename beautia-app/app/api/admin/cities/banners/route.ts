import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String },
  linkUrl: { type: String },
  position: { type: String, enum: ['main_hero', 'category_top', 'city'], default: 'main_hero' },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

// GET: 도시별 배너 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');

    const filter: any = { position: 'city' };
    if (cityId) {
      filter.linkUrl = { $regex: cityId, $options: 'i' };
    }

    const banners = await Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const formattedBanners = banners.map((banner: any) => ({
      id: banner._id.toString(),
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      startDate: banner.startDate?.toISOString(),
      endDate: banner.endDate?.toISOString(),
      isActive: banner.isActive,
      order: banner.order,
      createdAt: banner.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedBanners,
    });
  } catch (error) {
    console.error('도시 배너 조회 오류:', error);
    return NextResponse.json(
      { error: '도시 배너 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
