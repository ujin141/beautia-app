'use client';

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface FinanceData {
  totalGMV: number;
  netRevenue: number;
  feeRate: number;
  pendingPayout: number;
  partnerCount: number;
  settlements: Array<{
    _id?: string;
    settlementId?: string;
    partnerId: string;
    partnerName: string;
    shopName: string;
    period: string;
    totalSales: number;
    fee: number;
    payout: number;
    status: string;
  }>;
}

export default function AdminFinancePage() {
  const { formatPrice } = useLanguage();
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const response = await fetch('/api/admin/finance', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.replace('/admin/login');
          }
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFinanceData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch finance data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePayout = async (item: FinanceData['settlements'][0]) => {
    // settlementId가 없으면 정산을 먼저 생성해야 함
    const settlementId = item._id || item.settlementId;
    
    if (!settlementId) {
      // 정산이 아직 생성되지 않은 경우, 정산 생성 API를 통해 생성
      alert('정산 내역이 아직 생성되지 않았습니다. 정산 관리 페이지에서 먼저 정산을 생성해주세요.');
      return;
    }

    if (!confirm('Stripe를 통해 정산 지급을 처리하시겠습니까?\n모든 정산은 Stripe Connect를 통해서만 처리됩니다.')) return;
    
    setProcessingId(item.partnerId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const response = await fetch('/api/admin/settlements/payout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          settlementId,
        }),
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.replace('/admin/login');
        }
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(data.message || data.data?.transferResult?.message || 'Stripe를 통한 지급 처리가 완료되었습니다.');
          // 목록 새로고침
          const tokenRefresh = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
          const refreshResponse = await fetch('/api/admin/finance', {
            headers: {
              ...(tokenRefresh && { 'Authorization': `Bearer ${tokenRefresh}` }),
            },
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setFinanceData(refreshData.data);
            }
          }
        } else {
          throw new Error(data.error || '지급 처리에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '지급 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('지급 처리 오류:', error);
      alert(error instanceof Error ? error.message : '지급 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = () => {
    if (!financeData) return;
    const csvContent = `파트너명,매장명,기간,총 매출,수수료,실 지급액,상태\n${financeData.settlements.map(s => 
      `${s.partnerName},${s.shopName},${s.period},${s.totalSales},${s.fee},${s.payout},${s.status}`
    ).join('\n')}`;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `정산내역_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  if (!financeData) {
    return <div className="p-8 text-gray-500">데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
           <h2 className="text-[24px] font-bold">정산 및 재무</h2>
           <p className="text-[12px] text-gray-500 mt-1">
             모든 정산은 Stripe Connect를 통해 자동으로 처리됩니다.
           </p>
         </div>
         <button 
           onClick={handleDownload}
           className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2"
         >
            <Download className="w-4 h-4" /> 정산 리포트 다운로드
         </button>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[13px] text-blue-900 mb-1">Stripe Connect 정산 안내</div>
            <ul className="text-[12px] text-blue-700 space-y-1 list-disc list-inside">
              <li>모든 정산은 Stripe Connect를 통해서만 처리됩니다.</li>
              <li>"Stripe 정산 처리" 버튼 클릭 시 Stripe Transfer가 자동으로 실행됩니다.</li>
              <li>정산 완료 후 파트너의 Stripe Connect 계정으로 자동 입금됩니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-[13px] text-gray-500 mb-2">이번 달 총 거래액 (GMV)</div>
            <div className="text-[28px] font-bold">{formatPrice(financeData.totalGMV)}</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-[13px] text-gray-500 mb-2">예상 수수료 수익 (Net Revenue)</div>
            <div className="text-[28px] font-bold text-blue-600">{formatPrice(financeData.netRevenue)}</div>
            <div className="text-[12px] text-gray-400 mt-1">평균 수수료율 {financeData.feeRate}%</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-[13px] text-gray-500 mb-2">지급 대기 금액 (Payable)</div>
            <div className="text-[28px] font-bold text-red-500">{formatPrice(financeData.pendingPayout)}</div>
            <div className="text-[12px] text-gray-400 mt-1">{financeData.partnerCount}개 파트너 대상</div>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-200 font-bold text-[16px]">파트너 정산 내역</div>
         <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium">
               <tr>
                  <th className="px-6 py-3">파트너명</th>
                  <th className="px-6 py-3">정산 기간</th>
                  <th className="px-6 py-3">총 매출</th>
                  <th className="px-6 py-3">수수료(공제)</th>
                  <th className="px-6 py-3">실 지급액</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3 text-right">지급 처리</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {financeData.settlements.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        정산 내역이 없습니다.
                     </td>
                  </tr>
               ) : (
                  financeData.settlements.map((item) => (
                     <tr key={item.partnerId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold">{item.shopName}</div>
                           <div className="text-[11px] text-gray-400">{item.partnerName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{item.period}</td>
                        <td className="px-6 py-4">{formatPrice(item.totalSales)}</td>
                        <td className="px-6 py-4 text-red-500">- {formatPrice(item.fee)}</td>
                        <td className="px-6 py-4 font-bold">{formatPrice(item.payout)}</td>
                        <td className="px-6 py-4">
                           {item.status === 'complete' ? (
                              <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle className="w-3 h-3" /> 지급 완료</span>
                           ) : (
                              <span className="flex items-center gap-1 text-orange-500 font-bold"><Clock className="w-3 h-3" /> 대기중</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {item.status === 'pending' && (
                              <button 
                                 onClick={() => handlePayout(item)}
                                 disabled={processingId === item.partnerId || !(item._id || item.settlementId)}
                                 className="px-3 py-1 bg-gray-900 text-white rounded text-[11px] font-bold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                 title={!(item._id || item.settlementId) ? '정산이 아직 생성되지 않았습니다. 정산 관리에서 먼저 생성해주세요.' : ''}
                              >
                                 {processingId === item.partnerId ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> 처리중</>
                                 ) : (
                                    'Stripe 정산 처리'
                                 )}
                              </button>
                           )}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
