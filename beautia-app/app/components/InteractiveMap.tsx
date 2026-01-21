'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ArrowRight, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '../../contexts/LanguageContext';
import Link from 'next/link';
import { PublicApi } from '../../lib/api';

// 도시별 설정
const CITY_CONFIG = {
  seoul: {
    color: 'bg-brand-pink',
    textColor: 'text-brand-pink',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=2000&auto=format&fit=crop',
  },
  tokyo: {
    color: 'bg-brand-mint',
    textColor: 'text-brand-mint',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop',
  },
  bangkok: {
    color: 'bg-brand-lilac',
    textColor: 'text-brand-lilac',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=2000&auto=format&fit=crop',
  },
  singapore: {
    color: 'bg-brand-mint',
    textColor: 'text-brand-mint',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2000&auto=format&fit=crop',
  },
};

interface CityData {
  id: string;
  name: string;
  label: string;
  desc: string;
  shops: string[];
  color: string;
  textColor: string;
  image: string;
}

export function InteractiveMap() {
  const { t } = useLanguage();
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState<CityData | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const cityData = await PublicApi.getCities();
        
        // 기본 도시 구조
        const defaultCities: CityData[] = [
          { 
            id: 'seoul', 
            name: 'SEOUL', 
            label: t('map.seoul'), 
            desc: t('map.desc_seoul'),
            shops: [],
            ...CITY_CONFIG.seoul,
          },
          { 
            id: 'tokyo', 
            name: 'TOKYO', 
            label: t('map.tokyo'), 
            desc: t('map.desc_tokyo'),
            shops: [],
            ...CITY_CONFIG.tokyo,
          },
          { 
            id: 'bangkok', 
            name: 'BANGKOK', 
            label: t('map.bangkok'), 
            desc: t('map.desc_bangkok'),
            shops: [],
            ...CITY_CONFIG.bangkok,
          },
          { 
            id: 'singapore', 
            name: 'SINGAPORE', 
            label: t('map.singapore'), 
            desc: 'High-End Medical Aesthetic',
            shops: [],
            ...CITY_CONFIG.singapore,
          },
        ];

        // 백엔드 데이터로 업데이트
        cityData.forEach((city: any) => {
          const cityIndex = defaultCities.findIndex(c => c.id === city.id);
          if (cityIndex !== -1 && city.shops && city.shops.length > 0) {
            defaultCities[cityIndex].shops = city.shops.map((shop: any) => shop.name).slice(0, 3);
          }
        });

        // 기본값 설정 (데이터가 없을 때)
        if (defaultCities.every(c => c.shops.length === 0)) {
          defaultCities[0].shops = ['Cheongdam Le Bijou', 'Gangnam The Skin', 'Jenny House Premium'];
          defaultCities[1].shops = ['Ginza Haruka Spa', 'Omotesando Hair Lab', 'Shibuya Nail Art'];
          defaultCities[2].shops = ['Sukhumvit Oasis', 'Siam Kempinski Spa', 'Thong Lor Aesthetic'];
          defaultCities[3].shops = ['Marina Bay Wellness', 'Orchard Road Skin', 'Sentosa Retreat'];
        }

        setCities(defaultCities);
        setActiveCity(defaultCities[0]);
      } catch (error) {
        console.error('도시 데이터 조회 오류:', error);
        // 기본값 설정
        const fallbackCities: CityData[] = [
          { 
            id: 'seoul', 
            name: 'SEOUL', 
            label: t('map.seoul'), 
            desc: t('map.desc_seoul'),
            shops: ['Cheongdam Le Bijou', 'Gangnam The Skin', 'Jenny House Premium'],
            ...CITY_CONFIG.seoul,
          },
          { 
            id: 'tokyo', 
            name: 'TOKYO', 
            label: t('map.tokyo'), 
            desc: t('map.desc_tokyo'),
            shops: ['Ginza Haruka Spa', 'Omotesando Hair Lab', 'Shibuya Nail Art'],
            ...CITY_CONFIG.tokyo,
          },
          { 
            id: 'bangkok', 
            name: 'BANGKOK', 
            label: t('map.bangkok'), 
            desc: t('map.desc_bangkok'),
            shops: ['Sukhumvit Oasis', 'Siam Kempinski Spa', 'Thong Lor Aesthetic'],
            ...CITY_CONFIG.bangkok,
          },
          { 
            id: 'singapore', 
            name: 'SINGAPORE', 
            label: t('map.singapore'), 
            desc: 'High-End Medical Aesthetic',
            shops: ['Marina Bay Wellness', 'Orchard Road Skin', 'Sentosa Retreat'],
            ...CITY_CONFIG.singapore,
          },
        ];
        setCities(fallbackCities);
        setActiveCity(fallbackCities[0]);
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, [t]);

  if (loading || !activeCity) {
    return (
      <section className="py-12 md:py-16 bg-surface relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          {t('common.loading')}
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 bg-surface relative overflow-hidden">
      {/* Background Decor: Brand Colors */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-lilac/10 to-transparent -skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-brand-pink/10 to-transparent rounded-tr-full" />

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left: Typography & Selector */}
        <div className="lg:col-span-5">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="inline-flex items-center gap-2 mb-6"
           >
             <span className="w-8 h-[2px] bg-brand-pink" />
             <span className="text-[12px] font-bold text-brand-pink uppercase tracking-[0.2em] whitespace-nowrap">{t('map_ui.destinations')}</span>
           </motion.div>
           
           <h2 className="text-[40px] md:text-[56px] font-bold text-primary mb-8 leading-[1.05] tracking-tight">
             {t('map.title').split(' ').map((word, i) => (
                <React.Fragment key={i}>
                    {i === 2 ? <br/> : ' '}
                    {i > 2 ? <span className="italic font-light font-serif text-transparent bg-clip-text bg-blur-gradient">{word}</span> : word}
                </React.Fragment>
             ))}
           </h2>
           
           <p className="text-[16px] text-secondary mb-12 leading-relaxed max-w-[400px] font-medium">
             {t('map.subtitle')}
           </p>

           <div className="space-y-3">
             {cities.map((city) => (
               <div key={city.id} className="relative group">
                 <button
                   onClick={() => setActiveCity(city)}
                   className={`w-full text-left py-4 px-6 rounded-2xl transition-all duration-500 flex items-center justify-between group-hover:bg-white border ${
                     activeCity.id === city.id 
                       ? 'bg-white border-brand-lilac/30 shadow-xl shadow-brand-lilac/10 scale-[1.02] z-10' 
                       : 'bg-white/40 border-transparent hover:border-white'
                   }`}
                 >
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full transition-colors shrink-0 ${activeCity.id === city.id ? city.color : 'bg-secondary/20'}`} />
                      <span className={`text-[12px] font-bold tracking-widest uppercase transition-colors shrink-0 ${
                          activeCity.id === city.id ? 'text-primary' : 'text-secondary'
                      }`}>
                          {city.name}
                      </span>
                      {activeCity.id === city.id && (
                          <span className={`text-[14px] font-medium animate-fade-in-up ${city.textColor} truncate`}>
                              {city.label}
                          </span>
                      )}
                   </div>
                   
                   {activeCity.id === city.id ? (
                      <Plane className={`w-5 h-5 ${city.textColor} animate-pulse shrink-0`} />
                   ) : (
                      <ArrowRight className="w-4 h-4 text-secondary/30 group-hover:text-secondary transition-all shrink-0" />
                   )}
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Right: Immersive Visual */}
        <div className="lg:col-span-7 h-[600px] relative">
           <AnimatePresence mode='wait'>
             <motion.div
               key={activeCity?.id}
               initial={{ opacity: 0, scale: 1.05 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.6 }}
               className="absolute inset-0 rounded-[40px] overflow-hidden shadow-2xl shadow-brand-lilac/20"
             >
                {/* Real Image Background */}
                <div className="relative w-full h-full">
                    <Image 
                      src={activeCity.image} 
                      alt={activeCity.name}
                      fill
                      className="object-cover"
                    />
                    {/* Brand Color Overlay Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${
                        activeCity.id === 'seoul' ? 'from-brand-pink/90 via-brand-pink/20' :
                        activeCity.id === 'tokyo' ? 'from-brand-mint/90 via-brand-mint/20' :
                        activeCity.id === 'bangkok' ? 'from-brand-lilac/90 via-brand-lilac/20' :
                        'from-brand-mint/90 via-brand-mint/20'
                    } to-transparent mix-blend-multiply opacity-80`} />
                    
                    {/* Dark Gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                <div className="absolute top-0 right-0 p-12 opacity-30">
                    <div className="text-[140px] font-bold text-white leading-none tracking-tighter opacity-40 mix-blend-overlay">
                        {activeCity.name.substring(0, 3)}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-10 md:p-12 text-white z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                           <span className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-[12px] font-bold backdrop-blur-md whitespace-nowrap">
                              {activeCity.desc}
                           </span>
                        </div>
                        
                        <Link href="/ranking" className="group inline-flex items-center gap-2">
                           <h3 className="text-[32px] md:text-[40px] font-bold mb-8 leading-tight text-white drop-shadow-sm group-hover:text-brand-lilac transition-colors">
                              {t('map.explore')}
                           </h3>
                           <ArrowRight className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform mb-8" />
                        </Link>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {activeCity.shops.map((shop, i) => (
                              <Link href="/ranking" key={shop} className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer group">
                                 <div className="flex items-center gap-2 text-[10px] text-white/80 mb-2 uppercase tracking-wider whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white group-hover:bg-brand-pink transition-colors"/>
                                    {t('map_ui.premium_partner')}
                                 </div>
                                 <div className="text-[15px] font-bold leading-snug truncate">{shop}</div>
                              </Link>
                           ))}
                        </div>
                    </motion.div>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
