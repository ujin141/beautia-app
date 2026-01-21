'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Globe, ChevronDown, User, LogOut, ChevronUp, CheckCircle2, MapPin, Navigation, Bell } from 'lucide-react';
import { BeautiaLogo } from './BeautiaLogo';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language, Currency, CURRENCIES, LANGUAGES } from '../../lib/i18n';
import { getCustomerUser, isCustomerLoggedIn, logoutCustomer, type CustomerUser } from '../../lib/auth';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'booking' | 'promotion' | 'review' | 'system';
    title: string;
    message: string;
    time: Date;
    read: boolean;
  }>>([]);
  
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = isCustomerLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const user = getCustomerUser();
        setCustomer(user);
      } else {
        setCustomer(null);
      }
    };

    checkLoginStatus();
    
    // 스토리지 변경 감지 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    // 커스텀 이벤트 감지 (같은 탭에서 로그인 시)
    const handleCustomerLogin = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customer-login', handleCustomerLogin);
    
    // 주기적으로 확인 (같은 탭에서 상태 변경 감지)
    const interval = setInterval(checkLoginStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customer-login', handleCustomerLogin);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  };

  const handleCurrencyChange = (curr: Currency) => {
    setCurrency(curr);
    setIsLangMenuOpen(false);
  };

  // 현재 위치 가져오기
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse Geocoding을 사용하여 위치 이름 가져오기 (Google Maps API 또는 다른 서비스 사용)
          // 여기서는 간단하게 좌표를 사용하거나 도시 이름을 추정
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`
          );
          const data = await response.json();
          
          const locationName = data.city || data.locality || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setCurrentLocation(locationName);
          
          // localStorage에 저장
          if (typeof window !== 'undefined') {
            localStorage.setItem('beautia_location', locationName);
            localStorage.setItem('beautia_coordinates', JSON.stringify({ lat: latitude, lng: longitude }));
          }
          
          setIsLocationMenuOpen(false);
        } catch (error) {
          console.error('위치 정보 가져오기 실패:', error);
          // 실패 시 좌표만 표시
          const locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setCurrentLocation(locationName);
          setIsLocationMenuOpen(false);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('위치 권한 오류:', error);
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
        } else {
          alert('위치를 가져올 수 없습니다.');
        }
      }
    );
  };

  // 저장된 위치 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('beautia_location');
      if (savedLocation) {
        setCurrentLocation(savedLocation);
      }
    }
  }, []);

  // 알림 목록 로드 (백엔드 API에서)
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isLoggedIn) {
        // 로그인하지 않은 경우 빈 배열로 설정
        setNotifications([]);
        return;
      }
      
      try {
        const customerToken = localStorage.getItem('customer_token');
        if (!customerToken) {
          setNotifications([]);
          return;
        }
        
        const response = await fetch('/api/customer/notifications', {
          headers: {
            'Authorization': `Bearer ${customerToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.notifications) {
            const apiNotifications = data.data.notifications.map((n: any) => ({
              id: n.id,
              type: n.type || 'info',
              title: n.title,
              message: n.message || n.content,
              time: new Date(n.createdAt),
              read: n.isRead || false,
              link: n.link || null,
            }));
            
            // 로컬 스토리지에 저장된 알림과 병합 (기존 알림 유지)
            const savedNotifications = localStorage.getItem('beautia_notifications');
            let localNotifications: any[] = [];
            if (savedNotifications) {
              try {
                const parsed = JSON.parse(savedNotifications);
                localNotifications = parsed.map((n: any) => ({
                  ...n,
                  time: new Date(n.time)
                }));
              } catch (e) {
                console.error('로컬 알림 파싱 실패:', e);
              }
            }
            
            // API 알림과 로컬 알림 병합 (중복 제거)
            const allNotifications = [...apiNotifications, ...localNotifications];
            const uniqueNotifications = Array.from(
              new Map(allNotifications.map(n => [n.id, n])).values()
            );
            
            setNotifications(uniqueNotifications);
            if (typeof window !== 'undefined') {
              localStorage.setItem('beautia_notifications', JSON.stringify(uniqueNotifications));
            }
          }
        }
      } catch (error) {
        console.error('알림 로드 실패:', error);
        // 실패 시 로컬 스토리지에서 로드
        const savedNotifications = localStorage.getItem('beautia_notifications');
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            setNotifications(parsed.map((n: any) => ({
              ...n,
              time: new Date(n.time)
            })));
          } catch (e) {
            console.error('로컬 알림 로드 실패:', e);
            setNotifications([]);
          }
        } else {
          setNotifications([]);
        }
      }
    };
    
    loadNotifications();
    
    // 주기적으로 알림 새로고침 (5분마다)
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 알림 시간 포맷팅
  const formatNotificationTime = (time: Date): string => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t('notification.just_now');
    if (minutes < 60) return t('notification.minutes_ago').replace('{minutes}', minutes.toString());
    if (hours < 24) return t('notification.hours_ago').replace('{hours}', hours.toString());
    return t('notification.days_ago').replace('{days}', days.toString());
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beautia_notifications', JSON.stringify(updated));
    }
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container') && !target.closest('button[aria-label="user-menu"]')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('.lang-menu-container') && !target.closest('button[aria-label="lang-menu"]')) {
        setIsLangMenuOpen(false);
      }
      if (!target.closest('.location-menu-container') && !target.closest('button[aria-label="location-menu"]')) {
        setIsLocationMenuOpen(false);
      }
      if (!target.closest('.notification-menu-container') && !target.closest('button[aria-label="notification-menu"]')) {
        setIsNotificationMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isLangMenuOpen || isLocationMenuOpen || isNotificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isLangMenuOpen, isLocationMenuOpen, isNotificationMenuOpen]);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 h-[64px]' 
            : 'bg-transparent h-[72px]'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BeautiaLogo className="w-8 h-8 transition-transform group-hover:scale-110" />
            <span className="font-bold text-[18px] tracking-tight text-primary">BEAUTIA</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/services" className="text-[15px] font-medium text-secondary hover:text-primary transition-colors relative group">
                {t('nav.service')}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/ranking" className="text-[15px] font-medium text-secondary hover:text-primary transition-colors relative group">
                {t('nav.ranking')}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/magazine" className="text-[15px] font-medium text-secondary hover:text-primary transition-colors relative group">
                {t('nav.magazine')}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/partner" className="text-[15px] font-medium text-secondary hover:text-primary transition-colors relative group">
                {t('nav.partner')}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Current Location (알람 버튼 왼쪽) */}
            <div className="relative location-menu-container hidden md:block">
              <button
                aria-label="location-menu"
                onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                className="flex items-center gap-2 text-[13px] font-medium text-secondary hover:text-primary px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="max-w-[100px] truncate">
                  {currentLocation || t('location.set_location')}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLocationMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-3">
                  <div className="text-[12px] font-bold text-gray-500 px-2 py-1 uppercase mb-2">
                    {t('location.current_location')}
                  </div>
                  
                  {currentLocation && (
                    <div className="px-2 py-2 mb-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-[13px] text-primary">
                        <MapPin className="w-4 h-4 text-brand-lilac" />
                        <span className="font-medium">{currentLocation}</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium rounded-lg bg-brand-lilac text-white hover:bg-brand-lilac/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t('location.getting_location')}</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>{currentLocation ? t('location.update_location') : t('location.get_location')}</span>
                      </>
                    )}
                  </button>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500 px-2 mb-2">
                      {t('location.popular_cities')}
                    </div>
                    <div className="space-y-1">
                      {[
                        { name: 'Seoul', label: t('map.seoul') },
                        { name: 'Tokyo', label: t('map.tokyo') },
                        { name: 'Bangkok', label: t('map.bangkok') },
                        { name: 'Singapore', label: t('map.singapore') },
                      ].map((city) => (
                        <button
                          key={city.name}
                          onClick={() => {
                            setCurrentLocation(city.label);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('beautia_location', city.label);
                            }
                            setIsLocationMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-[13px] rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
                            currentLocation === city.label ? 'bg-brand-lilac/10 text-brand-lilac font-medium' : 'text-gray-600'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{city.label}</span>
                          {currentLocation === city.label && (
                            <CheckCircle2 className="w-4 h-4 text-brand-lilac ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Language & Currency Switcher */}
            <div className="relative lang-menu-container">
                <button 
                  aria-label="lang-menu"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="hidden md:flex items-center gap-1 text-[13px] font-medium text-secondary hover:text-primary px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                   <Globe className="w-4 h-4" />
                   {LANGUAGES[language]} / {CURRENCIES[currency].symbol} {currency}
                   <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                   <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2">
                      <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase">Language</div>
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
                      <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase">Currency</div>
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

            {/* 로그인 상태에 따라 다른 UI 표시 */}
            {isLoggedIn && customer ? (
              <div className="hidden md:block relative user-menu-container">
                <button
                  aria-label="user-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-lilac to-brand-pink flex items-center justify-center text-white font-bold text-[12px]">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-semibold text-primary">{customer.name}</span>
                  <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-gray-100">
                      <div className="font-semibold text-[14px] text-primary">{customer.name}</div>
                      <div className="text-[12px] text-secondary">{customer.email}</div>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/customer/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-[13px] text-secondary transition-colors"
                      >
                        <User className="w-4 h-4" />
                        {t('profile.title')}
                      </Link>
                      <button
                        onClick={() => {
                          logoutCustomer();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-[13px] text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('profile.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/customer/login"
                className="hidden md:block text-[14px] font-semibold text-secondary hover:text-primary px-3 py-2 transition-colors"
              >
                {t('nav.login')}
              </Link>
            )}
            
            {/* 알람 버튼 */}
            <div className="relative notification-menu-container hidden md:block">
              <button
                aria-label="notification-menu"
                onClick={() => {
                  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
                  if (!isLoggedIn) {
                    window.location.href = '/customer/login';
                    return;
                  }
                  setIsNotificationMenuOpen(!isNotificationMenuOpen);
                }}
                className="relative h-[40px] w-[40px] rounded-full bg-gray-100 text-secondary hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {isLoggedIn && notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {isNotificationMenuOpen && isLoggedIn && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-[15px] text-primary">{t('notification.title')}</h3>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[12px] text-brand-lilac hover:text-brand-lilac/80 font-medium"
                      >
                        {t('notification.mark_all_read')}
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-[13px] text-gray-500">{t('notification.empty')}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              // 알림 클릭 시 읽음 처리
                              const updated = notifications.map(n =>
                                n.id === notification.id ? { ...n, read: true } : n
                              );
                              setNotifications(updated);
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('beautia_notifications', JSON.stringify(updated));
                              }
                            }}
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                              !notification.read ? 'bg-brand-lilac/5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                !notification.read ? 'bg-brand-lilac' : 'bg-transparent'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[12px] font-semibold text-primary">
                                    {notification.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {formatNotificationTime(notification.time)}
                                  </span>
                                </div>
                                <p className="text-[12px] text-gray-600 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="h-[40px] px-5 rounded-full bg-primary text-white text-[14px] font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2">
              App
            </button>
            <button 
              className="md:hidden p-2 text-secondary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden animate-in slide-in-from-top-10 fade-in duration-200">
          <nav className="flex flex-col gap-6 text-[18px] font-semibold text-primary">
            <Link href="/services" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.service')}</Link>
            <Link href="/ranking" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.ranking')}</Link>
            <Link href="/magazine" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.magazine')}</Link>
            <Link href="/partner" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.partner')}</Link>
            <hr className="border-line" />
            {isLoggedIn && customer ? (
              <>
                <div className="py-2 border-b border-line">
                  <div className="font-semibold text-[16px]">{customer.name}</div>
                  <div className="text-[12px] text-secondary">{customer.email}</div>
                </div>
                <Link 
                  href="/customer/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2"
                >
                  {t('profile.title')}
                </Link>
                <button
                  onClick={() => {
                    logoutCustomer();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-red-600"
                >
                  {t('profile.logout')}
                </button>
              </>
            ) : (
              <Link 
                href="/customer/login" 
                onClick={() => setIsUserMenuOpen(false)}
                className="py-2"
              >
                {t('nav.login')}
              </Link>
            )}
            <div className="space-y-4 pb-4">
              <div>
                <div className="text-[12px] font-bold text-gray-500 mb-2 uppercase">Language</div>
                <div className="flex flex-wrap gap-2">
                  {(['ko', 'en', 'ja', 'th', 'zh'] as Language[]).map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => {
                        setLanguage(lang);
                        setIsMobileMenuOpen(false);
                      }} 
                      className={`px-3 py-1.5 rounded-lg border text-[13px] transition-all ${
                        language === lang 
                          ? 'border-primary bg-primary text-white font-semibold' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {LANGUAGES[lang]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-gray-500 mb-2 uppercase">Currency</div>
                <div className="flex flex-wrap gap-2">
                  {(['KRW', 'USD', 'JPY', 'THB', 'CNY'] as Currency[]).map(curr => (
                    <button 
                      key={curr} 
                      onClick={() => {
                        setCurrency(curr);
                        setIsMobileMenuOpen(false);
                      }} 
                      className={`px-3 py-1.5 rounded-lg border text-[13px] transition-all flex items-center gap-1 ${
                        currency === curr 
                          ? 'border-primary bg-primary text-white font-semibold' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{CURRENCIES[curr].symbol}</span>
                      <span>{curr}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
