export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 이미지 업로드 API
 * POST /api/upload/image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as any;
    const fileEntry = formData.get('image');
    const typeEntry = formData.get('type');
    
    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const file = fileEntry;
    const type = (typeEntry && typeof typeEntry === 'string') ? typeEntry : 'general';

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 체크 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${type}-${timestamp}-${randomStr}.${ext}`;

    // 업로드 디렉토리 설정
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    const filepath = join(uploadDir, filename);

    // 디렉토리 생성 (없으면)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL 반환 (public 폴더 기준)
    const url = `/uploads/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      url: url,
      imageUrl: url, // 호환성을 위해
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '이미지 업로드에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
