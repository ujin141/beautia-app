'use client';

import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ServicesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
           <Image 
             src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2000&auto=format&fit=crop"
             alt="Service Hero"
             fill
             className="object-cover"
           />
           <div className="absolute inset-0 bg-black/40" />
           <div className="relative z-10 text-center text-white px-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[40px] md:text-[64px] font-bold mb-6 whitespace-pre-line leading-[1.1]"
              >
                 {t('service_page.hero_title')}
              </motion.h1>
              <p className="text-[18px] opacity-90 max-w-[600px] mx-auto whitespace-pre-line leading-relaxed">
                 {t('service_page.hero_desc')}
              </p>
           </div>
        </section>

        {/* Features Detail */}
        <section className="py-24 px-6">
           <div className="max-w-[1200px] mx-auto space-y-32">
              
              {/* Feature 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                 <div className="order-2 md:order-1">
                    <div className="w-16 h-16 rounded-2xl bg-brand-lilac/10 flex items-center justify-center mb-6 text-brand-lilac">
                       <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-[32px] font-bold mb-6 whitespace-pre-line leading-tight">{t('service_page.f1_title')}</h2>
                    <p className="text-[16px] text-secondary leading-relaxed mb-8 whitespace-pre-line">
                       {t('service_page.f1_desc')}
                    </p>
                    <ul className="space-y-4">
                       {[t('service_page.f1_item1'), t('service_page.f1_item2'), t('service_page.f1_item3')].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 font-medium">
                             <CheckCircleIcon className="w-5 h-5 text-brand-lilac" /> {item}
                          </li>
                       ))}
                    </ul>
                 </div>
                 <div className="order-1 md:order-2 relative aspect-square rounded-[40px] overflow-hidden shadow-2xl">
                    <Image 
                      src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop"
                      alt="Premium Shop"
                      fill
                      className="object-cover"
                    />
                 </div>
              </div>

              {/* Feature 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                 <div className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl">
                    <Image 
                      src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1000&auto=format&fit=crop"
                      alt="Easy Booking"
                      fill
                      className="object-cover"
                    />
                 </div>
                 <div>
                    <div className="w-16 h-16 rounded-2xl bg-brand-mint/10 flex items-center justify-center mb-6 text-brand-mint">
                       <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-[32px] font-bold mb-6 whitespace-pre-line leading-tight">{t('service_page.f2_title')}</h2>
                    <p className="text-[16px] text-secondary leading-relaxed mb-8 whitespace-pre-line">
                       {t('service_page.f2_desc')}
                    </p>
                    <div className="bg-surface p-6 rounded-2xl border border-line">
                       <div className="flex items-center justify-between mb-4 pb-4 border-b border-line/50">
                          <span className="font-bold whitespace-nowrap">{t('service_page.comp_old')}</span>
                          <span className="text-secondary line-through text-[14px] text-right">{t('service_page.comp_old_desc')}</span>
                       </div>
                       <div className="flex items-center justify-between text-brand-mint font-bold">
                          <span>BEAUTIA</span>
                          <span className="text-right">{t('service_page.comp_new_desc')}</span>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
         <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
   )
}
