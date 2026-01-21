import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';
import CommunityComment from '@/models/CommunityComment';

export const runtime = 'nodejs';

/**
 * GET: 커뮤니티 게시글 상세 정보 조회 (댓글 포함)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const auth = await verifyAdminAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: auth.error || '인증에 실패했습니다.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    await connectDB();

    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    console.log('게시글 상세 조회 시작:', id);

    // 게시글 찾기
    const post = await CommunityPost.findById(id).lean();

    if (!post) {
      console.log('게시글을 찾을 수 없음:', id);
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('게시글 찾음:', post._id.toString());

    const postId = post._id.toString();

    // 관련 댓글 조회 (최근 100개, 삭제되지 않은 것만)
    const comments = await CommunityComment.find({
      postId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
      ],
    })
      .sort({ createdAt: 1 }) // 최신순
      .limit(100)
      .lean();

    // 댓글을 부모-자식 구조로 정리
    const commentsByParent: Record<string, any[]> = {};
    const rootComments: any[] = [];
    const commentMap: Record<string, any> = {}; // 모든 댓글을 ID로 매핑

    // 먼저 모든 댓글을 맵에 저장
    comments.forEach((comment: any) => {
      const commentId = comment._id.toString();
      commentMap[commentId] = {
        id: commentId,
        postId: comment.postId,
        userId: comment.userId,
        userName: comment.userName,
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        likes: comment.likes || 0,
        isDeleted: comment.isDeleted || false,
        reportedCount: comment.reportedCount || 0,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      };
    });

    // 댓글을 부모-자식 관계로 분류
    Object.values(commentMap).forEach((comment: any) => {
      if (comment.parentCommentId && commentMap[comment.parentCommentId]) {
        // 대댓글인 경우
        if (!commentsByParent[comment.parentCommentId]) {
          commentsByParent[comment.parentCommentId] = [];
        }
        commentsByParent[comment.parentCommentId].push(comment);
      } else {
        // 부모 댓글인 경우
        rootComments.push(comment);
      }
    });

    // 대댓글을 부모 댓글에 추가
    const commentsWithReplies = rootComments.map(comment => ({
      ...comment,
      replies: (commentsByParent[comment.id] || []).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }));

    return NextResponse.json({
      success: true,
      data: {
        post: {
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
          isDeleted: post.isDeleted || false,
          deletedAt: post.deletedAt,
          reportedCount: post.reportedCount || 0,
          tags: post.tags || [],
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
        comments: commentsWithReplies,
        totalComments: comments.length,
      },
    });
  } catch (error: any) {
    console.error('게시글 상세 조회 오류:', error);
    console.error('에러 스택:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || '게시글 상세 정보 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
