'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Trash2, Eye, Pin, AlertTriangle, MessageSquare, FileText, Users, RefreshCw, X, Heart, Clock } from 'lucide-react';

interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: 'question' | 'review' | 'tip' | 'free' | 'notice';
  images: string[];
  likes: number;
  views: number;
  commentCount: number;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  reportedCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  parentCommentId?: string;
  likes: number;
  isDeleted: boolean;
  deletedAt?: string;
  reportedCount: number;
  createdAt: string;
  replies?: Comment[];
}

interface PostDetail extends Post {
  comments: Comment[];
  totalComments: number;
}

const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'question', label: '질문' },
  { value: 'review', label: '후기' },
  { value: 'tip', label: '팁' },
  { value: 'free', label: '자유' },
  { value: 'notice', label: '공지' },
];

const STATUS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'deleted', label: '삭제됨' },
  { value: 'reported', label: '신고됨' },
];

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 상세보기 모달
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, categoryFilter, statusFilter, searchQuery, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);

        const response = await fetch(`/api/admin/community/posts?${params}`);
        const data = await response.json();

        if (data.success) {
          setPosts(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } else {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const response = await fetch(`/api/admin/community/comments?${params}`);
        const data = await response.json();

        if (data.success) {
          setComments(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'post' | 'comment') => {
    if (!confirm('정말로 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/community/${type === 'post' ? 'posts' : 'comments'}?id=${id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        alert('삭제되었습니다.');
        fetchData();
        // 상세보기 모달이 열려있고 삭제한 게시글이면 닫기
        if (selectedPostId === id) {
          setSelectedPostId(null);
          setPostDetail(null);
        }
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const viewPostDetail = async (postId: string) => {
    setSelectedPostId(postId);
    setLoadingDetail(true);
    setPostDetail(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/community/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPostDetail(data.data);
      } else {
        alert(data.error || '게시글을 불러올 수 없습니다.');
        setSelectedPostId(null);
      }
    } catch (error) {
      console.error('게시글 상세 조회 오류:', error);
      alert('게시글을 불러오는 중 오류가 발생했습니다.');
      setSelectedPostId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePostDetail = () => {
    setSelectedPostId(null);
    setPostDetail(null);
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">커뮤니티 관리</h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 새로고침
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('posts');
            setPage(1);
          }}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === 'posts'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          게시글 ({posts.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('comments');
            setPage(1);
          }}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === 'comments'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          댓글 ({comments.length})
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'posts' ? '게시글 제목, 내용, 작성자 검색' : '댓글 내용, 작성자 검색'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
          />
        </div>
        {activeTab === 'posts' && (
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
        >
          {STATUS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* 게시글 목록 */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-[50px]"><input type="checkbox" /></th>
                <th className="px-6 py-3">게시글</th>
                <th className="px-6 py-3">카테고리</th>
                <th className="px-6 py-3">작성자</th>
                <th className="px-6 py-3 text-center">조회수</th>
                <th className="px-6 py-3 text-center">댓글</th>
                <th className="px-6 py-3 text-center">신고</th>
                <th className="px-6 py-3">작성일</th>
                <th className="px-6 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className={`hover:bg-gray-50 transition-colors ${post.isDeleted ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4"><input type="checkbox" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {post.isPinned && <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        <div className="flex-1 cursor-pointer" onClick={() => viewPostDetail(post.id)}>
                          <div className="font-bold text-[14px] hover:text-blue-600">{post.title}</div>
                          <div className="text-[11px] text-gray-400 line-clamp-1">{post.content}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
                        {getCategoryLabel(post.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{post.userName}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {post.views}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{post.commentCount}</td>
                    <td className="px-6 py-4 text-center">
                      {post.reportedCount > 0 && (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-red-100 text-red-700 flex items-center gap-1 justify-center">
                          <AlertTriangle className="w-3 h-3" />
                          {post.reportedCount}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(post.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewPostDetail(post.id)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, 'post')}
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-[13px] text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 댓글 목록 */}
      {activeTab === 'comments' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-[50px]"><input type="checkbox" /></th>
                <th className="px-6 py-3">댓글 내용</th>
                <th className="px-6 py-3">작성자</th>
                <th className="px-6 py-3">게시글 ID</th>
                <th className="px-6 py-3 text-center">좋아요</th>
                <th className="px-6 py-3 text-center">신고</th>
                <th className="px-6 py-3">작성일</th>
                <th className="px-6 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    댓글이 없습니다.
                  </td>
                </tr>
              ) : (
                comments.map((comment) => (
                  <tr key={comment.id} className={`hover:bg-gray-50 transition-colors ${comment.isDeleted ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4"><input type="checkbox" /></td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        {comment.parentCommentId && (
                          <span className="text-[11px] text-gray-400 mr-2">↳ 답글</span>
                        )}
                        <div className="line-clamp-2">{comment.content}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{comment.userName}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">{comment.postId.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-center">{comment.likes}</td>
                    <td className="px-6 py-4 text-center">
                      {comment.reportedCount > 0 && (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-red-100 text-red-700 flex items-center gap-1 justify-center">
                          <AlertTriangle className="w-3 h-3" />
                          {comment.reportedCount}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(comment.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(comment.id, 'comment')}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-[13px] text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 게시글 상세보기 모달 */}
      {selectedPostId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[20px] font-bold">게시글 상세보기</h3>
              <button
                onClick={closePostDetail}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="text-center py-12 text-gray-500">
                  로딩 중...
                </div>
              ) : postDetail ? (
                <div className="space-y-6">
                  {/* 게시글 정보 */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {postDetail.isPinned && (
                            <Pin className="w-5 h-5 text-yellow-500" />
                          )}
                          <h2 className="text-[24px] font-bold">{postDetail.title}</h2>
                        </div>
                        <div className="flex items-center gap-4 text-[13px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {getCategoryLabel(postDetail.category)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {postDetail.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(postDetail.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {postDetail.reportedCount > 0 && (
                          <span className="px-3 py-1 rounded-lg text-[12px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            신고 {postDetail.reportedCount}건
                          </span>
                        )}
                        {postDetail.isDeleted && (
                          <span className="px-3 py-1 rounded-lg text-[12px] font-bold bg-gray-100 text-gray-700">
                            삭제됨
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 이미지 */}
                    {postDetail.images && postDetail.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {postDetail.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`이미지 ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                      </div>
                    )}

                    {/* 본문 */}
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-[14px] leading-relaxed">
                        {postDetail.content}
                      </div>
                    </div>

                    {/* 태그 */}
                    {postDetail.tags && postDetail.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {postDetail.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[12px]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 통계 */}
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span className="text-[13px]">조회수 {postDetail.views}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Heart className="w-4 h-4" />
                        <span className="text-[13px]">좋아요 {postDetail.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[13px]">댓글 {postDetail.commentCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* 댓글 목록 */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-[18px] font-bold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      댓글 ({postDetail.totalComments})
                    </h4>
                    {postDetail.comments && postDetail.comments.length > 0 ? (
                      <div className="space-y-4">
                        {postDetail.comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            {/* 댓글 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[14px]">{comment.userName}</span>
                                  <span className="text-[11px] text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {comment.reportedCount > 0 && (
                                    <span className="px-2 py-1 rounded text-[11px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {comment.reportedCount}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Heart className="w-4 h-4" />
                                    <span className="text-[12px]">{comment.likes}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-[13px] leading-relaxed">{comment.content}</div>
                            </div>

                            {/* 대댓글 */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-6 space-y-2 mt-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="bg-gray-100 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-[13px]">{reply.userName}</span>
                                        <span className="text-[11px] text-gray-500">{formatDate(reply.createdAt)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {reply.reportedCount > 0 && (
                                          <span className="px-2 py-1 rounded text-[11px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {reply.reportedCount}
                                          </span>
                                        )}
                                        <div className="flex items-center gap-1 text-gray-500">
                                          <Heart className="w-4 h-4" />
                                          <span className="text-[12px]">{reply.likes}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-[13px] leading-relaxed">{reply.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-[13px]">
                        댓글이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  게시글을 불러올 수 없습니다.
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={closePostDetail}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
              >
                닫기
              </button>
              {postDetail && (
                <button
                  onClick={() => {
                    if (confirm('정말로 삭제하시겠습니까?')) {
                      handleDelete(postDetail.id, 'post');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
