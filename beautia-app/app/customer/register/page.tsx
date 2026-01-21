'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BeautiaLogo } from '../../components/BeautiaLogo';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export default function CustomerRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      if (data.success) {
        // 회원가입 성공 - 자동 로그인
        localStorage.setItem('customer_token', 'temp-token');
        localStorage.setItem('customer_user', JSON.stringify(data.user));
        
        // 홈으로 리다이렉트
        window.location.href = '/';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
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
            <h2 className="text-[32px] font-bold mb-4">BEAUTIA와 함께하세요</h2>
            <p className="text-secondary text-[16px]">
               간편한 회원가입으로<br/>
               프리미엄 K-뷰티 서비스를 시작하세요
            </p>
         </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
         <div className="w-full max-w-[400px] py-8">
            <div className="mb-8">
               <Link href="/" className="inline-block mb-6">
                  <div className="flex items-center gap-2">
                     <BeautiaLogo className="w-8 h-8" />
                     <span className="font-bold text-[20px]">BEAUTIA</span>
                  </div>
               </Link>
               <h1 className="text-[28px] font-bold mb-2">회원가입</h1>
               <p className="text-secondary text-[14px]">새로운 계정을 만드세요.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">이름</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="이름을 입력하세요"
                    required
                    className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                  />
               </div>

               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">이메일</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="이메일 주소를 입력하세요"
                    required
                    className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                  />
               </div>

               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">전화번호 (선택)</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="010-1234-5678"
                    className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                  />
               </div>

               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">비밀번호</label>
                  <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       value={formData.password}
                       onChange={(e) => setFormData({...formData, password: e.target.value})}
                       placeholder="최소 6자 이상"
                       required
                       minLength={6}
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

               <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">비밀번호 확인</label>
                  <div className="relative">
                     <input 
                       type={showConfirmPassword ? "text" : "password"} 
                       value={formData.confirmPassword}
                       onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                       placeholder="비밀번호를 다시 입력하세요"
                       required
                       className="w-full h-[52px] px-4 rounded-xl border border-line bg-surface focus:bg-white focus:border-brand-lilac transition-all outline-none"
                     />
                     <button 
                       type="button"
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                     >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full h-[56px] bg-primary text-white rounded-xl font-bold text-[16px] hover:bg-brand-lilac hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isLoading ? '가입 중...' : '회원가입'}
                  {!isLoading && <Check className="w-5 h-5" />}
               </button>
            </form>

            <div className="mt-8 text-center text-[13px] text-secondary">
               이미 계정이 있으신가요? <br/>
               <Link href="/customer/login" className="text-primary font-bold underline mt-2 inline-block">로그인</Link>
            </div>
         </div>
      </div>
    </div>
  );
}
