'use client';

import React, { useEffect, useState } from 'react';
import { Star, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PublicApi } from '../../lib/api';
import { Review } from '../../types';

// 도시별 국기 매핑
const getCityFlag = (cityName: string): string => {
  const lower = cityName.toLowerCase();
  if (lower.includes('seoul')) return "🇰🇷";
  if (lower.includes('tokyo')) return "🇯🇵";
  if (lower.includes('bangkok')) return "🇹🇭";
  if (lower.includes('singapore')) return "🇸🇬";
  return "🌏";
};

// 도시 이름 추출
const getCityName = (address: string): string => {
  const lower = address.toLowerCase();
  if (lower.includes('seoul')) return "Seoul";
  if (lower.includes('tokyo')) return "Tokyo";
  if (lower.includes('bangkok')) return "Bangkok";
  if (lower.includes('singapore')) return "Singapore";
  return address.split(',')[0] || "Unknown";
};

export function ReviewTicker() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await PublicApi.getReviews(10);
        setReviews(data);
      } catch (error) {
        console.error('리뷰 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // 기본 리뷰 데이터 (데이터가 없을 때 사용)
  const FALLBACK_REVIEWS = [
    { text: t('ticker.r1'), user: "Ji-eun K.", loc: "Seoul", flag: "🇰🇷" },
    { text: t('ticker.r2'), user: "Sarah W.", loc: "Tokyo", flag: "🇺🇸" },
    { text: t('ticker.r3'), user: "Min-jun P.", loc: "Seoul", flag: "🇰🇷" },
    { text: t('ticker.r4'), user: "James L.", loc: "Bangkok", flag: "🇬🇧" },
  ];

  // 리뷰 데이터 가공
  const formattedReviews = reviews.length > 0 
    ? reviews.map((review) => ({
        text: review.content,
        user: review.userName,
        loc: getCityName(review.shopName || ''),
        flag: getCityFlag(review.shopName || ''),
      }))
    : FALLBACK_REVIEWS;

  const REVIEWS = formattedReviews;

  return (
    <div className="w-full bg-primary py-4 overflow-hidden border-y border-white/5 relative z-20">
      <div className="flex w-max animate-scroll-left hover:[animation-play-state:paused] group">
        {[...REVIEWS, ...REVIEWS, ...REVIEWS].map((review, idx) => (
          <div key={idx} className="flex items-center gap-4 px-10 text-white/90 text-[14px] font-medium border-r border-white/5 last:border-r-0 opacity-70 group-hover:opacity-100 transition-opacity">
             <div className="flex gap-0.5">
                 {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-white text-white" />)}
             </div>
             <span className="tracking-wide">"{review.text}"</span>
             <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-white/20">
                <span className="text-[14px]">{review.flag}</span>
                <span className="text-white/50 text-[12px] uppercase tracking-wider">{review.user} from {review.loc}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
