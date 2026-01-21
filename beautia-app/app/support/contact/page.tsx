'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Send, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState(t('contact.type_booking'));
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('contact.error'));
      }

      setSubmitted(true);
    } catch (err) {
      console.error('문의 전송 오류:', err);
      setError(
        err instanceof Error
          ? err.message
          : t('contact.error_retry')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
     return (
        <div className="min-h-screen bg-surface flex flex-col">
           <Header />
           <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20">
              <div className="w-16 h-16 bg-brand-mint/20 rounded-full flex items-center justify-center mb-6">
                 <Send className="w-8 h-8 text-brand-mint" />
              </div>
              <h2 className="text-[28px] font-bold mb-4">{t('contact.submitted_title')}</h2>
              <p className="text-secondary max-w-[400px] mb-8 whitespace-pre-line">
                 {t('contact.submitted_desc')}
              </p>
              <Link href="/" className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-black/80 transition-colors">
                 {t('contact.home_btn')}
              </Link>
           </main>
           <Footer />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-white text-primary selection:bg-brand-mint/20">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[600px] mx-auto px-6">
          <div className="text-center mb-10">
             <h1 className="text-[32px] md:text-[40px] font-bold mb-4">{t('contact.title')}</h1>
             <p className="text-secondary whitespace-pre-line">
                {t('contact.subtitle')}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
               <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                 {error}
               </div>
             )}
             <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('contact.label_type')}</label>
                <select
                  className="w-full h-[52px] px-4 rounded-xl bg-surface border-transparent focus:bg-white focus:border-brand-mint focus:ring-0 transition-all font-medium"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                   <option value={t('contact.type_booking')}>{t('contact.type_booking')}</option>
                   <option value={t('contact.type_account')}>{t('contact.type_account')}</option>
                   <option value={t('contact.type_service')}>{t('contact.type_service')}</option>
                   <option value={t('contact.type_suggestion')}>{t('contact.type_suggestion')}</option>
                </select>
             </div>

             <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('contact.label_email')}</label>
                <input 
                  type="email" 
                  placeholder={t('contact.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-xl bg-surface border-transparent focus:bg-white focus:border-brand-mint focus:ring-0 transition-all font-medium"
                  required 
                />
             </div>

             <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('contact.label_message')}</label>
                <textarea 
                  rows={6}
                  placeholder={t('contact.message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-surface border-transparent focus:bg-white focus:border-brand-mint focus:ring-0 transition-all font-medium resize-none"
                  required
                />
             </div>

             <div className="bg-surface/50 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-[12px] text-secondary leading-relaxed whitespace-pre-line">
                   {t('contact.notice')}
                </p>
             </div>

             <button
               type="submit"
               disabled={isSubmitting}
               className="w-full h-[56px] bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-mint hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSubmitting ? t('contact.submitting') : t('contact.submit')}
             </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
