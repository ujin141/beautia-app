'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, X, Calendar, Clock, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { PublicApi } from '../../lib/api';
import { Magazine } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import Link from 'next/link';

export function MagazineSection() {
  const [articles, setArticles] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Magazine | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        // 현재 언어를 API에 전달
        const data = await PublicApi.getMagazines(10, language);
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch magazine articles', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [language]); // language가 변경될 때마다 다시 로드

  if (loading) {
    return (
        <section className="py-24 md:py-32 bg-white">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
                {t('common.loading')}
            </div>
        </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-[28px] md:text-[36px] font-bold text-primary mb-4 tracking-tight">{t('magazine.title')}</h2>
            <p className="text-[16px] text-secondary font-medium">
              {t('magazine.subtitle')}
            </p>
          </div>
          <Link href="/magazine" className="text-[15px] font-semibold text-primary underline decoration-line underline-offset-4 hover:decoration-brand-pink transition-all">
            {t('magazine.read_more')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-8">
          {articles.map((article, idx) => (
            <motion.article 
              key={article.id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="group cursor-pointer flex flex-col h-full"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="w-full aspect-[4/3] rounded-[24px] mb-6 overflow-hidden relative isolate shadow-sm">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                
                <div className="absolute top-5 left-5">
                   <span className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase shadow-sm border border-white/50 text-primary">
                     {article.category}
                   </span>
                </div>
                
                {/* Corner Arrow Interaction */}
                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <ArrowUpRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col flex-1">
                <h3 className="text-[22px] font-bold text-primary mb-3 group-hover:text-brand-lilac transition-colors leading-[1.3] tracking-tight">
                  {article.title}
                </h3>
                <p className="text-[15px] text-secondary leading-relaxed mb-6 line-clamp-2">
                  {article.description}
                </p>
                
                <div className="mt-auto pt-6 border-t border-line/40 flex items-center gap-2 text-[14px] font-bold text-primary group-hover:text-brand-lilac transition-colors">
                  {t('magazine.read_article')}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Article Detail Modal (Same as Magazine Page) */}
      <AnimatePresence>
         {selectedArticle && (
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
                     <Image src={selectedArticle.imageUrl} alt={selectedArticle.title} fill className="object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <button 
                        onClick={() => setSelectedArticle(null)}
                        className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                     <div className="absolute bottom-6 left-6 md:left-8 text-white">
                        <span className="inline-block px-3 py-1 bg-brand-pink text-[11px] font-bold rounded-full mb-3 uppercase tracking-wider">
                           {selectedArticle.category}
                        </span>
                        <h2 className="text-[28px] md:text-[32px] font-bold leading-tight mb-2">
                           {selectedArticle.title}
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
                           {selectedArticle.description}
                        </p>
                        {selectedArticle.content && (
                           <div className="whitespace-pre-line leading-relaxed mb-6">
                              {selectedArticle.content}
                           </div>
                        )}
                        <div className="my-8 relative h-[300px] rounded-2xl overflow-hidden">
                           <Image src={selectedArticle.imageUrl} alt={selectedArticle.title} fill className="object-cover" />
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </section>
  );
}
