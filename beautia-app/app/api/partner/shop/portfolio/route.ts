// 파트너 샵 포트폴리오 이미지 업로드 및 관리 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

// POST: 포트폴리오 이미지 업로드
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // @ts-ignore - Next.js FormData 타입 이슈
    const formData: any = await request.formData();
    const fileEntry = formData.get('file');
    const file = fileEntry && typeof fileEntry !== 'string' ? fileEntry as File : null;
    const imageIndex = (formData.get('index') || '') as string; // 교체할 인덱스 (선택사항)

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파트너의 샵 찾기
    const shop = await Shop.findOne({ 
      partnerId: new mongoose.Types.ObjectId(verification.partnerId) 
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: '샵을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'portfolios');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${shop._id}_${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/portfolios/${fileName}`;

    // Shop 모델 업데이트
    if (!shop.portfolioImages) {
      shop.portfolioImages = [];
    }
    
    if (imageIndex !== null && imageIndex !== undefined) {
      // 특정 인덱스 교체
      const index = parseInt(imageIndex);
      if (index >= 0 && index < shop.portfolioImages.length) {
        shop.portfolioImages[index] = publicUrl;
      } else {
        shop.portfolioImages.push(publicUrl);
      }
    } else {
      // 새 이미지 추가
      shop.portfolioImages.push(publicUrl);
    }

    await shop.save();

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        portfolioImages: shop.portfolioImages,
      },
    });
  } catch (error: any) {
    console.error('포트폴리오 이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 포트폴리오 이미지 삭제
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const verification = await verifyPartnerToken(token);
    if (!verification.valid || !verification.partnerId) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const imageIndex = searchParams.get('index');

    if (!imageUrl && imageIndex === null) {
      return NextResponse.json(
        { success: false, error: '삭제할 이미지 URL 또는 인덱스가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파트너의 샵 찾기
    const shop = await Shop.findOne({ 
      partnerId: new mongoose.Types.ObjectId(verification.partnerId) 
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: '샵을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!shop.portfolioImages || shop.portfolioImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 이미지가 없습니다.' },
        { status: 404 }
      );
    }

    // 이미지 제거
    if (imageIndex !== null) {
      const index = parseInt(imageIndex);
      if (index >= 0 && index < shop.portfolioImages.length) {
        shop.portfolioImages.splice(index, 1);
      }
    } else if (imageUrl) {
      shop.portfolioImages = shop.portfolioImages.filter((url: string) => url !== imageUrl);
    }

    await shop.save();

    return NextResponse.json({
      success: true,
      data: {
        portfolioImages: shop.portfolioImages,
      },
    });
  } catch (error: any) {
    console.error('포트폴리오 이미지 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
