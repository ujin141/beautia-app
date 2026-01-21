import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';
import mongoose from 'mongoose';

// 고객 알림 설정 스키마
const CustomerNotificationSettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  pushEnabled: { type: Boolean, default: true },
  marketingEnabled: { type: Boolean, default: false },
  bookingEnabled: { type: Boolean, default: true },
  chatEnabled: { type: Boolean, default: true },
  communityEnabled: { type: Boolean, default: true },
}, { timestamps: true });

const CustomerNotificationSettings = mongoose.models.CustomerNotificationSettings || 
  mongoose.model('CustomerNotificationSettings', CustomerNotificationSettingsSchema);

// GET: 고객 알림 설정 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    // 알림 설정 조회 (없으면 기본값 반환)
    let settings = await CustomerNotificationSettings.findOne({ userId: customerId }).lean();
    
    if (!settings) {
      // 기본 설정 생성
      settings = {
        userId: customerId,
        pushEnabled: true,
        marketingEnabled: false,
        bookingEnabled: true,
        chatEnabled: true,
        communityEnabled: true,
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        pushEnabled: settings.pushEnabled,
        marketingEnabled: settings.marketingEnabled,
        bookingEnabled: settings.bookingEnabled,
        chatEnabled: settings.chatEnabled,
        communityEnabled: settings.communityEnabled,
      },
    });
  } catch (error) {
    console.error('알림 설정 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '알림 설정을 조회하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH: 고객 알림 설정 업데이트
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { pushEnabled, marketingEnabled, bookingEnabled, chatEnabled, communityEnabled } = body;
    
    // 알림 설정 업데이트 (없으면 생성)
    const settings = await CustomerNotificationSettings.findOneAndUpdate(
      { userId: customerId },
      {
        $set: {
          ...(pushEnabled !== undefined && { pushEnabled }),
          ...(marketingEnabled !== undefined && { marketingEnabled }),
          ...(bookingEnabled !== undefined && { bookingEnabled }),
          ...(chatEnabled !== undefined && { chatEnabled }),
          ...(communityEnabled !== undefined && { communityEnabled }),
        },
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        pushEnabled: settings.pushEnabled,
        marketingEnabled: settings.marketingEnabled,
        bookingEnabled: settings.bookingEnabled,
        chatEnabled: settings.chatEnabled,
        communityEnabled: settings.communityEnabled,
      },
      message: '알림 설정이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('알림 설정 업데이트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '알림 설정을 업데이트하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
