'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { Star, MapPin, Filter, Trophy, Crown } from 'lucide-react';
import Image from 'next/image';
import { PublicApi } from '../../lib/api';
import { Shop } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, formatPrice } = useLanguage();

  const CATEGORIES = [
    { id: 'All', label: t('trending.all') },
    { id: 'Hair', label: t('category.hair') },
    { id: 'Head Spa', label: t('category.spa') },
    { id: 'Makeup', label: t('category.makeup') },
    { id: 'Personal Color', label: t('category.personal_color') },
    { id: 'Nail', label: t('category.nail') },
    { id: 'Eyelash', label: t('category.eyelash') },
    { id: 'Esthetic', label: t('category.skin') },
    { id: 'Clinic', label: t('category.clinic') },
    { id: 'Body', label: t('category.body') },
    { id: 'Waxing', label: t('category.waxing') },
    { id: 'Massage', label: t('category.massage') },
    { id: 'Men', label: t('category.men') },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const category = activeTab === 'All' ? undefined : activeTab;
        const data = await PublicApi.getTrendingShops({ category, limit: 100 });
        setShops(data);
      } catch (error) {
        console.error('Failed to fetch ranking data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  // 백엔드에서 이미 필터링된 데이터 사용
  const filteredShops = shops;

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
    return newAddr.split(',')[0];
  };

  return (
    <div className="min-h-screen bg-surface text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h1 className="text-[32px] font-bold mb-2">{t('nav.ranking')}</h1>
                 <p className="text-secondary text-[14px]">{t('ranking.updated')}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[13px] font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                 <Filter className="w-4 h-4" /> {t('common.more')}
              </button>
           </div>

           {/* Category Tabs */}
           <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveTab(cat.id)}
                   className={`px-5 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all ${
                      activeTab === cat.id 
                         ? 'bg-primary text-white shadow-lg' 
                         : 'bg-white text-secondary hover:bg-gray-100'
                   }`}
                 >
                    {cat.label}
                 </button>
              ))}
           </div>

           {/* List */}
           <div className="space-y-4">
              {loading ? (
                 <div className="text-center py-20 text-secondary">{t('common.loading')}</div>
              ) : filteredShops.length === 0 ? (
                 <div className="text-center py-20 text-secondary">{t('ranking.no_data')}</div>
              ) : (
                 filteredShops.map((shop, idx) => {
                    const shopNameTrans = t(`shop_data.${shop.id}.name`);
                    const serviceNameTrans = t(`shop_data.${shop.id}.service`);
                    // Fallback to original if translation key is returned (meaning missing)
                    const shopName = shopNameTrans.startsWith('shop_data.') ? shop.name : shopNameTrans;
                    // services 또는 menus 배열 안전하게 접근
                    const services = shop.services || shop.menus || [];
                    const serviceName = serviceNameTrans.startsWith('shop_data.') ? (services[0]?.name || shop.name) : serviceNameTrans;

                    return (
                        <Link
                          key={shop.id}
                          href={`/shop/${shop.id}`}
                        >
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`relative p-4 rounded-[24px] flex items-center gap-6 transition-all cursor-pointer group ${
                             idx < 3 ? 'bg-white shadow-md border-2 border-transparent' : 'bg-white/60 border border-transparent hover:bg-white'
                          } ${idx === 0 ? 'hover:border-yellow-400/50' : idx === 1 ? 'hover:border-gray-300' : idx === 2 ? 'hover:border-orange-300' : ''}`}
                        >
                           {/* Rank Badge */}
                           <div className="w-16 flex flex-col items-center justify-center shrink-0">
                              {idx === 0 ? (
                                 <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 mb-1" />
                              ) : idx === 1 ? (
                                 <Trophy className="w-7 h-7 text-gray-400 fill-gray-200 mb-1" />
                              ) : idx === 2 ? (
                                 <Trophy className="w-6 h-6 text-orange-400 fill-orange-200 mb-1" />
                              ) : (
                                 <span className="text-[20px] font-bold text-gray-300 italic">#{idx + 1}</span>
                              )}
                              {idx < 3 && <span className="text-[18px] font-bold text-primary italic">#{idx + 1}</span>}
                           </div>
                           
                           <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden relative shrink-0 shadow-sm">
                              <Image src={shop.imageUrl} alt={shopName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                           </div>

                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[11px] font-bold text-brand-lilac bg-brand-lilac/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {getTranslatedCategory(shop.category)}
                                 </span>
                                 {idx < 3 && <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">{t('ranking.hot')}</span>}
                              </div>
                              <h3 className="text-[18px] md:text-[20px] font-bold mb-1 truncate group-hover:text-brand-pink transition-colors">
                                 {serviceName}
                              </h3>
                              <div className="text-[14px] font-medium text-gray-600 mb-3">{shopName}</div>
                              
                              <div className="flex items-center gap-4 text-[13px] text-secondary">
                                 <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {getTranslatedAddress(shop.address)}
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-brand-mint text-brand-mint" /> {shop.rating} ({shop.reviewCount})
                                 </div>
                              </div>
                           </div>

                           <div className="hidden md:block text-right px-4 shrink-0">
                              <div className="text-[12px] text-secondary font-bold uppercase mb-1">{t('ranking.start_from')}</div>
                              <div className="text-[20px] font-bold text-primary">
                                 {formatPrice(services[0]?.price || 0)}
                              </div>
                              <div className="mt-3 w-full py-2 bg-gray-900 text-white rounded-lg text-[13px] font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-center">
                                 {t('ranking.book_now')}
                              </div>
                           </div>
                        </motion.div>
                        </Link>
                    );
                 })
              )}
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
