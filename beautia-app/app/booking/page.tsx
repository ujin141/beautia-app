'use client';

import React, { useState, useEffect, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Star, 
  CheckCircle2, Loader2, AlertCircle, User, Phone,
  ChevronRight, Sparkles, CreditCard, Wallet, Smartphone
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { getCustomerUser, isCustomerLoggedIn, type CustomerUser } from '../../lib/auth';
import { Shop, Service } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PublicApi } from '../../lib/api';

type Step = 'shop' | 'service' | 'datetime' | 'confirm' | 'payment';
type PaymentMethod = 'card' | 'account' | 'easy' | null;

function BookingContent() {
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get('shopId');
  const serviceIdParam = searchParams.get('serviceId');
  const { t, formatPrice, language, currency } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState<Step>('shop');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  
  // 언어에 맞는 통화 자동 설정 (LanguageContext에서 가져옴)
  const selectedCurrency = currency.toLowerCase() as 'krw' | 'usd' | 'jpy' | 'eur' | 'thb' | 'cny';


  // 로그인 확인 및 사용자 정보 로드
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      const message = t('booking.login_required');
      if (confirm(message)) {
        window.location.href = '/customer/login';
      } else {
        window.location.href = '/';
      }
      return;
    }

    const user = getCustomerUser();
    if (user) {
      setCustomer(user);
      setUserName(user.name);
      setUserPhone(user.phone || '');
    }
  }, []);

  // 매장 목록 로드
  useEffect(() => {
    async function loadShops() {
      if (currentStep === 'shop' && shops.length === 0) {
        try {
          setShopsLoading(true);
          const data = await PublicApi.getTrendingShops({ limit: 50 });
          setShops(data);
        } catch (error) {
          console.error('매장 목록 로드 오류:', error);
        } finally {
          setShopsLoading(false);
        }
      }
    }
    loadShops();
  }, [currentStep]);

  // URL 파라미터에서 매장/서비스 정보 로드
  useEffect(() => {
    async function loadShopAndService() {
      if (shopIdParam && serviceIdParam) {
        try {
          const shop = await PublicApi.getShop(shopIdParam);
          if (shop) {
            setSelectedShop(shop);
            const service = shop.services.find(s => s.id === serviceIdParam);
            if (service) {
              setSelectedService(service);
              // 매장과 서비스가 이미 선택되어 있으면 서비스 선택 단계로 시작
              setCurrentStep('datetime');
            }
          }
        } catch (error) {
          console.error('매장 정보 로드 오류:', error);
        }
      }
    }
    loadShopAndService();
  }, [shopIdParam, serviceIdParam]);

  // 날짜 선택 (오늘부터 30일 후까지)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // 시간 선택 (9시부터 18시까지, 30분 단위)
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 9; hour < 18; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 'shop' && selectedShop) {
      setCurrentStep('service');
    } else if (currentStep === 'service' && selectedService) {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime' && selectedDate && selectedTime) {
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      setCurrentStep('payment');
    }
  };

  const handleBack = () => {
    if (currentStep === 'service') {
      setCurrentStep('shop');
    } else if (currentStep === 'datetime') {
      setCurrentStep('service');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirm');
    }
  };

  // 예약 생성 (결제 전)
  const handleCreateBooking = async () => {
    if (!selectedShop || !selectedService || !selectedDate || !selectedTime || !userName || !userPhone) {
      setError(t('booking.all_fields_required'));
      return;
    }

    if (!customer) {
      setError(t('booking.login_info_missing'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: customer.id,
          userName,
          userPhone,
          shopId: selectedShop.id,
          shopName: selectedShop.name,
          partnerId: selectedShop.partnerId,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          price: selectedService.price,
        }),
      });

      // 응답 본문 안전하게 파싱
      const responseText = await response.text();
      let data: any = {};
      
      try {
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error(`서버 응답을 처리할 수 없습니다. 상태: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || t('booking.booking_failed'));
      }

      if (data.success && data.booking) {
        setBookingId(data.booking.id);
        setCurrentStep('payment');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('booking.booking_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 결제 처리
  const handlePayment = async () => {
    if (!bookingId || !selectedPaymentMethod) {
      setError(t('booking.select_payment_method_error'));
      return;
    }

    if (!selectedService || !customer) {
      setError(t('booking.payment_info_missing'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Stripe 결제 (카드 결제인 경우)
      if (selectedPaymentMethod === 'card') {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            userId: customer.id,
            currency: selectedCurrency, // 언어에 맞는 통화 자동 사용
          }),
        });

        // 응답 본문 확인
        const responseText = await response.text();
        let data: any = {};
        
        try {
          // 응답이 비어있지 않으면 JSON 파싱 시도
          if (responseText.trim()) {
            data = JSON.parse(responseText);
          } else {
            console.warn('서버 응답이 비어있습니다.');
            data = { error: '서버 응답이 없습니다.' };
          }
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          console.error('응답 본문 (원문):', responseText);
          console.error('응답 상태:', response.status, response.statusText);
          data = { 
            error: '서버 응답을 파싱할 수 없습니다.',
            responseText: responseText.substring(0, 500)
          };
        }

        if (!response.ok) {
          // 상세 오류 메시지 구성
          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            error: data.error || '알 수 없는 오류',
            message: data.message,
            details: data.details,
            responseText: responseText ? responseText.substring(0, 500) : '(응답 없음)',
            hasData: Object.keys(data).length > 0,
          };
          
          console.error('Stripe 결제 세션 생성 오류:', errorDetails);
          
          // 사용자에게 표시할 오류 메시지
          let errorMsg = data.message || data.error;
          
          if (!errorMsg) {
            if (response.status === 500) {
              errorMsg = '서버 오류가 발생했습니다. 관리자에게 문의하세요.';
            } else if (response.status === 400) {
              errorMsg = '잘못된 요청입니다. 페이지를 새로고침하고 다시 시도해주세요.';
            } else {
              errorMsg = `결제 세션 생성 실패 (상태: ${response.status})`;
            }
          }
          
          // 개발 환경에서는 상세 정보도 포함
          if (process.env.NODE_ENV === 'development' && data.details) {
            errorMsg += `\n\n상세 정보:\n${JSON.stringify(data.details, null, 2)}`;
          }
          
          throw new Error(errorMsg);
        }

        if (data.success && data.url) {
          // Stripe Checkout 페이지로 리다이렉트
          window.location.href = data.url;
          return;
        } else {
          throw new Error('결제 세션 생성은 성공했지만 URL을 받지 못했습니다.');
        }
      } else {
        // 기존 결제 방식 (계좌이체, 간편결제 등)
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            userId: customer.id,
            amount: selectedService.price,
            method: selectedPaymentMethod,
            paymentMethodDetail: selectedPaymentMethod === 'account' ? '계좌이체' : undefined,
          }),
        });

      // 응답 본문 안전하게 파싱
      const responseText = await response.text();
      let data: any = {};
      
      try {
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error(`서버 응답을 처리할 수 없습니다. 상태: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || t('booking.payment_failed'));
      }

        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/customer/profile';
          }, 2000);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('booking.payment_failed');
      setError(errorMessage);
      console.error('결제 처리 오류:', error);
    } finally {
      setIsSubmitting(false);
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
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (!customer) {
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

  if (success) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <main className="pt-[100px] pb-20 px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-[32px] font-bold mb-4">{t('booking.success_title')}</h2>
            <p className="text-secondary mb-8">{t('booking.success_desc')}</p>
            <Link
              href="/customer/profile"
              className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-colors"
            >
              {t('booking.view_bookings')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      
      <main className="pt-[100px] pb-20 px-6">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[14px]">{t('booking.home')}</span>
            </Link>
            <h1 className="text-[32px] md:text-[40px] font-bold mb-2">{t('booking.title')}</h1>
            <p className="text-secondary text-[15px]">{t('booking.subtitle')}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 bg-white rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between w-full">
              {[t('booking.step_shop'), t('booking.step_service'), t('booking.step_datetime'), t('booking.step_confirm'), t('booking.step_payment')].map((label, index) => {
                const stepIndex = ['shop', 'service', 'datetime', 'confirm', 'payment'].indexOf(currentStep);
                const isActive = index <= stepIndex;
                const isCompleted = index < stepIndex;
                return (
                  <Fragment key={index}>
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all shrink-0 ${
                        isActive 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-surface text-secondary'
                      }`}>
                        {isCompleted || (isActive && index === stepIndex) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className={`mt-2 text-[12px] font-medium whitespace-nowrap ${isActive ? 'text-primary font-semibold' : 'text-secondary'}`}>
                        {label}
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`flex-1 h-[2px] mx-3 md:mx-4 transition-all ${isActive ? 'bg-primary' : 'bg-line'}`} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-red-700 text-[14px]">{error}</div>
            </motion.div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-2xl border border-line p-6 md:p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Shop Selection */}
              {currentStep === 'shop' && (
                <motion.div
                  key="shop"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-[24px] font-bold mb-6">매장을 선택하세요</h2>
                  {shopsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-lilac mx-auto mb-4" />
                      <p className="text-secondary">{t('common.loading')}</p>
                    </div>
                  ) : shops.length === 0 ? (
                    <div className="text-center py-12 text-secondary">{t('ranking.no_data')}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shops.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => {
                          setSelectedShop(shop);
                          setSelectedService(null); // 매장 변경 시 서비스 초기화
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedShop?.id === shop.id
                            ? 'border-primary bg-brand-lilac/5 shadow-lg'
                            : 'border-line hover:border-brand-lilac/50'
                        }`}
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-[16px] mb-1">{shop.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-[13px] font-medium">{shop.rating}</span>
                          <span className="text-[12px] text-secondary">({shop.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-secondary mb-2">
                          <MapPin className="w-3 h-3" />
                          {shop.address}
                        </div>
                        <p className="text-[13px] text-secondary">{shop.description}</p>
                      </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 'service' && selectedShop && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-6">
                    <h2 className="text-[24px] font-bold mb-2">{t('booking.select_service')}</h2>
                    <p className="text-secondary text-[14px]">{selectedShop.name}</p>
                  </div>
                  <div className="space-y-3">
                    {selectedShop.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          selectedService?.id === service.id
                            ? 'border-primary bg-brand-lilac/5 shadow-lg'
                            : 'border-line hover:border-brand-lilac/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[16px] mb-1">{service.name}</h3>
                            <div className="flex items-center gap-4 text-[13px] text-secondary">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {service.duration}분
                              </span>
                              <span className="font-bold text-primary">{formatPrice(service.price)}</span>
                            </div>
                          </div>
                          {selectedService?.id === service.id && (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Date & Time Selection */}
              {currentStep === 'datetime' && selectedService && (
                <motion.div
                  key="datetime"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h2 className="text-[24px] font-bold mb-2">{t('booking.select_datetime')}</h2>
                    <p className="text-secondary text-[14px]">{selectedService.name}</p>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-[14px] font-bold text-secondary mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('booking.step_datetime')}
                    </label>
                    <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
                      {getAvailableDates().map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              selectedDate === dateStr
                                ? 'border-primary bg-brand-lilac/5'
                                : 'border-line hover:border-brand-lilac/50'
                            }`}
                          >
                            <div className="text-[11px] text-secondary mb-1">
                              {date.toLocaleDateString(localeMap[language] || 'ko-KR', { weekday: 'short' })}
                            </div>
                            <div className={`text-[16px] font-bold ${isToday ? 'text-primary' : ''}`}>
                              {date.getDate()}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-[14px] font-bold text-secondary mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t('booking.datetime_label')}
                      </label>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {getAvailableTimes().map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-xl border-2 transition-all font-medium ${
                              selectedTime === time
                                ? 'border-primary bg-brand-lilac/5'
                                : 'border-line hover:border-brand-lilac/50'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="pt-6 border-t border-line space-y-4">
                    <h3 className="text-[16px] font-bold">{t('booking.contact_label')}</h3>
                    <div>
                      <label className="block text-[13px] font-bold text-secondary mb-2">{t('booking.name_label')}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full h-[52px] pl-12 pr-4 rounded-xl border-2 border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                          placeholder={t('booking.name_placeholder')}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-secondary mb-2">{t('booking.phone_label')}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                        <input
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full h-[52px] pl-12 pr-4 rounded-xl border-2 border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                          placeholder={t('booking.phone_placeholder')}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 'confirm' && selectedShop && selectedService && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-brand-lilac" />
                    <h2 className="text-[24px] font-bold">{t('booking.confirm_title')}</h2>
                  </div>

                  <div className="bg-surface rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[12px] text-secondary mb-1">{t('booking.shop_label')}</div>
                        <div className="font-bold text-[16px]">{selectedShop.name}</div>
                        <div className="text-[13px] text-secondary mt-1">{selectedShop.address}</div>
                      </div>
                    </div>

                    <div className="border-t border-line pt-4">
                      <div className="text-[12px] text-secondary mb-1">{t('booking.service_label')}</div>
                      <div className="font-bold text-[16px] mb-2">{selectedService.name}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-secondary">{t('booking.duration')}: {selectedService.duration}{t('booking.minutes')}</span>
                        <span className="font-bold text-[18px] text-primary">{formatPrice(selectedService.price)}</span>
                      </div>
                    </div>

                    <div className="border-t border-line pt-4">
                      <div className="text-[12px] text-secondary mb-1">{t('booking.datetime_label')}</div>
                      <div className="font-bold text-[16px]">
                        {formatDate(selectedDate)} {selectedTime}
                      </div>
                    </div>

                    <div className="border-t border-line pt-4">
                      <div className="text-[12px] text-secondary mb-1">{t('booking.contact_label')}</div>
                      <div className="font-medium text-[14px]">{userName}</div>
                      <div className="text-[13px] text-secondary">{userPhone}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[12px] text-blue-800">
                      <div className="font-bold mb-1">{t('booking.notice_title')}</div>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>{t('booking.notice_1')}</li>
                        <li>{t('booking.notice_2')}</li>
                        <li>{t('booking.notice_3')}</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Payment */}
              {currentStep === 'payment' && selectedService && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-brand-lilac" />
                    <h2 className="text-[24px] font-bold">{t('booking.payment_title')}</h2>
                  </div>

                  {/* 결제 금액 요약 */}
                  <div className="bg-surface rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-secondary">{t('booking.service_amount')}</span>
                      <span className="font-medium text-[16px]">{formatPrice(selectedService.price)}</span>
                    </div>
                    <div className="border-t border-line pt-3 flex items-center justify-between">
                      <span className="font-bold text-[18px]">{t('booking.total_amount')}</span>
                      <span className="font-bold text-[24px] text-primary">{formatPrice(selectedService.price)}</span>
                    </div>
                    <div className="text-[11px] text-secondary text-center pt-2 border-t border-line">
                      {currency !== 'KRW' && `결제는 ${currency}로 진행됩니다.`}
                    </div>
                  </div>

                  {/* 결제 수단 선택 */}
                  <div>
                    <h3 className="text-[16px] font-bold mb-4">{t('booking.select_payment_method')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPaymentMethod === 'card'
                            ? 'border-primary bg-brand-lilac/5 shadow-lg'
                            : 'border-line hover:border-brand-lilac/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedPaymentMethod === 'card' ? 'bg-primary text-white' : 'bg-surface text-secondary'
                          }`}>
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-bold text-[16px]">{t('booking.card')}</div>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Stripe</span>
                            </div>
                            <div className="text-[12px] text-secondary">{t('booking.card_desc') || '신용카드 결제 (Visa, Master, AMEX)'}</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('account')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPaymentMethod === 'account'
                            ? 'border-primary bg-brand-lilac/5 shadow-lg'
                            : 'border-line hover:border-brand-lilac/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedPaymentMethod === 'account' ? 'bg-primary text-white' : 'bg-surface text-secondary'
                          }`}>
                            <Wallet className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-[16px] mb-1">{t('booking.account')}</div>
                            <div className="text-[12px] text-secondary">{t('booking.account_desc')}</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('easy')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPaymentMethod === 'easy'
                            ? 'border-primary bg-brand-lilac/5 shadow-lg'
                            : 'border-line hover:border-brand-lilac/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedPaymentMethod === 'easy' ? 'bg-primary text-white' : 'bg-surface text-secondary'
                          }`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-[16px] mb-1">{t('booking.easy')}</div>
                            <div className="text-[12px] text-secondary">{t('booking.easy_desc')}</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 결제 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[12px] text-blue-800">
                      <div className="font-bold mb-1">{t('booking.payment_notice_title')}</div>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>{t('booking.payment_notice_1')}</li>
                        <li>{t('booking.payment_notice_2')}</li>
                        <li>{t('booking.payment_notice_3')}</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-line">
              {currentStep !== 'shop' ? (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-line hover:bg-surface transition-colors font-medium"
                >
                  {t('booking.prev')}
                </button>
              ) : (
                <div />
              )}

              {currentStep === 'confirm' ? (
                <button
                  onClick={handleCreateBooking}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('booking.creating')}
                    </>
                  ) : (
                    <>
                      {t('booking.next')}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : currentStep === 'payment' ? (
                <button
                  onClick={handlePayment}
                  disabled={isSubmitting || !selectedPaymentMethod}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-lilac to-brand-pink text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('booking.paying')}
                    </>
                  ) : (
                    <>
                      {formatPrice(selectedService?.price || 0)} {t('booking.pay_button')}
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'shop' && !selectedShop) ||
                    (currentStep === 'service' && !selectedService) ||
                    (currentStep === 'datetime' && (!selectedDate || !selectedTime || !userName || !userPhone))
                  }
                  className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {t('booking.next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-lilac border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
