import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';

// POST: 파트너 신청 제출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.name || !body.phone || !body.email || !body.shopName || !body.category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    await connectDB();

    // 새 신청서 생성
    const application = new PartnerApplication({
      name: body.name,
      phone: body.phone,
      email: body.email,
      shopName: body.shopName,
      address: body.address || '',
      category: body.category,
      shopImages: body.shopImages || [], // 가게 사진 URL 배열
      status: 'pending',
    });

    await application.save();

    return NextResponse.json(
      { 
        success: true, 
        message: '신청이 성공적으로 제출되었습니다.',
        id: application._id.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('파트너 신청 저장 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    
    // MongoDB 연결 오류인지 확인
    const isMongoError = errorMessage.includes('MongoDB') || 
                        errorMessage.includes('connection') || 
                        errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('MongooseError');
    
    return NextResponse.json(
      { 
        error: isMongoError 
          ? '데이터베이스 연결에 실패했습니다. MongoDB 서버가 실행 중인지 확인해주세요.' 
          : '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
