export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityComment from '@/models/CommunityComment';
import CommunityPost from '@/models/CommunityPost';

/**
 * 게시물의 댓글 목록 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const params = await Promise.resolve(context.params);
    const postId = params.id;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    
    // 댓글 조회 (부모 댓글만, 삭제되지 않은 것만)
    const comments = await CommunityComment.find({
      postId: postId,
      parentCommentId: null, // 댓글만 (대댓글 제외)
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
    
    // 각 댓글의 대댓글 조회
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await CommunityComment.find({
          parentCommentId: comment._id.toString(),
          isDeleted: false,
        })
          .sort({ createdAt: 1 })
          .lean();
        
        return {
          id: comment._id.toString(),
          postId: comment.postId,
          userId: comment.userId,
          userName: comment.userName,
          content: comment.content,
          likes: comment.likes || 0,
          replies: replies.map((reply: any) => ({
            id: reply._id.toString(),
            postId: reply.postId,
            userId: reply.userId,
            userName: reply.userName,
            content: reply.content,
            likes: reply.likes || 0,
            parentCommentId: reply.parentCommentId,
            createdAt: reply.createdAt ? new Date(reply.createdAt).toISOString() : new Date().toISOString(),
          })),
          replyCount: replies.length,
          createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString(),
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: commentsWithReplies,
      meta: {
        total: comments.length,
        limit: limit,
        offset: offset,
      },
    });
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: '댓글 목록을 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
