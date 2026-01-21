'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Download, AlertCircle, CreditCard, Loader2, X, CheckCircle2, ExternalLink, ArrowRight, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';

interface FinanceData {
  nextSettlement: {
    amount: number;
    date: string;
  };
  monthlySales: number;
  totalPayments: number;
  unsettledBalance: number;
  settlements: Array<{
    date: string;
    period: string;
    total: number;
    fee: number;
    final: number;
    status: string;
  }>;
}

interface StripeConnectInfo {
  connected: boolean;
  accountId: string | null;
  accountStatus: 'pending' | 'restricted' | 'enabled' | 'disabled' | null;
  email?: string;
  country?: string;
}

export default function FinancePage() {
  const { t, formatPrice } = useLanguage();
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [stripeConnectInfo, setStripeConnectInfo] = useState<StripeConnectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          setLoading(false);
          return;
        }

        const [financeResponse, stripeResponse] = await Promise.all([
          fetch(`/api/partner/finance?partnerId=${partner.id}`),
          fetch(`/api/partner/stripe-connect/create-account?partnerId=${partner.id}`)
        ]);

        if (financeResponse.ok) {
          const financeData = await financeResponse.json();
          if (financeData.success) {
            setFinanceData(financeData.data);
          }
        }

        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          if (stripeData.success) {
            console.log('Stripe Connect 상태 (Finance):', stripeData.data);
            setStripeConnectInfo(stripeData.data);
          } else {
            // 성공 응답이지만 success가 false인 경우
            console.warn('Stripe Connect 상태 조회 실패 (Finance):', stripeData);
            // 기본값 설정
            setStripeConnectInfo({
              connected: false,
              accountId: null,
              accountStatus: null,
            });
          }
        } else {
          // 실패 응답 처리 - JSON 파싱 전에 상태 확인
          try {
            const contentType = stripeResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await stripeResponse.json();
              console.error('Stripe Connect 상태 조회 실패 (Finance):', errorData);
            } else {
              const errorText = await stripeResponse.text();
              console.error('Stripe Connect 상태 조회 실패 (Finance):', {
                status: stripeResponse.status,
                statusText: stripeResponse.statusText,
                body: errorText,
              });
            }
          } catch (error) {
            console.error('Stripe Connect 응답 파싱 실패 (Finance):', error);
          }
          // 기본값 설정
          setStripeConnectInfo({
            connected: false,
            accountId: null,
            accountStatus: null,
          });
        }

        // Stripe 온보딩 완료 후 리다이렉트 처리
        const urlParams = new URLSearchParams(window.location.search);
        const stripeSuccess = urlParams.get('stripe_success');
        const stripeRefresh = urlParams.get('stripe_refresh');
        
        if (stripeSuccess === 'true') {
          // 상태 새로고침
          const refreshResponse = await fetch(`/api/partner/stripe-connect/create-account?partnerId=${partner.id}`);
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setStripeConnectInfo(refreshData.data);
            }
          }
          // URL에서 쿼리 파라미터 제거
          window.history.replaceState({}, '', '/partner/dashboard/finance');
        } else if (stripeRefresh === 'true') {
          const refreshResponse = await fetch(`/api/partner/stripe-connect/create-account?partnerId=${partner.id}`);
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setStripeConnectInfo(refreshData.data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  const getSettlementStatusDisplay = () => {
    // accountStatus가 있으면 connected로 간주 (계정이 생성되었으면)
    const isConnected = stripeConnectInfo?.connected || stripeConnectInfo?.accountStatus !== null;
    
    if (!isConnected || !stripeConnectInfo?.accountStatus) {
      return {
        text: t('partner_dashboard.settlement_status_not_setup'),
        icon: AlertCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      };
    }
    
    switch (stripeConnectInfo.accountStatus) {
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
  
  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-lilac" /></div>;
  }

  if (!financeData) {
    return <div className="p-8 text-secondary">{t('common.error') || '데이터를 불러올 수 없습니다.'}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.finance_title')}</h2>
         <button 
           onClick={() => {
             // 정산 내역 다운로드
             const csvContent = `정산일,기간,총 매출,수수료,실제 지급액,상태\n${financeData.settlements.map(s => `${s.date},${s.period},${s.total},${s.fee},${s.final},${s.status}`).join('\n')}`;
             const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
             const link = document.createElement('a');
             link.href = URL.createObjectURL(blob);
             link.download = `정산내역_${new Date().toISOString().split('T')[0]}.csv`;
             link.click();
           }}
           className="flex items-center gap-2 px-4 py-2 bg-white border border-line rounded-xl text-[14px] font-medium hover:bg-surface"
         >
            <Download className="w-4 h-4" /> {t('partner_dashboard.finance_download')}
         </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-primary text-white p-6 rounded-2xl">
            <div className="text-[14px] opacity-70 mb-2">{t('partner_dashboard.finance_next_settlement')}</div>
            <div className="text-[32px] font-bold">{formatPrice(financeData.nextSettlement.amount)}</div>
            <div className="text-[13px] opacity-70 mt-2">
               {t('partner_dashboard.finance_after_fee')}
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-line">
            <div className="text-[14px] text-secondary mb-2">{t('partner_dashboard.finance_monthly_sales')}</div>
            <div className="text-[32px] font-bold">{formatPrice(financeData.monthlySales)}</div>
            <div className="text-[13px] text-secondary mt-2">
               {t('partner_dashboard.finance_total_payments')} {financeData.totalPayments}
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-line">
            <div className="text-[14px] text-secondary mb-2">{t('partner_dashboard.finance_unsettled')}</div>
            <div className="text-[32px] font-bold text-brand-lilac">{formatPrice(financeData.unsettledBalance)}</div>
            <div className="text-[13px] text-secondary mt-2">
               {t('partner_dashboard.finance_unconfirmed')}
            </div>
         </div>
      </div>

      {/* Settlement History */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
         <div className="p-6 border-b border-line flex justify-between items-center">
            <h3 className="font-bold text-[18px]">{t('partner_dashboard.finance_recent_settlements')}</h3>
            <button className="text-[13px] text-secondary underline">{t('partner_dashboard.finance_view_all')}</button>
         </div>
         <table className="w-full text-left">
            <thead className="bg-surface text-[13px] text-secondary font-bold uppercase">
               <tr>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_payment_date')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_settlement_period')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_total_sales')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_fee_deduction')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_actual_payment')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.finance_status')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-line">
               {financeData.settlements.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="text-center py-8 text-secondary">
                        {t('partner_dashboard.reservations_empty')}
                     </td>
                  </tr>
               ) : (
                  financeData.settlements.map((item, i) => (
                     <tr key={i} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{item.date.replace(/-/g, '.')}</td>
                        <td className="px-6 py-4 text-secondary text-[14px]">{item.period}</td>
                        <td className="px-6 py-4">{formatPrice(item.total)}</td>
                        <td className="px-6 py-4 text-red-500">- {formatPrice(item.fee)}</td>
                        <td className="px-6 py-4 font-bold text-primary">{formatPrice(item.final)}</td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[12px] font-bold">{t('partner_dashboard.finance_paid')}</span>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* 정산 계좌 설정 섹션 */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="p-6 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[18px]">{t('partner_dashboard.finance_account_info')}</h3>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-secondary hover:text-brand-lilac hover:bg-brand-lilac/5 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showGuide ? t('partner_dashboard.settlement_guide_hide') : t('partner_dashboard.settlement_guide_show')}
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[13px] text-secondary">
            {t('partner_dashboard.settlement_setup_desc')}
          </p>
        </div>

        {/* 정산 설정 가이드 */}
        {showGuide && (
          <div className="p-6 bg-blue-50 border-b border-line">
            <div className="flex items-start gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-[14px] mb-3 text-blue-900">{t('partner_dashboard.settlement_guide_title')}</h4>
                <div className="space-y-3 text-[13px] text-blue-800">
                  <div>
                    <div className="font-bold mb-1">1. {t('partner_dashboard.settlement_guide_step1_title')}</div>
                    <p className="text-blue-700">{t('partner_dashboard.settlement_guide_step1_desc')}</p>
                  </div>
                  <div>
                    <div className="font-bold mb-1">2. {t('partner_dashboard.settlement_guide_step2_title')}</div>
                    <p className="text-blue-700">{t('partner_dashboard.settlement_guide_step2_desc')}</p>
                  </div>
                  <div>
                    <div className="font-bold mb-1">3. {t('partner_dashboard.settlement_guide_step3_title')}</div>
                    <p className="text-blue-700">{t('partner_dashboard.settlement_guide_step3_desc')}</p>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <div className="font-bold mb-1">💡 {t('partner_dashboard.settlement_guide_tip_title')}</div>
                    <p className="text-blue-700">{t('partner_dashboard.settlement_guide_tip_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {stripeConnectInfo?.accountStatus === 'enabled' ? (
            // 설정 완료 상태
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px] mb-1">
                        {t('partner_dashboard.settings_stripe_connect_title')}
                      </div>
                      {stripeConnectInfo.email && (
                        <div className="text-[12px] text-secondary">{stripeConnectInfo.email}</div>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-[12px] rounded font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('partner_dashboard.settlement_status_completed')}
                  </span>
                </div>
              </div>
            </div>
          ) : stripeConnectInfo?.accountStatus && (stripeConnectInfo.accountStatus === 'pending' || stripeConnectInfo.accountStatus === 'restricted' || stripeConnectInfo.accountStatus === 'disabled') ? (
            // 설정 중/심사 중 상태
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px] mb-1">
                        {t('partner_dashboard.settings_stripe_connect_title')}
                      </div>
                      <div className="text-[12px] text-secondary">
                        {t('partner_dashboard.settlement_status_reviewing')}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const statusDisplay = getSettlementStatusDisplay();
                    const StatusIcon = statusDisplay.icon;
                    return (
                      <span className={`px-3 py-1 ${statusDisplay.bgColor} ${statusDisplay.color} text-[12px] rounded font-bold flex items-center gap-1`}>
                        <StatusIcon className={`w-3 h-3 ${statusDisplay.icon === Loader2 ? 'animate-spin' : ''}`} />
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={handleSetupSettlement}
                  disabled={isConnecting}
                  className="w-full px-4 py-2.5 bg-brand-lilac text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.settlement_setup_connecting')}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      {t('partner_dashboard.settings_stripe_connect_complete_setup')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // 미설정 상태
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px] mb-1">
                        {t('partner_dashboard.settlement_status_not_setup')}
                      </div>
                      <div className="text-[12px] text-secondary">
                        {t('partner_dashboard.settlement_setup_banner_desc')}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSetupSettlement}
                  disabled={isConnecting}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-brand-lilac to-brand-pink text-white rounded-lg text-[14px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.settlement_setup_connecting')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {t('partner_dashboard.settlement_setup_button')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
