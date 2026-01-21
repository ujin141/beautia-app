'use client';

import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Globe, TrendingUp, Users, ShieldCheck, Wallet, PieChart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PartnerPage() {
  const { t, formatPrice, language } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-primary selection:bg-brand-lilac/20">
      <Header />
      
      <main className="pt-[72px]">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-primary text-white">
           <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop"
                alt="Business Meeting"
                fill
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent" />
           </div>

           <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[13px] font-bold text-brand-mint mb-6"
                 >
                    <Globe className="w-4 h-4" />
                    {t('partner_landing.tag')}
                 </motion.div>
                 
                 <motion.h1 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-[40px] md:text-[56px] font-bold leading-[1.1] mb-6"
                 >
                    {t('partner_landing.title')}
                 </motion.h1>
                 
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className="text-[18px] text-white/70 mb-10 leading-relaxed max-w-[500px]"
                 >
                    {t('partner_landing.subtitle')}
                 </motion.p>
                 
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="flex gap-4"
                 >
                    <a href="/partner/apply" className="h-[52px] px-8 rounded-xl bg-brand-lilac text-primary font-bold text-[16px] hover:bg-white transition-colors flex items-center justify-center">
                       {t('partner_landing.btn_apply')}
                    </a>
                    <button 
                      onClick={() => {
                        window.open(`/api/partner/brochure?lang=${language}`, '_blank');
                      }}
                      className="h-[52px] px-8 rounded-xl bg-white/10 text-white font-bold text-[16px] border border-white/20 hover:bg-white/20 transition-colors"
                    >
                       {t('partner_landing.btn_brochure')}
                    </button>
                 </motion.div>
              </div>

              {/* Dashboard Preview (Keep stats as examples for now, or translate if critical) */}
              <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.4 }}
                 className="hidden lg:block relative"
              >
                 <div className="bg-white rounded-[24px] p-6 shadow-2xl border border-white/10 text-primary relative z-10">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-line">
                       <div>
                          <div className="text-[14px] text-secondary font-medium">{t('partner.total_sales')}</div>
                          <div className="text-[32px] font-bold">{formatPrice(12450000)}</div>
                       </div>
                       <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[13px] font-bold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" /> +24.5%
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="bg-surface p-4 rounded-xl">
                          <div className="text-[13px] text-secondary mb-1">{t('partner_landing.dashboard_new_users')}</div>
                          <div className="text-[20px] font-bold">128</div>
                       </div>
                       <div className="bg-surface p-4 rounded-xl">
                          <div className="text-[13px] text-secondary mb-1">{t('partner_landing.dashboard_confirmation_rate')}</div>
                          <div className="text-[20px] font-bold text-brand-lilac">98.2%</div>
                       </div>
                    </div>
                    
                    {/* Fake Graph */}
                    <div className="h-[150px] flex items-end justify-between gap-2">
                       {[30, 45, 35, 60, 50, 75, 65, 80, 90].map((h, i) => (
                          <div key={i} className="w-full bg-brand-lilac/10 rounded-t-sm relative group overflow-hidden" style={{height: `${h}%`}}>
                             <div className="absolute bottom-0 w-full bg-brand-lilac h-0 group-hover:h-full transition-all duration-700" style={{ transitionDelay: `${i*50}ms`, height: '100%' }} />
                          </div>
                       ))}
                    </div>
                 </div>
                 
                 {/* Decorative Blobs */}
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-mint rounded-full blur-[60px] opacity-30" />
                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-pink rounded-full blur-[60px] opacity-30" />
              </motion.div>
           </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="py-24 bg-surface">
           <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-[32px] font-bold mb-4">{t('partner_landing.value_title')}</h2>
                 <p className="text-secondary text-[16px]">{t('partner_landing.value_subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                    {
                       icon: <Users className="w-8 h-8 text-brand-lilac" />,
                       title: t('partner_landing.val1_title'),
                       desc: t('partner_landing.val1_desc')
                    },
                    {
                       icon: <ShieldCheck className="w-8 h-8 text-brand-mint" />,
                       title: t('partner_landing.val2_title'),
                       desc: t('partner_landing.val2_desc')
                    },
                    {
                       icon: <Wallet className="w-8 h-8 text-brand-pink" />,
                       title: t('partner_landing.val3_title'),
                       desc: t('partner_landing.val3_desc')
                    }
                 ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[24px] border border-line hover:border-brand-lilac/30 hover:shadow-lg transition-all duration-300">
                       <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-6">
                          {item.icon}
                       </div>
                       <h3 className="text-[20px] font-bold mb-3">{item.title}</h3>
                       <p className="text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Social Proof / Success Stories */}
        <section className="py-24 bg-white">
           <div className="max-w-[1200px] mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="relative">
                    <div className="aspect-[4/5] rounded-[32px] overflow-hidden relative shadow-xl">
                       <Image 
                         src="https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?q=80&w=1000&auto=format&fit=crop"
                         alt="Success Partner"
                         fill
                         className="object-cover"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-8 left-8 text-white">
                          <div className="text-[20px] font-bold mb-1">Cheongdam Le Bijou Director</div>
                          <div className="text-[14px] opacity-80">{t('partner_landing.dashboard_partner_since')}</div>
                       </div>
                    </div>
                    {/* Floating Quote */}
                    <div className="absolute top-10 -right-10 bg-white p-6 rounded-2xl shadow-xl max-w-[300px] border border-line hidden md:block">
                       <div className="text-[40px] text-brand-lilac font-serif leading-none mb-2">"</div>
                       <p className="text-[15px] font-medium text-primary mb-4">
                          {t('partner_landing.success_quote')}
                       </p>
                       <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                       </div>
                    </div>
                 </div>

                 <div>
                    <h2 className="text-[32px] md:text-[40px] font-bold mb-8 leading-tight">
                       {t('partner_landing.success_title')}
                    </h2>
                    
                    <div className="space-y-6">
                       {[
                          { label: t('partner_landing.stat_avg_revenue'), value: `+ ${formatPrice(4500000)}` },
                          { label: t('partner_landing.stat_revisit_rate'), value: "68%" },
                          { label: t('partner_landing.stat_satisfaction'), value: "4.9/5.0" },
                       ].map((stat, i) => (
                          <div key={i} className="flex items-center gap-6 p-4 rounded-xl hover:bg-surface transition-colors border-b border-line last:border-0">
                             <div className="w-12 h-12 rounded-full bg-brand-lilac/10 flex items-center justify-center">
                                <PieChart className="w-6 h-6 text-brand-lilac" />
                             </div>
                             <div>
                                <div className="text-[14px] text-secondary mb-1">{stat.label}</div>
                                <div className="text-[24px] font-bold text-primary">{stat.value}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Steps */}
        <section className="py-24 bg-primary text-white text-center">
           <div className="max-w-[1000px] mx-auto px-6">
              <h2 className="text-[32px] font-bold mb-16">{t('partner_landing.process_title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                 {/* Connection Line */}
                 <div className="hidden md:block absolute top-8 left-0 w-full h-[2px] bg-white/10 -z-0" />

                 {[
                    { step: "01", title: t('partner_landing.process_step1_title'), desc: t('partner_landing.process_step1_desc') },
                    { step: "02", title: t('partner_landing.process_step2_title'), desc: t('partner_landing.process_step2_desc') },
                    { step: "03", title: t('partner_landing.process_step3_title'), desc: t('partner_landing.process_step3_desc') },
                    { step: "04", title: t('partner_landing.process_step4_title'), desc: t('partner_landing.process_step4_desc') },
                 ].map((item, i) => (
                    <div key={i} className="relative z-10">
                       <div className="w-16 h-16 rounded-full bg-primary border-2 border-brand-mint flex items-center justify-center text-[20px] font-bold mx-auto mb-6">
                          {item.step}
                       </div>
                       <h3 className="text-[20px] font-bold mb-2">{item.title}</h3>
                       <p className="text-white/60 text-[14px]">{item.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-white text-center">
           <div className="max-w-[800px] mx-auto px-6">
              <h2 className="text-[36px] font-bold mb-6">{t('partner_landing.cta_title')}</h2>
              <p className="text-secondary text-[18px] mb-10">
                 {t('partner_landing.cta_subtitle')}
              </p>
              <a href="/partner/apply" className="h-[60px] px-12 rounded-2xl bg-primary text-white font-bold text-[18px] hover:bg-brand-lilac hover:text-primary transition-colors shadow-xl flex items-center justify-center mx-auto w-fit">
                 {t('partner_landing.btn_apply')}
              </a>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
