import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, removeAdminToken } from '@/lib/admin-token-verifier';

// POST: 어드민 로그아웃
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 토큰 검증
    const verification = await verifyAdminToken(token);
    if (!verification.valid) {
      // 토큰이 이미 유효하지 않더라도 로그아웃은 성공으로 처리
      return NextResponse.json({
        success: true,
        message: '로그아웃되었습니다.',
      });
    }

    // 토큰 제거
    await removeAdminToken(token);

    return NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  } catch (error) {
    console.error('어드민 로그아웃 오류:', error);
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
