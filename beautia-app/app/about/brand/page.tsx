'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Download, Copy } from 'lucide-react';
import { BeautiaLogo } from '../../components/BeautiaLogo';

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-white text-primary">
      <Header />
      
      <main className="pt-[100px] pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
           <div className="text-center mb-16">
              <h1 className="text-[40px] font-bold mb-4">Brand Assets</h1>
              <p className="text-[16px] text-secondary">
                 BEAUTIA의 브랜드 아이덴티티를 소개합니다.<br/>
                 가이드를 준수하여 올바르게 사용해주세요.
              </p>
           </div>

           {/* Logo Section */}
           <section className="mb-20">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[24px] font-bold">Logo</h2>
                 <button className="flex items-center gap-2 text-[14px] font-bold text-brand-lilac hover:underline">
                    <Download className="w-4 h-4" /> 전체 다운로드
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-surface rounded-2xl p-12 flex items-center justify-center border border-line">
                    <div className="flex items-center gap-3">
                       <BeautiaLogo className="w-16 h-16" />
                       <span className="text-[32px] font-bold tracking-tight">BEAUTIA</span>
                    </div>
                 </div>
                 <div className="bg-primary rounded-2xl p-12 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                       <BeautiaLogo className="w-16 h-16" />
                       <span className="text-[32px] font-bold tracking-tight text-white">BEAUTIA</span>
                    </div>
                 </div>
              </div>
           </section>

           {/* Color Palette */}
           <section className="mb-20">
              <h2 className="text-[24px] font-bold mb-8">Color Palette</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                    { name: 'Brand Pink', hex: '#F9B4C9', text: 'text-black' },
                    { name: 'Brand Mint', hex: '#B6E6D8', text: 'text-black' },
                    { name: 'Brand Lilac', hex: '#B9B7F5', text: 'text-black' },
                    { name: 'Primary Black', hex: '#111114', text: 'text-white' },
                 ].map((color) => (
                    <div key={color.name} className="space-y-3">
                       <div 
                         className="aspect-video rounded-xl shadow-sm flex items-center justify-center relative group cursor-pointer"
                         style={{ backgroundColor: color.hex }}
                         onClick={() => { navigator.clipboard.writeText(color.hex); alert('Copied!'); }}
                       >
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity font-bold ${color.text} flex items-center gap-1`}>
                             <Copy className="w-4 h-4" /> Copy
                          </div>
                       </div>
                       <div>
                          <div className="font-bold text-[15px]">{color.name}</div>
                          <div className="text-[13px] text-secondary font-mono uppercase">{color.hex}</div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* Typography */}
           <section>
              <h2 className="text-[24px] font-bold mb-8">Typography</h2>
              <div className="bg-surface rounded-2xl p-10 border border-line space-y-8">
                 <div>
                    <div className="text-[12px] text-secondary font-bold mb-2 uppercase">Main Font (English)</div>
                    <div className="text-[32px] font-bold font-sans">Manrope</div>
                    <div className="text-[16px] text-secondary mt-2 break-all">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890</div>
                 </div>
                 <div>
                    <div className="text-[12px] text-secondary font-bold mb-2 uppercase">Main Font (Korean)</div>
                    <div className="text-[32px] font-bold font-sans">Noto Sans KR</div>
                    <div className="text-[16px] text-secondary mt-2">가나다라마바사아자차카타파하 뷰티아 프리미엄 예약 플랫폼</div>
                 </div>
              </div>
           </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
