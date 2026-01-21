'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, 
  Calendar, Shield, CheckCircle2, Image as ImageIcon,
  Sparkles, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Shop, Service, Review } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { isCustomerLoggedIn } from '../../../lib/auth';
import { PublicApi } from '../../../lib/api';

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 매장 정보와 리뷰를 동시에 가져오기
        const [shopData, reviewsData] = await Promise.all([
          PublicApi.getShop(shopId),
          PublicApi.getShopReviews(shopId, { limit: 20 }),
        ]);
        
        if (!shopData) {
          // 매장을 찾을 수 없으면 랭킹 페이지로
          router.push('/ranking');
          return;
        }
        
        setShop(shopData);
        setSelectedService(shopData.services[0] || null);
        setReviews(reviewsData.reviews);
      } catch (error) {
        console.error('매장 데이터 조회 오류:', error);
        router.push('/ranking');
      } finally {
        setLoading(false);
      }
    }
    
    if (shopId) {
      fetchData();
    }
  }, [shopId, router]);

  const handleBooking = () => {
    if (!isCustomerLoggedIn()) {
      if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        router.push('/customer/login');
      }
      return;
    }
    
    if (!shop) {
      alert('매장 정보를 불러올 수 없습니다.');
      return;
    }
    
    if (!selectedService) {
      alert('서비스를 선택해주세요.');
      return;
    }
    
    // 선택한 매장과 서비스 정보를 쿼리 파라미터로 전달
    router.push(`/booking?shopId=${shop.id}&serviceId=${selectedService.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-lilac border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <Image
            src={shop.imageUrl}
            alt={shop.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12">
            <div className="max-w-[1200px] mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white"
              >
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[12px] font-bold mb-4">
                  {shop.category}
                </div>
                <h1 className="text-[36px] md:text-[56px] font-bold mb-4">{shop.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-[18px]">{shop.rating}</span>
                    <span className="text-white/70 text-[14px]">({shop.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[14px]">{shop.address}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {/* Navigation */}
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px]">매장 목록으로</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-[24px] font-bold mb-4">소개</h2>
                <p className="text-[16px] text-secondary leading-relaxed">
                  {shop.description}
                </p>
              </section>

              {/* Services */}
              <section>
                <h2 className="text-[24px] font-bold mb-6">서비스 및 가격</h2>
                <div className="space-y-3">
                  {shop.services.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedService?.id === service.id
                          ? 'border-primary bg-brand-lilac/5'
                          : 'border-line hover:border-brand-lilac/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[16px] mb-2">{service.name}</h3>
                          <div className="flex items-center gap-4 text-[13px] text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {service.duration}분
                            </span>
                            <span className="font-bold text-primary">{formatPrice(service.price)}</span>
                          </div>
                        </div>
                        {selectedService?.id === service.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Reviews */}
              <section>
                <h2 className="text-[24px] font-bold mb-6">리뷰 ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-line rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-[14px]">{review.userName}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-[12px] text-secondary">{review.date}</div>
                        </div>
                      </div>
                      <p className="text-[14px] text-secondary leading-relaxed mb-3">
                        {review.content}
                      </p>
                      {review.reply && (
                        <div className="mt-4 pt-4 border-t border-line">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-lilac/10 flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-brand-lilac" />
                            </div>
                            <div>
                              <div className="font-bold text-[12px] text-brand-lilac mb-1">매장 답변</div>
                              <p className="text-[13px] text-secondary">{review.reply}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Booking Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-2 border-line rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-brand-lilac" />
                    <span className="font-bold text-[14px]">안전한 예약</span>
                  </div>
                  
                  {selectedService && (
                    <div className="mb-6">
                      <div className="text-[12px] text-secondary mb-2">선택한 서비스</div>
                      <div className="font-bold text-[16px] mb-1">{selectedService.name}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-secondary">{selectedService.duration}분</span>
                        <span className="font-bold text-[18px] text-primary">{formatPrice(selectedService.price)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    className="w-full h-[56px] bg-gradient-to-r from-brand-lilac to-brand-pink text-white rounded-xl font-bold text-[16px] hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    예약하기
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="mt-4 pt-4 border-t border-line space-y-2 text-[11px] text-secondary">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      AI 노쇼 예방 시스템
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      예약 취소 무료 (24시간 전)
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      검증된 프리미엄 매장
                    </div>
                  </div>
                </motion.div>

                {/* Contact Info */}
                <div className="bg-surface rounded-xl p-6 border border-line">
                  <h3 className="font-bold text-[14px] mb-4">매장 정보</h3>
                  <div className="space-y-3 text-[13px]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span className="text-secondary">{shop.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{shop.rating}점</span>
                      <span className="text-secondary">({shop.reviewCount}개 리뷰)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
