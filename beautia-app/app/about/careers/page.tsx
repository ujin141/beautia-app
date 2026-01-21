'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ArrowRight, Coffee, Monitor, Heart, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const JOBS = [
  { team: 'Product', title: 'Senior Product Designer', type: 'Full-time' },
  { team: 'Engineering', title: 'Frontend Developer (Next.js)', type: 'Full-time' },
  { team: 'Engineering', title: 'Backend Developer (Node.js)', type: 'Full-time' },
  { team: 'Marketing', title: 'Global Contents Marketer', type: 'Full-time' },
  { team: 'Business', title: 'Partner Sales Manager', type: 'Full-time' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-surface text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
           <div className="text-center mb-20">
              <h1 className="text-[40px] md:text-[56px] font-bold mb-6">Join the Journey</h1>
              <p className="text-[18px] text-secondary max-w-[600px] mx-auto leading-relaxed">
                 우리는 아시아 뷰티 시장의 혁신을 함께할 동료를 찾고 있습니다.<br/>
                 가장 빠르게 성장하는 글로벌 팀에 합류하세요.
              </p>
           </div>

           {/* Benefits */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
              {[
                 { icon: <Clock />, title: "유연 근무제", desc: "8~11시 자율 출근" },
                 { icon: <Monitor />, title: "최고급 장비", desc: "맥북 프로 & 모니터 지원" },
                 { icon: <Coffee />, title: "무제한 식대", desc: "점심 & 저녁 식대 지원" },
                 { icon: <Heart />, title: "뷰티 지원금", desc: "월 20만원 포인트 지급" },
              ].map((item, i) => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-line">
                    <div className="w-10 h-10 rounded-full bg-brand-lilac/10 flex items-center justify-center mb-4 text-brand-lilac">
                       {item.icon}
                    </div>
                    <h3 className="font-bold text-[16px] mb-2">{item.title}</h3>
                    <p className="text-[13px] text-secondary">{item.desc}</p>
                 </div>
              ))}
           </div>

           {/* Open Positions */}
           <div>
              <h2 className="text-[24px] font-bold mb-8">Open Positions</h2>
              <div className="space-y-4">
                 {JOBS.map((job, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-6 rounded-2xl border border-line flex items-center justify-between hover:border-brand-lilac/50 hover:shadow-lg transition-all cursor-pointer group"
                    >
                       <div>
                          <span className="text-[12px] font-bold text-brand-lilac bg-brand-lilac/10 px-2 py-1 rounded mb-2 inline-block">
                             {job.team}
                          </span>
                          <h3 className="text-[18px] font-bold group-hover:text-brand-lilac transition-colors">{job.title}</h3>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[14px] text-secondary font-medium hidden md:block">{job.type}</span>
                          <ArrowRight className="w-5 h-5 text-secondary group-hover:text-brand-lilac transition-colors" />
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
