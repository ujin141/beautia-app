'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BeautiaLogo } from '../../components/BeautiaLogo';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function PartnerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/partner/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password 
        }),
      });

      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (error) {
          console.error('응답 JSON 파싱 실패:', error);
          throw new Error('서버 응답을 처리할 수 없습니다.');
        }
      } else {
        // JSON이 아닌 경우 텍스트로 읽기
        const text = await response.text();
        console.error('로그인 실패 (비JSON 응답):', {
          status: response.status,
          statusText: response.statusText,
          body: text,
        });
        throw new Error('로그인에 실패했습니다.');
      }

      if (!response.ok) {
        console.error('로그인 실패:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });
        throw new Error(data.error || data.message || '로그인에 실패했습니다.');
      }

      if (response.ok && data.success && data.user) {
        // 로그인 성공 - 세션 정보 저장
        // 쿠키는 서버에서 설정되므로, localStorage에도 저장 (클라이언트 사이드 인증 확인용)
        if (data.token) {
          localStorage.setItem('partner_token', data.token);
        }
        localStorage.setItem('partner_user', JSON.stringify(data.user));
        
        console.log('로그인 성공:', data.user);
        
        // 대시보드로 리다이렉트
        window.location.replace('/partner/dashboard');
      } else {
        throw new Error(data.error || '로그인 응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      setError(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual */}
      <div className="hidden lg:flex w-1/2 bg-surface items-center justify-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-lilac/20 to-brand-pink/20" />
         <div className="relative z-10 text-center p-12">
            <h2 className="text-[32px] font-bold mb-4">{t('partner.welcome')}</h2>
            <p className="text-secondary text-[16px]">
               {t('partner.subtitle')}
            </p>
         </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
         <div className="w-full max-w-[400px]">
            <div className="mb-8">
               <Link href="/" className="inline-block mb-6">
                  <div className="flex items-center gap-2">
                     <BeautiaLogo className="w-8 h-8" />
                     <span className="font-bold text-[20px]">Partner Center</span>
                  </div>
               </Link>
               <h1 className="text-[28px] font-bold mb-2">{t('login.partner_title')}</h1>
               <p className="text-secondary text-[14px]">Please login to your partner account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
               {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
                     {error}
                  </div>
               )}
               
               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.email_placeholder')}
                    required
                    className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                  />
               </div>
               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">Password</label>
                  <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder={t('login.pw_placeholder')}
                       required
                       className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                     >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full h-[56px] bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-lilac hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isLoading ? '로그인 중...' : t('login.btn_login')}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
               </button>
            </form>

            <div className="mt-8 text-center text-[13px] text-secondary">
               {t('login.no_account')} <br/>
               <Link href="/partner/apply" className="text-primary font-bold underline mt-2 inline-block">{t('login.partner_signup')}</Link>
            </div>
         </div>
      </div>
    </div>
  );
}
