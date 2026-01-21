'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { BentoFeatures } from './components/BentoFeatures';
import { Footer } from './components/Footer';
import { CategoryGrid } from './components/CategoryGrid';
import { TrendingSection } from './components/TrendingSection';
import { MagazineSection } from './components/MagazineSection';
import { ReviewTicker } from './components/ReviewTicker';
import { InteractiveMap } from './components/InteractiveMap';
import { LoadingIntro } from './components/LoadingIntro';
import { Globe, ArrowRight } from 'lucide-react';
import { GradientButton } from './components/GradientButton';
import { useLanguage } from '../contexts/LanguageContext';
import { HelpToggle } from './components/HelpToggle';

export default function Home() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();

  // 소셜 로그인 성공 처리
  useEffect(() => {
    // URL에서 직접 쿼리 파라미터 읽기 (useSearchParams 대신)
    const urlParams = new URLSearchParams(window.location.search);
    const socialLogin = urlParams.get('social_login');
    const userParam = urlParams.get('user');

    if (socialLogin === 'success' && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('소셜 로그인 사용자 정보:', user);
        
        // 쿠키에서 토큰을 가져오기 위해 API 호출
        fetch('/api/customer/auth/check', {
          method: 'GET',
          credentials: 'include', // 쿠키 포함
        })
          .then(res => res.json())
          .then(data => {
            console.log('인증 확인 API 응답:', data);
            
            // successResponse 형식: { success: true, data: { token } }
            const token = data.data?.token || data.token;
            
            if (data.success && token) {
              console.log('토큰 저장 중:', token ? '있음' : '없음');
              
              // localStorage에 토큰과 사용자 정보 저장
              localStorage.setItem('customer_token', token);
              localStorage.setItem('customer_user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'user',
                profileImage: user.profileImage,
              }));

              console.log('localStorage 저장 완료:', {
                token: localStorage.getItem('customer_token') ? '있음' : '없음',
                user: localStorage.getItem('customer_user') ? '있음' : '없음',
              });

              // 커스텀 이벤트 발생
              window.dispatchEvent(new Event('customer-login'));

              // 쿼리 파라미터 제거
              router.replace('/');
            } else {
              console.error('토큰이 없습니다:', data);
              router.replace('/');
            }
          })
          .catch(error => {
            console.error('소셜 로그인 처리 오류:', error);
            router.replace('/');
          });
      } catch (error) {
        console.error('소셜 로그인 사용자 정보 파싱 오류:', error);
        router.replace('/');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-brand-pink/20">
      <LoadingIntro />
      
      <Header />
      
      <main className="relative">
        {/* 섹션 구분을 위한 시각적 가이드 */}
        <HeroSection />

        {/* 1. Quick Access - 카테고리 그리드 (작은 섹션) */}
        <div className="relative py-8 md:py-12 bg-gradient-to-b from-white via-surface/20 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-3">
            <div className="flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-lilac"></span>
              <span>S1</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[9px]">Quick Access</span>
            </div>
          </div>
          <CategoryGrid />
        </div>

        {/* 2. Social Proof Stream - 리뷰 티커 (매우 작은 섹션) */}
        <div className="relative py-6 md:py-8 bg-gradient-to-b from-white via-brand-lilac/5 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-2">
            <div className="flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink"></span>
              <span>S2</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[9px]">Social Proof</span>
            </div>
          </div>
          <ReviewTicker />
        </div>

        {/* 3. Viral Content - 트렌딩 섹션 (큰 섹션) */}
        <div className="relative py-20 md:py-28 bg-gradient-to-b from-white via-brand-mint/5 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-6">
            <div className="flex items-center gap-3 text-[11px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand-mint"></span>
              <span>S3</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[10px]">Trending (Large)</span>
            </div>
          </div>
          <TrendingSection />
        </div>

        {/* 4. Interactive Exploration - 인터랙티브 맵 (중간 섹션) */}
        <div className="relative py-16 md:py-20 bg-gradient-to-b from-white via-surface/20 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-4">
            <div className="flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-lilac"></span>
              <span>S4</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[9px]">Interactive Map (Medium)</span>
            </div>
          </div>
          <InteractiveMap />
        </div>

        {/* 5. Brand Story & Trust - 벤토 피처 (중간 섹션) */}
        <div className="relative py-16 md:py-20 bg-gradient-to-b from-white via-brand-pink/5 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-4">
            <div className="flex items-center gap-3 text-[10px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink"></span>
              <span>S5</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[9px]">Brand Story (Medium)</span>
            </div>
          </div>
          <BentoFeatures />
        </div>

        {/* 6. Retention Content - 매거진 섹션 (큰 섹션) */}
        <div className="relative py-20 md:py-28 bg-gradient-to-b from-white via-brand-mint/5 to-white">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"></div>
          <div className="max-w-[1200px] mx-auto px-6 mb-6">
            <div className="flex items-center gap-3 text-[11px] font-bold text-secondary uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand-mint"></span>
              <span>S6</span>
              <span className="flex-1 h-px bg-line"></span>
              <span className="text-[10px]">Magazine (Large)</span>
            </div>
          </div>
          <MagazineSection />
        </div>

        {/* Partner / Global Section */}
        <section className="py-24 bg-surface/30 border-y border-line/40 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line mb-6 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-brand-lilac" />
                <span className="text-[12px] font-bold text-secondary uppercase tracking-wide">{t('main_partner.tag')}</span>
              </div>
              <h2 className="text-[36px] md:text-[44px] font-bold mb-6 leading-[1.1] tracking-tight">
                {t('main_partner.title')}
              </h2>
              <p className="text-[16px] text-secondary mb-10 leading-relaxed max-w-[480px]">
                {t('main_partner.subtitle')}
              </p>
              
              <div className="flex items-center gap-8 mb-10">
                  <div>
                      <div className="text-[28px] font-bold text-primary mb-1">240%</div>
                      <div className="text-[13px] text-secondary font-medium">{t('main_partner.growth')}</div>
                  </div>
                  <div className="w-[1px] h-10 bg-line" />
                  <div>
                      <div className="text-[28px] font-bold text-primary mb-1">0%</div>
                      <div className="text-[13px] text-secondary font-medium">{t('main_partner.noshow')}</div>
                  </div>
              </div>

              <Link href="/partner">
                <GradientButton variant="secondary" className="pl-6 pr-4">
                  {t('main_partner.btn_guide')}
                  <ArrowRight className="ml-2 w-4 h-4 opacity-50" />
                </GradientButton>
              </Link>
            </div>
            
            <div className="flex-1 w-full max-w-[500px]">
              {/* Partner Dashboard Mockup */}
              <div className="aspect-square bg-white rounded-[40px] border border-line p-8 shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                 <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-brand-lilac/10 to-transparent rounded-bl-full" />
                 
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <div className="font-bold text-[18px]">{t('main_partner.dashboard_title')}</div>
                        <div className="bg-surface px-3 py-1 rounded-full text-[12px] font-medium">{t('main_partner.this_month')}</div>
                    </div>
                    
                    <div className="mb-8">
                        <div className="text-secondary text-[14px] mb-2">{t('main_partner.total_booking_revenue')}</div>
                        <div className="text-[36px] font-bold text-primary">{formatPrice(12450000)}</div>
                        <div className="text-[13px] text-green-500 font-medium mt-1">▲ 12.5% {t('main_partner.vs_last_month')}</div>
                    </div>

                    <div className="flex items-end gap-3 h-[120px] mt-auto">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-surface rounded-t-[8px] relative group overflow-hidden" style={{height: `${h}%`}}>
                                <div className="absolute bottom-0 left-0 w-full bg-brand-lilac/80 h-0 group-hover:h-full transition-all duration-500" />
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-24 px-6">
           <div className="max-w-[1200px] mx-auto bg-primary rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-brand-pink/20 to-transparent opacity-30 blur-[100px] pointer-events-none" />

             <div className="relative z-10">
                <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-white tracking-tight">
                    {t('main_cta.title')}
                </h2>
                <p className="text-white/60 mb-10 text-[16px] md:text-[18px]">
                    {t('main_cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="h-[56px] px-8 rounded-2xl bg-white text-primary font-bold text-[16px] hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
                        {t('main_cta.app_store')}
                    </button>
                    <button className="h-[56px] px-8 rounded-2xl bg-white/10 backdrop-blur text-white font-bold text-[16px] border border-white/20 hover:bg-white/20 transition-colors">
                        {t('main_cta.google_play')}
                    </button>
                </div>
             </div>
           </div>
        </section>
      </main>

      <Footer />
      
      {/* 도움말 토글 버튼 */}
      <HelpToggle />
    </div>
  );
}
