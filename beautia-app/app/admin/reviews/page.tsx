'use client';

import React, { useState, useEffect } from 'react';
import { Star, Trash2, Search, Filter, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Review {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reply?: string;
  replyDate?: string;
}

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.data || []);
        }
      }
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('리뷰가 삭제되었습니다.');
          fetchReviews();
          setShowDeleteModal(false);
          setSelectedReview(null);
        } else {
          throw new Error(data.error || '리뷰 삭제에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '리뷰 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!review.shopName.toLowerCase().includes(query) &&
          !review.userName.toLowerCase().includes(query) &&
          !review.content.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) {
      return false;
    }
    if (sentimentFilter !== 'all' && review.sentiment !== sentimentFilter) {
      return false;
    }
    return true;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">리뷰 관리</h2>
        <div className="text-[13px] text-gray-500">
          총 {filteredReviews.length}건
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="매장명, 사용자명, 리뷰 내용 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            <option value="all">전체 평점</option>
            <option value="5">5점</option>
            <option value="4">4점</option>
            <option value="3">3점</option>
            <option value="2">2점</option>
            <option value="1">1점</option>
          </select>
          <select 
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            <option value="all">전체 감정</option>
            <option value="positive">긍정</option>
            <option value="neutral">중립</option>
            <option value="negative">부정</option>
          </select>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">리뷰가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-bold text-[15px]">{review.shopName}</div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getSentimentColor(review.sentiment)}`}>
                        {review.sentiment === 'positive' ? '긍정' : review.sentiment === 'negative' ? '부정' : '중립'}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-500 mb-2">
                      {review.userName} · {review.date}
                    </div>
                    <p className="text-[14px] text-gray-700 mb-3">{review.content}</p>
                    {review.reply && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                        <div className="text-[12px] font-bold text-blue-700 mb-1">파트너 답글</div>
                        <p className="text-[13px] text-blue-900">{review.reply}</p>
                        {review.replyDate && (
                          <div className="text-[11px] text-blue-600 mt-1">{review.replyDate}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="리뷰 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
          setShowDeleteModal(false);
          setSelectedReview(null);
        }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-[18px] font-bold">리뷰 삭제</h3>
            </div>
            <p className="text-[14px] text-gray-600 mb-6">
              이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="text-[12px] text-gray-500 mb-1">매장: {selectedReview.shopName}</div>
              <div className="text-[12px] text-gray-500 mb-2">작성자: {selectedReview.userName}</div>
              <p className="text-[13px] text-gray-700">{selectedReview.content}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedReview(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(selectedReview.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-[13px] font-bold hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
