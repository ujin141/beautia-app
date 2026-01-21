'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  Edit2, Save, X, LogOut, Shield, 
  Clock, CheckCircle, XCircle, Loader2,
  ArrowLeft, Settings
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { getCustomerUser, isCustomerLoggedIn, logoutCustomer, type CustomerUser } from '../../../lib/auth';
import { Reservation } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function CustomerProfilePage() {
  const { t, formatPrice: formatPriceI18n, language } = useLanguage();
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // 인증 확인 및 데이터 로드
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      window.location.href = '/customer/login';
      return;
    }

    const customer = getCustomerUser();
    if (customer) {
      setUser(customer);
      setEditData({
        name: customer.name,
        phone: customer.phone || '',
      });
      
      // 서버에서 최신 프로필 정보 가져오기
      loadCustomerProfile(customer.id, customer.email);
      
      // 예약 내역 로드
      loadReservations(customer.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadCustomerProfile = async (userId?: string, email?: string) => {
    if (!userId && !email) return;

    try {
      const url = userId 
        ? `/api/customer/profile?userId=${userId}`
        : `/api/customer/profile?email=${encodeURIComponent(email || '')}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        const profileData = data.data;
        setUser({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          phone: profileData.phone || '',
          role: 'user' as const,
          joinDate: profileData.joinDate,
          status: 'active' as const,
        });
        setEditData({
          name: profileData.name,
          phone: profileData.phone || '',
        });
        
        // localStorage 업데이트
        localStorage.setItem('customer_user', JSON.stringify({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          phone: profileData.phone || '',
          role: 'user',
          joinDate: profileData.joinDate,
          status: 'active',
        }));
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async (userId?: string) => {
    if (!userId) {
      setReservationsLoading(false);
      return;
    }
    
    setReservationsLoading(true);
    try {
      const response = await fetch(`/api/bookings?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReservations(data.data || []);
        } else {
          setError(data.error || t('profile.load_error') || '예약 내역을 불러오는데 실패했습니다.');
        }
      } else {
        const data = await response.json();
        setError(data.error || t('profile.load_error') || '예약 내역을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 내역 로드 오류:', error);
      setError(t('profile.load_error') || '예약 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: editData.name,
          phone: editData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // localStorage 업데이트
        const updatedUser = {
          ...user,
          name: data.data.name,
          phone: data.data.phone || '',
        };
        localStorage.setItem('customer_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
      } else {
        setError(data.error || t('profile.update_failed'));
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setError(t('profile.update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name,
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  const handleLogout = () => {
    if (confirm(t('profile.logout_confirm'))) {
      logoutCustomer();
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm(t('profile.cancel_reservation_confirm') || '예약을 취소하시겠습니까?')) {
      return;
    }

    setCancellingId(reservationId);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 예약 목록 새로고침
        if (user) {
          loadReservations(user.id);
        }
        alert(t('profile.reservation_cancelled') || '예약이 취소되었습니다.');
      } else {
        setError(data.error || t('profile.cancel_failed') || '예약 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 취소 오류:', error);
      setError(t('profile.cancel_failed') || '예약 취소 중 오류가 발생했습니다.');
    } finally {
      setCancellingId(null);
    }
  };

  const localeMap: { [key: string]: string } = {
    'ko': 'ko-KR',
    'en': 'en-US',
    'ja': 'ja-JP',
    'th': 'th-TH',
    'zh': 'zh-CN'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(localeMap[language] || 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return formatPriceI18n(price);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('profile.status_pending'),
      confirmed: t('profile.status_confirmed'),
      completed: t('profile.status_completed'),
      cancelled: t('profile.status_cancelled'),
      noshow: t('profile.status_noshow'),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      noshow: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-lilac" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      
      <main className="pt-[100px] pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[14px]">{t('profile.home')}</span>
            </Link>
            <h1 className="text-[32px] md:text-[40px] font-bold mb-2">{t('profile.title')}</h1>
            <p className="text-secondary text-[15px]">{t('profile.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Profile Info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-line p-6 sticky top-24"
              >
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-lilac to-brand-pink flex items-center justify-center text-white font-bold text-[32px] mb-4 shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-[20px] font-bold mb-1">{user.name}</h2>
                  <p className="text-[13px] text-secondary">{user.email}</p>
                </div>

                {/* Account Status */}
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg mb-6">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-[12px] font-medium text-green-700">{t('profile.account_active')}</span>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[14px] font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('profile.logout')}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-line p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[20px] font-bold">{t('profile.basic_info')}</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-surface transition-colors text-[14px] font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('profile.edit')}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line hover:bg-surface transition-colors text-[14px] font-medium disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        {t('profile.cancel')}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-opacity-90 transition-colors text-[14px] font-medium disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {t('profile.save')}
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-secondary mb-2">{t('profile.email')}</label>
                    <div className="flex items-center gap-3 px-4 h-[52px] bg-surface rounded-xl">
                      <Mail className="w-5 h-5 text-secondary/50" />
                      <span className="text-[15px] font-medium">{user.email}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-secondary">{t('profile.email_cannot_change')}</p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-secondary mb-2">{t('profile.name')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full h-[52px] px-4 rounded-xl border-2 border-brand-lilac bg-white focus:outline-none focus:ring-2 focus:ring-brand-lilac/20"
                        placeholder={t('profile.name_placeholder')}
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 h-[52px] bg-surface rounded-xl">
                        <User className="w-5 h-5 text-secondary/50" />
                        <span className="text-[15px] font-medium">{user.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-secondary mb-2">{t('profile.phone')}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full h-[52px] px-4 rounded-xl border-2 border-brand-lilac bg-white focus:outline-none focus:ring-2 focus:ring-brand-lilac/20"
                        placeholder={t('profile.phone_placeholder')}
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 h-[52px] bg-surface rounded-xl">
                        <Phone className="w-5 h-5 text-secondary/50" />
                        <span className="text-[15px] font-medium">{user.phone || t('profile.phone_not_registered')}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-secondary mb-2">{t('profile.join_date')}</label>
                    <div className="flex items-center gap-3 px-4 h-[52px] bg-surface rounded-xl">
                      <Calendar className="w-5 h-5 text-secondary/50" />
                      <span className="text-[15px] font-medium">{formatDate(user.joinDate)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Reservations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-line p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[20px] font-bold">{t('profile.reservations')}</h3>
                  <span className="text-[13px] text-secondary">
                    {t('profile.reservations_count')?.replace('{count}', (reservations?.length || 0).toString()) || `총 ${reservations?.length || 0}건`}
                  </span>
                </div>

                {error && !reservationsLoading && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-[13px] text-yellow-700">
                    {error}
                  </div>
                )}

                {reservationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-lilac" />
                  </div>
                ) : !reservations || reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                    <p className="text-secondary text-[14px]">{t('profile.no_reservations')}</p>
                  </div>
                ) : reservations && reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border border-line rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-[16px] mb-1">{reservation.shopName}</h4>
                            <p className="text-[14px] text-secondary mb-2">{reservation.serviceName}</p>
                            <div className="flex items-center gap-4 text-[12px] text-secondary">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(reservation.date)} {reservation.time}
                              </span>
                              <span className="font-semibold text-primary">{formatPrice(reservation.price)}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusColor(reservation.status)}`}>
                            {getStatusLabel(reservation.status)}
                          </span>
                        </div>
                        {reservation.status === 'pending' && (
                          <div className="mt-3 pt-3 border-t border-line flex gap-2">
                            <button
                              onClick={() => {
                                // 예약 변경 - 예약 페이지로 이동
                                window.location.href = `/booking?shopId=${reservation.shopId}&serviceId=${reservation.serviceId}`;
                              }}
                              className="flex-1 px-4 py-2 rounded-lg border border-line hover:bg-surface transition-colors text-[13px] font-medium"
                            >
                              {t('profile.change_reservation')}
                            </button>
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={cancellingId === reservation.id}
                              className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {cancellingId === reservation.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t('profile.cancelling') || '취소 중...'}
                                </>
                              ) : (
                                t('profile.cancel_reservation')
                              )}
                            </button>
                          </div>
                        )}
                        {reservation.status === 'confirmed' && (
                          <div className="mt-3 pt-3 border-t border-line flex gap-2">
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={cancellingId === reservation.id}
                              className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {cancellingId === reservation.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t('profile.cancelling') || '취소 중...'}
                                </>
                              ) : (
                                t('profile.cancel_reservation')
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
