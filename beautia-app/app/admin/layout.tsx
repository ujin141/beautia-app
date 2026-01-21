'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Calendar, DollarSign, 
  Layers, Settings, LogOut, ShieldAlert, Monitor, Megaphone,
  MessageSquare, FileText, Bell, Activity, UsersRound, Tag
} from 'lucide-react';
import { logoutAdmin, isAdminLoggedIn } from '../../lib/auth';

const MENUS = [
  { name: '대시보드', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '파트너 관리', href: '/admin/partners', icon: Users },
  { name: '예약/거래', href: '/admin/bookings', icon: Calendar },
  { name: '정산/재무', href: '/admin/finance', icon: DollarSign },
  { name: '정산 관리', href: '/admin/settlements', icon: FileText },
  { name: '리뷰 관리', href: '/admin/reviews', icon: MessageSquare },
  { name: '커뮤니티 관리', href: '/admin/community', icon: UsersRound },
  { name: '지원 메시지', href: '/admin/support', icon: MessageSquare },
  { name: '광고/마케팅', href: '/admin/marketing', icon: Megaphone },
  { name: '프로모션 관리', href: '/admin/promotions', icon: Tag },
  { name: '콘텐츠/배너', href: '/admin/contents', icon: Monitor },
  { name: '알림/공지', href: '/admin/notifications', icon: Bell },
  { name: '로그/감사', href: '/admin/logs', icon: Activity },
  { name: '설정/권한', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  // 인증 확인 (로그아웃 상태에서는 접근 불가)
  useEffect(() => {
    // 한 번만 실행되도록 ref로 체크
    if (hasCheckedRef.current) {
      return;
    }

    // 로그인 페이지에서는 인증 검사 건너뛰기
    if (pathname === '/admin/login') {
      hasCheckedRef.current = true;
      return;
    }

    // 인증 상태 확인 (localStorage에서 토큰 확인)
    const authenticated = isAdminLoggedIn();
    
    // 인증되지 않았으면 즉시 로그인 페이지로 리다이렉트
    if (!authenticated && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // 이미 로그인 페이지가 아닐 때만 리다이렉트
      if (!currentPath.includes('/admin/login')) {
        hasCheckedRef.current = true; // 리다이렉트 전에 플래그 설정하여 무한 루프 방지
        // localStorage 완전히 비우기
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        // replace로 히스토리에서 제거
        window.location.replace('/admin/login');
        return;
      }
    }
    
    hasCheckedRef.current = true;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
           <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <span className="font-bold text-[16px] tracking-tight">BEAUTIA ADMIN</span>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
           {MENUS.map((menu) => {
              const isActive = pathname.startsWith(menu.href);
              return (
                 <Link 
                   key={menu.href} 
                   href={menu.href}
                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                         ? 'bg-primary text-white font-bold' 
                         : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                   }`}
                 >
                    <menu.icon className="w-5 h-5" />
                    {menu.name}
                 </Link>
              )
           })}
        </nav>

        <div className="p-4 border-t border-gray-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gray-700" />
              <div>
                 <div className="text-[13px] font-bold">Admin Super</div>
                 <div className="text-[11px] text-gray-500">최고 관리자</div>
              </div>
           </div>
           <button 
             onClick={() => {
               if (confirm('로그아웃 하시겠습니까?')) {
                 logoutAdmin();
               }
             }}
             className="flex items-center gap-2 px-2 text-[13px] text-gray-400 hover:text-white transition-colors w-full"
           >
              <LogOut className="w-4 h-4" /> 로그아웃
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
         <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
            <h1 className="font-bold text-[18px]">
               {MENUS.find(m => pathname.startsWith(m.href))?.name || 'Dashboard'}
            </h1>
            <div className="text-[13px] text-gray-500">
               접속 IP: 123.45.67.89 (Seoul)
            </div>
         </header>

         <div className="p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
