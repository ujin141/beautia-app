'use client';

import React from 'react';
import Link from 'next/link';
import { GradientButton } from './GradientButton';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhoneMockup } from './PhoneMockup';
import { useLanguage } from '../../contexts/LanguageContext';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-[140px] pb-[80px] md:pt-[160px] md:pb-[120px] overflow-hidden bg-white">
      {/* Background Aura - Brand Colors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-brand-pink/10 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
        <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-brand-lilac/10 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-brand-mint/10 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <div className="text-center lg:text-left z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-brand-lilac/20 shadow-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-mint opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-mint"></span>
            </span>
            <span className="text-[13px] font-bold text-brand-lilac tracking-tight uppercase">{t('hero_badge.global_platform')}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[44px] md:text-[64px] leading-[1.1] font-bold text-primary mb-6 tracking-tight"
          >
            {t('hero.title')}<br />
            <span className="bg-clip-text text-transparent bg-blur-gradient">Glow Up</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[17px] md:text-[19px] text-secondary mb-10 max-w-[500px] mx-auto lg:mx-0 leading-relaxed font-normal"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-12"
          >
            <Link href="/booking">
              <GradientButton className="h-[56px] px-8 text-[17px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all font-bold bg-black text-white hover:bg-gray-900">
                <span>{t('hero.cta')}</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </GradientButton>
            </Link>
            <GradientButton variant="outline" className="h-[56px] bg-white/50 backdrop-blur border-brand-lilac/30 text-primary hover:bg-brand-lilac/5 hover:border-brand-lilac">
              App Store
            </GradientButton>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center lg:justify-start gap-8 text-[13px] font-medium text-secondary"
          >
              <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-brand-mint" />
                  <span>{t('hero.verified')}</span>
              </div>
              <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-brand-mint" />
                  <span>{t('hero.instant')}</span>
              </div>
          </motion.div>
        </div>

        {/* Right: 3D Visual Mockup */}
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring" }}
            className="relative flex justify-center lg:justify-end items-center"
        >
             {/* Abstract background shapes behind phone */}
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-pink/20 via-brand-lilac/20 to-transparent rounded-full blur-[70px] transform rotate-12 opacity-60" />
             
             {/* The Phone Mockup */}
             <div className="relative z-10 transform rotate-[-6deg] lg:rotate-[-3deg] hover:rotate-0 transition-transform duration-700 hover:scale-105">
                <PhoneMockup />
                
                {/* Floating Elements around phone - Brand Colors */}
                <div className="absolute -left-12 top-1/3 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl shadow-brand-lilac/10 animate-bounce delay-700 hidden md:block border border-brand-lilac/20">
                    <div className="text-[12px] font-bold text-primary mb-1">{t('hero_badge.success')}</div>
                    <div className="text-[10px] text-brand-lilac font-medium">{t('hero_badge.ready')}</div>
                </div>
             </div>
        </motion.div>
      </div>
    </section>
  );
}
