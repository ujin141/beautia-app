export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';

/**
 * 커뮤니티 게시물 상세 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const params = await Promise.resolve(context.params);
    const postId = params.id;
    
    // 게시물 조회
    const post = await CommunityPost.findById(postId).lean();
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    if (post.isDeleted) {
      return NextResponse.json(
        { success: false, error: '삭제된 게시물입니다.' },
        { status: 404 }
      );
    }
    
    // 조회수 증가
    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { views: 1 },
    });
    
    // 데이터 가공
    const formattedPost = {
      id: post._id.toString(),
      userId: post.userId,
      userName: post.userName,
      title: post.title,
      content: post.content,
      category: post.category,
      images: post.images || [],
      likes: post.likes || 0,
      views: (post.views || 0) + 1, // 증가된 조회수
      commentCount: post.commentCount || 0,
      isPinned: post.isPinned || false,
      tags: post.tags || [],
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: formattedPost,
    });
  } catch (error) {
    console.error('게시물 상세 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '게시물을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
