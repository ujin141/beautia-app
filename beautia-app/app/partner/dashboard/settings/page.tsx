'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Clock, Calendar, Plus, Trash2, Save, CheckCircle2, Loader2, Globe, ChevronDown, CreditCard, Building2, ExternalLink, Lock, Sparkles, Eye, DollarSign, X } from 'lucide-react';
import { PartnerApi } from '../../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { Language } from '../../../../lib/i18n';
import { getPartnerUser } from '../../../../lib/auth';
import { useSearchParams } from 'next/navigation';

interface MenuTranslations {
   ko?: string;
   en?: string;
   ja?: string;
   th?: string;
   zh?: string;
}

interface Menu {
   id: number;
   name: string;
   nameTranslations?: MenuTranslations;
   description?: string;
   descriptionTranslations?: MenuTranslations;
   price: number;
   time: number;
}

// 시간 입력 컴포넌트 (12시간/24시간 형식 지원)
function TimeInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const { language, t } = useLanguage();
  
  // 언어별 로케일 매핑
  const localeMap: { [key: string]: string } = {
    ko: 'ko-KR',
    en: 'en-US',
    ja: 'ja-JP',
    th: 'th-TH',
    zh: 'zh-CN',
  };
  const locale = localeMap[language] || 'en-US';
  
  // 12시간 형식 사용 여부 (한국어, 영어, 일본어)
  const use12Hour = ['ko', 'en', 'ja'].includes(language);
  
  // 24시간 형식을 12시간 형식으로 변환
  const to12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? (language === 'ko' ? '오후' : language === 'ja' ? '午後' : 'PM') : (language === 'ko' ? '오전' : language === 'ja' ? '午前' : 'AM');
    const hour12 = hours % 12 || 12;
    return { hour: hour12, minute: minutes, period };
  };
  
  // 12시간 형식을 24시간 형식으로 변환
  const to24Hour = (hour: number, minute: number, period: string) => {
    let hour24 = hour;
    if (period === 'PM' || period === '오후' || period === '午後') {
      if (hour !== 12) hour24 = hour + 12;
    } else {
      if (hour === 12) hour24 = 0;
    }
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };
  
  const time12 = use12Hour ? to12Hour(value) : { hour: parseInt(value.split(':')[0]) || 0, minute: parseInt(value.split(':')[1]) || 0, period: '' };
  
  if (use12Hour) {
    const periodOptions = language === 'ko' 
      ? [{ value: '오전', label: '오전' }, { value: '오후', label: '오후' }]
      : language === 'ja'
      ? [{ value: '午前', label: '午前' }, { value: '午後', label: '午後' }]
      : [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }];
    
    return (
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[13px] font-bold text-secondary mb-2">{label}</label>
          <div className="flex gap-2">
            <select
              value={time12.period}
              onChange={(e) => {
                const newTime = to24Hour(time12.hour, time12.minute, e.target.value);
                onChange(newTime);
              }}
              className="flex-1 p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="12"
              value={time12.hour}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onChange(to24Hour(1, time12.minute, time12.period));
                  return;
                }
                const newHour = parseInt(inputValue);
                if (!isNaN(newHour) && newHour >= 1 && newHour <= 12) {
                  const newTime = to24Hour(newHour, time12.minute, time12.period);
                  onChange(newTime);
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1;
                if (value < 1) {
                  onChange(to24Hour(1, time12.minute, time12.period));
                } else if (value > 12) {
                  onChange(to24Hour(12, time12.minute, time12.period));
                }
              }}
              placeholder="12"
              className="w-20 p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac text-center"
            />
            <span className="self-center text-secondary font-bold">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={time12.minute}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onChange(to24Hour(time12.hour, 0, time12.period));
                  return;
                }
                const newMinute = parseInt(inputValue);
                if (!isNaN(newMinute) && newMinute >= 0 && newMinute <= 59) {
                  const newTime = to24Hour(time12.hour, newMinute, time12.period);
                  onChange(newTime);
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value < 0) {
                  onChange(to24Hour(time12.hour, 0, time12.period));
                } else if (value > 59) {
                  onChange(to24Hour(time12.hour, 59, time12.period));
                }
              }}
              placeholder="00"
              className="w-20 p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac text-center"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // 24시간 형식
  return (
    <div>
      <label className="block text-[13px] font-bold text-secondary mb-2">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
      />
    </div>
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [businessHours, setBusinessHours] = useState({
    openTime: '10:00',
    closeTime: '20:00',
    holidays: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Map<number, 'en' | 'th' | 'zh'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [previewMenuId, setPreviewMenuId] = useState<number | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja' | 'th' | 'zh'>('en');
  const { t, formatPrice, language } = useLanguage();

  // 통화 환율 로드
  useEffect(() => {
    async function loadCurrencyRates() {
      try {
        const response = await fetch('/api/currency/rates');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rates) {
            setCurrencyRates(data.rates);
          }
        }
      } catch (error) {
        console.error('환율 로드 실패:', error);
      }
    }
    loadCurrencyRates();
  }, []);

  // 통화 환산 함수
  const convertCurrency = (krwAmount: number, targetCurrency: 'USD' | 'THB' | 'CNY' | 'JPY'): string => {
    if (!krwAmount || !currencyRates[targetCurrency]) return '0';
    const converted = krwAmount * currencyRates[targetCurrency];
    
    const symbols: Record<string, string> = {
      USD: '$',
      THB: '฿',
      CNY: '¥',
      JPY: '¥',
    };
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: targetCurrency === 'USD' ? 2 : 0,
      maximumFractionDigits: targetCurrency === 'USD' ? 2 : 0,
    });
    
    return `${symbols[targetCurrency]}${formatter.format(converted)}`;
  };

  // AI 번역 함수 (GPT-4o 사용)
  const translateMenuWithAI = async (menuId: number) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu || !menu.name.trim()) {
      alert('메뉴명을 먼저 입력해주세요.');
      return;
    }

    setTranslatingId(menuId);
    try {
      const targetLangs: Language[] = ['en', 'ja', 'th', 'zh']; // ENG, JPN, THA, CHN
      const response = await fetch('/api/translate/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: menu.name,
          description: menu.description,
          targetLangs,
          sourceLang: 'ko',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          const nameTranslations: MenuTranslations = {};
          const descriptionTranslations: MenuTranslations = {};
          
          targetLangs.forEach(lang => {
            if (data.translations[lang]) {
              nameTranslations[lang] = data.translations[lang].name;
              if (data.translations[lang].description) {
                descriptionTranslations[lang] = data.translations[lang].description;
              }
            }
          });

          setMenus(prev => prev.map(m => 
            m.id === menuId 
              ? { 
                  ...m, 
                  nameTranslations,
                  descriptionTranslations: Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined,
                } 
              : m
          ));
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '번역에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 번역 실패:', error);
      alert('번역 중 오류가 발생했습니다.');
    } finally {
      setTranslatingId(null);
    }
  };

  // 자동 번역은 제거 (수동 AI 번역 버튼만 사용)

  const toggleMenuLanguage = (menuId: number, lang: 'en' | 'ja' | 'th' | 'zh') => {
    setExpandedMenus(prev => {
      const newMap = new Map(prev);
      if (newMap.get(menuId) === lang) {
        newMap.delete(menuId);
      } else {
        newMap.set(menuId, lang);
      }
      return newMap;
    });
  };

  // 매장 설정 로드
  useEffect(() => {
    async function loadSettings() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/partner/settings?partnerId=${partner.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 메뉴 데이터를 Menu 형식으로 변환
            if (data.data.menus && Array.isArray(data.data.menus)) {
              const loadedMenus: Menu[] = data.data.menus.map((m: any, index: number) => {
                // ID가 문자열인 경우 숫자로 변환, 없거나 유효하지 않은 경우 고유 ID 생성
                let menuId: number;
                if (m.id) {
                  const parsedId = typeof m.id === 'string' ? parseInt(m.id, 10) : m.id;
                  menuId = !isNaN(parsedId) && parsedId > 0 ? parsedId : Date.now() + index;
                } else {
                  menuId = Date.now() + index;
                }
                
                return {
                  id: menuId,
                  name: m.name || '',
                  nameTranslations: m.nameTranslations,
                  description: m.description || '',
                  descriptionTranslations: m.descriptionTranslations,
                  price: m.price || 0,
                  time: m.time || 60,
                };
              });
              setMenus(loadedMenus.length > 0 ? loadedMenus : []);
            }
            // 영업 시간 설정
            if (data.data.businessHours) {
              setBusinessHours(data.data.businessHours);
            }
          }
        }
      } catch (error) {
        console.error('Settings load failed', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleAddMenu = () => {
     // 기존 메뉴 중 가장 큰 ID를 찾아서 +1 하거나, 타임스탬프 사용
     const maxId = menus.length > 0 ? Math.max(...menus.map(m => m.id || 0)) : 0;
     const newId = maxId > 0 ? maxId + 1 : Date.now();
     
     const newMenu: Menu = {
        id: newId,
        name: '',
        description: '',
        price: 0,
        time: 60
     };
     setMenus([...menus, newMenu]);
  };

  const handleDeleteMenu = (id: number) => {
     setMenus(menus.filter(m => m.id !== id));
  };

  const handleMenuChange = (id: number, field: keyof Menu, value: string | number) => {
     setMenus(menus.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
     setIsSaving(true);
     try {
        await PartnerApi.updateShopSettings({ 
          menus: menus.map(m => ({
            id: m.id.toString(),
            name: m.name,
            nameTranslations: m.nameTranslations,
            description: m.description,
            descriptionTranslations: m.descriptionTranslations,
            price: m.price,
            time: m.time,
          })),
          businessHours,
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
     } catch (error) {
        console.error('Save failed', error);
        alert(t('partner_dashboard.settings_save_failed'));
     } finally {
        setIsSaving(false);
     }
  };

  if (loading) {
    return <div className="p-8">{t('common.loading')}</div>;
  }

  const tabs = [
    { id: 'general', label: t('partner_dashboard.settings_tab_general'), icon: Clock },
    { id: 'payment', label: t('partner_dashboard.settings_tab_payment'), icon: CreditCard },
    { id: 'account', label: t('partner_dashboard.settings_tab_account'), icon: Building2 },
  ];

  return (
    <div className="max-w-[800px] space-y-8 relative">
      {/* Toast */}
      <AnimatePresence>
         {showToast && (
            <motion.div 
               initial={{ opacity: 0, y: -20, x: '-50%' }}
               animate={{ opacity: 1, y: 0, x: '-50%' }}
               exit={{ opacity: 0, y: -20, x: '-50%' }}
               className="fixed top-8 left-1/2 z-50 px-6 py-3 bg-gray-900 rounded-full shadow-xl flex items-center gap-2 font-bold text-white"
            >
               <CheckCircle2 className="w-5 h-5 text-brand-mint" />
               {t('partner_dashboard.settings_saved')}
            </motion.div>
         )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.settings_title')}</h2>
         {activeTab === 'general' && (
           <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-brand-lilac hover:text-primary transition-colors disabled:opacity-50"
           >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('partner_dashboard.settings_save')}
           </button>
         )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-line">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('tab', tab.id);
                window.history.pushState({}, '', `?${params.toString()}`);
              }}
              className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 결제 수단 관리 탭 */}
      {activeTab === 'payment' && (
        <Suspense fallback={<div className="p-8">{t('common.loading')}</div>}>
          <PaymentMethodsTab />
        </Suspense>
      )}

      {/* 정산 계좌 관리 탭 */}
      {activeTab === 'account' && (
        <Suspense fallback={<div className="p-8">{t('common.loading')}</div>}>
          <SettlementAccountTab />
        </Suspense>
      )}

      {/* 일반 설정 탭 */}
      {activeTab === 'general' && (
        <>
          {/* Operation Hours */}
          <div className="bg-white p-8 rounded-2xl border border-line">
         <h3 className="font-bold text-[18px] mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-lilac" /> {t('partner_dashboard.settings_hours_title')}
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TimeInput
               value={businessHours.openTime}
               onChange={(value) => setBusinessHours({ ...businessHours, openTime: value })}
               label={t('partner_dashboard.settings_open_time')}
            />
            <TimeInput
               value={businessHours.closeTime}
               onChange={(value) => setBusinessHours({ ...businessHours, closeTime: value })}
               label={t('partner_dashboard.settings_close_time')}
            />
         </div>
         <div className="mt-6">
            <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.settings_holiday')}</label>
            <div className="flex gap-2">
               {[
                 { key: '월', tr: 'settings_day_mon' },
                 { key: '화', tr: 'settings_day_tue' },
                 { key: '수', tr: 'settings_day_wed' },
                 { key: '목', tr: 'settings_day_thu' },
                 { key: '금', tr: 'settings_day_fri' },
                 { key: '토', tr: 'settings_day_sat' },
                 { key: '일', tr: 'settings_day_sun' },
               ].map(({ key, tr }) => (
                  <button 
                    key={key}
                    onClick={() => {
                      const holidays = businessHours.holidays.includes(key)
                        ? businessHours.holidays.filter(d => d !== key)
                        : [...businessHours.holidays, key];
                      setBusinessHours({ ...businessHours, holidays });
                    }}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                       businessHours.holidays.includes(key) ? 'bg-primary text-white' : 'bg-surface text-secondary hover:bg-line'
                    }`}
                  >
                     {t(`partner_dashboard.${tr}`)}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* Menu Management */}
      <div className="bg-white p-8 rounded-2xl border border-line">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[18px]">{t('partner_dashboard.settings_menu_title')}</h3>
            <button 
               onClick={handleAddMenu}
               className="text-[13px] font-bold text-brand-lilac flex items-center gap-1 hover:underline"
            >
               <Plus className="w-4 h-4" /> {t('partner_dashboard.settings_menu_add')}
            </button>
         </div>
         
         <div className="space-y-6">
            {menus.map((menu, i) => {
               const menuId = menu.id && !isNaN(menu.id) ? menu.id : i;
               const isTranslating = translatingId === menuId;
               const hasTranslations = menu.nameTranslations && Object.keys(menu.nameTranslations).length > 0;
               
               return (
                  <div key={menuId} className="border-2 border-line rounded-2xl p-6 space-y-6 hover:border-brand-lilac transition-all">
                     {/* 기본 정보 입력 섹션 */}
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[13px] font-bold text-secondary mb-2">
                              메뉴명 (KR) *
                           </label>
                           <input 
                              type="text" 
                              value={menu.name} 
                              onChange={(e) => handleMenuChange(menuId, 'name', e.target.value)}
                              className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none" 
                              placeholder="예: 수분 폭탄 페이셜 케어"
                           />
                        </div>
                        
                        <div>
                           <label className="block text-[13px] font-bold text-secondary mb-2">
                              메뉴 설명 (KR)
                           </label>
                           <textarea 
                              value={menu.description || ''} 
                              onChange={(e) => handleMenuChange(menuId, 'description', e.target.value)}
                              className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none min-h-[80px] resize-none" 
                              placeholder="건조한 피부에 깊은 보습을 선사하는..."
                           />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[13px] font-bold text-secondary mb-2">
                                 가격 (KRW) *
                              </label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    value={menu.price || ''} 
                                    onChange={(e) => handleMenuChange(menuId, 'price', parseInt(e.target.value) || 0)}
                                    className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none pr-20" 
                                    placeholder="120000"
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-secondary">₩</span>
                              </div>
                              {/* 실시간 통화 환산 가이드 */}
                              {menu.price > 0 && (
                                 <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-secondary">
                                    <span className="flex items-center gap-1">
                                       <DollarSign className="w-3 h-3" />
                                       {convertCurrency(menu.price, 'USD')}
                                    </span>
                                    <span>{convertCurrency(menu.price, 'THB')}</span>
                                    <span>{convertCurrency(menu.price, 'CNY')}</span>
                                    <span>{convertCurrency(menu.price, 'JPY')}</span>
                                 </div>
                              )}
                           </div>
                           
                           <div>
                              <label className="block text-[13px] font-bold text-secondary mb-2">
                                 소요 시간 (분) *
                              </label>
                              <input 
                                 type="number" 
                                 value={menu.time || ''} 
                                 onChange={(e) => handleMenuChange(menuId, 'time', parseInt(e.target.value) || 0)}
                                 className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none" 
                                 placeholder="60"
                              />
                           </div>
                        </div>
                     </div>

                     {/* AI 다국어 번역 섹션 */}
                     <div className="border-t border-line pt-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-brand-lilac" />
                              <h4 className="font-bold text-[16px]">AI 다국어 자동 생성</h4>
                           </div>
                           <button
                              onClick={() => translateMenuWithAI(menuId)}
                              disabled={isTranslating || !menu.name.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-lilac to-brand-pink text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {isTranslating ? (
                                 <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    번역 중...
                                 </>
                              ) : (
                                 <>
                                    <Sparkles className="w-4 h-4" />
                                    AI 번역 실행
                                 </>
                              )}
                           </button>
                        </div>

                        {hasTranslations ? (
                           <div className="space-y-4">
                              {/* 탭 형태로 ENG, JPN, THA, CHN 표시 */}
                              <div className="flex gap-2 border-b border-line">
                                 {(['en', 'ja', 'th', 'zh'] as const).map((lang) => {
                                    const langNames = { en: 'ENG', ja: 'JPN', th: 'THA', zh: 'CHN' };
                                    const isActive = expandedMenus.get(menuId) === lang;
                                    return (
                                       <button
                                          key={lang}
                                          onClick={() => toggleMenuLanguage(menuId, lang)}
                                          className={`px-4 py-2 font-bold text-[13px] border-b-2 transition-colors ${
                                             isActive
                                                ? 'border-brand-lilac text-brand-lilac'
                                                : 'border-transparent text-secondary hover:text-brand-lilac'
                                          }`}
                                       >
                                          {langNames[lang]}
                                       </button>
                                    );
                                 })}
                              </div>

                              {/* 선택된 언어의 번역 표시 및 수정 */}
                              {expandedMenus.has(menuId) && (() => {
                                 const selectedLang = expandedMenus.get(menuId);
                                 if (!selectedLang || !menu.nameTranslations?.[selectedLang]) return null;
                                 
                                 return (
                                    <div className="space-y-4 p-4 bg-gradient-to-br from-brand-lilac/5 to-brand-pink/5 rounded-xl border border-brand-lilac/20">
                                       <div>
                                          <label className="block text-[12px] font-bold text-secondary mb-2">
                                             {selectedLang === 'en' ? 'ENG' : selectedLang === 'ja' ? 'JPN' : selectedLang === 'th' ? 'THA' : 'CHN'} - 메뉴명
                                          </label>
                                          <input
                                             type="text"
                                             value={menu.nameTranslations?.[selectedLang] || ''}
                                             onChange={(e) => {
                                                const newTranslations = { ...menu.nameTranslations };
                                                newTranslations[selectedLang] = e.target.value;
                                                setMenus(prev => prev.map(m => 
                                                   m.id === menuId 
                                                      ? { ...m, nameTranslations: newTranslations }
                                                      : m
                                                ));
                                             }}
                                             className="w-full p-3 bg-white rounded-lg border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                                          />
                                       </div>
                                       
                                       {menu.description && (
                                          <div>
                                             <label className="block text-[12px] font-bold text-secondary mb-2">
                                                {selectedLang === 'en' ? 'ENG' : selectedLang === 'ja' ? 'JPN' : selectedLang === 'th' ? 'THA' : 'CHN'} - 설명
                                             </label>
                                             <textarea
                                                value={menu.descriptionTranslations?.[selectedLang] || ''}
                                                onChange={(e) => {
                                                   const newTranslations = { ...menu.descriptionTranslations || {} };
                                                   newTranslations[selectedLang] = e.target.value;
                                                   setMenus(prev => prev.map(m => 
                                                      m.id === menuId 
                                                         ? { ...m, descriptionTranslations: newTranslations }
                                                         : m
                                                   ));
                                                }}
                                                className="w-full p-3 bg-white rounded-lg border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none min-h-[80px] resize-none"
                                             />
                                          </div>
                                       )}
                                    </div>
                                 );
                              })()}
                           </div>
                        ) : (
                           <div className="text-center py-8 text-secondary text-[13px]">
                              AI 번역 실행 버튼을 클릭하여 자동으로 번역을 생성하세요.
                           </div>
                        )}
                     </div>

                     {/* 미리보기 및 저장 */}
                     <div className="border-t border-line pt-4 flex items-center justify-between">
                        <button
                           onClick={() => {
                              if (hasTranslations) {
                                 setPreviewMenuId(menuId);
                                 setPreviewLanguage('en');
                              } else {
                                 alert('먼저 AI 번역을 실행해주세요.');
                              }
                           }}
                           className="flex items-center gap-2 px-4 py-2 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors"
                        >
                           <Eye className="w-4 h-4" />
                           외국인 고객에게 어떻게 보이나요?
                        </button>
                        
                        <button 
                           onClick={() => handleDeleteMenu(menuId)}
                           className="p-2 text-secondary hover:text-red-500 transition-colors"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* 미리보기 모달 */}
      {previewMenuId !== null && (() => {
         const menu = menus.find(m => m.id === previewMenuId);
         if (!menu) return null;
         
         return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
               >
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-bold text-[20px]">미리보기</h3>
                     <button
                        onClick={() => setPreviewMenuId(null)}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  {/* 언어 선택 */}
                  <div className="flex gap-2 mb-6">
                     {(['en', 'ja', 'th', 'zh'] as const).map((lang) => {
                        const langNames = { en: 'English', ja: '日本語', th: 'ไทย', zh: '中文' };
                        return (
                           <button
                              key={lang}
                              onClick={() => setPreviewLanguage(lang)}
                              className={`px-4 py-2 rounded-lg font-bold text-[13px] transition-colors ${
                                 previewLanguage === lang
                                    ? 'bg-brand-lilac text-white'
                                    : 'bg-surface text-secondary hover:bg-line'
                              }`}
                           >
                              {langNames[lang]}
                           </button>
                        );
                     })}
                  </div>
                  
                  {/* 미리보기 카드 */}
                  <div className="bg-gradient-to-br from-brand-lilac/10 to-brand-pink/10 rounded-xl p-6 border border-brand-lilac/20">
                     <h4 className="font-bold text-[18px] mb-2">
                        {menu.nameTranslations?.[previewLanguage] || menu.name}
                     </h4>
                     {(menu.descriptionTranslations?.[previewLanguage] || menu.description) && (
                        <p className="text-[14px] text-secondary mb-4">
                           {menu.descriptionTranslations?.[previewLanguage] || menu.description}
                        </p>
                     )}
                     <div className="flex items-center justify-between">
                        <div>
                           <div className="text-[24px] font-bold text-brand-lilac">
                              {previewLanguage === 'en' && convertCurrency(menu.price, 'USD')}
                              {previewLanguage === 'ja' && convertCurrency(menu.price, 'JPY')}
                              {previewLanguage === 'th' && convertCurrency(menu.price, 'THB')}
                              {previewLanguage === 'zh' && convertCurrency(menu.price, 'CNY')}
                           </div>
                           <div className="text-[12px] text-secondary">
                              {menu.time}분
                           </div>
                        </div>
                        <button className="px-6 py-3 bg-gradient-to-r from-brand-lilac to-brand-pink text-white rounded-xl font-bold">
                           예약하기
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         );
      })()}
        </>
      )}
    </div>
  );
}

// 정산 계좌 관리 탭 컴포넌트
function SettlementAccountTab() {
  const { t } = useLanguage();
  const [stripeConnectInfo, setStripeConnectInfo] = useState<{
    connected: boolean;
    accountId: string | null;
    accountStatus: 'pending' | 'restricted' | 'enabled' | 'disabled' | null;
    email?: string;
    country?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const partner = getPartnerUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchStripeConnectInfo();
    
    // Stripe 온보딩 완료 후 리다이렉트 처리
    const stripeSuccess = searchParams?.get('stripe_success');
    const stripeRefresh = searchParams?.get('stripe_refresh');
    if (stripeSuccess === 'true') {
      alert(t('partner_dashboard.settings_stripe_connect_success'));
      fetchStripeConnectInfo();
      // URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, '', '/partner/dashboard/settings?tab=account');
    } else if (stripeRefresh === 'true') {
      fetchStripeConnectInfo();
    }
  }, []);

  const fetchStripeConnectInfo = async () => {
    if (!partner) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/partner/stripe-connect/create-account?partnerId=${partner.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStripeConnectInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Stripe Connect 정보 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!partner) return;
    
    setIsConnectingStripe(true);
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
          throw new Error(data.error || 'Stripe Connect 연결에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Stripe Connect 연결에 실패했습니다.');
      }
    } catch (error) {
      console.error('Stripe Connect 연결 실패:', error);
      alert(error instanceof Error ? error.message : 'Stripe Connect 연결에 실패했습니다.');
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const handleChangePassword = async () => {
    if (!partner) return;

    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/partner/account/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPasswordSuccess(true);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setShowPasswordForm(false);
          setTimeout(() => setPasswordSuccess(false), 3000);
        } else {
          setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasStripeConnect = stripeConnectInfo?.connected && stripeConnectInfo.accountStatus === 'enabled';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[20px] font-bold mb-2">{t('partner_dashboard.settings_account_title')}</h3>
        <p className="text-[14px] text-secondary">
          {t('partner_dashboard.settings_account_desc')}
        </p>
      </div>

      {/* 비밀번호 변경 섹션 */}
      <div className="bg-white border-2 border-line rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-[16px] mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-lilac" />
              {t('partner_dashboard.settings_password_title') || '비밀번호 변경'}
            </h4>
            <p className="text-[12px] text-secondary">
              {t('partner_dashboard.settings_password_desc') || '계정 보안을 위해 정기적으로 비밀번호를 변경하세요.'}
            </p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 border border-line rounded-lg text-[14px] font-medium hover:bg-surface transition-colors"
            >
              {t('partner_dashboard.settings_password_change') || '비밀번호 변경'}
            </button>
          )}
        </div>

        {/* Success Message */}
        {passwordSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[13px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t('partner_dashboard.settings_password_success') || '비밀번호가 변경되었습니다.'}
          </div>
        )}

        {/* Error Message */}
        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
            {passwordError}
          </div>
        )}

        {/* Password Form */}
        {showPasswordForm && (
          <div className="space-y-4 pt-4 border-t border-line">
            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                {t('partner_dashboard.settings_password_current') || '현재 비밀번호'} *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder={t('partner_dashboard.settings_password_current_placeholder') || '현재 비밀번호를 입력하세요'}
                className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                {t('partner_dashboard.settings_password_new') || '새 비밀번호'} *
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder={t('partner_dashboard.settings_password_new_placeholder') || '새 비밀번호를 입력하세요 (최소 6자)'}
                className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                {t('partner_dashboard.settings_password_confirm') || '새 비밀번호 확인'} *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder={t('partner_dashboard.settings_password_confirm_placeholder') || '새 비밀번호를 다시 입력하세요'}
                className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg text-[14px] font-bold hover:bg-opacity-90 disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('partner_dashboard.settings_password_changing') || '변경 중...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('partner_dashboard.settings_password_save') || '변경하기'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setPasswordError('');
                }}
                disabled={changingPassword}
                className="px-4 py-3 bg-surface text-secondary rounded-lg text-[14px] font-medium hover:bg-line transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || '취소'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 등록된 계좌 정보 표시 */}
      {hasStripeConnect && (
        <div className="bg-white border-2 border-line rounded-xl p-6 space-y-4">
          <h4 className="font-bold text-[16px] mb-4">{t('partner_dashboard.settings_account_registered')}</h4>
          
          {/* Stripe Connect 계좌 */}
          <div className="p-4 bg-brand-lilac/5 rounded-lg border border-brand-lilac/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-lilac/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-lilac" />
                </div>
                <div>
                  <div className="font-bold text-[14px]">{t('partner_dashboard.settings_stripe_connect_title')}</div>
                  {stripeConnectInfo.email && (
                    <div className="text-[12px] text-secondary">{stripeConnectInfo.email}</div>
                  )}
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('partner_dashboard.settings_stripe_connect_enabled')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 계좌 등록 옵션 */}
      {!hasStripeConnect && (
        <div className="bg-white border-2 border-line rounded-xl p-6 space-y-4">
          <div>
            <h4 className="font-bold text-[16px] mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-lilac" />
              {t('partner_dashboard.settings_stripe_connect_title')}
            </h4>
            <p className="text-[12px] text-secondary mb-4">
              {t('partner_dashboard.settings_stripe_connect_desc')}
            </p>
          </div>

          {stripeConnectInfo?.connected && stripeConnectInfo.accountStatus !== 'enabled' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[14px]">
                  {t('partner_dashboard.settings_stripe_connect_account_id')}: {stripeConnectInfo.accountId?.slice(0, 20)}...
                </span>
                {stripeConnectInfo.accountStatus === 'pending' && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded font-bold">
                    {t('partner_dashboard.settings_stripe_connect_pending')}
                  </span>
                )}
                {stripeConnectInfo.accountStatus === 'restricted' && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-bold">
                    {t('partner_dashboard.settings_stripe_connect_restricted')}
                  </span>
                )}
              </div>
              <button
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                className="w-full px-4 py-3 bg-brand-lilac text-white rounded-lg text-[14px] font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConnectingStripe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('partner_dashboard.settings_stripe_connect_connecting')}
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    {t('partner_dashboard.settings_stripe_connect_complete_setup')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-secondary">
                {t('partner_dashboard.settings_stripe_connect_not_connected')}
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                className="w-full px-4 py-3 bg-brand-lilac text-white rounded-lg text-[14px] font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConnectingStripe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('partner_dashboard.settings_stripe_connect_connecting')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {t('partner_dashboard.settings_stripe_connect_connect_button')}
                  </>
                )}
              </button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-800">
                ℹ️ {t('partner_dashboard.settings_stripe_connect_info')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="p-8">{t('common.loading')}</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

// 결제 수단 관리 탭 컴포넌트
function PaymentMethodsTab() {
  const { t } = useLanguage();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const partner = getPartnerUser();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    if (!partner) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/partner/payment-methods?partnerId=${partner.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentMethods(data.data.paymentMethods || []);
        }
      }
    } catch (error) {
      console.error('결제 수단 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!partner) return;

    try {
      const response = await fetch('/api/partner/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          paymentMethodId,
        }),
      });

      if (response.ok) {
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('기본 결제 수단 설정 실패:', error);
      alert(t('partner_dashboard.payment_methods_set_default_failed'));
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!partner || !confirm(t('partner_dashboard.payment_methods_delete_confirm'))) return;

    setDeletingId(paymentMethodId);
    try {
      const response = await fetch(
        `/api/partner/payment-methods?partnerId=${partner.id}&paymentMethodId=${paymentMethodId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchPaymentMethods();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('결제 수단 삭제 실패:', error);
      alert(t('partner_dashboard.payment_methods_delete_failed'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[20px] font-bold mb-2">{t('partner_dashboard.payment_methods_title')}</h3>
          <p className="text-[14px] text-secondary">
            {t('partner_dashboard.payment_methods_desc')}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => window.location.href = '/partner/dashboard/marketing?charge=1'}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90"
          >
            <Plus className="w-5 h-5" />
            {t('partner_dashboard.payment_methods_charge')}
          </button>
        )}
      </div>

      {paymentMethods.length === 0 ? (
        <div className="bg-gray-50 border border-line rounded-2xl p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-secondary mb-4">{t('partner_dashboard.payment_methods_empty_title')}</p>
          <p className="text-[12px] text-secondary mb-6">
            {t('partner_dashboard.payment_methods_empty_desc')}
          </p>
          <button
            onClick={() => window.location.href = '/partner/dashboard/marketing?charge=1'}
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90"
          >
            {t('partner_dashboard.payment_methods_empty_button')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <motion.div
              key={pm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-line rounded-xl p-6 hover:border-brand-lilac transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[16px]">
                        {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                      </span>
                      {pm.isDefault && (
                        <span className="px-2 py-0.5 bg-brand-lilac/10 text-brand-lilac text-[10px] rounded font-bold">
                          {t('partner_dashboard.payment_methods_default')}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-secondary">
                      {t('partner_dashboard.payment_methods_expiry')}: {pm.card.expMonth.toString().padStart(2, '0')}/{pm.card.expYear}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <button
                      onClick={() => handleSetDefault(pm.id)}
                      className="px-4 py-2 border border-line rounded-lg text-[12px] font-medium hover:bg-gray-50"
                    >
                      {t('partner_dashboard.payment_methods_set_default')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(pm.id)}
                    disabled={deletingId === pm.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {deletingId === pm.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[12px] text-blue-800">
            <div className="font-bold mb-1">{t('partner_dashboard.payment_methods_info_title')}</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t('partner_dashboard.payment_methods_info_1')}</li>
              <li>{t('partner_dashboard.payment_methods_info_2')}</li>
              <li>{t('partner_dashboard.payment_methods_info_3')}</li>
              <li>{t('partner_dashboard.payment_methods_info_4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
