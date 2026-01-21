'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, Calendar, Clock, Share2 } from 'lucide-react';
import Image from 'next/image';
import { PublicApi } from '../../lib/api';
import { Magazine } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export default function MagazineListPage() {
  const [articles, setArticles] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Magazine | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        // 현재 언어를 API에 전달
        const data = await PublicApi.getMagazines(20, language);
        setArticles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [language]); // language가 변경될 때마다 다시 로드

  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
           <div className="text-center mb-16">
              <h1 className="text-[40px] font-bold mb-4">{t('magazine.title')}</h1>
              <p className="text-[16px] text-secondary">
                 {t('magazine.subtitle')}
              </p>
           </div>

           {loading ? (
              <div className="text-center py-20 text-secondary">{t('common.loading')}</div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {articles.map((article, idx) => {
                    // 직접 값을 사용 (번역 키 사용하지 않음)
                    const title = article.title || '';
                    const description = article.description || '';
                    const category = article.category || '';

                    return (
                        <motion.article 
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group cursor-pointer"
                          onClick={() => setSelectedArticle(article)}
                        >
                           <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-6 relative shadow-sm">
                              <Image 
                                src={article.imageUrl} 
                                alt={title} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide text-primary shadow-sm">
                                 {category}
                              </div>
                           </div>
                           
                           <h3 className="text-[20px] font-bold mb-2 group-hover:text-brand-lilac transition-colors leading-snug">
                              {title}
                           </h3>
                           <p className="text-[15px] text-secondary mb-4 line-clamp-2">
                              {description}
                           </p>
                           
                           <div className="flex items-center gap-2 text-[13px] font-bold hover:underline decoration-brand-lilac underline-offset-4">
                              {t('magazine.read_article')} <ArrowUpRight className="w-4 h-4" />
                           </div>
                        </motion.article>
                    );
                 })}
              </div>
           )}
        </div>
      </main>

      {/* Article Detail Modal */}
      <AnimatePresence>
         {selectedArticle && (() => {
             // 직접 값을 사용 (번역 키 사용하지 않음)
             const title = selectedArticle.title || '';
             const description = selectedArticle.description || '';
             const category = selectedArticle.category || '';
             const content = selectedArticle.content || '';

             return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
                   <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedArticle(null)}
                   />
                   <motion.div 
                      initial={{ opacity: 0, y: 100, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 100, scale: 0.9 }}
                      className="bg-white w-full max-w-[800px] h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-3xl md:rounded-3xl overflow-hidden relative z-10 flex flex-col shadow-2xl"
                   >
                      {/* Modal Header Image */}
                      <div className="relative h-[300px] shrink-0">
                         <Image src={selectedArticle.imageUrl} alt={title} fill className="object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <button 
                            onClick={() => setSelectedArticle(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                         >
                            <X className="w-5 h-5" />
                         </button>
                         <div className="absolute bottom-6 left-6 md:left-8 text-white">
                            <span className="inline-block px-3 py-1 bg-brand-pink text-[11px] font-bold rounded-full mb-3 uppercase tracking-wider">
                               {category}
                            </span>
                            <h2 className="text-[28px] md:text-[32px] font-bold leading-tight mb-2">
                               {title}
                            </h2>
                         </div>
                      </div>

                      {/* Modal Content */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                         <div className="flex items-center gap-6 text-[13px] text-secondary border-b border-gray-100 pb-6 mb-6">
                            <div className="flex items-center gap-2">
                               <Calendar className="w-4 h-4" /> {selectedArticle.date}
                            </div>
                            <div className="flex items-center gap-2">
                               <Clock className="w-4 h-4" /> {selectedArticle.readTime} {t('magazine.read_time')}
                            </div>
                            <button className="ml-auto flex items-center gap-2 hover:text-primary transition-colors">
                               <Share2 className="w-4 h-4" /> {t('magazine.share')}
                            </button>
                         </div>

                         <div className="prose prose-lg max-w-none text-secondary">
                            <p className="text-[18px] font-medium text-primary mb-6 leading-relaxed">
                               {description}
                            </p>
                            <div className="whitespace-pre-line leading-relaxed mb-6">
                               {content}
                            </div>
                            <div className="my-8 relative h-[300px] rounded-2xl overflow-hidden">
                               <Image src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop" alt="Detail" fill className="object-cover" />
                            </div>
                            <h3 className="text-[20px] font-bold text-primary mb-4">{t('magazine.why_matters')}</h3>
                            <p>
                               {/* Keep Editor's note generic or reuse part of content? Let's use generic text or specific if available. 
                                   For now, I'll use a placeholder or part of content.
                                   Actually I didn't add why_matters content. I'll just leave a generic translated sentence.
                               */}
                               {t('service_page.hero_desc')} {/* Reusing a nice sentence as filler for now */}
                            </p>
                         </div>
                      </div>
                   </motion.div>
                </div>
             );
         })()}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
