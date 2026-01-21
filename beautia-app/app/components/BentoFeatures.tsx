'use client';

import React from 'react';
import { ShieldCheck, Star, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '../../contexts/LanguageContext';

export function BentoFeatures() {
  const { t } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-transparent relative">
       <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 max-w-[600px] mx-auto">
            <h2 className="text-[32px] font-bold text-primary mb-4 tracking-tight">
              {t('features.title')}
            </h2>
            <p className="text-[16px] text-secondary">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
             {/* Card 1: Large Span - Premium Partner */}
             <motion.div 
               whileHover={{ y: -5 }}
               className="md:col-span-2 rounded-[32px] p-8 relative overflow-hidden group border border-line/50 shadow-sm"
             >
                <Image 
                  src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2000&auto=format&fit=crop" 
                  alt="Luxury Interior" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
                
                <div className="relative z-10 max-w-[400px]">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-brand-mint">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-[24px] font-bold mb-3 text-primary">{t('features.card1_title')}</h3>
                    <p className="text-secondary leading-relaxed">
                        {t('features.card1_desc')}
                    </p>
                </div>
             </motion.div>

             {/* Card 2: Tall Span - Real Reviews */}
             <motion.div 
                whileHover={{ y: -5 }}
                className="md:row-span-2 bg-primary text-white rounded-[32px] p-8 relative overflow-hidden group"
             >
                 <Image 
                   src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=1000&auto=format&fit=crop"
                   alt="Happy Customer"
                   fill
                   className="object-cover opacity-40 group-hover:opacity-30 transition-opacity"
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/90" />

                 <div className="relative z-10 h-full flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                    <h3 className="text-[24px] font-bold mb-3">{t('reviews.title')}</h3>
                    
                    {/* Review Cards UI */}
                    <div className="mt-auto space-y-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-[13px] border border-white/10 transform group-hover:translate-x-1 transition-transform">
                            <div className="flex gap-1 mb-1 text-yellow-400 text-[10px]">⭐⭐⭐⭐⭐</div>
                            "{t('reviews.review1')}"
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-[13px] border border-white/10 opacity-60 transform group-hover:translate-x-2 transition-transform delay-75">
                            <div className="flex gap-1 mb-1 text-yellow-400 text-[10px]">⭐⭐⭐⭐⭐</div>
                            "{t('reviews.review2')}"
                        </div>
                    </div>
                 </div>
             </motion.div>

             {/* Card 3: Standard - Quick Booking */}
             <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-[32px] p-8 relative overflow-hidden group shadow-sm border border-line"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center mb-6 text-brand-pink">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-[20px] font-bold mb-2">{t('hero.instant')}</h3>
                    <p className="text-[14px] text-secondary">
                        {t('features.card3_desc')}
                    </p>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-pink/10 rounded-full blur-2xl" />
             </motion.div>

             {/* Card 4: Standard - Global Payment */}
             <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-[32px] p-8 relative overflow-hidden group shadow-sm border border-line"
             >
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-lilac/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-lilac/10 flex items-center justify-center mb-6 text-brand-lilac">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-[20px] font-bold mb-2">{t('features.card4_title')}</h3>
                    <p className="text-[14px] text-secondary">
                        {t('features.card4_desc')}
                    </p>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-lilac/10 rounded-full blur-2xl" />
             </motion.div>
          </div>
       </div>
    </section>
  );
}
