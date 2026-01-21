'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreHorizontal, AlertCircle, ShieldAlert, Loader2, Download, Eye, CheckCircle, X, Clock, XCircle } from 'lucide-react';
import { AdminApi } from '../../../lib/api';
import { Reservation } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function AdminBookingsPage() {
  const { formatPrice, t } = useLanguage();
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        let url = '/api/admin/bookings';
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        
        // 날짜 필터
        if (dateFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          params.append('dateFrom', today);
          params.append('dateTo', today);
        } else if (dateFilter === 'week') {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          params.append('dateFrom', weekStart.toISOString().split('T')[0]);
        } else if (dateFilter === 'month') {
          const monthStart = new Date();
          monthStart.setDate(1);
          params.append('dateFrom', monthStart.toISOString().split('T')[0]);
        }
        
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBookings(result.data || []);
          }
        } else {
          const data = await AdminApi.getAllReservations();
          setBookings(data);
        }
      } catch (error) {
        console.error('예약 목록 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [statusFilter, dateFilter, searchQuery]);

  const handleDownload = () => {
    const csvContent = `예약번호,고객명,전화번호,파트너/시술,날짜,시간,금액,상태,결제상태,AI위험도\n${bookings.map(b => 
      `${b.id},${b.userName},${b.userPhone},${b.shopName}/${b.serviceName},${b.date},${b.time},${b.price},${b.status},${b.paymentStatus},${b.aiRiskScore || 0}`
    ).join('\n')}`;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `예약내역_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      let clickedInside = false;
      
      Object.values(menuRefs.current).forEach((ref) => {
        if (ref && ref.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setShowActionMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewDetail = async (bookingId: string) => {
    try {
      console.log('handleViewDetail called with:', bookingId);
      
      // 이미 선택된 예약이면 바로 모달 열기
      if (selectedBooking?.id === bookingId && showDetailModal) {
        console.log('Modal already open for this booking');
        return;
      }

      // 목록에서 먼저 찾아보기 (빠른 응답)
      const existingBooking = bookings.find(b => b.id === bookingId);
      if (existingBooking) {
        console.log('Found booking in list:', existingBooking);
        setSelectedBooking(existingBooking);
        setShowDetailModal(true);
        setShowActionMenu(null);
        
        // 백그라운드에서 최신 데이터 가져오기
        fetch(`/api/bookings/${bookingId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setSelectedBooking(data.data);
            }
          })
          .catch(err => console.error('Background fetch error:', err));
        return;
      }

      // 목록에 없으면 API 호출
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: 예약 정보를 불러올 수 없습니다.`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (!data.success) {
        throw new Error(data.error || '예약 정보를 불러올 수 없습니다.');
      }

      if (!data.data) {
        throw new Error('예약 데이터가 없습니다.');
      }

      console.log('Setting selected booking:', data.data);
      setSelectedBooking(data.data);
      setShowDetailModal(true);
      setShowActionMenu(null);
    } catch (error) {
      console.error('예약 상세 조회 오류:', error);
      alert(error instanceof Error ? error.message : '예약 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    console.log('handleStatusChange called:', bookingId, newStatus);
    
    const statusLabel = getStatusLabel(newStatus);
    if (!confirm(`예약 상태를 "${statusLabel}"으로 변경하시겠습니까?`)) {
      return;
    }

    setProcessingId(bookingId);
    setShowActionMenu(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'cancelled' && { paymentStatus: 'refunded' })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: 상태 변경 실패`);
      }

      const data = await response.json();
      console.log('Status change response:', data);
      
      if (!data.success) {
        throw new Error(data.error || '상태 변경 실패');
      }

      // API 응답의 업데이트된 데이터 사용
      const updatedBookingData = data.data;
      
      // 목록 새로고침
      const refreshResponse = await fetch('/api/admin/bookings');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setBookings(refreshData.data || []);
          
          // 모달이 열려있으면 최신 데이터로 업데이트
          if (selectedBooking?.id === bookingId && showDetailModal) {
            // 최신 데이터를 목록에서 찾거나 API 응답 사용
            const latestBooking = refreshData.data.find((b: Reservation) => b.id === bookingId) || updatedBookingData;
            if (latestBooking) {
              setSelectedBooking(latestBooking);
            }
          }
        }
      }
      
      alert('예약 상태가 변경되었습니다.');
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '대기중',
      confirmed: '확정',
      completed: '완료',
      cancelled: '취소',
      noshow: '노쇼',
    };
    return labels[status] || status;
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.id.toLowerCase().includes(query) ||
      b.userName?.toLowerCase().includes(query) ||
      b.shopName?.toLowerCase().includes(query) ||
      b.userPhone?.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">예약 및 거래 관리</h2>
         <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 flex items-center gap-2"
            >
               <Download className="w-4 h-4" /> 엑셀 다운로드
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
         {/* Search & Filter Bar */}
         <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
            <div className="relative flex-1 max-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="예약번호, 고객명, 파트너명" 
                 className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
               />
            </div>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
            >
               <option value="all">전체 기간</option>
               <option value="today">오늘</option>
               <option value="week">이번 주</option>
               <option value="month">이번 달</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
            >
               <option value="all">전체 상태</option>
               <option value="pending">대기중</option>
               <option value="confirmed">예약 확정</option>
               <option value="completed">이용 완료</option>
               <option value="cancelled">취소/환불</option>
               <option value="noshow">노쇼</option>
            </select>
         </div>

         <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
               <tr>
                  <th className="px-6 py-3">예약번호/일시</th>
                  <th className="px-6 py-3">고객 정보</th>
                  <th className="px-6 py-3">파트너/시술</th>
                  <th className="px-6 py-3">결제금액</th>
                  <th className="px-6 py-3">AI Risk</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3 text-right">관리</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                  <tr>
                     <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                     </td>
                  </tr>
               ) : filteredBookings.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery ? '검색 결과가 없습니다.' : '예약 내역이 없습니다.'}
                     </td>
                  </tr>
               ) : (
                  filteredBookings.map((booking) => (
                     <tr 
                       key={booking.id} 
                       className={`hover:bg-gray-50 transition-colors cursor-pointer ${(booking.aiRiskScore || 0) > 80 ? 'bg-red-50/50' : ''}`}
                       onClick={(e) => {
                         // 버튼 클릭은 제외
                         if ((e.target as HTMLElement).closest('button, a')) return;
                         handleViewDetail(booking.id);
                       }}
                     >
                        <td className="px-6 py-4">
                           <div className="font-bold text-[11px] font-mono">{booking.id.slice(-8)}</div>
                           <div className="text-gray-400 text-[12px]">{booking.date} {booking.time}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-medium">{booking.userName}</div>
                           <div className="text-gray-400 text-[11px]">{booking.userPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold">{booking.shopName}</div>
                           <div className="text-gray-500 text-[12px]">{booking.serviceName}</div>
                        </td>
                        <td className="px-6 py-4 font-bold">{formatPrice(booking.price)}</td>
                        
                        {/* AI Risk Analysis Column */}
                        <td className="px-6 py-4">
                           {(booking.aiRiskScore || 0) > 50 ? (
                              <div className="group relative inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded text-[11px] font-bold cursor-help">
                                 <ShieldAlert className="w-3 h-3" />
                                 {booking.aiRiskScore}% 위험
                                 
                                 {/* Tooltip */}
                                 {booking.aiRiskReason && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[11px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                       {booking.aiRiskReason}
                                    </div>
                                 )}
                              </div>
                           ) : (
                              <span className="text-gray-400 text-[11px]">-</span>
                           )}
                        </td>

                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'cancelled' ? 'bg-gray-100 text-gray-500 line-through' :
                              booking.status === 'noshow' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                           }`}>
                              {booking.status === 'confirmed' ? '확정' :
                               booking.status === 'completed' ? '완료' :
                               booking.status === 'cancelled' ? '취소' :
                               booking.status === 'noshow' ? '노쇼' : '대기'}
                           </span>
                           <div className={`text-[11px] mt-1 ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                              {booking.paymentStatus === 'paid' ? '결제완료' : '미결제'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                           <div 
                              className="relative inline-block" 
                              ref={(el) => {
                                if (el) {
                                  menuRefs.current[booking.id] = el;
                                } else {
                                  delete menuRefs.current[booking.id];
                                }
                              }}
                           >
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newMenuState = showActionMenu === booking.id ? null : booking.id;
                                  console.log('토글 버튼 클릭:', booking.id, '->', newMenuState);
                                  setShowActionMenu(newMenuState);
                                }}
                                disabled={processingId === booking.id}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-50"
                              >
                                 {processingId === booking.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                 ) : (
                                    <MoreHorizontal className="w-4 h-4" />
                                 )}
                              </button>
                              
                              {showActionMenu === booking.id && (
                                 <div 
                                   className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]"
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                   }}
                                   onMouseDown={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                   }}
                                 >
                                    <button
                                       type="button"
                                       onMouseDown={(e) => {
                                         e.preventDefault();
                                         e.stopPropagation();
                                       }}
                                       onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('상세 보기 클릭:', booking.id);
                                          setShowActionMenu(null);
                                          try {
                                            await handleViewDetail(booking.id);
                                          } catch (err) {
                                            console.error('상세 보기 오류:', err);
                                          }
                                       }}
                                       className="w-full px-4 py-2 text-left text-[12px] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                    >
                                       <Eye className="w-3 h-3" /> 상세 보기
                                    </button>
                                    {booking.status === 'pending' && (
                                       <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onClick={async (e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             console.log('확정 처리 클릭:', booking.id);
                                             setShowActionMenu(null);
                                             try {
                                               await handleStatusChange(booking.id, 'confirmed');
                                             } catch (err) {
                                               console.error('확정 처리 오류:', err);
                                             }
                                          }}
                                          className="w-full px-4 py-2 text-left text-[12px] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                       >
                                          <CheckCircle className="w-3 h-3 text-blue-600" /> 확정 처리
                                       </button>
                                    )}
                                    {booking.status === 'confirmed' && (
                                       <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onClick={async (e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             console.log('완료 처리 클릭:', booking.id);
                                             setShowActionMenu(null);
                                             try {
                                               await handleStatusChange(booking.id, 'completed');
                                             } catch (err) {
                                               console.error('완료 처리 오류:', err);
                                             }
                                          }}
                                          className="w-full px-4 py-2 text-left text-[12px] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                       >
                                          <Clock className="w-3 h-3 text-green-600" /> 완료 처리
                                       </button>
                                    )}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                       <>
                                          <button
                                             type="button"
                                             onMouseDown={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                             }}
                                             onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('취소 처리 클릭:', booking.id);
                                                setShowActionMenu(null);
                                                try {
                                                  await handleStatusChange(booking.id, 'cancelled');
                                                } catch (err) {
                                                  console.error('취소 처리 오류:', err);
                                                }
                                             }}
                                             className="w-full px-4 py-2 text-left text-[12px] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                          >
                                             <X className="w-3 h-3 text-red-600" /> 취소 처리
                                          </button>
                                          <button
                                             type="button"
                                             onMouseDown={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                             }}
                                             onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('노쇼 처리 클릭:', booking.id);
                                                setShowActionMenu(null);
                                                try {
                                                  await handleStatusChange(booking.id, 'noshow');
                                                } catch (err) {
                                                  console.error('노쇼 처리 오류:', err);
                                                }
                                             }}
                                             className="w-full px-4 py-2 text-left text-[12px] hover:bg-gray-50 flex items-center gap-2 text-red-600 transition-colors"
                                          >
                                             <XCircle className="w-3 h-3" /> 노쇼 처리
                                          </button>
                                       </>
                                    )}
                                 </div>
                              )}
                           </div>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* 예약 상세 모달 */}
      {showDetailModal && selectedBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
          onClick={() => {
            console.log('Closing modal');
            setShowDetailModal(false);
          }}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">예약 상세 정보</h3>
              <button 
                onClick={() => {
                  console.log('Close button clicked');
                  setShowDetailModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedBooking ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">예약번호</div>
                  <div className="font-mono text-[13px] font-bold break-all">{selectedBooking.id}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">상태</div>
                  <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${
                     selectedBooking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                     selectedBooking.status === 'completed' ? 'bg-green-100 text-green-700' :
                     selectedBooking.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                     selectedBooking.status === 'noshow' ? 'bg-red-100 text-red-700' :
                     'bg-yellow-100 text-yellow-700'
                  }`}>
                     {getStatusLabel(selectedBooking.status)}
                  </span>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">고객명</div>
                  <div className="font-medium">{selectedBooking.userName}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">전화번호</div>
                  <div className="text-[13px]">{selectedBooking.userPhone}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">파트너/매장</div>
                  <div className="font-medium">{selectedBooking.shopName}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">시술</div>
                  <div className="text-[13px]">{selectedBooking.serviceName}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">예약일시</div>
                  <div className="text-[13px]">{selectedBooking.date} {selectedBooking.time}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">결제금액</div>
                  <div className="font-bold text-[16px]">{formatPrice(selectedBooking.price)}</div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-500 mb-1">결제상태</div>
                  <span className={`text-[12px] font-bold ${selectedBooking.paymentStatus === 'paid' ? 'text-green-600' : selectedBooking.paymentStatus === 'refunded' ? 'text-gray-500' : 'text-red-500'}`}>
                     {selectedBooking.paymentStatus === 'paid' ? '결제완료' : selectedBooking.paymentStatus === 'refunded' ? '환불완료' : '미결제'}
                  </span>
                </div>
                {selectedBooking.aiRiskScore && selectedBooking.aiRiskScore > 50 && (
                  <div>
                    <div className="text-[12px] text-gray-500 mb-1">AI 위험도</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-red-600 font-bold">{selectedBooking.aiRiskScore}%</span>
                      {selectedBooking.aiRiskReason && (
                        <span className="text-[11px] text-gray-500">{selectedBooking.aiRiskReason}</span>
                      )}
                    </div>
                  </div>
                )}
                {(selectedBooking as any).createdAt && (
                  <div>
                    <div className="text-[12px] text-gray-500 mb-1">예약 생성일</div>
                    <div className="text-[12px]">{new Date((selectedBooking as any).createdAt).toLocaleString('ko-KR')}</div>
                  </div>
                )}
                {(selectedBooking as any).updatedAt && (
                  <div>
                    <div className="text-[12px] text-gray-500 mb-1">최종 수정일</div>
                    <div className="text-[12px]">{new Date((selectedBooking as any).updatedAt).toLocaleString('ko-KR')}</div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                {selectedBooking.status !== 'confirmed' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'confirmed');
                    }}
                    disabled={processingId === selectedBooking.id}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리중
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        확정 처리
                      </>
                    )}
                  </button>
                )}
                {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'noshow' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'completed');
                    }}
                    disabled={processingId === selectedBooking.id}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-green-600 text-white rounded-lg text-[13px] font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리중
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        완료 처리
                      </>
                    )}
                  </button>
                )}
                {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'cancelled');
                    }}
                    disabled={processingId === selectedBooking.id}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-gray-600 text-white rounded-lg text-[13px] font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리중
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        취소 처리
                      </>
                    )}
                  </button>
                )}
                {selectedBooking.status !== 'noshow' && selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'noshow');
                    }}
                    disabled={processingId === selectedBooking.id}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === selectedBooking.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리중
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        노쇼 처리
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            ) : (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">예약 정보를 불러오는 중...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
