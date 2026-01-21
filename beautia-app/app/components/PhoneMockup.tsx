'use client';

import React from 'react';
import { Star, MapPin, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function PhoneMockup() {
  const { t } = useLanguage();

  return (
    <div className="relative w-[300px] h-[600px] bg-primary rounded-[55px] p-3 shadow-2xl border-[4px] border-gray-900 ring-1 ring-gray-400/20 transform hover:-translate-y-2 transition-transform duration-500">
      {/* Dynamic Island */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20 flex items-center justify-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
         <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50" />
      </div>

      {/* Screen Content */}
      <div className="w-full h-full bg-white rounded-[44px] overflow-hidden relative flex flex-col">
        {/* Status Bar */}
        <div className="h-14 w-full bg-white z-10 flex justify-between items-center px-6 pt-2">
            <span className="text-[12px] font-bold">9:41</span>
            <div className="flex gap-1.5">
                <div className="w-4 h-2.5 bg-black rounded-[2px]" />
            </div>
        </div>

        {/* App Content */}
        <div className="flex-1 overflow-hidden relative">
            {/* Header Area */}
            <div className="px-6 pb-4">
                <div className="text-secondary text-[12px] font-medium mb-1 truncate">{t('mockup.location_tag')}</div>
                {/* Title allows 2 lines max, then ellipsis */}
                <div className="text-[20px] font-bold leading-tight whitespace-pre-line line-clamp-2 h-[50px] flex items-center">
                    {t('mockup.title_hot')}
                </div>
            </div>

            {/* Floating Card 1 */}
            <div className="mx-4 bg-white rounded-[20px] shadow-lg border border-line overflow-hidden mb-4 relative z-10 animate-[fade-in-up_0.6s_ease-out]">
                <div className="h-[140px] bg-stone-200 relative">
                     <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        4.9
                     </div>
                </div>
                <div className="p-4">
                    <div className="font-bold text-[16px] mb-1 truncate">{t('mockup.shop_name')}</div>
                    <div className="flex items-center gap-1 text-[12px] text-secondary mb-3 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> 
                        <span className="truncate">{t('mockup.address')}</span>
                    </div>
                    <div className="flex gap-2 overflow-hidden">
                         <span className="px-2 py-1 bg-surface rounded-[6px] text-[10px] text-secondary font-medium whitespace-nowrap">{t('mockup.tag1')}</span>
                         <span className="px-2 py-1 bg-surface rounded-[6px] text-[10px] text-secondary font-medium whitespace-nowrap">{t('mockup.tag2')}</span>
                    </div>
                </div>
            </div>

            {/* Floating Card 2 */}
            <div className="mx-4 bg-white rounded-[20px] shadow-sm border border-line overflow-hidden opacity-60 scale-95 origin-top animate-[fade-in-up_0.8s_ease-out]">
                <div className="h-[40px] bg-stone-100" />
                <div className="p-4">
                    <div className="w-2/3 h-4 bg-stone-100 rounded mb-2" />
                    <div className="w-1/2 h-3 bg-stone-50 rounded" />
                </div>
            </div>
            
            {/* Booking Alert Toast */}
            <div className="absolute bottom-6 left-4 right-4 bg-primary/90 backdrop-blur text-white p-4 rounded-[16px] shadow-xl animate-[fade-in-up_1s_ease-out]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blur-gradient flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] opacity-80 truncate">{t('mockup.booking_confirmed')}</div>
                        <div className="text-[14px] font-bold truncate">{t('mockup.visit_time')}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Nav */}
        <div className="h-[70px] bg-white border-t border-line flex justify-around items-center px-2 pb-4">
            <div className="w-12 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-primary/10" />
            </div>
             <div className="w-12 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-stone-100" />
            </div>
             <div className="w-12 flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-stone-100" />
            </div>
        </div>
      </div>
    </div>
  );
}
