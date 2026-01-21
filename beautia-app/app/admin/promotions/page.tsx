'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Search, Loader2, Tag, Percent, Calendar, Users, TrendingUp, Trash2, Plus } from 'lucide-react';

export default function AdminPromotionsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    shopId: '',
    title: '',
    description: '',
    type: 'discount' as 'discount' | 'flash_sale' | 'package' | 'coupon',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    code: '',
    isGlobal: false, // 전역 쿠폰 여부
  });
  const [createdCouponCode, setCreatedCouponCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
    fetchShops();
  }, [statusFilter, typeFilter, searchQuery]);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/admin/shops');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShops(data.data || []);
        }
      }
    } catch (error) {
      console.error('샵 목록 로드 오류:', error);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const url = `/api/admin/promotions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const promotionsData = data.data || [];
          // 디버깅: 쿠폰 코드 확인
          console.log('프로모션 목록:', promotionsData.map((p: any) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            code: p.code,
          })));
          setPromotions(promotionsData);
        }
      }
    } catch (error) {
      console.error('프로모션 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionAction = async (action: 'activate' | 'deactivate' | 'delete', promotionId: string) => {
    if (action === 'delete') {
      if (!confirm('이 프로모션을 삭제하시겠습니까?')) return;
    } else {
      const confirmMsg = action === 'activate' ? '이 프로모션을 활성화하시겠습니까?' : '이 프로모션을 비활성화하시겠습니까?';
      if (!confirm(confirmMsg)) return;
    }

    setProcessingId(promotionId);
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/admin/promotions?id=${promotionId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert('프로모션이 삭제되었습니다.');
            fetchPromotions();
          } else {
            throw new Error(data.error || '삭제에 실패했습니다.');
          }
        } else {
          const data = await response.json();
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
      } else {
        const response = await fetch('/api/admin/promotions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promotionId,
            isActive: action === 'activate',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert(data.message || `프로모션이 ${action === 'activate' ? '활성화' : '비활성화'}되었습니다.`);
            fetchPromotions();
          } else {
            throw new Error(data.error || '처리에 실패했습니다.');
          }
        } else {
          const data = await response.json();
          throw new Error(data.error || '처리에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('프로모션 처리 오류:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = (promotion: any) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  const generateCouponCode = () => {
    // 랜덤 쿠폰 코드 생성 (예: BEAUTIA-XXXX)
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BEAUTIA-${randomPart}`;
  };

  const handleCreatePromotion = async () => {
    // 유효성 검사
    if (!promotionForm.title || !promotionForm.description || 
        !promotionForm.discountValue || !promotionForm.startDate || !promotionForm.endDate) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }

    // shopId 검증: 전역 쿠폰이 아니고 all도 아니면 shopId 필요
    if (!promotionForm.isGlobal && promotionForm.shopId !== 'all' && !promotionForm.shopId) {
      alert('샵을 선택하거나 전역 쿠폰을 선택해주세요.');
      return;
    }

    // 쿠폰 코드 처리: 사용자가 입력한 코드를 사용하거나, 쿠폰 타입이고 비어있으면 자동 생성
    let couponCode = promotionForm.code.trim(); // 앞뒤 공백 제거
    
    // 쿠폰 타입일 때 코드가 없으면 자동 생성
    if (promotionForm.type === 'coupon' && !couponCode) {
      couponCode = generateCouponCode();
    }
    
    // 사용자가 입력한 코드가 있으면 그대로 사용 (쿠폰 타입이 아니어도 가능)

    setIsCreating(true);
    try {
      const basePromotionData = {
        title: promotionForm.title,
        description: promotionForm.description,
        type: promotionForm.type,
        discountType: promotionForm.discountType,
        discountValue: Number(promotionForm.discountValue),
        startDate: promotionForm.startDate,
        endDate: promotionForm.endDate,
        isActive: promotionForm.isActive,
        minPurchaseAmount: promotionForm.minPurchaseAmount ? Number(promotionForm.minPurchaseAmount) : undefined,
        maxDiscountAmount: promotionForm.maxDiscountAmount ? Number(promotionForm.maxDiscountAmount) : undefined,
        usageLimit: promotionForm.usageLimit ? Number(promotionForm.usageLimit) : undefined,
        code: couponCode || undefined,
      };

      if (promotionForm.isGlobal) {
        // 전역 쿠폰 생성 (어떤 샵에서도 사용 가능)
        const response = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePromotionData,
            // shopId를 보내지 않으면 전역 쿠폰
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (promotionForm.type === 'coupon' && data.data.code) {
              setCreatedCouponCode(data.data.code);
              // 모달은 닫지 않고 쿠폰 코드 표시
            } else {
              alert('전역 쿠폰이 생성되었습니다!');
              setShowCreateModal(false);
            }
            setPromotionForm({
              shopId: '',
              title: '',
              description: '',
              type: 'discount',
              discountType: 'percentage',
              discountValue: '',
              startDate: '',
              endDate: '',
              isActive: true,
              minPurchaseAmount: '',
              maxDiscountAmount: '',
              usageLimit: '',
              code: '',
              isGlobal: false,
            });
            fetchPromotions();
          } else {
            throw new Error(data.error || '생성에 실패했습니다.');
          }
        } else {
          const data = await response.json();
          throw new Error(data.error || '생성에 실패했습니다.');
        }
      } else if (promotionForm.shopId === 'all') {
        // 전체 샵에 프로모션 생성
        if (shops.length === 0) {
          alert('샵이 없습니다.');
          setIsCreating(false);
          return;
        }

        // 모든 샵에 대해 프로모션 생성
        const createPromotions = shops.map(async (shop) => {
          const response = await fetch('/api/admin/promotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...basePromotionData,
              shopId: shop.id,
            }),
          });

          return response.json();
        });

        const results = await Promise.all(createPromotions);
        const successCount = results.filter(r => r.success).length;

          if (successCount === shops.length) {
          if (promotionForm.type === 'coupon') {
            alert(`모든 샵(${successCount}개)에 쿠폰이 생성되었습니다!\n각 샵별로 다른 쿠폰 코드가 생성되었습니다.`);
          } else {
            alert(`모든 샵(${successCount}개)에 프로모션이 생성되었습니다!`);
          }
          setShowCreateModal(false);
          setPromotionForm({
            shopId: '',
            title: '',
            description: '',
            type: 'discount',
            discountType: 'percentage',
            discountValue: '',
            startDate: '',
            endDate: '',
            isActive: true,
            minPurchaseAmount: '',
            maxDiscountAmount: '',
            usageLimit: '',
            code: '',
            isGlobal: false,
          });
          fetchPromotions();
        } else {
          alert(`${successCount}/${shops.length}개 샵에 프로모션이 생성되었습니다.`);
        }
      } else {
        // 특정 샵에 프로모션 생성
        const response = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePromotionData,
            shopId: promotionForm.shopId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (promotionForm.type === 'coupon' && data.data.code) {
              setCreatedCouponCode(data.data.code);
              // 모달은 닫지 않고 쿠폰 코드 표시, 폼은 초기화하지 않음
            } else {
              alert('프로모션이 생성되었습니다.');
              setShowCreateModal(false);
              setPromotionForm({
                shopId: '',
                title: '',
                description: '',
                type: 'discount',
                discountType: 'percentage',
                discountValue: '',
                startDate: '',
                endDate: '',
                isActive: true,
                minPurchaseAmount: '',
                maxDiscountAmount: '',
                usageLimit: '',
                code: '',
                isGlobal: false,
              });
            }
            fetchPromotions();
          } else {
            throw new Error(data.error || '생성에 실패했습니다.');
          }
        } else {
          const data = await response.json();
          throw new Error(data.error || '생성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('프로모션 생성 오류:', error);
      alert(error instanceof Error ? error.message : '프로모션 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const typeLabels: { [key: string]: string } = {
    discount: '할인',
    flash_sale: '플래시 세일',
    package: '패키지',
    coupon: '쿠폰',
  };

  const statusLabels: { [key: string]: string } = {
    active: '진행 중',
    inactive: '비활성',
    expired: '만료됨',
  };

  // 통계 계산
  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.status === 'active').length,
    inactive: promotions.filter((p) => p.status === 'inactive').length,
    expired: promotions.filter((p) => p.status === 'expired').length,
    totalUsed: promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">프로모션 관리</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            프로모션 생성
          </button>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-medium">
            총 프로모션: <span className="font-bold text-blue-600">{stats.total}개</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-medium">
            진행 중: <span className="font-bold text-green-600">{stats.active}개</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-medium">
            총 사용: <span className="font-bold text-purple-600">{stats.totalUsed.toLocaleString()}회</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="파트너명, 샵명, 제목, 코드 검색"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
          >
            <option value="all">전체 상태</option>
            <option value="active">진행 중</option>
            <option value="inactive">비활성</option>
            <option value="expired">만료됨</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
          >
            <option value="all">전체 타입</option>
            <option value="discount">할인</option>
            <option value="flash_sale">플래시 세일</option>
            <option value="package">패키지</option>
            <option value="coupon">쿠폰</option>
          </select>
        </div>

        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">생성일</th>
              <th className="px-6 py-3">파트너</th>
              <th className="px-6 py-3">샵</th>
              <th className="px-6 py-3">프로모션</th>
              <th className="px-6 py-3">타입</th>
              <th className="px-6 py-3">할인</th>
              <th className="px-6 py-3">기간</th>
              <th className="px-6 py-3">사용/제한</th>
              <th className="px-6 py-3">상태</th>
              <th className="px-6 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다.' : '프로모션 내역이 없습니다.'}
                </td>
              </tr>
            ) : (
              promotions.map((promo) => {
                const period = promo.startDate && promo.endDate
                  ? `${new Date(promo.startDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${new Date(promo.endDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
                  : '-';

                const discountText = promo.discountType === 'percentage'
                  ? `${promo.discountValue}%`
                  : `${promo.discountValue.toLocaleString()}원`;

                return (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(promo.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 font-medium">{promo.partnerName || '-'}</td>
                    <td className="px-6 py-4">
                      {promo.isGlobal ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[11px] font-medium">
                          전역 쿠폰
                        </span>
                      ) : (
                        promo.shopName
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{promo.title}</div>
                      {promo.type === 'coupon' ? (
                        promo.code ? (
                          <div className="text-[11px] text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                            쿠폰 번호: <span className="font-bold text-blue-600">{promo.code}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-red-500 mt-1">쿠폰 번호 없음</div>
                        )
                      ) : promo.code ? (
                        <div className="text-[11px] text-gray-400 mt-1 font-mono">코드: {promo.code}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-[12px] font-medium">
                        {typeLabels[promo.type] || promo.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">{discountText}</td>
                    <td className="px-6 py-4 text-gray-500 text-[12px]">{period}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{promo.usedCount || 0}</span>
                        {promo.usageLimit && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{promo.usageLimit}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          promo.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : promo.status === 'expired'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {statusLabels[promo.status] || promo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {processingId === promo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline-block" />
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(promo)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {promo.status === 'active' ? (
                            <button
                              onClick={() => handlePromotionAction('deactivate', promo.id)}
                              className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                              title="비활성화"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : promo.status === 'inactive' ? (
                            <button
                              onClick={() => handlePromotionAction('activate', promo.id)}
                              className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                              title="활성화"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button
                            onClick={() => handlePromotionAction('delete', promo.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedPromotion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[20px] font-bold">프로모션 상세 정보</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold mb-3">기본 정보</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-gray-500">제목:</span>
                    <span className="ml-2 font-medium">{selectedPromotion.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">타입:</span>
                    <span className="ml-2 font-medium">{typeLabels[selectedPromotion.type] || selectedPromotion.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">파트너:</span>
                    <span className="ml-2 font-medium">{selectedPromotion.partnerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">샵:</span>
                    <span className="ml-2 font-medium">{selectedPromotion.shopName}</span>
                  </div>
                  {selectedPromotion.type === 'coupon' && selectedPromotion.code && (
                    <div className="col-span-2">
                      <span className="text-gray-500">쿠폰 번호:</span>
                      <div className="mt-1 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div className="text-[20px] font-mono font-bold text-blue-800">{selectedPromotion.code}</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPromotion.code!);
                            alert('쿠폰 번호가 복사되었습니다!');
                          }}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-[12px] font-medium hover:bg-blue-700"
                        >
                          복사
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedPromotion.type !== 'coupon' && selectedPromotion.code && (
                    <div>
                      <span className="text-gray-500">코드:</span>
                      <span className="ml-2 font-medium font-mono">{selectedPromotion.code}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">상태:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-[11px] font-bold ${
                        selectedPromotion.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedPromotion.status === 'expired'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {statusLabels[selectedPromotion.status] || selectedPromotion.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold mb-3">할인 정보</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-gray-500">할인 타입:</span>
                    <span className="ml-2 font-medium">
                      {selectedPromotion.discountType === 'percentage' ? '퍼센트' : '고정액'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">할인 금액:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {selectedPromotion.discountType === 'percentage'
                        ? `${selectedPromotion.discountValue}%`
                        : `${selectedPromotion.discountValue.toLocaleString()}원`}
                    </span>
                  </div>
                  {selectedPromotion.minPurchaseAmount && (
                    <div>
                      <span className="text-gray-500">최소 구매 금액:</span>
                      <span className="ml-2">{selectedPromotion.minPurchaseAmount.toLocaleString()}원</span>
                    </div>
                  )}
                  {selectedPromotion.maxDiscountAmount && (
                    <div>
                      <span className="text-gray-500">최대 할인 금액:</span>
                      <span className="ml-2">{selectedPromotion.maxDiscountAmount.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold mb-3">기간 및 사용</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-gray-500">시작일:</span>
                    <span className="ml-2">
                      {new Date(selectedPromotion.startDate).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">종료일:</span>
                    <span className="ml-2">
                      {new Date(selectedPromotion.endDate).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">사용 횟수:</span>
                    <span className="ml-2 font-medium">{selectedPromotion.usedCount || 0}회</span>
                  </div>
                  {selectedPromotion.usageLimit && (
                    <div>
                      <span className="text-gray-500">사용 제한:</span>
                      <span className="ml-2">{selectedPromotion.usageLimit}회</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedPromotion.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">설명</h4>
                  <p className="text-[13px] text-gray-700">{selectedPromotion.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프로모션 생성 모달 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCreateModal(false);
            setCreatedCouponCode(null);
          }}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[20px] font-bold">프로모션 생성</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedCouponCode(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 생성된 쿠폰 코드 표시 */}
            {createdCouponCode && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-green-800 mb-1">쿠폰이 생성되었습니다!</div>
                    <div className="text-[14px] text-green-700">쿠폰 코드를 고객에게 안내해주세요</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCouponCode);
                      alert('쿠폰 코드가 복사되었습니다!');
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded text-[12px] font-medium hover:bg-green-700"
                  >
                    복사
                  </button>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-green-300">
                  <div className="text-[11px] text-gray-600 mb-1">쿠폰 등록 번호</div>
                  <div className="text-[20px] font-mono font-bold text-green-800">{createdCouponCode}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium mb-1">적용 범위 *</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shopSelection"
                      checked={promotionForm.isGlobal}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPromotionForm({ ...promotionForm, isGlobal: true, shopId: '' });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-[13px]">전역 쿠폰 (어떤 샵에서도 사용 가능)</div>
                      <div className="text-[11px] text-gray-500">모든 샵에서 사용할 수 있는 쿠폰입니다</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shopSelection"
                      checked={!promotionForm.isGlobal && promotionForm.shopId === 'all'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPromotionForm({ ...promotionForm, isGlobal: false, shopId: 'all' });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-[13px]">전체 샵 ({shops.length}개)</div>
                      <div className="text-[11px] text-gray-500">모든 샵에 각각 프로모션이 생성됩니다</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shopSelection"
                      checked={!promotionForm.isGlobal && promotionForm.shopId !== '' && promotionForm.shopId !== 'all'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPromotionForm({ ...promotionForm, isGlobal: false });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[13px] mb-1">특정 샵 선택</div>
                      <select
                        value={promotionForm.shopId}
                        onChange={(e) => setPromotionForm({ ...promotionForm, shopId: e.target.value, isGlobal: false })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                        disabled={promotionForm.isGlobal || promotionForm.shopId === 'all'}
                      >
                        <option value="">샵을 선택하세요</option>
                        {shops.map((shop) => (
                          <option key={shop.id} value={shop.id}>
                            {shop.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1">제목 *</label>
                <input
                  type="text"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  placeholder="프로모션 제목"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1">설명 *</label>
                <textarea
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  placeholder="프로모션 설명"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1">타입 *</label>
                  <select
                    value={promotionForm.type}
                    onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="discount">할인</option>
                    <option value="flash_sale">플래시 세일</option>
                    <option value="package">패키지</option>
                    <option value="coupon">쿠폰</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">할인 타입 *</label>
                  <select
                    value={promotionForm.discountType}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="percentage">퍼센트 (%)</option>
                    <option value="fixed">고정액 (원)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1">할인 금액 *</label>
                <input
                  type="number"
                  value={promotionForm.discountValue}
                  onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  placeholder={promotionForm.discountType === 'percentage' ? '할인율 (예: 20)' : '할인 금액 (예: 10000)'}
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1">
                  쿠폰 코드 {promotionForm.type === 'coupon' && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promotionForm.code}
                    onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 font-mono"
                    placeholder={promotionForm.type === 'coupon' 
                      ? "쿠폰 코드를 입력하거나 비워두면 자동 생성됩니다 (예: BEAUTIA-XXXX)" 
                      : "쿠폰 코드를 입력할 수 있습니다 (선택사항)"}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = generateCouponCode();
                      setPromotionForm({ ...promotionForm, code });
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap"
                  >
                    자동 생성
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {promotionForm.type === 'coupon' 
                    ? "쿠폰 코드를 직접 입력하거나 '자동 생성' 버튼을 클릭하여 랜덤 코드를 생성할 수 있습니다. 비워두면 자동으로 생성됩니다."
                    : "프로모션 코드를 입력할 수 있습니다. 쿠폰 타입이 아닌 경우 선택사항입니다."}
                </p>
                {promotionForm.code && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-[12px]">
                    <div className="text-blue-800 font-medium">입력된 코드:</div>
                    <div className="text-blue-600 font-mono font-bold mt-1">{promotionForm.code}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1">시작일 *</label>
                  <input
                    type="datetime-local"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">종료일 *</label>
                  <input
                    type="datetime-local"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1">최소 구매 금액</label>
                  <input
                    type="number"
                    value={promotionForm.minPurchaseAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, minPurchaseAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    placeholder="선택사항"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">최대 할인 금액</label>
                  <input
                    type="number"
                    value={promotionForm.maxDiscountAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    placeholder="선택사항"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">사용 제한</label>
                  <input
                    type="number"
                    value={promotionForm.usageLimit}
                    onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    placeholder="선택사항"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={promotionForm.isActive}
                  onChange={(e) => setPromotionForm({ ...promotionForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-[13px]">
                  즉시 활성화
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedCouponCode(null);
                    setPromotionForm({
                      shopId: '',
                      title: '',
                      description: '',
                      type: 'discount',
                      discountType: 'percentage',
                      discountValue: '',
                      startDate: '',
                      endDate: '',
                      isActive: true,
                      minPurchaseAmount: '',
                      maxDiscountAmount: '',
                      usageLimit: '',
                      code: '',
                      isGlobal: false,
                    });
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium hover:bg-gray-50"
                >
                  {createdCouponCode ? '닫기' : '취소'}
                </button>
                {createdCouponCode ? (
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedCouponCode(null);
                      setPromotionForm({
                        shopId: '',
                        title: '',
                        description: '',
                        type: 'discount',
                        discountType: 'percentage',
                        discountValue: '',
                        startDate: '',
                        endDate: '',
                        isActive: true,
                        minPurchaseAmount: '',
                        maxDiscountAmount: '',
                        usageLimit: '',
                        code: '',
                        isGlobal: false,
                      });
                      fetchPromotions();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-[13px] font-medium hover:bg-green-700"
                  >
                    확인
                  </button>
                ) : (
                  <button
                    onClick={handleCreatePromotion}
                    disabled={isCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      '생성'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
