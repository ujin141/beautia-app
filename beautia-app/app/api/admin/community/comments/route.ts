import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { withGetHandler, withDeleteHandler } from '@/lib/api-handler';
import connectDB from '@/lib/mongodb';
import CommunityComment from '@/models/CommunityComment';

export const runtime = 'nodejs';

/**
 * GET: 커뮤니티 댓글 목록 조회
 */
async function handleGet(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get('postId');
  const status = searchParams.get('status'); // all, active, deleted, reported
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (postId) {
    filter.postId = postId;
  }

  if (status === 'deleted') {
    filter.isDeleted = true;
  } else if (status === 'active') {
    filter.isDeleted = false;
  } else if (status === 'reported') {
    filter.reportedCount = { $gt: 0 };
  }

  const [comments, total] = await Promise.all([
    CommunityComment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityComment.countDocuments(filter),
  ]);

  const formattedComments = comments.map((comment: any) => ({
    id: comment._id.toString(),
    postId: comment.postId,
    userId: comment.userId,
    userName: comment.userName,
    content: comment.content,
    parentCommentId: comment.parentCommentId,
    likes: comment.likes || 0,
    isDeleted: comment.isDeleted || false,
    deletedAt: comment.deletedAt,
    reportedCount: comment.reportedCount || 0,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data: formattedComments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * DELETE: 커뮤니티 댓글 삭제
 */
async function handleDelete(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: '댓글 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const comment = await CommunityComment.findById(id);

    if (!comment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 댓글 삭제 (소프트 삭제)
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // 게시글의 댓글 수 업데이트
    const CommunityPost = (await import('@/models/CommunityPost')).default;
    await CommunityPost.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -1 },
    });

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(withGetHandler(handleGet));
export const DELETE = withAdminAuth(withDeleteHandler(handleDelete));
