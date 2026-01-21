import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// 로그 스키마 (임시 - 추후 모델로 분리 가능)
const LogSchema = new mongoose.Schema({
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], required: true },
  category: { type: String, enum: ['system', 'user', 'payment', 'booking', 'security'], required: true },
  message: { type: String, required: true },
  userId: { type: String },
  userName: { type: String },
  ipAddress: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

LogSchema.index({ createdAt: -1 });
LogSchema.index({ type: 1, category: 1 });

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

// GET: 로그 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '500');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    const filter: any = {};
    if (type) filter.type = type;
    if (category) filter.category = category;

    const logs = await Log.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      type: log.type,
      category: log.category,
      message: log.message,
      userId: log.userId,
      userName: log.userName,
      ipAddress: log.ipAddress,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
    });
  } catch (error) {
    console.error('로그 조회 오류:', error);
    return NextResponse.json(
      { error: '로그 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
