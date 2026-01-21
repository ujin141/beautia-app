'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BeautiaLogo } from '../../components/BeautiaLogo';
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle, Loader2, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function CustomerLoginPage() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // 이메일 유효성 검사
  const isValidEmail = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = email.length > 0 && password.length >= 6 && isValidEmail;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isFormValid) {
      setError(t('customer_login.invalid_credentials'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // 응답 텍스트 먼저 가져오기 (디버깅용)
      const responseText = await response.text();
      console.log('API 응답 원본:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        responseText: responseText.substring(0, 500) // 처음 500자만
      });

      // 응답을 JSON으로 파싱
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('응답 파싱 오류:', parseError, '응답 텍스트:', responseText);
        throw new Error('서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }

      if (!response.ok) {
        // 에러 응답 처리
        const errorMessage = data?.error || data?.message || data?.details || t('customer_login.login_failed');
        
        // 상세한 디버깅 정보 출력
        console.error('로그인 실패 상세:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage: errorMessage,
          fullData: data,
          responseText: responseText.substring(0, 200) // 처음 200자
        });
        
        // 사용자에게 표시할 에러 메시지
        const userErrorMessage = errorMessage || `서버 오류 (${response.status}): ${response.statusText}`;
        throw new Error(userErrorMessage);
      }

      // 성공 응답 확인
      if (data && data.success && data.token && data.user) {
        // 로그인 성공 애니메이션
        setLoginSuccess(true);
        
        // 세션 정보 저장
        try {
          localStorage.setItem('customer_token', data.token);
          localStorage.setItem('customer_user', JSON.stringify(data.user));
          
          if (rememberMe) {
            localStorage.setItem('remember_email', email);
          } else {
            localStorage.removeItem('remember_email');
          }
          
          console.log('로그인 성공:', {
            token: data.token ? '있음' : '없음',
            user: data.user?.email || '없음'
          });
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
          throw new Error('로그인 정보 저장에 실패했습니다. 브라우저 설정을 확인해주세요.');
        }
        
        // 커스텀 이벤트 발생 (같은 탭에서 로그인 상태 변경 감지용)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('customer-login'));
        }
        
        // 홈으로 리다이렉트
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        // 성공 응답이지만 데이터가 불완전한 경우
        console.error('로그인 응답 데이터 오류:', {
          hasData: !!data,
          hasSuccess: !!data?.success,
          hasToken: !!data?.token,
          hasUser: !!data?.user,
          fullData: data
        });
        throw new Error(data?.error || data?.message || '로그인 정보가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      const errorMessage = error instanceof Error ? error.message : t('customer_login.login_failed');
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left: Enhanced Visual */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-lilac/30 via-brand-pink/20 to-brand-mint/20 items-center justify-center relative overflow-hidden">
         {/* Animated Background Elements */}
         <div className="absolute inset-0">
            <motion.div 
               className="absolute top-20 left-20 w-72 h-72 bg-brand-lilac/20 rounded-full blur-3xl"
               animate={{
                  x: [0, 100, 0],
                  y: [0, 50, 0],
               }}
               transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut"
               }}
            />
            <motion.div 
               className="absolute bottom-20 right-20 w-96 h-96 bg-brand-pink/20 rounded-full blur-3xl"
               animate={{
                  x: [0, -80, 0],
                  y: [0, -60, 0],
               }}
               transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "easeInOut"
               }}
            />
         </div>
         
         <motion.div 
            className="relative z-10 text-center p-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
         >
            <div className="flex items-center justify-center gap-2 mb-6">
               <BeautiaLogo className="w-12 h-12" />
               <span className="font-bold text-[24px] text-primary">BEAUTIA</span>
            </div>
            <h2 className="text-[36px] font-bold mb-4 bg-gradient-to-r from-brand-lilac to-brand-pink bg-clip-text text-transparent">
               {t('customer_login.welcome')}
            </h2>
            <p className="text-secondary text-[16px] leading-relaxed mb-8">
               {t('customer_login.subtitle')}
            </p>
            
            {/* Features */}
            <div className="space-y-4 text-left">
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-lilac/20 flex items-center justify-center shrink-0 mt-0.5">
                     <Sparkles className="w-4 h-4 text-brand-lilac" />
                  </div>
                  <div>
                     <div className="font-semibold text-[14px] mb-1">{t('customer_login.feature1_title')}</div>
                     <div className="text-[12px] text-secondary">{t('customer_login.feature1_desc')}</div>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-pink/20 flex items-center justify-center shrink-0 mt-0.5">
                     <Shield className="w-4 h-4 text-brand-pink" />
                  </div>
                  <div>
                     <div className="font-semibold text-[14px] mb-1">{t('customer_login.feature2_title')}</div>
                     <div className="text-[12px] text-secondary">{t('customer_login.feature2_desc')}</div>
                  </div>
               </div>
            </div>
         </motion.div>
      </div>

      {/* Right: Enhanced Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white relative">
         {/* Success Overlay */}
         <AnimatePresence>
            {loginSuccess && (
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center"
               >
                  <div className="text-center">
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                     >
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                     </motion.div>
                     <h3 className="text-[24px] font-bold mb-2">{t('customer_login.success_title')}</h3>
                     <p className="text-secondary">{t('customer_login.success_desc')}</p>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <motion.div 
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
         >
            <div className="mb-8">
               <Link href="/" className="inline-block mb-8 group">
                  <motion.div 
                     className="flex items-center gap-2"
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                  >
                     <BeautiaLogo className="w-10 h-10 transition-transform group-hover:rotate-12" />
                     <span className="font-bold text-[24px] bg-gradient-to-r from-brand-lilac to-brand-pink bg-clip-text text-transparent">
                        BEAUTIA
                     </span>
                  </motion.div>
               </Link>
               <h1 className="text-[32px] font-bold mb-2">{t('customer_login.title')}</h1>
               <p className="text-secondary text-[15px]">{t('customer_login.desc')}</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
               {error && (
                  <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3"
                  >
                     <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                     <div className="flex-1">
                        <div className="font-semibold text-red-800 text-[14px] mb-1">{t('customer_login.error_title')}</div>
                        <div className="text-red-700 text-[13px]">{error}</div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
               {/* Email Input */}
               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('customer_login.email_label')}</label>
                  <div className="relative">
                     <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        emailFocused ? 'text-brand-lilac' : 'text-secondary/50'
                     }`} />
                     <input 
                        type="email" 
                        value={email}
                        onChange={(e) => {
                           setEmail(e.target.value);
                           setError('');
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder={t('customer_login.email_placeholder')}
                        required
                        className={`w-full h-[56px] pl-12 pr-4 rounded-xl border-2 transition-all outline-none font-medium ${
                           !isValidEmail && email.length > 0
                              ? 'border-red-300 bg-red-50/50 focus:border-red-500'
                              : emailFocused
                              ? 'border-brand-lilac bg-white shadow-lg shadow-brand-lilac/10'
                              : 'border-line bg-surface focus:bg-white focus:border-brand-lilac'
                        }`}
                     />
                     {isValidEmail && email.length > 0 && (
                        <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                     )}
                  </div>
                  {!isValidEmail && email.length > 0 && (
                     <p className="mt-1.5 text-[12px] text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('customer_login.email_invalid')}
                     </p>
                  )}
               </div>

               {/* Password Input */}
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <label className="block text-[13px] font-bold text-secondary">{t('customer_login.password_label')}</label>
                     <Link 
                        href="/customer/forgot-password" 
                        className="text-[12px] text-brand-lilac hover:underline font-medium"
                     >
                        {t('customer_login.forgot_password')}
                     </Link>
                  </div>
                  <div className="relative">
                     <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        passwordFocused ? 'text-brand-lilac' : 'text-secondary/50'
                     }`} />
                     <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => {
                           setPassword(e.target.value);
                           setError('');
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder={t('customer_login.password_placeholder')}
                        required
                        minLength={6}
                        className={`w-full h-[56px] pl-12 pr-12 rounded-xl border-2 transition-all outline-none font-medium ${
                           passwordFocused
                              ? 'border-brand-lilac bg-white shadow-lg shadow-brand-lilac/10'
                              : 'border-line bg-surface focus:bg-white focus:border-brand-lilac'
                        }`}
                     />
                     <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-brand-lilac transition-colors"
                     >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                     <p className="mt-1.5 text-[12px] text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('customer_login.password_min')}
                     </p>
                  )}
               </div>

               {/* Remember Me */}
               <div className="flex items-center gap-2">
                  <input
                     type="checkbox"
                     id="remember"
                     checked={rememberMe}
                     onChange={(e) => setRememberMe(e.target.checked)}
                     className="w-4 h-4 rounded border-line text-brand-lilac focus:ring-brand-lilac focus:ring-2"
                  />
                  <label htmlFor="remember" className="text-[13px] text-secondary cursor-pointer">
                     {t('customer_login.remember_email')}
                  </label>
               </div>

               {/* Login Button */}
               <motion.button 
                  type="submit" 
                  disabled={isLoading || !isFormValid}
                  whileHover={!isLoading && isFormValid ? { scale: 1.02 } : {}}
                  whileTap={!isLoading && isFormValid ? { scale: 0.98 } : {}}
                  className={`w-full h-[56px] rounded-xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-lg ${
                     isLoading || !isFormValid
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-brand-lilac to-brand-pink text-white hover:shadow-xl hover:shadow-brand-lilac/30'
                  }`}
               >
                  {isLoading ? (
                     <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('customer_login.logging_in')}
                     </>
                  ) : (
                     <>
                        {t('customer_login.btn_login')}
                        <ArrowRight className="w-5 h-5" />
                     </>
                  )}
               </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
               </div>
               <div className="relative flex justify-center text-[12px]">
                  <span className="px-4 bg-white text-secondary">{t('customer_login.or')}</span>
               </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {/* 구글 로그인 */}
               <a
                  href="/api/auth/google"
                  className="h-[52px] border-2 border-line rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md group"
               >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-semibold text-[13px] text-gray-700 group-hover:text-primary">{t('customer_login.social_google')}</span>
               </a>
               
               {/* 카카오 로그인 */}
               <a
                  href="/api/auth/kakao"
                  className="h-[52px] bg-[#FEE500] rounded-xl flex items-center justify-center gap-2 hover:bg-[#FEE500]/90 transition-all shadow-sm hover:shadow-md group"
               >
                  <div className="w-5 h-5 bg-[#FEE500] rounded-full flex items-center justify-center">
                     <span className="text-[10px] font-bold text-black">K</span>
                  </div>
                  <span className="font-semibold text-[13px] text-black">{t('customer_login.social_kakao')}</span>
               </a>
               
               {/* 라인 로그인 */}
               <a
                  href="/api/auth/line"
                  className="h-[52px] bg-[#06C755] rounded-xl flex items-center justify-center gap-2 hover:bg-[#06C755]/90 transition-all shadow-sm hover:shadow-md group"
               >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                     <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.348 0 .63.285.63.63 0 .349-.282.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.27l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.058.896-.021.135-.14.816.549.816.391 0 1.063-.258 1.47-.483.26-.156.49-.27.736-.27.27 0 .471.15.646.301.195.18.42.391.919.391.52 0 .915-.211 1.29-.391.27-.15.48-.301.75-.301.24 0 .465.104.735.27.42.24 1.084.483 1.47.483.69 0 .57-.681.549-.816-.021-.13-.063-.595.058-.896.135-.332.667-.508 1.058-.59C19.73 19.156 24 15.125 24 10.314"/>
                  </svg>
                  <span className="font-semibold text-[13px] text-white">{t('customer_login.social_line')}</span>
               </a>
               
               {/* 페이스북 로그인 */}
               <a
                  href="/api/auth/facebook"
                  className="h-[52px] bg-[#1877F2] rounded-xl flex items-center justify-center gap-2 hover:bg-[#1877F2]/90 transition-all shadow-sm hover:shadow-md group"
               >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-semibold text-[13px] text-white">{t('customer_login.social_facebook')}</span>
               </a>
               
               {/* Apple 로그인 */}
               <a
                  href="/api/auth/apple"
                  className="h-[52px] bg-black rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-sm hover:shadow-md group"
               >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                     <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.54 7.06 9.58 6.88c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 6.9c-.15-2.58 1.66-4.68 3.74-5.42-2.89 2.5-4.39 6.34-3.74 5.42z"/>
                  </svg>
                  <span className="font-semibold text-[13px] text-white">{t('customer_login.social_apple')}</span>
               </a>
            </div>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
               <p className="text-[13px] text-secondary mb-3">
                  {t('customer_login.no_account')}
               </p>
               <Link 
                  href="/customer/register" 
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-brand-lilac hover:text-brand-pink transition-colors group"
               >
                  {t('customer_login.signup')}
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-line flex justify-center gap-4 text-[11px] text-secondary">
               <Link href="/policy/terms" className="hover:text-primary transition-colors">{t('customer_login.terms')}</Link>
               <span>•</span>
               <Link href="/policy/privacy" className="hover:text-primary transition-colors">{t('customer_login.privacy')}</Link>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
