'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function FAQPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const FAQS = [
    {
      category: t('faq.category_booking'),
      q: t('faq.q1'),
      a: t('faq.a1')
    },
    {
      category: t('faq.category_payment'),
      q: t('faq.q2'),
      a: t('faq.a2')
    },
    {
      category: t('faq.category_account'),
      q: t('faq.q3'),
      a: t('faq.a3')
    },
    {
      category: t('faq.category_usage'),
      q: t('faq.q4'),
      a: t('faq.a4')
    },
    {
      category: t('faq.category_partner'),
      q: t('faq.q5'),
      a: t('faq.a5')
    }
  ];

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-brand-pink/20">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-[32px] md:text-[40px] font-bold mb-6 text-center">{t('faq.title')}</h1>
          <p className="text-secondary text-center mb-10 whitespace-pre-line">
             {t('faq.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative mb-12">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
             <input 
               type="text" 
               placeholder={t('faq.search_placeholder')}
               className="w-full h-[56px] pl-12 pr-6 rounded-2xl bg-surface border-transparent focus:bg-white focus:border-brand-pink focus:ring-0 transition-all font-medium"
             />
          </div>

          <div className="space-y-4">
             {FAQS.map((faq, idx) => (
                <div key={idx} className="border border-line rounded-2xl overflow-hidden bg-white">
                   <button 
                     onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                     className="w-full p-6 text-left flex justify-between items-center hover:bg-surface/50 transition-colors"
                   >
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                         <span className="text-[12px] font-bold text-brand-lilac bg-brand-lilac/10 px-2 py-1 rounded w-fit">
                            {faq.category}
                         </span>
                         <span className="text-[16px] font-bold text-primary">{faq.q}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
                   </button>
                   
                   <AnimatePresence>
                      {openIndex === idx && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ duration: 0.3 }}
                         >
                            <div className="p-6 pt-0 text-[15px] text-secondary leading-relaxed border-t border-transparent">
                               <div className="bg-surface p-4 rounded-xl">
                                  {faq.a}
                               </div>
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             ))}
          </div>

          <div className="mt-16 text-center">
             <p className="text-secondary mb-4">{t('faq.not_found')}</p>
             <a href="/support/contact" className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-bold text-[14px] hover:bg-brand-lilac hover:text-primary transition-colors">
                {t('faq.contact_btn')}
             </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
