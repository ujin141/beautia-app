'use client';

import React from 'react';
import { 
  Scissors, Sparkles, Palette, Eye, 
  Gem, User, Heart, Zap, 
  Aperture, Crown, Smile, Sun
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export function CategoryGrid() {
  const { t } = useLanguage();

  const CATEGORIES = [
    { id: 1, name: t('category_detail.hair'), label: t('category.hair'), icon: Scissors, color: "text-rose-500", bg: "bg-rose-50" },
    { id: 2, name: t('category_detail.spa'), label: t('category.spa'), icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 3, name: t('category_detail.makeup'), label: t('category.makeup'), icon: Palette, color: "text-pink-500", bg: "bg-pink-50" },
    { id: 4, name: t('category_detail.personal_color'), label: t('category.personal_color'), icon: Aperture, color: "text-violet-500", bg: "bg-violet-50" },
    { id: 5, name: t('category_detail.nail'), label: t('category.nail'), icon: Crown, color: "text-amber-500", bg: "bg-amber-50" },
    { id: 6, name: t('category_detail.eyelash'), label: t('category.eyelash'), icon: Eye, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 7, name: t('category_detail.skin'), label: t('category.skin'), icon: Sun, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 8, name: t('category_detail.clinic'), label: t('category.clinic'), icon: Gem, color: "text-cyan-500", bg: "bg-cyan-50" },
    { id: 9, name: t('category_detail.body'), label: t('category.body'), icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { id: 10, name: t('category_detail.waxing'), label: t('category.waxing'), icon: Zap, color: "text-lime-500", bg: "bg-lime-50" },
    { id: 11, name: t('category_detail.massage'), label: t('category.massage'), icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 12, name: t('category_detail.men'), label: t('category.men'), icon: User, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-8 md:py-12 bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-[26px] md:text-[32px] font-bold text-primary mb-3 tracking-tight">
              {t('nav.categories')}
            </h2>
            <p className="text-[15px] text-secondary font-medium">
              {t('hero.verified')}
            </p>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12"
        >
          {CATEGORIES.map((category) => (
            <motion.button 
              key={category.id}
              variants={item}
              className="group flex flex-col items-center gap-4 text-center w-full"
            >
              <div className={`relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-[24px] ${category.bg} border border-transparent group-hover:border-black/5 flex items-center justify-center transition-all duration-300 overflow-hidden shrink-0`}>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                
                <category.icon 
                  className={`w-8 h-8 md:w-9 md:h-9 ${category.color} transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6`} 
                  strokeWidth={1.5}
                />
              </div>
              
              <div className="flex flex-col gap-1 w-full px-1">
                <span className="text-[13px] md:text-[14px] font-bold text-primary/90 group-hover:text-primary transition-colors leading-tight truncate w-full block">
                  {category.name}
                </span>
                <span className="text-[11px] md:text-[12px] text-secondary/70 group-hover:text-secondary transition-colors truncate w-full block">
                  {category.label}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
