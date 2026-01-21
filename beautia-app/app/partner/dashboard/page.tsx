'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Users, DollarSign, ArrowRight, Sparkles, Clock, MessageSquare, ExternalLink, Loader2, CheckCircle2, AlertCircle, HelpCircle, ChevronDown, ChevronUp, BookOpen, Lightbulb, Zap, Percent, MapPin } from 'lucide-react';
import { PartnerApi } from '../../../lib/api';
import { DashboardStats, Reservation } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { requireAuth, getPartnerUser, type PartnerUser } from '../../../lib/auth';
import { useRouter } from 'next/navigation';

export default function PartnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<{
    connected: boolean;
    accountStatus: 'pending' | 'restricted' | 'enabled' | 'disabled' | null;
    isLoading: boolean;
  }>({
    connected: false,
    accountStatus: null,
    isLoading: true,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // AI Suggestion State
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    type: 'time_deal' | 'coupon' | 'ad';
    title: string;
    description: string;
    impact: string;
    actionLabel: string;
    actionUrl: string;
    icon: any;
    color: string;
  }>>([]);
  
  const { t, formatPrice } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // 인증 확인
    const partnerUser = requireAuth();
    if (!partnerUser) {
      return; // requireAuth가 리다이렉트 처리
    }
    setUser(partnerUser);
    async function fetchData() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          console.error('Partner info not found');
          setLoading(false);
          return;
        }

        const partnerId = partner.id;
        const [statsData, reservationsData, suggestionsData] = await Promise.all([
          PartnerApi.getStats(partnerId),
          PartnerApi.getReservations(partnerId),
          PartnerApi.getMarketingSuggestions(partnerId)
        ]);
        setStats(statsData);
        // reservationsData가 배열인지 확인하고, 최근 3개만 표시
        const reservations = Array.isArray(reservationsData) ? reservationsData : [];
        setRecentReservations(reservations.slice(0, 3));
        
        // API로부터 받은 제안 데이터 설정
        const mappedSuggestions = suggestionsData.map((s: any) => ({
          ...s,
          icon: s.icon === 'Clock' ? Clock : s.icon === 'MapPin' ? MapPin : s.icon === 'MessageSquare' ? MessageSquare : Lightbulb,
          type: s.type as 'time_deal' | 'coupon' | 'ad'
        }));
        setSuggestions(mappedSuggestions);
        
        // Stripe Connect 상태 조회
        await fetchStripeConnectStatus(partnerId);
        
        // Stripe 온보딩 완료 후 리다이렉트 처리
        const urlParams = new URLSearchParams(window.location.search);
        const stripeSuccess = urlParams.get('stripe_success');
        const stripeRefresh = urlParams.get('stripe_refresh');
        
        if (stripeSuccess === 'true') {
          // 상태 새로고침
          await fetchStripeConnectStatus(partnerId);
          // URL에서 쿼리 파라미터 제거
          window.history.replaceState({}, '', '/partner/dashboard');
        } else if (stripeRefresh === 'true') {
          await fetchStripeConnectStatus(partnerId);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fetchStripeConnectStatus = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/partner/stripe-connect/create-account?partnerId=${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Stripe Connect 상태:', data.data);
          setStripeConnectStatus({
            connected: data.data.connected || !!data.data.accountId,
            accountStatus: data.data.accountStatus || null,
            isLoading: false,
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Stripe Connect 상태 조회 실패:', errorData);
        setStripeConnectStatus(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Stripe Connect 상태 조회 실패:', error);
      setStripeConnectStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSetupSettlement = async () => {
    const partner = getPartnerUser();
    if (!partner) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/partner/stripe-connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.onboardingUrl) {
          // Stripe 온보딩 페이지로 리다이렉트
          window.location.href = data.data.onboardingUrl;
        } else {
          throw new Error(data.error || '정산 설정에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '정산 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('정산 설정 실패:', error);
      alert(error instanceof Error ? error.message : '정산 설정에 실패했습니다.');
      setIsConnecting(false);
    }
  };

  // 상태 텍스트 및 아이콘
  const getSettlementStatusDisplay = () => {
    // accountStatus가 있으면 connected로 간주 (계정이 생성되었으면)
    const isConnected = stripeConnectStatus.connected || stripeConnectStatus.accountStatus !== null;
    
    if (!isConnected || !stripeConnectStatus.accountStatus) {
      return {
        text: t('partner_dashboard.settlement_status_not_setup'),
        icon: AlertCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      };
    }
    
    switch (stripeConnectStatus.accountStatus) {
      case 'enabled':
        return {
          text: t('partner_dashboard.settlement_status_completed'),
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        };
      case 'pending':
        return {
          text: t('partner_dashboard.settlement_status_reviewing'),
          icon: Loader2,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        };
      case 'restricted':
      case 'disabled':
        return {
          text: t('partner_dashboard.settlement_status_reviewing'),
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        };
      default:
        return {
          text: t('partner_dashboard.settlement_status_not_setup'),
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
        };
    }
  };

  if (loading || !stats) {
    return <div className="p-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-gray-900">{t('partner.welcome')} 👋</h1>
        <p className="text-gray-500 text-[14px]">{t('partner.subtitle')}</p>
      </div>

      {/* 정산 설정 알림 배너 (미설정일 때만 표시) */}
      {!stripeConnectStatus.isLoading && (!stripeConnectStatus.accountStatus || stripeConnectStatus.accountStatus !== 'enabled') && (
        <div className="bg-gradient-to-r from-brand-lilac to-brand-pink rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-[14px] font-bold">{t('partner_dashboard.settlement_setup_banner_title')}</span>
                </div>
                <p className="text-[13px] text-white/90 mb-4">
                  {t('partner_dashboard.settlement_setup_banner_desc')}
                </p>
                <button
                  onClick={handleSetupSettlement}
                  disabled={isConnecting}
                  className="px-6 py-2.5 bg-white text-brand-lilac rounded-lg text-[14px] font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.settlement_setup_connecting')}
                    </>
                  ) : (
                    <>
                      {t('partner_dashboard.settlement_setup_button')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              {(() => {
                const statusDisplay = getSettlementStatusDisplay();
                const StatusIcon = statusDisplay.icon;
                return (
                  <div className={`px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg flex items-center gap-2`}>
                    <StatusIcon className={`w-4 h-4 ${statusDisplay.icon === Loader2 ? 'animate-spin' : ''}`} />
                    <span className="text-[12px] font-bold">{statusDisplay.text}</span>
                  </div>
                );
              })()}
            </div>
            
            {/* 가이드 토글 버튼 */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-[12px] font-medium hover:bg-white/30 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showGuide ? t('partner_dashboard.settlement_guide_hide') : t('partner_dashboard.settlement_guide_show')}
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {/* 정산 설정 가이드 */}
          {showGuide && (
            <div className="relative z-10 mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-[14px] mb-3">{t('partner_dashboard.settlement_guide_title')}</h4>
                  <div className="space-y-3 text-[13px] text-white/90">
                    <div>
                      <div className="font-bold mb-1">1. {t('partner_dashboard.settlement_guide_step1_title')}</div>
                      <p className="text-white/80">{t('partner_dashboard.settlement_guide_step1_desc')}</p>
                    </div>
                    <div>
                      <div className="font-bold mb-1">2. {t('partner_dashboard.settlement_guide_step2_title')}</div>
                      <p className="text-white/80">{t('partner_dashboard.settlement_guide_step2_desc')}</p>
                    </div>
                    <div>
                      <div className="font-bold mb-1">3. {t('partner_dashboard.settlement_guide_step3_title')}</div>
                      <p className="text-white/80">{t('partner_dashboard.settlement_guide_step3_desc')}</p>
                    </div>
                    <div className="pt-2 border-t border-white/20">
                      <div className="font-bold mb-1">💡 {t('partner_dashboard.settlement_guide_tip_title')}</div>
                      <p className="text-white/80">{t('partner_dashboard.settlement_guide_tip_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        </div>
      )}

      {/* AI Insight Banner */}
      {suggestions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-brand-lilac fill-brand-lilac" />
            <h3 className="text-[18px] font-bold text-gray-900">AI 마케팅 제안</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white rounded-2xl p-5 border border-brand-lilac/20 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-lilac/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-gray-50 ${suggestion.color}`}>
                      <suggestion.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-brand-lilac bg-brand-lilac/5 px-2 py-1 rounded-full">
                      {suggestion.impact}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-[16px] mb-1">{suggestion.title}</h4>
                  <p className="text-[13px] text-gray-600 mb-4 line-clamp-2">
                    {suggestion.description}
                  </p>
                  
                  <button 
                    onClick={() => router.push(suggestion.actionUrl)}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {suggestion.actionLabel} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-brand-lilac/20 to-brand-pink/20 rounded-2xl p-6 flex items-start justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-brand-lilac fill-brand-lilac" />
                 <span className="text-[12px] font-bold text-brand-lilac uppercase tracking-wider">AI Smart Assistant</span>
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-1" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.ai_insight_title') }} />
              <p className="text-[13px] text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.ai_insight_desc') }} />
              <button 
                 onClick={() => {
                    router.push('/partner/dashboard/promotions');
                 }}
                 className="px-4 py-2 bg-white rounded-lg text-[13px] font-bold text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
              >
                 {t('partner_dashboard.ai_insight_btn')}
              </button>
           </div>
           <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
            { label: t('partner.total_sales'), value: formatPrice(stats.totalSales), change: `+${stats.salesGrowth}%`, icon: DollarSign, color: 'text-brand-pink' },
            { label: t('partner.new_booking'), value: `${stats.reservationCount}`, change: `+${stats.reservationGrowth}%`, icon: Calendar, color: 'text-brand-mint' },
            { label: t('partner.visitors'), value: `${stats.customerCount}`, change: '+3.2%', icon: Users, color: 'text-brand-lilac' },
            { label: t('partner.new_review'), value: `${stats.reviewCount}`, change: '+12%', icon: MessageSquare, color: 'text-blue-500' },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                     <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
               </div>
               <div className="text-[13px] text-gray-500 font-medium mb-1">{stat.label}</div>
               <div className="text-[24px] font-bold text-gray-900">{stat.value}</div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Upcoming Reservations */}
         <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-900">{t('partner_dashboard.reservations_title')}</h3>
               <button 
                  onClick={() => router.push('/partner/dashboard/reservations')}
                  className="text-[13px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
               >
                  {t('partner_dashboard.reservations_view_all')} <ArrowRight className="w-3 h-3" />
               </button>
            </div>
            <div className="space-y-4">
               {recentReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">{t('partner_dashboard.reservations_empty')}</div>
               ) : (
                  recentReservations.map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[18px]">
                             {res.status === 'confirmed' ? '✅' : '⏳'}
                          </div>
                          <div>
                             <div className="font-bold text-gray-900">{res.userName} <span className="font-normal text-gray-400 text-[13px]">({res.userPhone.slice(-4)})</span></div>
                             <div className="text-[13px] text-gray-500 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[11px] font-medium">{res.serviceName}</span>
                                <span>{res.date} {res.time}</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="font-bold text-brand-pink mb-1">{formatPrice(res.price)}</div>
                          <div className="text-[11px] text-gray-400">{res.status === 'confirmed' ? t('partner_dashboard.reservation_status_confirmed') : t('partner_dashboard.reservation_status_pending')}</div>
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>

         {/* Quick Actions */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-6">{t('partner_dashboard.quick_actions_title')}</h3>

            <div className="grid grid-cols-2 gap-3">
               {[
                  { 
                    label: t('partner_dashboard.quick_action_manual_booking'), 
                    icon: Calendar,
                    onClick: () => router.push('/partner/dashboard/reservations?action=add')
                  },
                  { 
                    label: t('partner_dashboard.quick_action_holiday'), 
                    icon: Clock,
                    onClick: () => router.push('/partner/dashboard/settings?tab=general')
                  },
                  { 
                    label: t('partner_dashboard.quick_action_promotion'), 
                    icon: Sparkles,
                    onClick: () => router.push('/partner/dashboard/marketing?action=promotion')
                  },
                  { 
                    label: t('partner_dashboard.quick_action_settlement'), 
                    icon: DollarSign, 
                    onClick: () => router.push('/partner/dashboard/finance'),
                    badge: stripeConnectStatus.accountStatus === 'enabled' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
                    ) : null
                  },
               ].map((action, i) => (
                  <button 
                    key={i} 
                    onClick={action.onClick || (() => {})}
                    className="relative flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-brand-lilac hover:bg-brand-lilac/5 transition-all group"
                  >
                     {action.badge}
                     <action.icon className="w-6 h-6 text-gray-400 group-hover:text-brand-lilac mb-2 transition-colors" />
                     <span className="text-[13px] font-medium text-gray-600 group-hover:text-brand-lilac">{action.label}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
