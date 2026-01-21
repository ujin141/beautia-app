import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { withGetHandler, withDeleteHandler } from '@/lib/api-handler';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';
import CommunityComment from '@/models/CommunityComment';

export const runtime = 'nodejs';

/**
 * GET: 커뮤니티 게시글 목록 조회
 */
async function handleGet(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const status = searchParams.get('status'); // all, active, deleted, reported
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (category) {
    filter.category = category;
  }

  if (status === 'deleted') {
    filter.isDeleted = true;
  } else if (status === 'active') {
    filter.isDeleted = false;
  } else if (status === 'reported') {
    filter.reportedCount = { $gt: 0 };
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
    ];
  }

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityPost.countDocuments(filter),
  ]);

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
    isDeleted: post.isDeleted || false,
    deletedAt: post.deletedAt,
    reportedCount: post.reportedCount || 0,
    tags: post.tags || [],
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * DELETE: 커뮤니티 게시글 삭제
 */
async function handleDelete(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: '게시글 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const post = await CommunityPost.findById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시글 삭제 (소프트 삭제)
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    // 관련 댓글도 삭제
    await CommunityComment.updateMany(
      { postId: id },
      { isDeleted: true, deletedAt: new Date() }
    );

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(withGetHandler(handleGet));
export const DELETE = withAdminAuth(withDeleteHandler(handleDelete));
