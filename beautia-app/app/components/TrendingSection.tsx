'use client';

import React, { useEffect, useState } from 'react';
import { Star, Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PublicApi } from '../../lib/api';
import { Shop } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export function TrendingSection() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState('ALL');
  const [likedShops, setLikedShops] = useState<Set<string>>(new Set());
  
  const { t, formatPrice } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await PublicApi.getTrendingShops();
        setShops(data);
      } catch (error) {
        console.error('Failed to fetch trending shops', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleLike = (shopId: string) => {
     setLikedShops(prev => {
        const next = new Set(prev);
        if (next.has(shopId)) next.delete(shopId);
        else next.add(shopId);
        return next;
     });
  };

  const filteredShops = activeCity === 'ALL' 
     ? shops 
     : shops.filter(shop => shop.address.toUpperCase().includes(activeCity));

  const getTranslatedCategory = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('hair')) return t('category.hair');
    if (lower.includes('spa')) return t('category.spa');
    if (lower.includes('massage')) return t('category.massage');
    if (lower.includes('skin')) return t('category.skin');
    if (lower.includes('nail')) return t('category.nail');
    return cat;
  };

  const getTranslatedAddress = (addr: string) => {
    let newAddr = addr;
    if (newAddr.includes('Seoul')) newAddr = newAddr.replace('Seoul', t('map.seoul'));
    else if (newAddr.includes('Tokyo')) newAddr = newAddr.replace('Tokyo', t('map.tokyo'));
    else if (newAddr.includes('Bangkok')) newAddr = newAddr.replace('Bangkok', t('map.bangkok'));
    else if (newAddr.includes('Singapore')) newAddr = newAddr.replace('Singapore', t('map.singapore'));
    return newAddr.split(',')[1] || newAddr.split(',')[0]; // Prefer city part for badge
  };

  if (loading) {
    return (
        <section className="py-16 md:py-20 bg-transparent">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
                {t('common.loading')}
            </div>
        </section>
    );
  }

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-pink"></span>
              </span>
              <span className="text-[12px] font-bold text-brand-pink uppercase tracking-[0.2em]">{t('trending.badge')}</span>
            </div>
            <h2 className="text-[32px] md:text-[40px] font-bold text-primary tracking-tight leading-tight">
              {t('trending.title')}
            </h2>
          </div>
          <div className="flex gap-4 md:gap-8 text-[14px] font-bold text-secondary overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             {[
                { label: t('trending.all'), val: 'ALL' },
                { label: t('trending.city_seoul'), val: 'SEOUL' },
                { label: t('trending.city_tokyo'), val: 'TOKYO' },
                { label: t('trending.city_bangkok'), val: 'BANGKOK' }
             ].map((city) => (
                <button 
                   key={city.val} 
                   onClick={() => setActiveCity(city.val)}
                   className={`whitespace-nowrap hover:text-primary transition-colors ${
                      activeCity === city.val ? 'text-brand-lilac underline decoration-2 underline-offset-8 decoration-brand-lilac' : ''
                   }`}
                >
                    {city.label}
                </button>
             ))}
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
          <div className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide">
            {filteredShops.length === 0 ? (
               <div className="w-full text-center py-20 text-secondary">
                  {t('ranking.no_data')}
               </div>
            ) : (
               filteredShops.map((shop) => {
                  const shopNameTrans = t(`shop_data.${shop.id}.name`);
                  const serviceNameTrans = t(`shop_data.${shop.id}.service`);
                  const shopName = shopNameTrans.startsWith('shop_data.') ? shop.name : shopNameTrans;
                  // services 또는 menus 배열 안전하게 접근
                  const services = shop.services || shop.menus || [];
                  const serviceName = serviceNameTrans.startsWith('shop_data.') ? (services[0]?.name || shop.name) : serviceNameTrans;

                  return (
                    <motion.div 
                        key={shop.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="min-w-[300px] w-[300px] md:min-w-[340px] md:w-[340px] snap-center group cursor-pointer"
                    >
                        {/* Image Area - Architectural Ratio */}
                        <div className="aspect-[3/4] relative overflow-hidden mb-6 rounded-2xl shadow-md group-hover:shadow-xl transition-all duration-500">
                            <Image
                            src={shop.imageUrl}
                            alt={shopName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            {/* City Badge - Brand Color */}
                            <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
                                    <MapPin className="w-3 h-3 text-brand-pink" /> {getTranslatedAddress(shop.address)}
                                </span>
                            </div>

                            {/* Heart Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleLike(shop.id); }}
                                className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                                    likedShops.has(shop.id) ? 'bg-white text-brand-pink' : 'bg-white/20 text-white hover:bg-white hover:text-brand-pink'
                                }`}
                            >
                                <Heart className={`w-5 h-5 ${likedShops.has(shop.id) ? 'fill-brand-pink' : ''}`} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col px-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-[12px] font-bold text-brand-lilac uppercase tracking-wider">{getTranslatedCategory(shop.category)}</div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-brand-mint text-brand-mint" />
                                    <span className="text-[14px] font-bold text-primary">{shop.rating}</span>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-[20px] leading-snug text-primary mb-1 group-hover:text-brand-pink transition-colors">
                            {serviceName}
                            </h3>
                            <div className="text-[14px] text-secondary mb-4 font-medium">{shopName}</div>

                            <div className="flex items-center justify-between pt-4 border-t border-line/50">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 rounded-md bg-surface text-[11px] font-medium text-secondary">#Premium</span>
                                    <span className="px-2 py-1 rounded-md bg-surface text-[11px] font-medium text-secondary">#{getTranslatedCategory(shop.category)}</span>
                                </div>
                                <div className="font-bold text-[17px] text-primary">
                                    {/* Currency Formatting Applied */}
                                    {formatPrice(services[0]?.price || 0)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                  );
               })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
