'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BeautiaLogo } from './BeautiaLogo';
import { useLanguage } from '../../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  const CATEGORIES = [
    { name: t('category.hair'), href: '#' },
    { name: t('category.spa'), href: '#' },
    { name: t('category.makeup'), href: '#' },
    { name: t('category.personal_color'), href: '#' },
    { name: t('category.nail'), href: '#' },
    { name: t('category.skin'), href: '#' },
    { name: t('category.clinic'), href: '#' },
    { name: t('category.body'), href: '#' },
    { name: t('category.waxing'), href: '#' },
    { name: t('category.massage'), href: '#' },
    { name: t('category.men'), href: '#' },
    { name: t('category.wedding'), href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-line/60 pt-20 pb-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 gap-x-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 pr-8">
            <div className="flex items-center gap-2 mb-6">
              <BeautiaLogo className="w-7 h-7" />
              <span className="font-bold text-[18px] tracking-tight text-primary">BEAUTIA</span>
            </div>
            <p className="text-[14px] text-secondary leading-relaxed mb-6">
              {t('hero.subtitle')}<br />
              {t('map.subtitle')}
            </p>
            <div className="flex gap-3">
              {['Instagram', 'Youtube', 'Linkedin'].map((social) => (
                <a key={social} href="#" className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-secondary hover:text-primary hover:border-primary transition-colors">
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 bg-secondary/20 rounded-sm" /> {/* Placeholder Icon */}
                </a>
              ))}
            </div>
          </div>
          
          {/* Links Columns */}
          {/* Category Column: Expanded to 2 columns for 12 items */}
          <div className="col-span-2 md:col-span-4">
            <h4 className="font-bold text-[14px] mb-6 text-primary">{t('nav.categories')}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
               {CATEGORIES.map((cat, i) => (
                  <a key={i} href={cat.href} className="text-[14px] text-secondary font-medium hover:text-primary transition-colors">
                     {cat.name}
                  </a>
               ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-[14px] mb-6 text-primary">{t('footer.help')}</h4>
            <ul className="space-y-3 text-[14px] text-secondary font-medium">
              <li><a href="/support/faq" className="hover:text-primary transition-colors">{t('footer.help')}</a></li>
              <li><a href="/support/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</a></li>
              <li><a href="/policy/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</a></li>
              <li><a href="/policy/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="/about/team" className="hover:text-primary transition-colors">{t('footer.about')}</a></li>
            </ul>
          </div>

           <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-[14px] mb-6 text-primary">{t('footer.contact_title')}</h4>
            <p className="text-[14px] text-secondary font-medium mb-1">support@beautia.com</p>
            <p className="text-[14px] text-secondary font-medium">+82 2-1234-5678</p>
            <div className="mt-4">
                 <a href="/partner" className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:text-brand-lilac transition-colors">
                    {t('nav.partner')} <ArrowUpRight className="w-3 h-3" />
                 </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-line/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[12px] text-secondary/60">
          <div>
            {t('footer.company_name')} | {t('footer.business_info')}: 123-45-67890<br className="md:hidden"/>
          </div>
          <div className="flex gap-6">
            <span>{t('footer.rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
