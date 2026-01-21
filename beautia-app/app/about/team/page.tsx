'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function TeamPage() {
  const { t } = useLanguage();
  
  const MEMBERS = [
    {
      name: t('team.ceo_name'),
      role: t('team.ceo_role'),
      desc: t('team.ceo_desc'),
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop'
    },
    {
      name: t('team.product_name'),
      role: t('team.product_role'),
      desc: t('team.product_desc'),
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop'
    },
    {
      name: t('team.cto_name'),
      role: t('team.cto_role'),
      desc: t('team.cto_desc'),
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop'
    },
    {
      name: t('team.brand_name'),
      role: t('team.brand_role'),
      desc: t('team.brand_desc'),
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop'
    }
  ];
  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main className="pt-[100px]">
        {/* Hero */}
        <section className="relative py-32 px-6 overflow-hidden">
           <div className="absolute inset-0 z-0">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-lilac/5 -skew-x-12 transform origin-top-right" />
           </div>
           
           <div className="max-w-[1200px] mx-auto relative z-10 text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[48px] md:text-[64px] font-bold mb-6 leading-tight"
              >
                 {t('team.title').replace('BEAUTIA', '').trim()} <span className="text-transparent bg-clip-text bg-blur-gradient">BEAUTIA</span>.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[18px] text-secondary max-w-[600px] mx-auto leading-relaxed whitespace-pre-line"
              >
                 {t('team.subtitle')}
              </motion.p>
           </div>
        </section>

        {/* Mission */}
        <section className="py-24 bg-primary text-white">
           <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-[32px] font-bold mb-6">{t('team.mission_title')}</h2>
                 <p className="text-[18px] text-white/70 leading-relaxed mb-8 whitespace-pre-line">
                    "{t('team.mission_quote')}"
                 </p>
                 <p className="text-[16px] text-white/50 leading-relaxed whitespace-pre-line">
                    {t('team.mission_desc')}
                 </p>
              </div>
              <div className="aspect-video bg-white/10 rounded-2xl overflow-hidden relative">
                 <Image 
                   src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop"
                   alt="Team Meeting"
                   fill
                   className="object-cover opacity-60"
                 />
              </div>
           </div>
        </section>

        {/* Members */}
        <section className="py-32 px-6">
           <div className="max-w-[1200px] mx-auto">
              <h2 className="text-[32px] font-bold mb-16 text-center">{t('team.leadership_title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {MEMBERS.map((member, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ margin: "-50px" }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                       <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6 relative bg-surface">
                          <Image 
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                             <p className="text-[13px] font-medium leading-relaxed">{member.desc}</p>
                          </div>
                       </div>
                       <h3 className="text-[20px] font-bold mb-1">{member.name}</h3>
                       <p className="text-[14px] text-brand-lilac font-bold uppercase tracking-wide">{member.role}</p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
