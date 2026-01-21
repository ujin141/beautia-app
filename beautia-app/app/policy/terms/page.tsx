'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function TermsPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-[32px] font-bold mb-8">{t('terms.title')}</h1>
          
          <div className="prose prose-stone max-w-none text-[15px] text-secondary leading-relaxed">
             <p className="font-medium text-primary mb-8">
                {t('terms.effective_date')}
             </p>

             <h3 className="text-[18px] font-bold text-primary mt-8 mb-4">{t('terms.article1_title')}</h3>
             <p>
                {t('terms.article1_content')}
             </p>

             <h3 className="text-[18px] font-bold text-primary mt-8 mb-4">{t('terms.article2_title')}</h3>
             <ul className="list-disc pl-5 space-y-2">
                <li>{t('terms.service_def')}</li>
                <li>{t('terms.member_def')}</li>
                <li>{t('terms.partner_def')}</li>
             </ul>

             <h3 className="text-[18px] font-bold text-primary mt-8 mb-4">{t('terms.article3_title')}</h3>
             <p>
                {t('terms.article3_content')}
             </p>

             <h3 className="text-[18px] font-bold text-primary mt-8 mb-4">{t('terms.article4_title')}</h3>
             <p>
                {t('terms.article4_intro')}
                <br/>1. {t('terms.article4_item1')}
                <br/>2. {t('terms.article4_item2')}
                <br/>3. {t('terms.article4_item3')}
             </p>
             
             {/* ... 더 많은 약관 내용 (생략) ... */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
