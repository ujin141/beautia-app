import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// 배너 스키마
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

// GET: 배너 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const banners = await Banner.find({})
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
    console.error('배너 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '배너 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 배너 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { title, imageUrl, linkUrl, position, startDate, endDate, order } = body;

    if (!title) {
      return NextResponse.json(
        { error: '배너 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    const banner = new Banner({
      title,
      imageUrl,
      linkUrl,
      position: position || 'main_hero',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      order: order || 0,
      isActive: body.isActive !== false,
    });

    await banner.save();

    return NextResponse.json({
      success: true,
      message: '배너가 생성되었습니다.',
      data: {
        id: banner._id.toString(),
        title: banner.title,
      },
    });
  } catch (error) {
    console.error('배너 생성 오류:', error);
    return NextResponse.json(
      { error: '배너 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
