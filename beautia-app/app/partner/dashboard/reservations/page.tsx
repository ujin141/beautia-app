'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Check, X, Clock, Loader2, Eye, CheckCircle2, Plus } from 'lucide-react';
import { Reservation } from '../../../../types';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';
import { useSearchParams } from 'next/navigation';

interface ReservationDetail {
  id: string;
  userName: string;
  userPhone: string;
  shopName: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

function ReservationsPageContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { formatPrice, t, language } = useLanguage();

  // 예약 추가 폼 상태
  const [addFormData, setAddFormData] = useState({
    userName: '',
    userPhone: '',
    serviceName: '',
    date: '',
    time: '',
    price: '',
    notes: '',
  });

  // 예약 추가 핸들러
  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = getPartnerUser();
    if (!partner) {
      alert(t('partner_dashboard.schedule_login_required'));
      return;
    }

    if (!addFormData.userName || !addFormData.userPhone || !addFormData.serviceName || !addFormData.date || !addFormData.time || !addFormData.price) {
      alert(t('partner_dashboard.reservation_add_required_fields'));
      return;
    }

    setIsSaving(true);
    try {
      // 임시 userId 생성 (실제로는 고객 관리에서 선택하거나 새로 생성)
      const tempUserId = `temp_${Date.now()}`;
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUserId,
          userName: addFormData.userName,
          userPhone: addFormData.userPhone,
          shopId: partner.id, // 파트너 ID를 shopId로 사용
          shopName: partner.name || '매장',
          partnerId: partner.id,
          serviceId: `service_${Date.now()}`, // 임시 serviceId
          serviceName: addFormData.serviceName,
          date: addFormData.date,
          time: addFormData.time,
          price: parseInt(addFormData.price.replace(/,/g, '')),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(t('partner_dashboard.reservation_added'));
          setShowAddModal(false);
          setAddFormData({
            userName: '',
            userPhone: '',
            serviceName: '',
            date: '',
            time: '',
            price: '',
            notes: '',
          });
          fetchReservations();
        } else {
          throw new Error(data.error || t('partner_dashboard.reservation_add_failed'));
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || t('partner_dashboard.reservation_add_failed'));
      }
    } catch (error) {
      console.error('예약 추가 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.reservation_add_failed'));
    } finally {
      setIsSaving(false);
    }
  };


  const fetchReservations = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) {
        console.error('Partner info not found');
        return;
      }

      const response = await fetch(`/api/bookings?partnerId=${partner.id}`);
      const data = await response.json();
      
      if (data.success) {
        // data.data가 배열인지 확인하고 설정
        const reservationsData = data.data || [];
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      } else {
        throw new Error(data.error || 'Failed to load reservations');
      }
    } catch (error) {
      console.error('예약 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    
    // URL 파라미터에서 action=add 확인
    const action = searchParams?.get('action');
    if (action === 'add') {
      setShowAddModal(true);
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/partner/dashboard/reservations');
    }
  }, []);

  const handleStatusUpdate = async (id: string, status: Reservation['status']) => {
    if (status === 'cancelled' && !confirm(t('partner_dashboard.reservation_cancel_confirm') || '예약을 취소하시겠습니까?')) {
      return;
    }

    setProcessingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      // 목록 새로고침
      await fetchReservations();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert(t('common.error') || 'Failed to update status. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancellationAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'approve' 
      ? t('partner_dashboard.reservation_cancel_approve_confirm')
      : t('partner_dashboard.reservation_cancel_reject_confirm');
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: action === 'approve' ? 'approve_cancellation' : 'reject_cancellation'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('partner_dashboard.reservation_cancel_action_failed'));
      }

      alert(data.message || (action === 'approve' ? t('partner_dashboard.reservation_cancel_approved') : t('partner_dashboard.reservation_cancel_rejected')));

      // 목록 새로고침
      await fetchReservations();
    } catch (error) {
      console.error('취소 요청 처리 오류:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.reservation_cancel_action_failed'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSelectedReservation(data.data);
        setShowDetailModal(true);
      } else {
        throw new Error(data.error || 'Failed to load reservation details');
      }
    } catch (error) {
      console.error('예약 상세 조회 오류:', error);
      alert(t('common.error') || 'Failed to load reservation details.');
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setFilterByDate(true); // 날짜 변경 시 필터 활성화
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
    setFilterByDate(false); // 오늘 클릭 시 필터 비활성화 (모든 예약 표시)
  };

  const formatDateDisplay = useMemo(() => {
    return (date: Date | string) => {
      // 문자열인 경우 Date 객체로 변환
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // 유효하지 않은 날짜인 경우 원본 반환
      if (isNaN(dateObj.getTime())) {
        return typeof date === 'string' ? date : dateObj.toISOString().split('T')[0];
      }
      
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      const dayOfWeek = dateObj.getDay();
      
      // 언어별 요일 번역
      const weekdayMap: { [key: string]: string[] } = {
        ko: ['일', '월', '화', '수', '목', '금', '토'],
        en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        ja: ['日', '月', '火', '水', '木', '金', '土'],
        th: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
        zh: ['日', '一', '二', '三', '四', '五', '六'],
      };
      
      const weekdays = weekdayMap[language] || weekdayMap['en'];
      const weekday = weekdays[dayOfWeek];
      
      // 언어별 날짜 형식
      const dateFormatMap: { [key: string]: string } = {
        ko: `${year}년 ${month}월 ${day}일 (${weekday})`,
        en: `${month}/${day}/${year} (${weekday})`,
        ja: `${year}年${month}月${day}日 (${weekday})`,
        th: `${day}/${month}/${year} (${weekday})`,
        zh: `${year}年${month}月${day}日 (${weekday})`,
      };
      
      return dateFormatMap[language] || dateFormatMap['en'];
    };
  }, [language]);

  // 날짜 필터링 (선택적으로 사용)
  const [filterByDate, setFilterByDate] = useState(false);
  
  // reservations가 배열인지 확인하고 필터링
  const reservationsArray = Array.isArray(reservations) ? reservations : [];
  
  const filteredReservations = filterByDate 
    ? reservationsArray.filter(res => {
        if (!res.date) return false;
        try {
          const resDate = new Date(res.date);
          const selectedDateStr = selectedDate.toDateString();
          const resDateStr = resDate.toDateString();
          return resDateStr === selectedDateStr;
        } catch (e) {
          return false;
        }
      })
    : reservationsArray; // 필터링 비활성화 시 모든 예약 표시

  if (loading) return <div className="p-8">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-4">
            <h2 className="text-[24px] font-bold">{t('partner_dashboard.reservation_management')}</h2>
            <div className="flex bg-white rounded-lg border border-line p-1">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface text-primary font-bold' : 'text-secondary hover:bg-surface'}`}
               >
                  <List className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => setViewMode('calendar')}
                 className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-surface text-primary font-bold' : 'text-secondary hover:bg-surface'}`}
               >
                  <CalendarIcon className="w-5 h-5" />
               </button>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-line">
            <button 
              onClick={() => handleDateChange(-1)}
              className="p-1 hover:bg-surface rounded transition-colors"
              title={t('partner_dashboard.reservation_prev_day') || '이전 날짜'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleTodayClick}
              className={`px-3 py-1 text-[12px] rounded transition-colors ${
                !filterByDate 
                  ? 'bg-brand-lilac text-white font-bold' 
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
              title={t('partner_dashboard.reservation_today') || '오늘'}
            >
              {t('partner_dashboard.reservation_today') || '오늘'}
            </button>
            <span className="font-bold w-[200px] text-center">{formatDateDisplay(selectedDate)}</span>
            {filterByDate && (
              <button
                onClick={() => setFilterByDate(false)}
                className="px-2 py-1 text-[11px] text-secondary hover:text-primary hover:bg-surface rounded transition-colors"
                title={t('partner_dashboard.reservation_view_all')}
              >
                {t('partner_dashboard.reservation_view_all')}
              </button>
            )}
            <button 
              onClick={() => handleDateChange(1)}
              className="p-1 hover:bg-surface rounded transition-colors"
              title={t('partner_dashboard.reservation_next_day') || '다음 날짜'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
         </div>
         <button
           onClick={() => setShowAddModal(true)}
           className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-brand-lilac"
         >
           <Plus className="w-4 h-4" /> {t('partner_dashboard.quick_action_manual_booking')}
         </button>
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-surface border-b border-line text-[13px] text-secondary font-bold uppercase tracking-wider">
                  <tr>
                     <th className="px-6 py-4">{t('partner_dashboard.reservation_time')}</th>
                     <th className="px-6 py-4">{t('partner_dashboard.reservation_customer')}</th>
                     <th className="px-6 py-4">{t('partner_dashboard.reservation_service')}</th>
                     <th className="px-6 py-4">{t('partner_dashboard.reservation_status')}</th>
                     <th className="px-6 py-4">{t('partner_dashboard.reservation_payment')}</th>
                     <th className="px-6 py-4 text-right">{t('partner_dashboard.reservation_manage')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-line">
                  {loading ? (
                     <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-lilac mx-auto" /></td></tr>
                  ) : filteredReservations.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="text-center py-8 text-secondary">
                           {filterByDate 
                              ? t('partner_dashboard.reservation_no_reservation_on_date').replace('{date}', formatDateDisplay(selectedDate))
                              : t('partner_dashboard.reservations_empty')
                           }
                        </td>
                     </tr>
                  ) : filteredReservations.map((res) => (
                     <tr key={res.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold">{res.date ? formatDateDisplay(res.date) : res.date}</div>
                           <div className="text-[12px] text-secondary">{res.time}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold">{res.userName}</div>
                           <div className="text-[12px] text-secondary">{res.userPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-medium">{res.serviceName}</div>
                           <div className="text-[11px] text-secondary">{res.shopName}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-bold ${
                              res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              res.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              res.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              res.status === 'cancellation_requested' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                           }`}>
                              {res.status === 'confirmed' ? t('partner_dashboard.reservation_status_confirmed') : 
                               res.status === 'pending' ? t('partner_dashboard.reservation_status_waiting') : 
                               res.status === 'completed' ? t('partner_dashboard.reservation_status_completed') :
                               res.status === 'cancellation_requested' ? t('partner_dashboard.reservation_cancellation_requested') :
                               t('partner_dashboard.reservation_status_cancelled')}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold">{formatPrice(res.price)}</div>
                           <div className={`text-[12px] ${res.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                              {res.paymentStatus === 'paid' ? t('partner_dashboard.payment_status_paid') : t('partner_dashboard.payment_status_unpaid')}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {processingId === res.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-brand-lilac inline-block" />
                           ) : (
                              <div className="flex justify-end gap-2">
                                 {res.status === 'pending' && (
                                    <>
                                       <button 
                                          onClick={() => handleStatusUpdate(res.id, 'confirmed')}
                                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" 
                                          title={t('partner_dashboard.reservation_approve') || '승인'}
                                       >
                                          <Check className="w-4 h-4" />
                                       </button>
                                       <button 
                                          onClick={() => handleStatusUpdate(res.id, 'cancelled')}
                                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" 
                                          title={t('partner_dashboard.reservation_reject') || '거절'}
                                       >
                                          <X className="w-4 h-4" />
                                       </button>
                                    </>
                                 )}
                                 {res.status === 'cancellation_requested' && (
                                    <>
                                       <button 
                                          onClick={() => handleCancellationAction(res.id, 'approve')}
                                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" 
                                          title={t('partner_dashboard.reservation_cancel_approve')}
                                       >
                                          <Check className="w-4 h-4" />
                                       </button>
                                       <button 
                                          onClick={() => handleCancellationAction(res.id, 'reject')}
                                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" 
                                          title={t('partner_dashboard.reservation_cancel_reject')}
                                       >
                                          <X className="w-4 h-4" />
                                       </button>
                                    </>
                                 )}
                                 {res.status === 'confirmed' && (
                                    <button 
                                       onClick={() => handleStatusUpdate(res.id, 'completed')}
                                       className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" 
                                       title={t('partner_dashboard.reservation_complete') || '완료 처리'}
                                    >
                                       <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                 )}
                                 <button 
                                    onClick={() => handleViewDetail(res.id)}
                                    className="px-3 py-1.5 rounded-lg border border-line text-[13px] font-medium hover:bg-surface transition-colors flex items-center gap-1"
                                 >
                                    <Eye className="w-3 h-3" />
                                    {t('partner_dashboard.reservation_detail')}
                                 </button>
                              </div>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* 예약 상세 모달 */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{t('partner_dashboard.reservation_detail')}</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.reservation_customer')}</label>
                <div className="text-[16px] font-bold">{selectedReservation.userName}</div>
                <div className="text-[14px] text-secondary">{selectedReservation.userPhone}</div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.reservation_service')}</label>
                <div className="text-[16px] font-medium">{selectedReservation.serviceName}</div>
                <div className="text-[14px] text-secondary">{selectedReservation.shopName}</div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.reservation_time')}</label>
                <div className="text-[16px] font-bold">
                  {selectedReservation.date ? formatDateDisplay(selectedReservation.date) : selectedReservation.date} {selectedReservation.time}
                </div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.reservation_payment')}</label>
                <div className="text-[16px] font-bold">{formatPrice(selectedReservation.price)}</div>
                <div className={`text-[14px] ${selectedReservation.paymentStatus === 'paid' ? 'text-green-600' : selectedReservation.paymentStatus === 'refunded' ? 'text-orange-600' : 'text-red-500'}`}>
                  {selectedReservation.paymentStatus === 'paid' ? t('partner_dashboard.payment_status_paid') : 
                   selectedReservation.paymentStatus === 'refunded' ? t('partner_dashboard.reservation_refunded') : 
                   t('partner_dashboard.payment_status_unpaid')}
                </div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.reservation_status')}</label>
                <span className={`inline-flex items-center px-3 py-1 rounded text-[13px] font-bold ${
                  selectedReservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedReservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedReservation.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  selectedReservation.status === 'cancellation_requested' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedReservation.status === 'confirmed' ? t('partner_dashboard.reservation_status_confirmed') : 
                   selectedReservation.status === 'pending' ? t('partner_dashboard.reservation_status_waiting') : 
                   selectedReservation.status === 'completed' ? t('partner_dashboard.reservation_status_completed') :
                   selectedReservation.status === 'cancellation_requested' ? t('partner_dashboard.reservation_cancellation_requested') :
                   t('partner_dashboard.reservation_status_cancelled')}
                </span>
              </div>

              <div className="pt-4 border-t border-line flex gap-2">
                {selectedReservation.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        handleStatusUpdate(selectedReservation.id, 'confirmed');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      {t('partner_dashboard.reservation_approve')}
                    </button>
                    <button 
                      onClick={() => {
                        handleStatusUpdate(selectedReservation.id, 'cancelled');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      {t('partner_dashboard.reservation_reject')}
                    </button>
                  </>
                )}
                {selectedReservation.status === 'cancellation_requested' && (
                  <>
                    <button 
                      onClick={() => {
                        handleCancellationAction(selectedReservation.id, 'approve');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      {t('partner_dashboard.reservation_cancel_approve')}
                    </button>
                    <button 
                      onClick={() => {
                        handleCancellationAction(selectedReservation.id, 'reject');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      {t('partner_dashboard.reservation_cancel_reject')}
                    </button>
                  </>
                )}
                {selectedReservation.status === 'confirmed' && (
                  <button 
                    onClick={() => {
                      handleStatusUpdate(selectedReservation.id, 'completed');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t('partner_dashboard.reservation_complete') || '완료 처리'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 예약 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          if (!isSaving) {
            setShowAddModal(false);
            setAddFormData({
              userName: '',
              userPhone: '',
              serviceName: '',
              date: '',
              time: '',
              price: '',
              notes: '',
            });
          }
        }}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{t('partner_dashboard.quick_action_manual_booking')}</h3>
              <button 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false);
                    setAddFormData({
                      userName: '',
                      userPhone: '',
                      serviceName: '',
                      date: '',
                      time: '',
                      price: '',
                      notes: '',
                    });
                  }
                }}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_customer_name')} *</label>
                <input 
                  type="text"
                  value={addFormData.userName}
                  onChange={(e) => setAddFormData({ ...addFormData, userName: e.target.value })}
                  placeholder={t('partner_dashboard.reservation_add_customer_name_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_contact')} *</label>
                <input 
                  type="tel"
                  value={addFormData.userPhone}
                  onChange={(e) => setAddFormData({ ...addFormData, userPhone: e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') })}
                  placeholder={t('partner_dashboard.reservation_add_contact_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_service')} *</label>
                <input 
                  type="text"
                  value={addFormData.serviceName}
                  onChange={(e) => setAddFormData({ ...addFormData, serviceName: e.target.value })}
                  placeholder={t('partner_dashboard.reservation_add_service_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_date')} *</label>
                  <input 
                    type="date"
                    value={addFormData.date}
                    onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    lang={language}
                    required
                    disabled={isSaving}
                  />
                  {addFormData.date && (
                    <p className="text-[12px] text-secondary mt-1">
                      {formatDateDisplay(addFormData.date)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_time')} *</label>
                  <input 
                    type="time"
                    value={addFormData.time}
                    onChange={(e) => setAddFormData({ ...addFormData, time: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_price')} *</label>
                <input 
                  type="text"
                  value={addFormData.price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setAddFormData({ ...addFormData, price: value });
                  }}
                  placeholder={t('partner_dashboard.reservation_add_price_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                />
                {addFormData.price && (
                  <p className="text-[12px] text-secondary mt-1">
                    {formatPrice(parseInt(addFormData.price || '0'))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.reservation_add_memo')}</label>
                <textarea 
                  value={addFormData.notes}
                  onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                  placeholder={t('partner_dashboard.reservation_add_memo_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac resize-none"
                  rows={3}
                  disabled={isSaving}
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (!isSaving) {
                      setShowAddModal(false);
                      setAddFormData({
                        userName: '',
                        userPhone: '',
                        serviceName: '',
                        date: '',
                        time: '',
                        price: '',
                        notes: '',
                      });
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-brand-lilac transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.reservation_adding')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t('partner_dashboard.reservation_add_button')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="p-8">로딩 중...</div>}>
      <ReservationsPageContent />
    </Suspense>
  );
}
