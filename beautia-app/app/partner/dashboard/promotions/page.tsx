'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Percent, Calendar, TrendingUp, Loader2, AlertCircle, CheckCircle2, Clock, Tag } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';
import { motion } from 'framer-motion';

interface RecommendedPromotion {
  _id: string;
  title: string;
  description: string;
  type: 'discount' | 'flash_sale' | 'package' | 'coupon';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  effectiveness: number;
  daysRemaining: number;
  recommendation: 'high' | 'medium' | 'low';
  usedCount: number;
  usageLimit?: number;
}

export default function RecommendedPromotionsPage() {
  const [promotions, setPromotions] = useState<RecommendedPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t, formatPrice } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadRecommendedPromotions();
  }, []);

  const loadRecommendedPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const partner = getPartnerUser();
      if (!partner) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/partner/promotions?partnerId=${partner.id}&recommended=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromotions(data.data);
        } else {
          setError(data.error || '추천 프로모션을 불러오는데 실패했습니다.');
        }
      } else {
        const data = await response.json();
        setError(data.error || '추천 프로모션을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('추천 프로모션 로드 오류:', error);
      setError('추천 프로모션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'high':
        return t('partner_dashboard.promotions_effectiveness_high');
      case 'medium':
        return t('partner_dashboard.promotions_effectiveness_medium');
      case 'low':
        return t('partner_dashboard.promotions_effectiveness_low');
      default:
        return t('partner_dashboard.promotions_effectiveness_analyzing');
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'discount':
        return t('partner_dashboard.promotions_type_discount');
      case 'flash_sale':
        return t('partner_dashboard.promotions_type_flash_sale');
      case 'package':
        return t('partner_dashboard.promotions_type_package');
      case 'coupon':
        return t('partner_dashboard.promotions_type_coupon');
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-lilac" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-brand-lilac" />
            {t('partner_dashboard.promotions_title')}
          </h1>
          <p className="text-secondary text-[14px]">
            {t('partner_dashboard.promotions_desc')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[14px] flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-line text-center">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">{t('partner_dashboard.promotions_empty_title')}</h3>
          <p className="text-secondary text-[14px] mb-6">
            {t('partner_dashboard.promotions_empty_desc')}
          </p>
          <button
            onClick={() => router.push('/partner/dashboard/marketing?action=promotion')}
            className="px-6 py-3 bg-brand-lilac text-white rounded-xl font-bold hover:bg-brand-pink transition-colors"
          >
            {t('partner_dashboard.quick_action_promotion')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-line p-6 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-lilac" />
                  <span className="text-[12px] font-bold text-gray-500 uppercase">
                    {getTypeText(promo.type)}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getRecommendationColor(promo.recommendation)}`}>
                  {getRecommendationText(promo.recommendation)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[20px] font-bold text-gray-900 mb-2">{promo.title}</h3>
              <p className="text-[14px] text-secondary mb-4">{promo.description}</p>

              {/* Discount Info */}
              <div className="bg-gradient-to-r from-brand-lilac/10 to-brand-pink/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-brand-pink" />
                  <span className="text-[24px] font-bold text-brand-pink">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}%` 
                      : formatPrice(promo.discountValue)}
                  </span>
                  <span className="text-[14px] text-secondary">{t('partner_dashboard.promotions_discount')}</span>
                </div>
                {promo.discountType === 'percentage' && promo.maxDiscountAmount && (
                  <p className="text-[12px] text-secondary">
                    {t('partner_dashboard.promotions_max_discount')} {formatPrice(promo.maxDiscountAmount)} {t('partner_dashboard.promotions_discount')}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface rounded-lg p-3">
                  <div className="text-[11px] text-secondary mb-1">{t('partner_dashboard.promotions_usage_count')}</div>
                  <div className="text-[16px] font-bold text-gray-900">
                    {promo.usedCount || 0}
                    {promo.usageLimit && ` / ${promo.usageLimit}`}
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <div className="text-[11px] text-secondary mb-1">{t('partner_dashboard.promotions_effectiveness_score')}</div>
                  <div className="text-[16px] font-bold text-gray-900">
                    {Math.round(promo.effectiveness)}
                  </div>
                </div>
              </div>

              {/* Date Info */}
              <div className="flex items-center gap-4 text-[12px] text-secondary mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(promo.startDate)}</span>
                </div>
                <span>~</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(promo.endDate)}</span>
                </div>
              </div>

              {/* Days Remaining */}
              <div className="flex items-center gap-2 text-[13px]">
                <Clock className="w-4 h-4 text-brand-mint" />
                <span className="text-secondary">
                  {promo.daysRemaining > 0 
                    ? t('partner_dashboard.promotions_days_remaining_value').replace('{days}', promo.daysRemaining.toString())
                    : t('partner_dashboard.promotions_ended')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/partner/dashboard/marketing?action=promotion')}
          className="px-6 py-3 bg-brand-lilac text-white rounded-xl font-bold hover:bg-brand-pink transition-colors"
        >
          {t('partner_dashboard.promotions_create_new')}
        </button>
        <button
          onClick={() => router.push('/partner/dashboard')}
          className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors"
        >
          {t('partner_dashboard.promotions_back_dashboard')}
        </button>
      </div>
    </div>
  );
}
