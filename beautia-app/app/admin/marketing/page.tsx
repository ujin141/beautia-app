'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Eye, TrendingUp, Search, Loader2, BarChart3, Users, DollarSign, MousePointerClick, TrendingDown, Clock, Trash2 } from 'lucide-react';
import { AdminApi } from '../../../lib/api';

export default function AdminMarketingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [timeDeals, setTimeDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'performance' | 'timedeals'>('list');
  const [overallStats, setOverallStats] = useState<any>(null);

  useEffect(() => {
    if (viewMode === 'timedeals') {
      fetchTimeDeals();
    } else if (viewMode === 'performance') {
      fetchOverallPerformance();
    } else {
      fetchAds();
    }
  }, [statusFilter, searchQuery, viewMode]);

  const fetchTimeDeals = async () => {
    setLoading(true);
    try {
      const deals = await AdminApi.getPromotions('flash_sale');
      setTimeDeals(deals || []);
    } catch (error) {
      console.error('타임 딜 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeDealAction = async (action: 'toggle' | 'delete', id: string, currentStatus?: boolean) => {
    if (action === 'delete' && !confirm('정말 삭제하시겠습니까?')) return;
    
    setProcessingId(id);
    try {
      if (action === 'toggle') {
        await AdminApi.updatePromotionStatus(id, !currentStatus);
      } else {
        await AdminApi.deletePromotion(id);
      }
      fetchTimeDeals();
    } catch (error) {
      console.error('타임 딜 처리 오류:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/marketing'
        : `/api/admin/marketing?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAds(data.data || []);
        }
      }
    } catch (error) {
      console.error('광고 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallPerformance = async () => {
    setPerformanceLoading(true);
    try {
      const response = await fetch('/api/admin/marketing/performance');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOverallStats(data.data);
        }
      }
    } catch (error) {
      console.error('성과 데이터 로드 오류:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchAdPerformance = async (adId: string) => {
    setPerformanceLoading(true);
    setSelectedAdId(adId);
    setShowPerformanceModal(true);
    try {
      const response = await fetch(`/api/admin/marketing/performance?adId=${adId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPerformanceData(data.data);
        }
      }
    } catch (error) {
      console.error('광고 성과 조회 오류:', error);
      alert('광고 성과를 불러오는데 실패했습니다.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleAdAction = async (action: 'approve' | 'reject' | 'view', adId: string) => {
    if (action === 'view') {
      try {
        const response = await fetch(`/api/admin/marketing/${adId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert(`광고 상세 정보:\n파트너: ${data.data.partnerName}\n광고명: ${data.data.adName}\n비용: ${data.data.cost} P`);
          }
        }
      } catch (error) {
        console.error('광고 상세 조회 오류:', error);
        alert('광고 정보를 불러오는데 실패했습니다.');
      }
      return;
    }

    const confirmMsg = action === 'approve' ? '이 광고를 승인하시겠습니까?' : '이 광고를 반려하시겠습니까?';
    if (!confirm(confirmMsg)) return;

    setProcessingId(adId);
    try {
      const response = await fetch('/api/admin/marketing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          status: action === 'approve' ? 'active' : 'rejected',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(action === 'approve' ? '광고가 승인되었습니다.' : '광고가 반려되었습니다.');
          fetchAds();
        } else {
          throw new Error(data.error || '처리에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('광고 처리 오류:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAds = ads.filter(ad => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!ad.partnerName?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const adTypeLabels: { [key: string]: string } = {
    main_banner: '메인 홈 배너',
    category_top: '검색 상단 고정',
    search_powerlink: '검색 파워링크',
    local_push: '지역 타겟 푸시',
    coupon: '쿠폰',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">광고 및 마케팅 관리</h2>
         <div className="flex gap-2">
            <button
              onClick={() => setViewMode('timedeals')}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                viewMode === 'timedeals'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-1" />
              타임 딜 관리
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'performance' ? 'list' : 'performance')}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                viewMode === 'performance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {viewMode === 'list' ? (
                <>
                  <BarChart3 className="w-4 h-4 inline-block mr-1" />
                  성과 보기
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 inline-block mr-1" />
                  광고 목록
                </>
              )}
            </button>
         </div>
      </div>

      {/* 타임 딜 관리 */}
      {viewMode === 'timedeals' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold">진행 중인 타임 딜</h3>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">생성일</th>
                <th className="px-6 py-3">파트너/샵</th>
                <th className="px-6 py-3">제목</th>
                <th className="px-6 py-3">할인</th>
                <th className="px-6 py-3">기간</th>
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : timeDeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    등록된 타임 딜이 없습니다.
                  </td>
                </tr>
              ) : (
                timeDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(deal.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{deal.shopName}</div>
                      <div className="text-[11px] text-gray-500">{deal.partnerName}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{deal.title}</td>
                    <td className="px-6 py-4 text-purple-600 font-bold">
                      {deal.discountType === 'percentage' ? `${deal.discountValue}%` : `${deal.discountValue.toLocaleString()}원`}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(deal.startDate).toLocaleDateString()} ~ {new Date(deal.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                        deal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {deal.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleTimeDealAction('toggle', deal.id, deal.isActive)}
                          className={`p-1.5 rounded ${deal.isActive ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          title={deal.isActive ? '비활성화' : '활성화'}
                        >
                          {processingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (deal.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
                        </button>
                        <button
                          onClick={() => handleTimeDealAction('delete', deal.id)}
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
        </div>
      )}

      {/* 성과 대시보드 */}
      {viewMode === 'performance' && (
        <div className="space-y-6">
          {performanceLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : overallStats ? (
            <>
              {/* 전체 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-gray-500">총 광고 수</span>
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-[24px] font-bold">{overallStats.summary.totalAds.toLocaleString()}개</div>
                  <div className="text-[12px] text-gray-400 mt-1">활성: {overallStats.summary.activeAds}개</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-gray-500">총 노출</span>
                    <Eye className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-[24px] font-bold">{overallStats.summary.totalImpressions.toLocaleString()}회</div>
                  <div className="text-[12px] text-gray-400 mt-1">클릭: {overallStats.summary.totalClicks.toLocaleString()}회</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-gray-500">총 지출</span>
                    <DollarSign className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-[24px] font-bold">{overallStats.summary.totalSpend.toLocaleString()} P</div>
                  <div className="text-[12px] text-gray-400 mt-1">평균 CPC: {overallStats.summary.avgCPC.toLocaleString()}P</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-gray-500">평균 CTR</span>
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-[24px] font-bold">{overallStats.summary.avgCTR}%</div>
                  <div className="text-[12px] text-gray-400 mt-1">클릭률</div>
                </div>
              </div>

              {/* 타입별 통계 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-[18px] font-bold mb-4">광고 타입별 성과</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">타입</th>
                        <th className="px-4 py-3">광고 수</th>
                        <th className="px-4 py-3">노출</th>
                        <th className="px-4 py-3">클릭</th>
                        <th className="px-4 py-3">CTR</th>
                        <th className="px-4 py-3">CPC</th>
                        <th className="px-4 py-3">지출</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(overallStats.typeStats).map(([type, stats]: [string, any]) => (
                        <tr key={type} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{adTypeLabels[type] || type}</td>
                          <td className="px-4 py-3">{stats.count}</td>
                          <td className="px-4 py-3">{stats.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3">{stats.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3">{stats.ctr}%</td>
                          <td className="px-4 py-3">{stats.cpc.toLocaleString()}P</td>
                          <td className="px-4 py-3 font-bold">{stats.spend.toLocaleString()}P</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 상위 파트너 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-[18px] font-bold mb-4">상위 파트너 성과</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">파트너</th>
                        <th className="px-4 py-3">광고 수</th>
                        <th className="px-4 py-3">노출</th>
                        <th className="px-4 py-3">클릭</th>
                        <th className="px-4 py-3">CTR</th>
                        <th className="px-4 py-3">지출</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overallStats.topPartners.map((partner: any, index: number) => (
                        <tr key={partner.partnerId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-bold">
                                {index + 1}
                              </span>
                              {partner.partnerName}
                            </div>
                          </td>
                          <td className="px-4 py-3">{partner.ads}</td>
                          <td className="px-4 py-3">{partner.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3">{partner.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3">{partner.ctr}%</td>
                          <td className="px-4 py-3 font-bold">{partner.spend.toLocaleString()}P</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 최고 성과 광고 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-[18px] font-bold mb-4">최고 성과 광고</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">타입</th>
                        <th className="px-4 py-3">파트너</th>
                        <th className="px-4 py-3">샵</th>
                        <th className="px-4 py-3">노출</th>
                        <th className="px-4 py-3">클릭</th>
                        <th className="px-4 py-3">CTR</th>
                        <th className="px-4 py-3">지출</th>
                        <th className="px-4 py-3">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overallStats.topAds.map((ad: any) => (
                        <tr key={ad.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-gray-100 rounded text-[12px]">
                              {adTypeLabels[ad.type] || ad.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{ad.partnerName}</td>
                          <td className="px-4 py-3">{ad.shopName}</td>
                          <td className="px-4 py-3">{ad.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{ad.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3">{ad.ctr}%</td>
                          <td className="px-4 py-3">{ad.spend.toLocaleString()}P</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                              ad.status === 'active' ? 'bg-green-100 text-green-700' :
                              ad.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {ad.status === 'active' ? '진행 중' : ad.status === 'completed' ? '종료' : '대기'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              성과 데이터를 불러올 수 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 광고 목록 */}
      {viewMode === 'list' && (

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
            <div className="relative flex-1 max-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="파트너명 검색" 
                 className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
               />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
            >
               <option value="all">전체 상태</option>
               <option value="waiting">승인 대기</option>
               <option value="active">진행 중</option>
               <option value="completed">종료됨</option>
            </select>
         </div>

         <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium">
               <tr>
                  <th className="px-6 py-3">신청일</th>
                  <th className="px-6 py-3">파트너명</th>
                  <th className="px-6 py-3">광고 상품</th>
                  <th className="px-6 py-3">기간</th>
                  <th className="px-6 py-3">결제 포인트</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3 text-right">관리</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                  <tr>
                     <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                     </td>
                  </tr>
               ) : filteredAds.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery ? '검색 결과가 없습니다.' : '광고 내역이 없습니다.'}
                     </td>
                  </tr>
               ) : (
                  filteredAds.map((ad) => {
                     const adTypeLabels: { [key: string]: string } = {
                        main_banner: '메인 홈 배너',
                        category_top: '검색 상단 고정',
                        search_powerlink: '검색 파워링크',
                        local_push: '지역 타겟 푸시',
                        coupon: '쿠폰',
                     };
                     
                     const period = ad.startDate && ad.endDate
                        ? `${new Date(ad.startDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${new Date(ad.endDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
                        : '즉시 발송';
                     
                     return (
                        <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 text-gray-500">{new Date(ad.createdAt).toLocaleDateString('ko-KR')}</td>
                           <td className="px-6 py-4 font-bold">{ad.partnerName}</td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 rounded text-[12px] font-medium">{adTypeLabels[ad.adType] || ad.adType}</span>
                           </td>
                           <td className="px-6 py-4 text-gray-500">{period}</td>
                           <td className="px-6 py-4 font-bold">{ad.cost.toLocaleString()} P</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                                 ad.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                 ad.status === 'active' ? 'bg-green-100 text-green-700' :
                                 ad.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                 'bg-gray-100 text-gray-600'
                              }`}>
                                 {ad.status === 'waiting' ? '승인 대기' : ad.status === 'active' ? '진행 중' : ad.status === 'rejected' ? '반려됨' : '종료'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              {processingId === ad.id ? (
                                 <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline-block" />
                              ) : ad.status === 'waiting' ? (
                                 <div className="flex justify-end gap-2">
                                    <button 
                                       onClick={() => handleAdAction('view', ad.id)}
                                       className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                                       title="미리보기"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                       onClick={() => handleAdAction('approve', ad.id)}
                                       className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" 
                                       title="승인"
                                    >
                                       <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                       onClick={() => handleAdAction('reject', ad.id)}
                                       className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" 
                                       title="반려"
                                    >
                                       <X className="w-4 h-4" />
                                    </button>
                                 </div>
                              ) : (
                                 <button 
                                    onClick={() => fetchAdPerformance(ad.id)}
                                    className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-blue-500 justify-end w-full"
                                 >
                                    <TrendingUp className="w-3 h-3" /> 성과 보기
                                 </button>
                              )}
                           </td>
                        </tr>
                     );
                  })
               )}
            </tbody>
         </table>
      </div>
      )}

      {/* 개별 광고 성과 모달 */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPerformanceModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[20px] font-bold">광고 성과 상세</h3>
              <button onClick={() => setShowPerformanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {performanceLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : performanceData ? (
              <div className="space-y-6">
                {/* 광고 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold mb-3">광고 정보</h4>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <span className="text-gray-500">타입:</span>
                      <span className="ml-2 font-medium">{adTypeLabels[performanceData.ad.type] || performanceData.ad.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-[11px] font-bold ${
                        performanceData.ad.status === 'active' ? 'bg-green-100 text-green-700' :
                        performanceData.ad.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {performanceData.ad.status === 'active' ? '진행 중' : performanceData.ad.status === 'completed' ? '종료' : '대기'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">파트너:</span>
                      <span className="ml-2 font-medium">{performanceData.partner?.name || performanceData.partner?.email || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">샵:</span>
                      <span className="ml-2 font-medium">{performanceData.shop?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">시작일:</span>
                      <span className="ml-2">{new Date(performanceData.ad.startDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">종료일:</span>
                      <span className="ml-2">{new Date(performanceData.ad.endDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

                {/* 성과 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-[12px] text-gray-500 mb-1">노출 수</div>
                    <div className="text-[24px] font-bold text-blue-600">{performanceData.performance.impressions.toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-[12px] text-gray-500 mb-1">클릭 수</div>
                    <div className="text-[24px] font-bold text-green-600">{performanceData.performance.clicks.toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-[12px] text-gray-500 mb-1">CTR (클릭률)</div>
                    <div className="text-[24px] font-bold text-orange-600">{performanceData.performance.ctr}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-[12px] text-gray-500 mb-1">CPC (클릭당 비용)</div>
                    <div className="text-[24px] font-bold text-purple-600">{performanceData.performance.cpc.toLocaleString()}P</div>
                  </div>
                </div>

                {/* 비용 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold mb-3">비용 정보</h4>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <span className="text-gray-500">총 지출:</span>
                      <span className="ml-2 font-bold">{performanceData.performance.totalSpend.toLocaleString()}P</span>
                    </div>
                    {performanceData.ad.budget && (
                      <div>
                        <span className="text-gray-500">예산:</span>
                        <span className="ml-2">{performanceData.ad.budget.toLocaleString()}P</span>
                      </div>
                    )}
                    {performanceData.ad.dailyCost && (
                      <div>
                        <span className="text-gray-500">일일 비용:</span>
                        <span className="ml-2">{performanceData.ad.dailyCost.toLocaleString()}P</span>
                      </div>
                    )}
                    {performanceData.ad.costPerClick && (
                      <div>
                        <span className="text-gray-500">클릭당 비용:</span>
                        <span className="ml-2">{performanceData.ad.costPerClick.toLocaleString()}P</span>
                      </div>
                    )}
                  </div>
                </div>

                {performanceData.ad.keywords && performanceData.ad.keywords.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold mb-2">키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {performanceData.ad.keywords.map((keyword: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-white rounded text-[12px] border border-gray-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                성과 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
   </div>
  );
}
