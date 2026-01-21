'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, CalendarCheck, BarChart3, Settings, 
  LogOut, Menu, X, Bell, Users, MessageSquare, Tag, 
  Wallet, UserCog, Mail, Globe, ChevronDown, CheckCircle2, User
} from 'lucide-react';
import { BeautiaLogo } from '../../components/BeautiaLogo';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Language, Currency, CURRENCIES, LANGUAGES } from '../../../lib/i18n';
import { logoutPartner, getPartnerUser, requireAuth } from '../../../lib/auth';
import { HelpToggle } from '../../components/HelpToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 인증 확인 (로그아웃 상태에서는 접근 불가)
  useEffect(() => {
    requireAuth();
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [partnerName, setPartnerName] = useState<string>('파트너');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { t, language, currency, setLanguage, setCurrency } = useLanguage();

  // 클라이언트에서만 사용자 정보 로드 (Hydration 오류 방지)
  useEffect(() => {
    const user = getPartnerUser();
    if (user?.name) {
      setPartnerName(user.name);
    }
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, []);

  const fetchNotifications = async (partnerId: string) => {
    setLoadingNotifications(true);
    try {
      const partnerToken = localStorage.getItem('partner_token');
      const response = await fetch(`/api/partner/notifications`, {
        headers: {
          'Authorization': `Bearer ${partnerToken || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // data.data.notifications 배열 사용
          const notificationsData = data.data.notifications || [];
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
          setUnreadCount(data.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, partnerId: string) => {
    try {
      const response = await fetch('/api/partner/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, partnerId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 알림 목록 새로고침
          fetchNotifications(partnerId);
        }
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  const handleMarkAllAsRead = async (partnerId: string) => {
    try {
      const response = await fetch('/api/partner/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, markAllAsRead: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchNotifications(partnerId);
          setIsNotificationMenuOpen(false);
        }
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  };

  const handleCurrencyChange = (curr: Currency) => {
    setCurrency(curr);
    setIsLangMenuOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm(t('partner_dashboard.logout_confirm'))) {
      logoutPartner().catch(console.error);
    }
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.lang-menu-container') && !target.closest('button[aria-label="lang-menu"]')) {
        setIsLangMenuOpen(false);
      }
      if (!target.closest('.notification-menu-container') && !target.closest('button[aria-label="notification-menu"]')) {
        setIsNotificationMenuOpen(false);
      }
      if (!target.closest('.profile-menu-container') && !target.closest('button[aria-label="profile-menu"]')) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const MENUS = [
    { name: t('partner_dashboard.menu_home'), href: '/partner/dashboard', icon: LayoutDashboard },
    { name: t('partner_dashboard.menu_reservations'), href: '/partner/dashboard/reservations', icon: CalendarCheck },
    { name: t('partner_dashboard.menu_schedule'), href: '/partner/dashboard/schedule', icon: UserCog },
    { name: t('partner_dashboard.menu_customers'), href: '/partner/dashboard/customers', icon: Users },
    { name: t('partner_dashboard.menu_inbox'), href: '/partner/dashboard/inbox', icon: Mail },
    { name: t('partner_dashboard.menu_reviews'), href: '/partner/dashboard/reviews', icon: MessageSquare },
    { name: t('partner_dashboard.menu_finance'), href: '/partner/dashboard/finance', icon: Wallet },
    { name: t('partner_dashboard.menu_marketing'), href: '/partner/dashboard/marketing', icon: Tag },
    { name: t('partner_dashboard.menu_profile') || '프로필', href: '/partner/dashboard/profile', icon: User },
    { name: t('partner_dashboard.menu_settings'), href: '/partner/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-line flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-line">
           <Link href="/partner/dashboard" className="flex items-center gap-2">
              <BeautiaLogo className="w-6 h-6" />
              <span className="font-bold text-[16px] text-primary">{t('partner_dashboard.partner_center')}</span>
           </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
           {MENUS.map((menu) => {
              const isActive = pathname === menu.href;
              return (
                 <Link 
                   key={menu.href} 
                   href={menu.href}
                   className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive 
                         ? 'bg-brand-lilac/10 text-brand-lilac font-bold' 
                         : 'text-secondary hover:bg-surface hover:text-primary'
                   }`}
                 >
                    <menu.icon className="w-5 h-5" />
                    {menu.name}
                 </Link>
              )
           })}
        </nav>

        <div className="p-4 border-t border-line">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3 text-secondary hover:text-red-500 w-full rounded-xl hover:bg-red-50 transition-colors"
           >
              <LogOut className="w-5 h-5" />
              {t('partner_dashboard.logout')}
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-line z-30 flex items-center justify-between px-4">
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
         </button>
         <span className="font-bold">{t('partner_dashboard.partner_center')}</span>
         <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
         <div className="lg:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`lg:hidden fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-line z-30 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <nav className="flex-1 p-4 space-y-1">
            {MENUS.map((menu) => (
               <Link 
                 key={menu.href} 
                 href={menu.href}
                 onClick={() => setIsSidebarOpen(false)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    pathname === menu.href 
                       ? 'bg-brand-lilac/10 text-brand-lilac font-bold' 
                       : 'text-secondary'
                 }`}
               >
                  <menu.icon className="w-5 h-5" />
                  {menu.name}
               </Link>
            ))}
         </nav>
         <div className="p-4 border-t border-line">
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 text-secondary hover:text-red-500 w-full rounded-xl hover:bg-red-50 transition-colors"
            >
               <LogOut className="w-5 h-5" />
               {t('partner_dashboard.logout')}
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
         {/* Top Bar */}
         <header className="h-16 bg-white border-b border-line px-6 flex items-center justify-between sticky top-0 z-10 hidden lg:flex">
            <h1 className="font-bold text-[18px]">
               {MENUS.find(m => m.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
               {/* Language & Currency Switcher */}
               <div className="relative lang-menu-container">
                  <button 
                    aria-label="lang-menu"
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-1 text-[13px] font-medium text-secondary hover:text-primary px-2 py-1.5 rounded-md hover:bg-surface transition-colors"
                  >
                     <Globe className="w-4 h-4" />
                     {LANGUAGES[language]} / {CURRENCIES[currency].symbol} {currency}
                     <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2 z-50">
                        <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase">{t('common.language')}</div>
                        {(['ko', 'en', 'ja', 'th', 'zh'] as Language[]).map((lang) => (
                           <button 
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              className={`w-full text-left px-3 py-1.5 text-[13px] rounded-lg hover:bg-gray-50 flex items-center justify-between ${language === lang ? 'font-bold text-brand-pink' : 'text-gray-600'}`}
                           >
                              <span>{LANGUAGES[lang]}</span>
                              {language === lang && <CheckCircle2 className="w-4 h-4 text-brand-pink" />}
                           </button>
                        ))}
                        <div className="h-[1px] bg-gray-100 my-2" />
                        <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase">{t('common.currency')}</div>
                        {(['KRW', 'USD', 'JPY', 'THB', 'CNY'] as Currency[]).map((curr) => (
                           <button 
                              key={curr}
                              onClick={() => handleCurrencyChange(curr)}
                              className={`w-full text-left px-3 py-1.5 text-[13px] rounded-lg hover:bg-gray-50 flex items-center justify-between ${currency === curr ? 'font-bold text-brand-pink' : 'text-gray-600'}`}
                           >
                              <span>{CURRENCIES[curr].symbol} {curr}</span>
                              {currency === curr && <CheckCircle2 className="w-4 h-4 text-brand-pink" />}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
               
               {/* 알림 메뉴 */}
               <div className="relative notification-menu-container">
                  <button 
                    aria-label="notification-menu"
                    onClick={() => {
                      const user = getPartnerUser();
                      if (!user?.id) {
                        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
                        router.push('/partner/login');
                        return;
                      }
                      setIsNotificationMenuOpen(!isNotificationMenuOpen);
                      setIsProfileMenuOpen(false);
                      if (!isNotificationMenuOpen) {
                        fetchNotifications(user.id);
                      }
                    }}
                    className="relative p-2 rounded-full hover:bg-surface transition-colors"
                  >
                     <Bell className="w-5 h-5 text-secondary" />
                     {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                     )}
                  </button>

                  {isNotificationMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                           <h3 className="font-bold text-[14px]">알림</h3>
                           {unreadCount > 0 && (
                              <button
                                 onClick={() => {
                                    const user = getPartnerUser();
                                    if (user?.id) {
                                       handleMarkAllAsRead(user.id);
                                    }
                                 }}
                                 className="text-[12px] text-blue-500 hover:text-blue-600 font-medium"
                              >
                                 모두 읽음
                              </button>
                           )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                           {loadingNotifications ? (
                              <div className="p-8 text-center text-[13px] text-gray-500">
                                 로딩 중...
                              </div>
                           ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                              <div className="p-8 text-center text-[13px] text-gray-500">
                                 알림이 없습니다.
                              </div>
                           ) : (
                              notifications.map((notif) => (
                                 <div
                                    key={notif.id}
                                    onClick={() => {
                                       const user = getPartnerUser();
                                       if (user?.id) {
                                          handleMarkAsRead(notif.id, user.id);
                                       }
                                       if (notif.link) {
                                          router.push(notif.link);
                                       }
                                       setIsNotificationMenuOpen(false);
                                    }}
                                    className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                                       !notif.isRead ? 'bg-blue-50/50' : ''
                                    }`}
                                 >
                                    <div className="flex items-start gap-3">
                                       <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                          !notif.isRead ? 'bg-blue-500' : 'bg-transparent'
                                       }`} />
                                       <div className="flex-1 min-w-0">
                                          <div className="font-medium text-[13px] mb-1">{notif.title}</div>
                                          <div className="text-[12px] text-gray-600 line-clamp-2">{notif.message}</div>
                                          <div className="text-[11px] text-gray-400 mt-1">
                                             {new Date(notif.createdAt).toLocaleString('ko-KR', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                             })}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                        {Array.isArray(notifications) && notifications.length > 0 && (
                           <div className="p-3 border-t border-gray-100 text-center">
                              <Link
                                 href="/partner/dashboard/notifications"
                                 onClick={() => setIsNotificationMenuOpen(false)}
                                 className="text-[12px] text-blue-500 hover:text-blue-600 font-medium"
                              >
                                 전체 보기
                              </Link>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* 프로필 메뉴 */}
               <div className="relative profile-menu-container flex items-center gap-3 pl-4 border-l border-line">
                  <button
                     aria-label="profile-menu"
                     onClick={() => {
                        setIsProfileMenuOpen(!isProfileMenuOpen);
                        setIsNotificationMenuOpen(false);
                        setIsLangMenuOpen(false);
                     }}
                     className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-mint to-brand-lilac flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[14px] font-medium">{partnerName}님</span>
                     <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-2">
                           <Link
                              href="/partner/dashboard/profile"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                           >
                              <User className="w-4 h-4" />
                              프로필 관리
                           </Link>
                           <Link
                              href="/partner/dashboard/settings?tab=account"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                           >
                              <Settings className="w-4 h-4" />
                              계정 설정
                           </Link>
                           <div className="h-[1px] bg-gray-100 my-1" />
                           <button
                              onClick={() => {
                                 setIsProfileMenuOpen(false);
                                 handleLogout();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           >
                              <LogOut className="w-4 h-4" />
                              로그아웃
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </header>

         <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            {children}
         </div>
      </main>
      
      {/* 도움말 토글 버튼 */}
      <HelpToggle variant="partner" />
    </div>
  );
}
