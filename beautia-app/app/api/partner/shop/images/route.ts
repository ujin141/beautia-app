// 파트너 샵 이미지 업로드 및 관리 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

// POST: 이미지 업로드
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
    const imageType = (formData.get('type') || '') as string; // 'thumbnail' or 'gallery'
    const imageIndex = (formData.get('index') || '') as string; // 갤러리 이미지 인덱스 (선택사항)

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
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'shops');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${shop._id}_${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/shops/${fileName}`;

    // Shop 모델 업데이트
    if (imageType === 'thumbnail') {
      // 썸네일은 첫 번째 이미지로 설정
      if (!shop.imageUrls || shop.imageUrls.length === 0) {
        shop.imageUrls = [publicUrl];
      } else {
        shop.imageUrls[0] = publicUrl;
      }
    } else if (imageType === 'gallery') {
      // 갤러리 이미지 추가 또는 교체
      if (!shop.imageUrls) {
        shop.imageUrls = [];
      }
      
      if (imageIndex !== null && imageIndex !== undefined) {
        // 특정 인덱스 교체
        const index = parseInt(imageIndex);
        if (index >= 0 && index < shop.imageUrls.length) {
          shop.imageUrls[index] = publicUrl;
        } else {
          shop.imageUrls.push(publicUrl);
        }
      } else {
        // 새 이미지 추가
        shop.imageUrls.push(publicUrl);
      }
    } else {
      // 기본적으로 갤러리에 추가
      if (!shop.imageUrls) {
        shop.imageUrls = [];
      }
      shop.imageUrls.push(publicUrl);
    }

    await shop.save();

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        imageUrls: shop.imageUrls,
      },
    });
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 이미지 삭제
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

    if (!shop.imageUrls || shop.imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 이미지가 없습니다.' },
        { status: 404 }
      );
    }

    // 이미지 제거
    if (imageIndex !== null) {
      // 인덱스로 삭제
      const index = parseInt(imageIndex);
      if (index >= 0 && index < shop.imageUrls.length) {
        shop.imageUrls.splice(index, 1);
      }
    } else if (imageUrl) {
      // URL로 삭제
      shop.imageUrls = shop.imageUrls.filter((url: string) => url !== imageUrl);
    }

    await shop.save();

    return NextResponse.json({
      success: true,
      data: {
        imageUrls: shop.imageUrls,
      },
    });
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 이미지 순서 변경
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { imageUrls } = body;

    if (!Array.isArray(imageUrls)) {
      return NextResponse.json(
        { success: false, error: '이미지 URL 배열이 필요합니다.' },
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

    shop.imageUrls = imageUrls;
    await shop.save();

    return NextResponse.json({
      success: true,
      data: {
        imageUrls: shop.imageUrls,
      },
    });
  } catch (error: any) {
    console.error('이미지 순서 변경 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
