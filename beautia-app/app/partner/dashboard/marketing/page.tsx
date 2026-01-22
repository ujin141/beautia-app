'use client';

// Cache busting: Force update 2026-01-21
import React, { useState, useEffect, Suspense } from 'react';
import { Tag, Percent, Plus, X, CreditCard, Coins, History, Megaphone, Layout, MapPin, Search, Loader2, CheckCircle2, Settings, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { PartnerApi } from '../../../../lib/api';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';

function MarketingPageContent() {
  const searchParams = useSearchParams();
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [adPoints, setAdPoints] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<any>(null);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    type: 'discount' as 'discount' | 'flash_sale' | 'package' | 'coupon',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    startDate: '',
    endDate: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
  });
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isBuyingAd, setIsBuyingAd] = useState<string | null>(null);
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [timeDeals, setTimeDeals] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<{ [key: string]: number }>({
    main_banner: 3,
    category_top: 3,
  });
  const { formatPrice, t, currency } = useLanguage();
  
  // 광고 포인트 조회
  const fetchPoints = async () => {
    try {
      setIsLoadingPoints(true);
      console.log('포인트 조회 시작...');
      const points = await PartnerApi.getMarketingPoints();
      console.log('API에서 조회된 포인트:', points, '타입:', typeof points); // 디버깅용
      
      // 숫자로 변환
      const parsedPoints = typeof points === 'number' 
        ? points 
        : (typeof points === 'string' ? parseInt(points, 10) : Number(points) || 0);
      
      console.log('파싱된 포인트:', parsedPoints, 'isNaN:', isNaN(parsedPoints)); // 디버깅용
      
      const finalPoints = isNaN(parsedPoints) ? 0 : parsedPoints;
      console.log('최종 설정할 포인트:', finalPoints); // 디버깅용
      
      setAdPoints(finalPoints);
    } catch (error) {
      console.error('포인트 조회 실패:', error);
      setAdPoints(0);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  // 활성 광고 목록 조회
  const fetchActiveAds = async () => {
    try {
      const ads = await PartnerApi.getActiveAds();
      setActiveAds(ads);
    } catch (error) {
      console.error('광고 목록 조회 실패:', error);
    }
  };

  // 타임 딜 목록 조회
  const fetchTimeDeals = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) return;
      const promotions = await PartnerApi.getPromotions(partner.id);
      // 클라이언트 측 필터링 (API가 type 필터링을 지원하지 않을 경우 대비)
      const deals = promotions.filter((p: any) => p.type === 'flash_sale' && p.isActive);
      setTimeDeals(deals);
    } catch (error) {
      console.error('타임 딜 조회 실패:', error);
    }
  };

  // 타임 딜 삭제
  const handleDeleteTimeDeal = async (id: string) => {
    if (!confirm(t('partner_dashboard.marketing_delete_confirm') || '정말 삭제하시겠습니까?')) return;
    try {
      await PartnerApi.deletePromotion(id);
      showNotification(t('partner_dashboard.marketing_delete_success') || '삭제되었습니다.', 'success');
      fetchTimeDeals();
    } catch (error) {
      showNotification(t('partner_dashboard.marketing_delete_failed') || '삭제 실패', 'error');
    }
  };

  // 저장된 결제 수단 조회 및 초기 데이터 로드
  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const partner = getPartnerUser();
        if (!partner) return;

        const response = await fetch(`/api/partner/payment-methods?partnerId=${partner.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPaymentMethods(data.data.paymentMethods || []);
            const defaultMethod = data.data.paymentMethods?.find((pm: any) => pm.isDefault);
            setDefaultPaymentMethod(defaultMethod || null);
          }
        }
      } catch (error) {
        console.error('결제 수단 조회 실패:', error);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    }
    
    fetchPaymentMethods();
    // 포인트 조회를 먼저 실행
    fetchPoints().then(() => {
      console.log('포인트 조회 완료, 현재 포인트:', adPoints);
    });
    fetchActiveAds();
    fetchTimeDeals();

    // URL 파라미터에서 action=promotion 확인
    const action = searchParams?.get('action');
    if (action === 'promotion') {
      setShowPromotionModal(true);
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/partner/dashboard/marketing');
    }

    // 충전 성공 확인
    const charge = searchParams?.get('charge');
    if (charge === 'success') {
      showNotification(t('partner_dashboard.marketing_charge_success'), 'success');
      fetchPoints(); // 포인트 다시 조회
      window.history.replaceState({}, '', '/partner/dashboard/marketing');
    }
  }, [searchParams]);

  const handleCharge = async (amount: number) => {
    setIsCharging(true);
    try {
      // 언어에 맞는 통화 자동 사용
      const chargeCurrency = currency.toLowerCase();
      const result = await PartnerApi.chargePoints(amount, chargeCurrency);
      
      if (result.url) {
        // Stripe Checkout 페이지로 리다이렉트
        window.location.href = result.url;
        return;
      }
      
      // 성공 처리 (Stripe Checkout 완료 후 success URL로 돌아오면 포인트 추가됨)
      setIsChargeModalOpen(false);
      showNotification(`${amount.toLocaleString()} ${t('partner_dashboard.marketing_charge_success')}`);
    } catch (error) {
      console.error('Charge failed:', error);
      const errorMessage = error instanceof Error ? error.message : t('partner_dashboard.marketing_charge_error');
      showNotification(errorMessage, 'error');
    } finally {
      setIsCharging(false);
    }
  };

  const handleBuyAd = async (
    adType: 'main_banner' | 'category_top' | 'search_powerlink' | 'local_push' | 
            'search_top' | 'trending_first' | 'todays_pick_top' | 'editors_pick' | 
            'popular_brands' | 'category_banner' | 'category_middle' | 
            'shop_detail_top' | 'menu_middle' | 'community_middle' | 'chat_top',
    adName: string, 
    cost: number, 
    duration?: number, 
    budget?: number, 
    keywords?: string[],
    category?: string
  ) => {
    // 포인트가 로딩 중이면 대기
    if (isLoadingPoints) {
      showNotification(t('partner_dashboard.marketing_loading_points'), 'error');
      return;
    }

    console.log('광고 구매 시도:', { adPoints, cost, 부족: adPoints < cost }); // 디버깅용

    if (adPoints < cost) {
      showNotification(`${t('partner_dashboard.marketing_charge_failed')} (보유: ${formatPrice(adPoints)}, 필요: ${formatPrice(cost)})`, 'error');
      return;
    }

    setIsBuyingAd(adType);
    try {
      // 광고 구매 API 호출
      const result = await PartnerApi.purchaseAd({
        adType,
        duration,
        budget,
        keywords,
        category,
      });

      // 성공 시 포인트 및 광고 목록 업데이트
      setAdPoints(result.remainingPoints);
      await fetchActiveAds();
      showNotification(`${adName} ${t('partner_dashboard.marketing_ad_started') || '광고가 시작되었습니다!'}`, 'success');
    } catch (error) {
      console.error('광고 구매 실패:', error);
      const errorMessage = error instanceof Error ? error.message : t('partner_dashboard.marketing_charge_error');
      showNotification(errorMessage, 'error');
    } finally {
      setIsBuyingAd(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
     setShowToast({ message, type });
     setTimeout(() => setShowToast(null), 3000);
  };

  const handleCreatePromotion = async () => {
    try {
      setIsCreatingPromotion(true);
      
      const partner = getPartnerUser();
      if (!partner) {
        showNotification(t('partner_dashboard.marketing_login_required'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      // 유효성 검사
      if (!promotionForm.title.trim()) {
        showNotification(t('partner_dashboard.marketing_promotion_title_required'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      if (!promotionForm.description.trim()) {
        showNotification(t('partner_dashboard.marketing_promotion_description_required'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      if (promotionForm.discountValue <= 0) {
        showNotification(t('partner_dashboard.marketing_discount_value_required'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      if (!promotionForm.startDate || !promotionForm.endDate) {
        showNotification(t('partner_dashboard.marketing_dates_required'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      const startDate = new Date(promotionForm.startDate);
      const endDate = new Date(promotionForm.endDate);

      if (endDate <= startDate) {
        showNotification(t('partner_dashboard.marketing_end_date_after_start'), 'error');
        setIsCreatingPromotion(false);
        return;
      }

      // 프로모션 데이터 준비
      const promotionData: any = {
        partnerId: partner.id,
        title: promotionForm.title.trim(),
        description: promotionForm.description.trim(),
        type: promotionForm.type,
        discountType: promotionForm.discountType,
        discountValue: Number(promotionForm.discountValue),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
      };

      // 선택적 필드 추가
      if (promotionForm.minPurchaseAmount) {
        promotionData.minPurchaseAmount = Number(promotionForm.minPurchaseAmount);
      }

      if (promotionForm.maxDiscountAmount) {
        promotionData.maxDiscountAmount = Number(promotionForm.maxDiscountAmount);
      }

      if (promotionForm.usageLimit) {
        promotionData.usageLimit = Number(promotionForm.usageLimit);
      }

      // API 호출
      const response = await fetch('/api/partner/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showNotification(t('partner_dashboard.marketing_promotion_created'), 'success');
        setShowPromotionModal(false);
        fetchTimeDeals(); // 목록 갱신
        // 폼 초기화
        setPromotionForm({
          title: '',
          description: '',
          type: 'discount',
          discountType: 'percentage',
          discountValue: 0,
          startDate: '',
          endDate: '',
          minPurchaseAmount: '',
          maxDiscountAmount: '',
          usageLimit: '',
        });
      } else {
        showNotification(data.error || t('partner_dashboard.marketing_promotion_create_failed'), 'error');
      }
    } catch (error) {
      console.error('프로모션 생성 오류:', error);
      showNotification(t('partner_dashboard.marketing_promotion_create_failed'), 'error');
    } finally {
      setIsCreatingPromotion(false);
    }
  };

  return (
    <div className="space-y-10 relative pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
         {showToast && (
            <motion.div 
               initial={{ opacity: 0, y: -20, x: '-50%' }}
               animate={{ opacity: 1, y: 0, x: '-50%' }}
               exit={{ opacity: 0, y: -20, x: '-50%' }}
               className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-white ${
                  showToast.type === 'success' ? 'bg-gray-900' : 'bg-red-500'
               }`}
            >
               {showToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-brand-mint" />}
               {showToast.message}
            </motion.div>
         )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.marketing_title')}</h2>
         <div className="flex gap-3">
            <button 
              onClick={() => setIsChargeModalOpen(true)}
              disabled={isLoadingPoints}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-lilac text-brand-lilac rounded-xl font-bold text-[14px] hover:bg-brand-lilac/5 transition-colors disabled:opacity-50"
            >
               <Coins className="w-4 h-4" /> 
               {isLoadingPoints ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <>
                   {formatPrice(adPoints)}
                 </>
               )}
               {t('partner_dashboard.marketing_charge')}
            </button>
            <button 
              onClick={async () => {
                try {
                  const report = await PartnerApi.getAdReport();
                  // 리포트를 모달로 표시하거나 별도 페이지로 이동
                  alert(`${t('partner_dashboard.marketing_ad_report_title')}\n\n${t('partner_dashboard.marketing_ad_report_total_spent')}: ${report.summary.totalSpent.toLocaleString()}P\n${t('partner_dashboard.marketing_ad_report_total_impressions')}: ${report.summary.totalImpressions.toLocaleString()}${t('partner_dashboard.marketing_count')}\n${t('partner_dashboard.marketing_ad_report_total_clicks')}: ${report.summary.totalClicks.toLocaleString()}${t('partner_dashboard.marketing_count')}\n${t('partner_dashboard.marketing_ad_report_ctr')}: ${report.summary.ctr.toFixed(2)}%\n${t('partner_dashboard.marketing_ad_report_cpc')}: ${report.summary.cpc.toLocaleString()}P`);
                } catch (error) {
                  showNotification(t('partner_dashboard.marketing_ad_report_failed'), 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-colors"
            >
               <History className="w-4 h-4" /> {t('partner_dashboard.marketing_ad_report')}
            </button>
         </div>
      </div>

      {/* 3. Time Deal (타임 딜) - 최상단으로 이동 */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-mint" /> {t('partner_dashboard.marketing_time_deal') || '타임 딜 (Time Deal)'}
         </h3>
         
         {/* Active Time Deals List */}
         {timeDeals.length > 0 && (
           <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {timeDeals.map((deal) => (
               <div key={deal._id} className="bg-white p-4 rounded-xl border border-brand-mint/50 relative overflow-hidden">
                 <div className="absolute top-0 right-0 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                   Running
                 </div>
                 <h4 className="font-bold text-[15px] mb-1">{deal.title}</h4>
                 <div className="text-[20px] font-bold text-brand-mint mb-2">
                   {deal.discountType === 'percentage' ? `${deal.discountValue}%` : formatPrice(deal.discountValue)} OFF
                 </div>
                 <div className="text-[11px] text-secondary space-y-1">
                   <div>{new Date(deal.startDate).toLocaleDateString()} ~ {new Date(deal.endDate).toLocaleDateString()}</div>
                   <div>{t('partner_dashboard.marketing_usage_count') || '사용됨'}: {deal.usedCount}</div>
                 </div>
                 <button 
                   onClick={() => handleDeleteTimeDeal(deal._id)}
                   className="mt-3 w-full py-1.5 text-[12px] border border-gray-200 rounded hover:bg-gray-50 text-gray-500"
                 >
                   {t('common.delete') || '삭제'}
                 </button>
               </div>
             ))}
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-line flex justify-between items-center hover:shadow-lg transition-shadow cursor-pointer">
               <div>
                  <h4 className="font-bold text-[16px] mb-1 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-secondary" /> {t('partner_dashboard.marketing_time_deal_title') || '반짝 타임 딜'}
                  </h4>
                  <p className="text-[13px] text-secondary">
                    {t('partner_dashboard.marketing_time_deal_desc') || '특정 시간에만 파격적인 할인을 제공하여<br/>고객의 방문을 유도해보세요.'}
                  </p>
               </div>
               <div className="text-right">
                  <div className="text-[18px] font-bold text-brand-mint">
                    {t('partner_dashboard.marketing_high_conversion') || '높은 전환율'}
                  </div>
                  <button 
                     onClick={() => {
                       setPromotionForm(prev => ({ ...prev, type: 'flash_sale' }));
                       setShowPromotionModal(true);
                     }}
                     className="mt-2 text-[12px] font-bold text-brand-lilac underline"
                  >
                     {t('partner_dashboard.marketing_create_time_deal') || '타임 딜 만들기'}
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* 1. Exposure Ads (노출형 광고) */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Layout className="w-5 h-5 text-brand-pink" /> {t('partner_dashboard.marketing_exposure_ads')}
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Banner */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'main_banner' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-pink transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-pink border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-pink text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">App Screen</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-pink/20 border border-brand-pink rounded animate-pulse" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[16px]">{t('partner_dashboard.marketing_main_banner')}</h4>
                      <span className="bg-brand-pink text-white text-[10px] px-2 py-1 rounded font-bold">HOT</span>
                    </div>
                    <p className="text-[13px] text-secondary mb-4 min-h-[40px]" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.marketing_main_banner_desc') }} />
                    {activeAd && (
                      <div className="mb-2 text-[11px] text-secondary">
                        {t('partner_dashboard.marketing_impressions')}: {activeAd.impressions.toLocaleString()}{t('partner_dashboard.marketing_count')} | {t('partner_dashboard.marketing_clicks')}: {activeAd.clicks.toLocaleString()}{t('partner_dashboard.marketing_count')} | {t('partner_dashboard.marketing_ad_report_ctr')}: {activeAd.ctr.toFixed(2)}%
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[12px] text-gray-400 line-through">{formatPrice(50000)}</div>
                        <div className="text-[18px] font-bold text-brand-pink">{formatPrice(30000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                        {!activeAd && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-secondary">{t('partner_dashboard.marketing_period')}:</span>
                            <select
                              value={selectedDuration.main_banner}
                              onChange={(e) => setSelectedDuration({ ...selectedDuration, main_banner: Number(e.target.value) })}
                              className="text-[11px] border border-line rounded px-2 py-1 bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value={1}>1{t('partner_dashboard.marketing_days')} ({formatPrice(30000)})</option>
                              <option value={3}>3{t('partner_dashboard.marketing_days')} ({formatPrice(90000)})</option>
                              <option value={5}>5{t('partner_dashboard.marketing_days')} ({formatPrice(150000)})</option>
                              <option value={7}>7{t('partner_dashboard.marketing_days')} ({formatPrice(210000)})</option>
                              <option value={14}>14{t('partner_dashboard.marketing_days')} ({formatPrice(420000)})</option>
                            </select>
                          </div>
                        )}
                        {activeAd && (
                          <div className="text-[11px] text-secondary mt-1">
                            {t('partner_dashboard.marketing_end_date')}: {new Date(activeAd.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.main_banner;
                          const cost = 30000 * duration;
                          handleBuyAd('main_banner', t('partner_dashboard.marketing_main_banner'), cost, duration);
                        }}
                        disabled={isBuyingAd === 'main_banner' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'main_banner' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t('partner_dashboard.marketing_purchasing')}
                          </>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Category Top */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'category_top' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-lilac transition-all group cursor-pointer ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex flex-col p-2 gap-1">
                      <div className="w-full h-4 bg-gray-100 rounded" />
                      <div className="w-full h-8 bg-brand-lilac/20 border border-brand-lilac rounded" />
                      <div className="w-full h-8 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">{t('partner_dashboard.marketing_category_top')}</h4>
                    <p className="text-[13px] text-secondary mb-4 min-h-[40px]" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.marketing_category_top_desc') }} />
                    {activeAd && (
                      <div className="mb-2 text-[11px] text-secondary">
                        {t('partner_dashboard.marketing_impressions')}: {activeAd.impressions.toLocaleString()}{t('partner_dashboard.marketing_count')} | {t('partner_dashboard.marketing_clicks')}: {activeAd.clicks.toLocaleString()}{t('partner_dashboard.marketing_count')}
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[18px] font-bold text-primary">{formatPrice(15000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                        {!activeAd && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-secondary">{t('partner_dashboard.marketing_period')}:</span>
                            <select
                              value={selectedDuration.category_top}
                              onChange={(e) => setSelectedDuration({ ...selectedDuration, category_top: Number(e.target.value) })}
                              className="text-[11px] border border-line rounded px-2 py-1 bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value={1}>1{t('partner_dashboard.marketing_days')} ({formatPrice(15000)})</option>
                              <option value={3}>3{t('partner_dashboard.marketing_days')} ({formatPrice(45000)})</option>
                              <option value={5}>5{t('partner_dashboard.marketing_days')} ({formatPrice(75000)})</option>
                              <option value={7}>7{t('partner_dashboard.marketing_days')} ({formatPrice(105000)})</option>
                              <option value={14}>14{t('partner_dashboard.marketing_days')} ({formatPrice(210000)})</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.category_top;
                          const cost = 15000 * duration;
                          handleBuyAd('category_top', t('partner_dashboard.marketing_category_top'), cost, duration);
                        }}
                        disabled={isBuyingAd === 'category_top' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'category_top' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t('partner_dashboard.marketing_purchasing')}
                          </>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Search Ad */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'search_powerlink' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-mint transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-mint border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <Search className="w-8 h-8 text-gray-300 absolute top-4 right-4" />
                    <div className="w-3/4 h-8 bg-brand-mint/20 border border-brand-mint rounded flex items-center px-2 text-[10px] text-brand-mint font-bold">
                      {activeAd?.keywords?.[0] || '강남 미용실...'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">{t('partner_dashboard.marketing_search_powerlink')}</h4>
                    <p className="text-[13px] text-secondary mb-4 min-h-[40px]" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.marketing_search_powerlink_desc') }} />
                    {activeAd && (
                      <div className="mb-2 text-[11px] text-secondary">
                        {t('partner_dashboard.marketing_clicks')}: {activeAd.clicks.toLocaleString()}{t('partner_dashboard.marketing_count')} | 예산: {activeAd.budget?.toLocaleString()}P
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(500)} <span className="text-[12px] text-secondary font-normal">/ {t('partner_dashboard.marketing_per_click')}</span></div>
                      <button 
                        onClick={() => {
                          // 검색 파워링크는 키워드 입력 모달이 필요할 수 있지만, 일단 기본값으로 구매
                          const keywords = prompt(t('partner_dashboard.marketing_search_keyword_prompt'));
                          if (keywords) {
                            handleBuyAd('search_powerlink', t('partner_dashboard.marketing_search_powerlink'), 10000, undefined, 10000, keywords.split(',').map(k => k.trim()));
                          }
                        }}
                        disabled={isBuyingAd === 'search_powerlink' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'search_powerlink' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t('partner_dashboard.marketing_purchasing')}
                          </>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_keyword_setup')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
         </div>
      </section>

      {/* 2. Action Ads (타겟형 광고) */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-lilac" /> {t('partner_dashboard.marketing_target_ads')}
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'local_push' && ad.status === 'active');
              return (
                <div className={`bg-white p-6 rounded-2xl border flex justify-between items-center hover:shadow-lg transition-shadow cursor-pointer relative ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-[16px] mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary" /> {t('partner_dashboard.marketing_local_push')}
                    </h4>
                    <p className="text-[13px] text-secondary" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.marketing_local_push_desc') }} />
                    {activeAd && (
                      <div className="mt-2 text-[11px] text-secondary">
                        {t('partner_dashboard.marketing_sending')}: {activeAd.clicks.toLocaleString()}{t('partner_dashboard.marketing_count')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-bold">{formatPrice(50)} <span className="text-[12px] text-secondary font-normal">/ 건</span></div>
                    <button 
                      onClick={() => {
                        // 지역 푸시는 건수 입력 필요
                        const count = prompt(t('partner_dashboard.marketing_local_push_count_prompt'), '100');
                        if (count) {
                          const pushCount = parseInt(count) || 100;
                          const cost = pushCount * 50;
                          handleBuyAd('local_push', t('partner_dashboard.marketing_local_push'), cost, undefined, cost);
                        }
                      }}
                      disabled={isBuyingAd === 'local_push' || isLoadingPoints || !!activeAd}
                      className={`mt-2 text-[12px] font-bold text-brand-lilac underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                      {isBuyingAd === 'local_push' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('partner_dashboard.marketing_sending_progress')}
                        </>
                      ) : activeAd ? (
                        t('partner_dashboard.marketing_active')
                      ) : (
                        t('partner_dashboard.marketing_send')
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
            
            <div className="bg-white p-6 rounded-2xl border border-line flex justify-between items-center hover:shadow-lg transition-shadow cursor-pointer">
               <div>
                  <h4 className="font-bold text-[16px] mb-1 flex items-center gap-2">
                     <Tag className="w-4 h-4 text-secondary" /> {t('partner_dashboard.marketing_coupon')}
                  </h4>
                  <p className="text-[13px] text-secondary" dangerouslySetInnerHTML={{ __html: t('partner_dashboard.marketing_coupon_desc') }} />
               </div>
               <div className="text-right">
                  <div className="text-[18px] font-bold">{t('partner_dashboard.marketing_coupon_free')} <span className="text-[12px] text-secondary font-normal">{t('partner_dashboard.marketing_coupon_monthly_limit')}</span></div>
                  <button 
                     onClick={() => showNotification(t('partner_dashboard.marketing_coupon_sent'))}
                     className="mt-2 text-[12px] font-bold text-brand-lilac underline"
                  >
                     {t('partner_dashboard.marketing_coupon_create')}
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* 4. 홈 화면 섹션별 광고 */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Layout className="w-5 h-5 text-brand-mint" /> 홈 화면 섹션별 광고
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search Top */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'search_top' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-mint transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-mint border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">검색 결과</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-mint/20 border border-brand-mint rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">검색 결과 상단</h4>
                    <p className="text-[13px] text-secondary mb-4">검색 결과 최상단에 노출됩니다.<br/>구매 의도가 높은 고객 타겟</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(12000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.search_top || 3;
                          const cost = 12000 * duration;
                          handleBuyAd('search_top', '검색 결과 상단', cost, duration);
                        }}
                        disabled={isBuyingAd === 'search_top' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'search_top' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Trending First */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'trending_first' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-pink transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-pink border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-pink text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">트렌딩 섹션</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-pink/20 border border-brand-pink rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">트렌딩 첫 번째</h4>
                    <p className="text-[13px] text-secondary mb-4">트렌딩 섹션 첫 번째 카드에 노출<br/>높은 클릭률 예상</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(15000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.trending_first || 3;
                          const cost = 15000 * duration;
                          handleBuyAd('trending_first', '트렌딩 첫 번째', cost, duration);
                        }}
                        disabled={isBuyingAd === 'trending_first' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'trending_first' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Todays Pick Top */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'todays_pick_top' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-lilac transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">오늘의 추천</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-lilac/20 border border-brand-lilac rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">오늘의 추천 상단</h4>
                    <p className="text-[13px] text-secondary mb-4">오늘의 추천 섹션 최상단 노출<br/>홈 화면 중간에 높은 노출</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(20000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.todays_pick_top || 3;
                          const cost = 20000 * duration;
                          handleBuyAd('todays_pick_top', '오늘의 추천 상단', cost, duration);
                        }}
                        disabled={isBuyingAd === 'todays_pick_top' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'todays_pick_top' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Editors Pick */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'editors_pick' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-pink transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-pink border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-pink text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">에디터 픽</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-pink/20 border border-brand-pink rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">에디터 픽</h4>
                    <p className="text-[13px] text-secondary mb-4">프리미엄 섹션에 노출<br/>높은 신뢰도와 전환율</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(25000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.editors_pick || 3;
                          const cost = 25000 * duration;
                          handleBuyAd('editors_pick', '에디터 픽', cost, duration);
                        }}
                        disabled={isBuyingAd === 'editors_pick' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'editors_pick' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Popular Brands */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'popular_brands' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-mint transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-mint border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">인기 브랜드</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-mint/20 border border-brand-mint rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">인기 브랜드</h4>
                    <p className="text-[13px] text-secondary mb-4">브랜드 인지도 상승에 효과적<br/>프리미엄 노출</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(30000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.popular_brands || 3;
                          const cost = 30000 * duration;
                          handleBuyAd('popular_brands', '인기 브랜드', cost, duration);
                        }}
                        disabled={isBuyingAd === 'popular_brands' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'popular_brands' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
         </div>
      </section>

      {/* 5. 카테고리 및 매장 상세 광고 */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Layout className="w-5 h-5 text-brand-lilac" /> 카테고리 및 매장 상세 광고
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Banner */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'category_banner' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-lilac transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">카테고리 상단</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-lilac/20 border border-brand-lilac rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">카테고리 상단 배너</h4>
                    <p className="text-[13px] text-secondary mb-4">카테고리 화면 상단에 배너 노출<br/>카테고리 진입 시 즉시 노출</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(10000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const category = prompt('카테고리를 입력하세요 (예: Hair, Nail):');
                          if (category) {
                            const duration = selectedDuration.category_banner || 3;
                            const cost = 10000 * duration;
                            handleBuyAd('category_banner', '카테고리 상단 배너', cost, duration, undefined, undefined, category);
                          }
                        }}
                        disabled={isBuyingAd === 'category_banner' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'category_banner' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Category Middle */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'category_middle' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-mint transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-mint border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">카테고리 목록</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-mint/20 border border-brand-mint rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">카테고리 목록 중간</h4>
                    <p className="text-[13px] text-secondary mb-4">카테고리 목록 중간에 삽입<br/>자연스러운 노출로 클릭률 높음</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(8000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const category = prompt('카테고리를 입력하세요 (예: Hair, Nail):');
                          if (category) {
                            const duration = selectedDuration.category_middle || 3;
                            const cost = 8000 * duration;
                            handleBuyAd('category_middle', '카테고리 목록 중간', cost, duration, undefined, undefined, category);
                          }
                        }}
                        disabled={isBuyingAd === 'category_middle' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'category_middle' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Shop Detail Top */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'shop_detail_top' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-pink transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-pink border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-pink text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">매장 상세</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-pink/20 border border-brand-pink rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">매장 상세 상단</h4>
                    <p className="text-[13px] text-secondary mb-4">매장 상세 화면 상단 배너<br/>예약 전환 직전 단계 노출</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(15000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.shop_detail_top || 3;
                          const cost = 15000 * duration;
                          handleBuyAd('shop_detail_top', '매장 상세 상단', cost, duration);
                        }}
                        disabled={isBuyingAd === 'shop_detail_top' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'shop_detail_top' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Menu Middle */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'menu_middle' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-lilac transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">메뉴 목록</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-lilac/20 border border-brand-lilac rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">메뉴 섹션 사이</h4>
                    <p className="text-[13px] text-secondary mb-4">메뉴 목록 중간에 삽입<br/>메뉴를 보는 고객은 구매 의도 높음</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(10000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.menu_middle || 3;
                          const cost = 10000 * duration;
                          handleBuyAd('menu_middle', '메뉴 섹션 사이', cost, duration);
                        }}
                        disabled={isBuyingAd === 'menu_middle' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'menu_middle' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
         </div>
      </section>

      {/* 6. 커뮤니티 및 채팅 광고 */}
      <section>
         <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2">
            <Layout className="w-5 h-5 text-brand-mint" /> 커뮤니티 및 채팅 광고
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Community Middle */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'community_middle' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-lilac transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-lilac border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-lilac text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">커뮤니티</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-lilac/20 border border-brand-lilac rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">커뮤니티 게시글 사이</h4>
                    <p className="text-[13px] text-secondary mb-4">커뮤니티 게시글 목록 중간에 삽입<br/>활성 사용자 타겟</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(8000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.community_middle || 3;
                          const cost = 8000 * duration;
                          handleBuyAd('community_middle', '커뮤니티 게시글 사이', cost, duration);
                        }}
                        disabled={isBuyingAd === 'community_middle' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'community_middle' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Chat Top */}
            {(() => {
              const activeAd = activeAds.find(ad => ad.type === 'chat_top' && ad.status === 'active');
              return (
                <div className={`bg-white rounded-2xl border overflow-hidden hover:border-brand-mint transition-all group cursor-pointer relative ${
                  activeAd ? 'border-brand-mint border-2' : 'border-line'
                }`}>
                  {activeAd && (
                    <div className="absolute top-2 right-2 z-10 bg-brand-mint text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('partner_dashboard.marketing_active')}
                    </div>
                  )}
                  <div className="bg-gray-100 h-32 flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center text-[10px] text-gray-400">채팅 목록</div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-brand-mint/20 border border-brand-mint rounded" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[16px] mb-2">채팅 목록 상단</h4>
                    <p className="text-[13px] text-secondary mb-4">채팅 목록 화면 상단 배너<br/>활성 사용자 타겟</p>
                    <div className="flex justify-between items-end">
                      <div className="text-[18px] font-bold text-primary">{formatPrice(10000)} <span className="text-[12px] text-secondary font-normal">/ 일</span></div>
                      <button 
                        onClick={() => {
                          const duration = selectedDuration.chat_top || 3;
                          const cost = 10000 * duration;
                          handleBuyAd('chat_top', '채팅 목록 상단', cost, duration);
                        }}
                        disabled={isBuyingAd === 'chat_top' || isLoadingPoints || !!activeAd}
                        className={`px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {isBuyingAd === 'chat_top' ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t('partner_dashboard.marketing_purchasing')}</>
                        ) : activeAd ? (
                          t('partner_dashboard.marketing_active')
                        ) : (
                          t('partner_dashboard.marketing_select')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
         </div>
      </section>

      {/* Point Charge Modal */}
      <AnimatePresence>
         {isChargeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                 onClick={() => !isCharging && setIsChargeModalOpen(false)}
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white w-full max-w-[400px] rounded-3xl p-8 relative z-10 shadow-2xl"
               >
                  <button 
                     onClick={() => !isCharging && setIsChargeModalOpen(false)} 
                     className="absolute top-6 right-6 text-secondary hover:text-primary"
                     disabled={isCharging}
                  >
                     <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-[24px] font-bold mb-6">{t('partner_dashboard.marketing_charge_modal_title')}</h3>
                  
                  <div className="space-y-3 mb-8">
                     {[10000, 30000, 50000, 100000].map((amount) => (
                        <button 
                           key={amount} 
                           onClick={() => handleCharge(amount)}
                           disabled={isCharging}
                           className="w-full py-4 border border-line rounded-xl hover:border-brand-lilac hover:bg-brand-lilac/5 font-bold flex justify-between px-6 transition-all disabled:opacity-50"
                        >
                           <span>{formatPrice(amount)}</span>
                           <span className="text-[12px] text-secondary">({amount.toLocaleString()} P)</span>
                        </button>
                     ))}
                  </div>
                  
                  {/* 결제 수단 정보 */}
                  {defaultPaymentMethod ? (
                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-secondary" />
                          <div>
                            <div className="text-[14px] font-bold">
                              {defaultPaymentMethod.card.brand.toUpperCase()} •••• {defaultPaymentMethod.card.last4}
                            </div>
                            <div className="text-[11px] text-secondary">
                              {t('partner_dashboard.marketing_expiry')}: {defaultPaymentMethod.card.expMonth}/{defaultPaymentMethod.card.expYear}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.location.href = '/partner/dashboard/settings?tab=payment'}
                          className="text-[11px] text-brand-lilac hover:underline"
                          title={t('partner_dashboard.marketing_payment_method_management')}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[12px] text-secondary">{t('partner_dashboard.marketing_registered_card')}</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="text-[14px] font-bold text-blue-900">{t('partner_dashboard.marketing_card_registration')}</span>
                      </div>
                      <p className="text-[12px] text-blue-700 mb-3">
                        {t('partner_dashboard.marketing_card_registration_desc')}
                      </p>
                      <button
                        onClick={() => window.location.href = '/partner/dashboard/settings?tab=payment'}
                        className="text-[12px] font-bold text-blue-600 hover:underline"
                      >
                        {t('partner_dashboard.marketing_card_registration_button')} →
                      </button>
                    </div>
                  )}

                  {isCharging && (
                     <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-3xl">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-lilac" />
                     </div>
                  )}
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* 프로모션 생성 모달 */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPromotionModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{t('partner_dashboard.quick_action_promotion')}</h3>
              <button 
                onClick={() => setShowPromotionModal(false)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreatePromotion(); }} className="space-y-6">
              {/* 프로모션 타입 */}
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_promotion_type')} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'discount', label: t('partner_dashboard.promotions_type_discount') },
                    { value: 'flash_sale', label: t('partner_dashboard.promotions_type_flash_sale') },
                    { value: 'package', label: t('partner_dashboard.promotions_type_package') },
                    { value: 'coupon', label: t('partner_dashboard.promotions_type_coupon') },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPromotionForm({ ...promotionForm, type: type.value as any })}
                      className={`px-4 py-2 rounded-lg border-2 transition-all text-[13px] font-medium ${
                        promotionForm.type === type.value
                          ? 'border-brand-lilac bg-brand-lilac/10 text-brand-lilac'
                          : 'border-line bg-white text-secondary hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_promotion_title')} *</label>
                <input
                  type="text"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                  placeholder={t('partner_dashboard.marketing_promotion_title_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_promotion_description')} *</label>
                <textarea
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                  placeholder={t('partner_dashboard.marketing_promotion_description_placeholder')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none resize-none"
                  required
                />
              </div>

              {/* 할인 타입 및 값 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_discount_type')} *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPromotionForm({ ...promotionForm, discountType: 'percentage' })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all text-[13px] font-medium ${
                        promotionForm.discountType === 'percentage'
                          ? 'border-brand-lilac bg-brand-lilac/10 text-brand-lilac'
                          : 'border-line bg-white text-secondary hover:border-gray-300'
                      }`}
                    >
                      {t('partner_dashboard.marketing_percentage')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromotionForm({ ...promotionForm, discountType: 'fixed' })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all text-[13px] font-medium ${
                        promotionForm.discountType === 'fixed'
                          ? 'border-brand-lilac bg-brand-lilac/10 text-brand-lilac'
                          : 'border-line bg-white text-secondary hover:border-gray-300'
                      }`}
                    >
                      {t('partner_dashboard.marketing_fixed_amount')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">
                    {t('partner_dashboard.marketing_discount_value')} * {promotionForm.discountType === 'percentage' ? '(%)' : `(${currency === 'KRW' ? '원' : currency})`}
                  </label>
                  <input
                    type="number"
                    value={promotionForm.discountValue || ''}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: Number(e.target.value) })}
                    placeholder={promotionForm.discountType === 'percentage' ? '20' : '10000'}
                    min="0"
                    step={promotionForm.discountType === 'percentage' ? '1' : '1000'}
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* 최대 할인 금액 (퍼센트 타입일 때만) */}
              {promotionForm.discountType === 'percentage' && (
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_max_discount_amount')} ({t('common.cancel')})</label>
                  <input
                    type="number"
                    value={promotionForm.maxDiscountAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, maxDiscountAmount: e.target.value })}
                    placeholder={t('partner_dashboard.marketing_max_discount_amount_placeholder')}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                  />
                </div>
              )}

              {/* 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_start_date')} *</label>
                  <input
                    type="datetime-local"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_end_date')} *</label>
                  <input
                    type="datetime-local"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                    min={promotionForm.startDate}
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* 추가 옵션 */}
              <div className="space-y-4 pt-4 border-t border-line">
                <div className="text-[13px] font-bold text-secondary mb-3">{t('partner_dashboard.marketing_additional_options')}</div>
                
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_min_purchase_amount')}</label>
                  <input
                    type="number"
                    value={promotionForm.minPurchaseAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, minPurchaseAmount: e.target.value })}
                    placeholder={t('partner_dashboard.marketing_min_purchase_amount_placeholder')}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.marketing_usage_limit')}</label>
                  <input
                    type="number"
                    value={promotionForm.usageLimit}
                    onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: e.target.value })}
                    placeholder={t('partner_dashboard.marketing_usage_limit_placeholder')}
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setShowPromotionModal(false);
                    setPromotionForm({
                      title: '',
                      description: '',
                      type: 'discount',
                      discountType: 'percentage',
                      discountValue: 0,
                      startDate: '',
                      endDate: '',
                      minPurchaseAmount: '',
                      maxDiscountAmount: '',
                      usageLimit: '',
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors"
                  disabled={isCreatingPromotion}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPromotion}
                  className="flex-1 px-4 py-3 bg-brand-lilac text-white rounded-lg font-bold hover:bg-brand-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingPromotion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.marketing_promotion_creating')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('partner_dashboard.marketing_promotion_create')}
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

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-8">로딩 중...</div>}>
      <MarketingPageContent />
    </Suspense>
  );
}
