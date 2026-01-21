'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Check, ChevronRight, Upload, Building2, User, Phone, Mail, X, Image as ImageIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';

type Step = 'basic' | 'shop' | 'complete';

export default function PartnerApplyPage() {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    shopName: '',
    address: '',
    category: '',
    shopImages: [] as string[], // 업로드된 이미지 URL 배열
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();

  const SHOP_CATEGORIES = [
    t('category.hair'), t('category.spa'), t('category.makeup'), t('category.personal_color'),
    t('category.nail'), t('category.eyelash'), t('category.skin'), t('category.clinic'),
    t('category.body'), t('category.waxing'), t('category.massage'), t('category.men')
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // 여러 파일 업로드
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/partner/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        shopImages: [...prev.shopImages, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shopImages: prev.shopImages.filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    // Simple validation
    if (currentStep === 'basic') {
        if (!formData.name || !formData.phone) {
            alert(t('apply.alert_basic'));
            return;
        }
        setCurrentStep('shop');
    }
    else if (currentStep === 'shop') {
        if (!formData.shopName || !formData.category) {
            alert(t('apply.alert_shop'));
            return;
        }
        
        // 서버로 제출
        setIsSubmitting(true);
        try {
          const response = await fetch('/api/partner/apply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

          const data = await response.json();

          if (!response.ok) {
            // 개발 환경에서는 상세 에러 메시지 포함
            const errorMsg = data.details 
              ? `${data.error}\n${data.details}` 
              : data.error || t('apply.submission_failed');
            console.error('API Error:', data);
            throw new Error(errorMsg);
          }

          // 성공하면 완료 단계로
          setCurrentStep('complete');
        } catch (error) {
          console.error(t('apply.submission_error'), error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : t('apply.submission_failed_retry');
          // 더 명확한 에러 메시지 표시
          alert(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-brand-lilac/20">
      <Header />

      <main className="pt-[100px] pb-20 px-6">
        <div className="max-w-[600px] mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
             <div className="flex justify-between items-center text-[13px] font-bold text-secondary mb-4 uppercase tracking-wider">
                <span className={currentStep === 'basic' ? 'text-primary' : ''}>01. {t('apply.step1')}</span>
                <span className={currentStep === 'shop' ? 'text-primary' : ''}>02. {t('apply.step2')}</span>
                <span className={currentStep === 'complete' ? 'text-primary' : ''}>03. {t('apply.step3')}</span>
             </div>
             <div className="h-1 bg-line rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-primary"
                   initial={{ width: '33%' }}
                   animate={{ 
                      width: currentStep === 'basic' ? '33%' : currentStep === 'shop' ? '66%' : '100%' 
                   }}
                   transition={{ duration: 0.5 }}
                />
             </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-xl border border-line relative overflow-hidden">
             <AnimatePresence mode='wait'>
                
                {/* Step 1: Basic Info */}
                {currentStep === 'basic' && (
                   <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                   >
                      <div className="text-center mb-8">
                         <h2 className="text-[24px] font-bold mb-2">{t('apply.title_basic')}</h2>
                         <p className="text-secondary text-[15px]">{t('apply.desc_basic')}</p>
                         <button
                            onClick={() => {
                              window.open(`/api/partner/brochure?lang=${language}`, '_blank');
                            }}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-brand-lilac text-white rounded-xl font-bold text-[14px] hover:bg-opacity-90 transition-all"
                         >
                            <Download className="w-4 h-4" />
                            {t('partner_landing.btn_brochure') || '브로슈어 다운로드'}
                         </button>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_name')}</label>
                            <div className="relative">
                               <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                               <input 
                                 type="text" 
                                 className="w-full h-[52px] pl-12 pr-4 bg-surface rounded-xl border-transparent focus:border-brand-lilac focus:bg-white focus:ring-0 transition-all font-medium"
                                 placeholder={t('apply.placeholder_name')}
                                 value={formData.name}
                                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                               />
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_phone')}</label>
                            <div className="relative">
                               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                               <input 
                                 type="tel" 
                                 className="w-full h-[52px] pl-12 pr-4 bg-surface rounded-xl border-transparent focus:border-brand-lilac focus:bg-white focus:ring-0 transition-all font-medium"
                                 placeholder={t('apply.placeholder_phone')}
                                 value={formData.phone}
                                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               />
                            </div>
                         </div>

                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_email')}</label>
                            <div className="relative">
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                               <input 
                                 type="email" 
                                 className="w-full h-[52px] pl-12 pr-4 bg-surface rounded-xl border-transparent focus:border-brand-lilac focus:bg-white focus:ring-0 transition-all font-medium"
                                 placeholder={t('apply.placeholder_email')}
                                 value={formData.email}
                                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                               />
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleNext}
                        className="w-full h-[56px] mt-4 bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-lilac hover:text-primary transition-all flex items-center justify-center gap-2"
                      >
                         {t('apply.btn_next')}
                         <ChevronRight className="w-5 h-5" />
                      </button>
                   </motion.div>
                )}

                {/* Step 2: Shop Info */}
                {currentStep === 'shop' && (
                   <motion.div
                      key="shop"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                   >
                      <div className="text-center mb-6">
                         <h2 className="text-[24px] font-bold mb-2">{t('apply.title_shop')}</h2>
                         <p className="text-secondary text-[15px]">{t('apply.desc_shop')}</p>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_shop_name')}</label>
                            <div className="relative">
                               <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                               <input 
                                 type="text" 
                                 className="w-full h-[52px] pl-12 pr-4 bg-surface rounded-xl border-transparent focus:border-brand-lilac focus:bg-white focus:ring-0 transition-all font-medium"
                                 placeholder={t('apply.placeholder_shop_name')}
                                 value={formData.shopName}
                                 onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                               />
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_category')}</label>
                            {/* Updated to Grid 3 cols for better layout of 12 items */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                               {SHOP_CATEGORIES.map((cat) => (
                                  <button
                                    key={cat}
                                    onClick={() => setFormData({...formData, category: cat})}
                                    className={`h-[44px] rounded-lg text-[13px] font-medium transition-all border ${
                                       formData.category === cat 
                                          ? 'bg-primary text-white border-primary shadow-md' 
                                          : 'bg-surface text-secondary border-transparent hover:bg-white hover:border-line'
                                    }`}
                                  >
                                     {cat}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_shop_images')}</label>
                            
                            {/* 이미지 미리보기 */}
                            {formData.shopImages.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                {formData.shopImages.map((url, index) => (
                                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-line">
                                    <Image
                                      src={url}
                                      alt={`Shop image ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                    <button
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 업로드 영역 */}
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-line rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-surface/50 transition-colors cursor-pointer group"
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                              />
                              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                {uploading ? (
                                  <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Upload className="w-5 h-5 text-secondary" />
                                )}
                              </div>
                              <p className="text-[13px] font-medium text-primary mb-1">
                                {uploading ? t('apply.uploading') : t('apply.upload_shop_images')}
                              </p>
                              <p className="text-[11px] text-secondary">
                                {t('apply.upload_hint')}
                              </p>
                            </div>
                         </div>

                         <div>
                            <label className="block text-[13px] font-bold text-secondary mb-2">{t('apply.label_address')}</label>
                            <div className="relative">
                               <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                               <input 
                                 type="text" 
                                 className="w-full h-[52px] pl-12 pr-4 bg-surface rounded-xl border-transparent focus:border-brand-lilac focus:bg-white focus:ring-0 transition-all font-medium"
                                 placeholder={t('apply.placeholder_address')}
                                 value={formData.address}
                                 onChange={(e) => setFormData({...formData, address: e.target.value})}
                               />
                            </div>
                         </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                         <button 
                           onClick={() => setCurrentStep('basic')}
                           className="flex-1 h-[56px] bg-surface text-secondary rounded-xl font-bold text-[16px] hover:bg-line transition-all"
                         >
                            {t('apply.btn_prev')}
                         </button>
                         <button 
                           onClick={handleNext}
                           disabled={isSubmitting}
                           className="flex-[2] h-[56px] bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-lilac hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {isSubmitting ? t('apply.submitting') : t('apply.btn_submit')}
                            {!isSubmitting && <Check className="w-5 h-5" />}
                         </button>
                      </div>
                   </motion.div>
                )}

                {/* Step 3: Complete */}
                {currentStep === 'complete' && (
                   <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                   >
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                         <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                      </div>
                      
                      <h2 className="text-[28px] font-bold mb-4">{t('apply.title_complete')}</h2>
                      <p className="text-secondary text-[16px] leading-relaxed mb-8 whitespace-pre-line">
                         {t('apply.desc_complete')}
                      </p>

                      <div className="bg-surface p-6 rounded-2xl text-left mb-8">
                         <h4 className="font-bold text-[14px] mb-3">{t('apply.process_title')}</h4>
                         <ul className="space-y-3 text-[14px] text-secondary">
                            <li className="flex gap-2">
                               <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center text-[10px] font-bold">1</span>
                               {t('apply.process_1')}
                            </li>
                            <li className="flex gap-2">
                               <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center text-[10px] font-bold">2</span>
                               {t('apply.process_2')}
                            </li>
                            <li className="flex gap-2">
                               <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center text-[10px] font-bold">3</span>
                               {t('apply.process_3')}
                            </li>
                         </ul>
                      </div>

                      <Link href="/" className="inline-block w-full h-[56px] leading-[56px] bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-lilac hover:text-primary transition-all">
                         {t('apply.btn_home')}
                      </Link>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
