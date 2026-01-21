'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-[32px] font-bold mb-8">{t('privacy.title')}</h1>
          
          <div className="bg-surface p-6 rounded-2xl mb-10 border border-line">
             <p className="text-[14px] text-secondary font-medium">
                {t('privacy.intro')}
             </p>
          </div>

          <div className="prose prose-stone max-w-none text-[15px] text-secondary leading-relaxed space-y-8">
             <section>
                <h3 className="text-[18px] font-bold text-primary mb-3">{t('privacy.section1_title')}</h3>
                <p>{t('privacy.section1_intro')}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 bg-surface/30 p-4 rounded-xl">
                   <li>{t('privacy.section1_required')}</li>
                   <li>{t('privacy.section1_optional')}</li>
                   <li>{t('privacy.section1_auto')}</li>
                </ul>
             </section>

             <section>
                <h3 className="text-[18px] font-bold text-primary mb-3">{t('privacy.section2_title')}</h3>
                <p>{t('privacy.section2_intro')}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                   <li>{t('privacy.section2_item1')}</li>
                   <li>{t('privacy.section2_item2')}</li>
                   <li>{t('privacy.section2_item3')}</li>
                </ul>
             </section>

             <section>
                <h3 className="text-[18px] font-bold text-primary mb-3">{t('privacy.section3_title')}</h3>
                <p>
                   {t('privacy.section3_intro')}
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                   <li>{t('privacy.section3_item1')}</li>
                   <li>{t('privacy.section3_item2')}</li>
                   <li>{t('privacy.section3_item3')}</li>
                </ul>
             </section>

             <section>
                <h3 className="text-[18px] font-bold text-primary mb-3">{t('privacy.section4_title')}</h3>
                <p>
                   {t('privacy.section4_name')}<br/>
                   {t('privacy.section4_role')}<br/>
                   {t('privacy.section4_contact')}
                </p>
             </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
