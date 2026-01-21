import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

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

// GET: 광고 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const adId = id;
    const ad = await Ad.findById(adId).lean();

    if (!ad) {
      return NextResponse.json(
        { error: '광고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ad._id.toString(),
        partnerId: ad.partnerId,
        partnerName: ad.partnerName,
        adType: ad.adType,
        adName: ad.adName,
        startDate: ad.startDate?.toISOString(),
        endDate: ad.endDate?.toISOString(),
        cost: ad.cost,
        status: ad.status,
        metadata: ad.metadata,
      },
    });
  } catch (error) {
    console.error('광고 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '광고 상세 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
