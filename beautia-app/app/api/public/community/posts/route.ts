export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';

/**
 * 커뮤니티 게시물 목록 조회 (공개 API)
 * - 인기순, 최신순 정렬 지원
 * - 카테고리 필터 지원
 * - 페이지네이션 지원
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'latest'; // 'latest', 'popular', 'trending'
    const category = searchParams.get('category'); // 'question', 'review', 'tip', 'free', 'notice'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search'); // 검색어
    const userId = searchParams.get('userId'); // 사용자 ID로 필터링
    
    // 필터 조건
    const filter: any = {
      isDeleted: false, // 삭제되지 않은 게시물만
    };
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    
    // 정렬 조건
    let sortCondition: any = {};
    switch (sort) {
      case 'popular':
        // 인기순: 좋아요 + 댓글 수 + 조회수 (최근 7일 내 생성)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filter.createdAt = { $gte: sevenDaysAgo };
        sortCondition = { likes: -1, commentCount: -1, views: -1, createdAt: -1 };
        break;
      case 'trending':
        // 트렌딩: 최근 3일 내, 좋아요 + 댓글 수 + 조회수
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        filter.createdAt = { $gte: threeDaysAgo };
        sortCondition = { likes: -1, commentCount: -1, views: -1, createdAt: -1 };
        break;
      case 'latest':
      default:
        // 최신순: 고정글 우선, 그 다음 최신순
        sortCondition = { isPinned: -1, createdAt: -1 };
        break;
    }
    
    // 총 개수 조회
    const totalCount = await CommunityPost.countDocuments(filter);
    
    // 게시물 조회
    const posts = await CommunityPost.find(filter)
      .sort(sortCondition)
      .skip(offset)
      .limit(limit)
      .lean();
    
    // 데이터 가공
    const formattedPosts = posts.map((post: any) => ({
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
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedPosts,
      meta: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
        sort: sort,
        category: category || 'all',
      },
    });
  } catch (error) {
    console.error('커뮤니티 게시물 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '게시물 목록을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
