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

// PUT: 배너 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = await Promise.resolve(params);
    const bannerId = resolvedParams.id;
    const body = await request.json();
    const { title, imageUrl, linkUrl, position, startDate, endDate, order, isActive } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (position) updateData.position = position;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      updateData,
      { new: true }
    );

    if (!banner) {
      return NextResponse.json(
        { error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '배너가 수정되었습니다.',
      data: {
        id: banner._id.toString(),
        title: banner.title,
      },
    });
  } catch (error) {
    console.error('배너 수정 오류:', error);
    return NextResponse.json(
      { error: '배너 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 배너 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = await Promise.resolve(params);
    const bannerId = resolvedParams.id;
    
    if (!bannerId) {
      return NextResponse.json(
        { error: '배너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(bannerId)) {
      return NextResponse.json(
        { error: '유효하지 않은 배너 ID입니다.' },
        { status: 400 }
      );
    }
    
    const banner = await Banner.findByIdAndDelete(bannerId);
    
    if (!banner) {
      return NextResponse.json(
        { error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '배너가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('배너 삭제 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { 
        error: '배너 삭제에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
