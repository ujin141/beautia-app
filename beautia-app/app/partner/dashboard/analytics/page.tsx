'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const WEEKLY_DATA = [
  { day: '월', amount: 850000 },
  { day: '화', amount: 920000 },
  { day: '수', amount: 780000 },
  { day: '목', amount: 1050000 },
  { day: '금', amount: 1450000 },
  { day: '토', amount: 2100000 },
  { day: '일', amount: 1800000 },
];

const MAX_AMOUNT = 2500000;

export default function AnalyticsPage() {
  const { t, formatPrice } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.analytics_title')}</h2>
         <div className="flex gap-2">
            <button 
               onClick={() => setSelectedPeriod('week')}
               className={`px-4 py-2 bg-white border border-line rounded-xl text-[14px] font-medium hover:bg-surface transition-colors ${
                  selectedPeriod === 'week' ? 'bg-brand-lilac/10 border-brand-lilac text-brand-lilac' : 'text-secondary'
               }`}
            >
               {t('partner_dashboard.analytics_this_week')}
            </button>
            <button 
               onClick={() => setSelectedPeriod('month')}
               className={`px-4 py-2 bg-white border border-line rounded-xl text-[14px] font-medium hover:bg-surface transition-colors ${
                  selectedPeriod === 'month' ? 'bg-brand-lilac/10 border-brand-lilac text-brand-lilac' : 'text-secondary'
               }`}
            >
               {t('partner_dashboard.analytics_this_month')}
            </button>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-line">
            <div className="text-[14px] text-secondary mb-2">{t('partner_dashboard.analytics_weekly_total')}</div>
            <div className="text-[32px] font-bold">{formatPrice(8950000)}</div>
            <div className="text-[13px] text-green-600 font-medium mt-2 flex items-center gap-1">
               <TrendingUp className="w-4 h-4" /> {t('partner_dashboard.analytics_vs_last_week')} +15%
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-line">
            <div className="text-[14px] text-secondary mb-2">{t('partner_dashboard.analytics_daily_avg')}</div>
            <div className="text-[32px] font-bold">{formatPrice(1278000)}</div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-line">
            <div className="text-[14px] text-secondary mb-2">{t('partner_dashboard.analytics_estimated_monthly')}</div>
            <div className="text-[32px] font-bold text-brand-lilac">{formatPrice(38500000)}</div>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-2xl border border-line">
         <h3 className="font-bold text-[18px] mb-8">{t('partner_dashboard.analytics_weekly_trend')}</h3>
         <div className="h-[300px] flex items-end justify-between gap-4">
            {WEEKLY_DATA.map((data, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full bg-surface rounded-t-xl overflow-hidden h-full flex items-end">
                     <div 
                       className="w-full bg-brand-lilac hover:bg-brand-lilac/80 transition-all duration-500 rounded-t-xl relative group-hover:scale-y-105 origin-bottom"
                       style={{ height: `${(data.amount / MAX_AMOUNT) * 100}%` }}
                     >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[12px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                           ₩{data.amount.toLocaleString()}
                        </div>
                     </div>
                  </div>
                  <span className="text-[14px] font-bold text-secondary">{data.day}</span>
               </div>
            ))}
         </div>
      </div>

      {/* Menu Analysis */}
      <div className="bg-white p-8 rounded-2xl border border-line">
         <h3 className="font-bold text-[18px] mb-6">{t('partner_dashboard.analytics_popular_top5')}</h3>
         <div className="space-y-4">
            {[
               { name: '퍼스널 히피펌', count: 42, revenue: 7560000 },
               { name: '프리미엄 클리닉', count: 35, revenue: 4200000 },
               { name: '뿌리 염색', count: 28, revenue: 2240000 },
               { name: '맨즈 다운펌', count: 25, revenue: 1250000 },
               { name: '앞머리 컷', count: 15, revenue: 300000 },
            ].map((menu, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-transparent hover:border-line transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-bold border border-line">{i+1}</div>
                     <span className="font-medium">{menu.name}</span>
                  </div>
                  <div className="flex gap-8 text-right">
                     <div className="w-24 text-[14px] text-secondary">{menu.count} {t('partner_dashboard.analytics_treatments')}</div>
                     <div className="w-32 font-bold">{formatPrice(menu.revenue)}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
