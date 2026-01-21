import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST: 이미지 업로드
export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Next.js FormData 타입 이슈
    const formData: any = await request.formData();
    const fileEntry = formData.get('file');
    const file = fileEntry && typeof fileEntry !== 'string' ? fileEntry as File : null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    // 업로드 디렉토리 경로 (public/uploads/banners)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'banners');
    
    // 디렉토리가 없으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일 저장
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL 반환 (절대 경로)
    const fileUrl = `/uploads/banners/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: '이미지가 업로드되었습니다.',
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
