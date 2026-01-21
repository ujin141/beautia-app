'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, Clock, X, Download, Search, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import Settlement from '@/models/Settlement';

interface SettlementData {
  _id?: string;
  partnerId: string;
  partnerName: string;
  shopName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  fee: number;
  payout: number;
  bookingCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function AdminSettlementsPage() {
  const { formatPrice, t } = useLanguage();
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settlements');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettlements(data.data || []);
        }
      }
    } catch (error) {
      console.error('정산 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSettlement = async () => {
    if (!selectedPeriod.start || !selectedPeriod.end) {
      alert('정산 기간을 선택해주세요.');
      return;
    }

    if (!confirm('정산을 생성하시겠습니까?\n\n※ Stripe Connect 계정이 활성화된 파트너만 정산이 생성됩니다.')) return;

    try {
      const response = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: selectedPeriod.start,
          periodEnd: selectedPeriod.end,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('정산이 생성되었습니다.');
          setShowCreateModal(false);
          setSelectedPeriod({ start: '', end: '' });
          fetchSettlements();
        } else {
          throw new Error(data.error || '정산 생성에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '정산 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('정산 생성 오류:', error);
      alert(error instanceof Error ? error.message : '정산 생성 중 오류가 발생했습니다.');
    }
  };

  const handleStatusUpdate = async (settlementId: string, newStatus: string) => {
    if (!confirm(`정산 상태를 "${newStatus}"로 변경하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/admin/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('정산 상태가 변경되었습니다.');
          fetchSettlements();
        } else {
          throw new Error(data.error || '상태 변경에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = () => {
    const csvContent = `파트너명,매장명,기간,총 매출,수수료,실 지급액,예약 건수,상태\n${filteredSettlements.map(s => 
      `${s.partnerName},${s.shopName},${s.period},${s.totalSales},${s.fee},${s.payout},${s.bookingCount},${s.status}`
    ).join('\n')}`;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `정산내역_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredSettlements = settlements.filter(settlement => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!settlement.partnerName.toLowerCase().includes(query) &&
          !settlement.shopName.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && settlement.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 className="w-3 h-3" /> 완료</span>;
      case 'processing':
        return <span className="flex items-center gap-1 text-blue-600 font-bold"><Clock className="w-3 h-3" /> 처리중</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-red-600 font-bold"><X className="w-3 h-3" /> 실패</span>;
      default:
        return <span className="flex items-center gap-1 text-orange-500 font-bold"><Clock className="w-3 h-3" /> 대기중</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[24px] font-bold">정산 관리</h2>
          <p className="text-[12px] text-gray-500 mt-1">
            모든 정산은 Stripe Connect를 통해 자동으로 처리됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> 리포트 다운로드
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 정산 생성
          </button>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[13px] text-blue-900 mb-1">Stripe Connect 정산 안내</div>
            <ul className="text-[12px] text-blue-700 space-y-1 list-disc list-inside">
              <li>정산 생성은 Stripe Connect 계정이 활성화된 파트너만 가능합니다.</li>
              <li>"Stripe 정산 처리" 버튼 클릭 시 Stripe Transfer가 자동으로 실행됩니다.</li>
              <li>정산 완료 후 파트너의 Stripe Connect 계정으로 자동 입금됩니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="파트너명, 매장명 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="processing">처리중</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
          </select>
        </div>
      </div>

      {/* 정산 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">파트너/매장</th>
              <th className="px-6 py-3">정산 기간</th>
              <th className="px-6 py-3">총 매출</th>
              <th className="px-6 py-3">수수료</th>
              <th className="px-6 py-3">실 지급액</th>
              <th className="px-6 py-3">예약 건수</th>
              <th className="px-6 py-3">상태</th>
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
            ) : filteredSettlements.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  정산 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredSettlements.map((settlement) => (
                <tr key={settlement._id || settlement.partnerId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold">{settlement.shopName}</div>
                    <div className="text-[11px] text-gray-400">{settlement.partnerName}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{settlement.period}</td>
                  <td className="px-6 py-4">{formatPrice(settlement.totalSales)}</td>
                  <td className="px-6 py-4 text-red-500">- {formatPrice(settlement.fee)}</td>
                  <td className="px-6 py-4 font-bold">{formatPrice(settlement.payout)}</td>
                  <td className="px-6 py-4">{settlement.bookingCount}건</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(settlement.status)}
                      {settlement.status === 'completed' && (settlement as any).transferInfo?.transferMethod === 'stripe' && (
                        <div title="Stripe 이체 완료">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {settlement.status === 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm('Stripe를 통해 정산을 진행하시겠습니까?\n"처리 시작" 클릭 시 Stripe Transfer가 자동으로 실행됩니다.')) {
                              handleStatusUpdate(settlement._id || settlement.partnerId, 'processing');
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-[11px] font-bold hover:bg-blue-600"
                        >
                          Stripe 정산 처리
                        </button>
                      )}
                      {settlement.status === 'completed' && (settlement as any).transferInfo?.transferId && (
                        <div className="text-[11px] text-gray-500">
                          Transfer ID: {(settlement as any).transferInfo.transferId.slice(0, 20)}...
                        </div>
                      )}
                      {settlement.status === 'failed' && (
                        <button
                          onClick={() => handleStatusUpdate(settlement._id || settlement.partnerId, 'pending')}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-[11px] font-bold hover:bg-gray-600"
                        >
                          재시도
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 정산 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">정산 생성</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-[12px] text-blue-800">
                  <strong>안내:</strong> Stripe Connect 계정이 활성화된 파트너만 정산이 생성됩니다.
                </p>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">정산 시작일</label>
                <input
                  type="date"
                  value={selectedPeriod.start}
                  onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">정산 종료일</label>
                <input
                  type="date"
                  value={selectedPeriod.end}
                  onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateSettlement}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
