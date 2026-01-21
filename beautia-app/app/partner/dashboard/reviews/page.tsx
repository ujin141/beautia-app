'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, ThumbsUp, Sparkles, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { PartnerApi } from '../../../../lib/api';
import { Review } from '../../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          console.error('Partner info not found');
          setLoading(false);
          return;
        }
        const data = await PartnerApi.getReviews(partner.id);
        // data가 배열인지 확인하고 설정
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleReplySubmit = async (reviewId: string) => {
     if (!replyText.trim()) return;
     setIsSubmitting(true);
     try {
        await PartnerApi.replyToReview(reviewId, replyText);
        // 리뷰 목록 새로고침
        const partner = getPartnerUser();
        if (partner) {
          const data = await PartnerApi.getReviews(partner.id);
          // data가 배열인지 확인하고 설정
          setReviews(Array.isArray(data) ? data : []);
        }
        setActiveReviewId(null);
        setReplyText('');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
     } catch (error) {
        console.error('Failed to reply', error);
        alert('답글 작성에 실패했습니다. 다시 시도해주세요.');
     } finally {
        setIsSubmitting(false);
     }
  };

  const generateAIResponse = (rating: number, content: string) => {
     if (rating === 5) {
        setReplyText(`안녕하세요 고객님! 소중한 리뷰 감사합니다. 마음에 드셨다니 저희도 정말 기쁘네요! 😊 다음 방문 때도 최고의 서비스로 보답하겠습니다.`);
     } else {
        setReplyText(`안녕하세요 고객님, 이용에 불편을 드려 정말 죄송합니다. 말씀해주신 부분은 바로 개선하여 다음번엔 더 만족스러운 경험을 드리도록 노력하겠습니다.`);
     }
  };

  if (loading) return <div className="p-8">{t('common.loading')}</div>;

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      <AnimatePresence>
         {showToast && (
            <motion.div 
               initial={{ opacity: 0, y: -20, x: '-50%' }}
               animate={{ opacity: 1, y: 0, x: '-50%' }}
               exit={{ opacity: 0, y: -20, x: '-50%' }}
               className="fixed top-8 left-1/2 z-50 px-6 py-3 bg-gray-900 rounded-full shadow-xl flex items-center gap-2 font-bold text-white"
            >
               <CheckCircle2 className="w-5 h-5 text-brand-mint" />
               {t('partner_dashboard.reviews_reply_registered')}
            </motion.div>
         )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.reviews_management')}</h2>
         <div className="flex gap-4 text-[14px]">
            <div className="flex items-center gap-2">
               <span className="text-secondary">{t('partner_dashboard.reviews_avg_rating')}</span>
               <div className="flex items-center gap-1 font-bold text-[18px]">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> 
                  {Array.isArray(reviews) && reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
                    : '0.0'}
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-secondary">{t('partner_dashboard.reviews_total')}</span>
               <span className="font-bold text-[18px]">{Array.isArray(reviews) ? reviews.length : 0}</span>
            </div>
         </div>
      </div>

      <div className="space-y-4">
         {Array.isArray(reviews) && reviews.length > 0 ? (
            reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-line">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-surface" />
                     <div>
                        <div className="font-bold">{review.userName}</div>
                        <div className="text-[12px] text-secondary">{review.date}</div>
                     </div>
                  </div>
                  <div className="flex gap-0.5">
                     {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                     ))}
                  </div>
               </div>
               
               <p className="text-[15px] mb-6">{review.content}</p>

               {review.reply ? (
                  <div className="bg-surface p-4 rounded-xl text-[14px]">
                     <div className="font-bold mb-1 text-primary flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-brand-lilac" /> {t('partner_dashboard.reviews_owner_reply')}
                     </div>
                     <p className="text-secondary">{review.reply}</p>
                  </div>
               ) : (
                  <div>
                     {activeReviewId === review.id ? (
                        <div className="mt-4">
                           <textarea 
                             className="w-full p-4 bg-surface rounded-xl border border-transparent focus:bg-white focus:border-brand-lilac transition-all text-[14px] resize-none mb-3 outline-none"
                             rows={3}
                             value={replyText}
                             onChange={(e) => setReplyText(e.target.value)}
                             placeholder={t('partner_dashboard.reviews_reply_placeholder')}
                           />
                           <div className="flex justify-between items-center">
                              <button 
                                onClick={() => generateAIResponse(review.rating, review.content)}
                                className="flex items-center gap-2 text-[13px] font-bold text-brand-lilac hover:bg-brand-lilac/10 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                 <Wand2 className="w-4 h-4" /> {t('partner_dashboard.reviews_ai_reply')}
                              </button>
                              <div className="flex gap-2">
                                 <button onClick={() => setActiveReviewId(null)} className="px-4 py-2 text-[13px] text-secondary hover:bg-surface rounded-lg">{t('common.cancel')}</button>
                                 <button 
                                    onClick={() => handleReplySubmit(review.id)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold flex items-center gap-2 disabled:opacity-50"
                                 >
                                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {t('common.confirm')}
                                 </button>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <button 
                          onClick={() => { setActiveReviewId(review.id); setReplyText(''); }}
                          className="text-[14px] font-bold text-brand-lilac hover:underline"
                        >
                           {t('partner_dashboard.reviews_reply_btn')}
                        </button>
                     )}
                  </div>
               )}
            </div>
         ))
         ) : (
            <div className="bg-white p-12 rounded-2xl border border-line text-center">
               <div className="text-secondary text-[14px]">{t('partner_dashboard.reviews_empty') || '리뷰가 없습니다.'}</div>
            </div>
         )}
      </div>
    </div>
  );
}
