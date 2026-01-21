import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// 도시 스키마
const CitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const City = mongoose.models.City || mongoose.model('City', CitySchema);

// GET: 도시 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    let cities = await City.find({}).sort({ name: 1 }).lean();

    // 도시가 없으면 기본 도시들 생성 (키워드에 맞는 기본 이미지 포함)
    if (cities.length === 0) {
      const defaultCities = [
        { id: 'seoul', name: 'SEOUL', imageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=400&fit=crop', isActive: true },
        { id: 'tokyo', name: 'TOKYO', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop', isActive: true },
        { id: 'bangkok', name: 'BANGKOK', imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=400&fit=crop', isActive: true },
        { id: 'singapore', name: 'SINGAPORE', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=400&fit=crop', isActive: true },
      ];

      await City.insertMany(defaultCities);
      cities = await City.find({}).sort({ name: 1 }).lean();
    }

    const formattedCities = cities.map((city: any) => ({
      id: city.id || city._id.toString(),
      name: city.name,
      imageUrl: city.imageUrl || '',
      isActive: city.isActive !== false,
      createdAt: city.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedCities,
    });
  } catch (error) {
    console.error('도시 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '도시 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 도시 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { cityId, name, imageUrl, isActive } = body;

    if (!cityId) {
      return NextResponse.json(
        { error: '도시 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const city = await City.findOneAndUpdate(
      { id: cityId },
      updateData,
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: '도시 정보가 업데이트되었습니다.',
      data: {
        id: city.id,
        name: city.name,
        imageUrl: city.imageUrl || '',
        isActive: city.isActive,
      },
    });
  } catch (error) {
    console.error('도시 정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '도시 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
