'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, AlertCircle } from 'lucide-react';
import { isAdminLoggedIn } from '../../../lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace('/admin/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // 토큰과 사용자 정보를 localStorage에 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', data.data.token);
          localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        }

        // 로그인 성공 시 어드민 대시보드로 리다이렉트
        window.location.replace('/admin/dashboard');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
        setLoading(false);
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 체크 중이면 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">
         <div className="p-8 pb-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-center gap-2 mb-3 text-gray-900">
               <ShieldCheck className="w-7 h-7 text-blue-600" />
               <span className="font-bold text-[22px] tracking-tight">BEAUTIA ADMIN</span>
            </div>
            <p className="text-center text-[13px] text-gray-500 font-medium">관리자 전용 로그인</p>
         </div>

         <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-[13px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">이메일</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-[50px] px-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-[14px]"
                    placeholder="admin@beautia.com"
                    autoComplete="email"
                  />
               </div>
               <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">비밀번호</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-[50px] px-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-[14px]"
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                  />
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-[52px] bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg font-bold hover:from-gray-800 hover:to-gray-700 transition-all flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
               >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>로그인</span>
                    </>
                  )}
               </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
               <p className="text-[11px] text-gray-400 leading-relaxed">
                  ⚠️ 무단 접근은 엄격히 금지됩니다.<br/>
                  모든 접속 기록은 보안을 위해 저장됩니다.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
