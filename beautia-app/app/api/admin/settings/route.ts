import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// 시스템 설정 스키마
const SystemSettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  ipRestriction: { type: Boolean, default: true },
  allowedIPs: { type: [String], default: [] },
}, { timestamps: true });

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);

// GET: 시스템 설정 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    let settings = await SystemSettings.findOne({}).lean();
    
    if (!settings) {
      // 기본 설정 생성
      const defaultSettings = new SystemSettings({
        maintenanceMode: false,
        ipRestriction: true,
        allowedIPs: [],
      });
      await defaultSettings.save();
      settings = defaultSettings.toObject();
    }

    return NextResponse.json({
      success: true,
      data: {
        maintenanceMode: settings.maintenanceMode,
        ipRestriction: settings.ipRestriction,
        allowedIPs: settings.allowedIPs || [],
      },
    });
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '시스템 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 시스템 설정 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { maintenanceMode, ipRestriction, allowedIPs } = body;

    let settings = await SystemSettings.findOne({});
    
    if (!settings) {
      settings = new SystemSettings({});
    }

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (ipRestriction !== undefined) settings.ipRestriction = ipRestriction;
    if (allowedIPs !== undefined) settings.allowedIPs = allowedIPs;

    await settings.save();

    return NextResponse.json({
      success: true,
      message: '시스템 설정이 업데이트되었습니다.',
      data: {
        maintenanceMode: settings.maintenanceMode,
        ipRestriction: settings.ipRestriction,
        allowedIPs: settings.allowedIPs,
      },
    });
  } catch (error) {
    console.error('시스템 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '시스템 설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
