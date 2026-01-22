export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';
import CustomerUser from '@/models/CustomerUser';

/**
 * POST: 커뮤니티 게시물 작성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 토큰 확인
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
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = customer.id;
    await connectDB();

    const body = await request.json();
    const { title, content, category, images, tags } = body;

    // 필수 필드 검증
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 선택해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 정보 조회
    const user = await CustomerUser.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시물 생성
    const post = new CommunityPost({
      userId: userId,
      userName: user.name || user.email || '익명',
      title: title.trim(),
      content: content.trim(),
      category: category,
      images: images || [],
      tags: tags || [],
      likes: 0,
      views: 0,
      commentCount: 0,
      isPinned: false,
      isDeleted: false,
    });

    await post.save();

    // 응답 데이터 포맷팅
    const formattedPost = {
      id: post._id.toString(),
      userId: post.userId,
      userName: post.userName,
      title: post.title,
      content: post.content,
      category: post.category,
      images: post.images || [],
      likes: post.likes || 0,
      views: post.views || 0,
      commentCount: post.commentCount || 0,
      isPinned: post.isPinned || false,
      tags: post.tags || [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: formattedPost,
      message: '게시물이 작성되었습니다.',
    });
  } catch (error) {
    console.error('게시물 작성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: '게시물 작성 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
