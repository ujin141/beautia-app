'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, Currency, DICTIONARY, CURRENCIES, LANGUAGES } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string; // Translation function
  formatPrice: (amount: number) => string; // Currency formatter
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 브라우저 언어 감지 및 언어/통화 매핑
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'ko';
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // 지원하는 언어로 매핑
  const langMap: { [key: string]: Language } = {
    'ko': 'ko',
    'en': 'en',
    'ja': 'ja',
    'th': 'th',
    'zh': 'zh',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    'zh-hk': 'zh',
  };
  
  return langMap[langCode] || 'ko';
}

// 언어에 따른 기본 통화 설정
function getDefaultCurrency(lang: Language): Currency {
  const currencyMap: { [key in Language]: Currency } = {
    'ko': 'KRW',
    'en': 'USD',
    'ja': 'JPY',
    'th': 'THB',
    'zh': 'CNY',
  };
  return currencyMap[lang];
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 초기값을 항상 'ko'로 고정하여 서버/클라이언트 일치 보장
  const [language, setLanguageState] = useState<Language>('ko');
  const [currency, setCurrencyState] = useState<Currency>('KRW');
  const [isMounted, setIsMounted] = useState(false);

  // 언어 변경 시 localStorage 저장 및 통화 자동 설정
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beautia_language', lang);
      // 언어 변경 시 기본 통화로 자동 변경 (사용자가 수동으로 변경한 경우가 아니면)
      const currentCurrency = localStorage.getItem('beautia_currency');
      if (!currentCurrency || currentCurrency === getDefaultCurrency(language)) {
        const newCurrency = getDefaultCurrency(lang);
        setCurrencyState(newCurrency);
        localStorage.setItem('beautia_currency', newCurrency);
      }
    }
  };

  // 통화 변경 시 localStorage 저장
  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beautia_currency', curr);
    }
  };

  // 클라이언트에서 마운트 후 언어/통화 초기화 (Hydration 오류 방지)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsMounted(true);
    
    const savedLang = localStorage.getItem('beautia_language');
    const savedCurrency = localStorage.getItem('beautia_currency');
    
    // localStorage에 저장된 값이 있으면 사용
    if (savedLang && ['ko', 'en', 'ja', 'th', 'zh'].includes(savedLang)) {
      setLanguageState(savedLang as Language);
      
      if (savedCurrency && ['KRW', 'USD', 'JPY', 'THB', 'CNY'].includes(savedCurrency)) {
        setCurrencyState(savedCurrency as Currency);
      } else {
        const defaultCurrency = getDefaultCurrency(savedLang as Language);
        setCurrencyState(defaultCurrency);
        localStorage.setItem('beautia_currency', defaultCurrency);
      }
    } else {
      // 저장된 설정이 없으면 브라우저 언어로 초기화
      const detectedLang = detectBrowserLanguage();
      setLanguageState(detectedLang);
      localStorage.setItem('beautia_language', detectedLang);
      
      const defaultCurrency = getDefaultCurrency(detectedLang);
      setCurrencyState(defaultCurrency);
      localStorage.setItem('beautia_currency', defaultCurrency);
    }
  }, []);

  // Simple translation helper
  // usage: t('hero.title')
  // useCallback으로 메모이제이션하여 language가 변경될 때마다 재생성
  const t = useCallback((key: string): string => {
    if (!key || typeof key !== 'string') {
      return key || '';
    }

    try {
      // 현재 언어의 사전 가져오기 (기본값: 'ko')
      const currentLang: Language = language || 'ko';
      
      // 키를 점으로 분리
      const keys = key.split('.');
      
      // 현재 언어 사전 가져오기
      const dict = DICTIONARY[currentLang] || DICTIONARY.ko;
      
      if (!dict || typeof dict !== 'object') {
        if (typeof window !== 'undefined') {
          console.error(`[Translation] DICTIONARY not available`, { currentLang, key });
        }
        return key;
      }
      
      // 중첩된 키 순회
      let result: any = dict;
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // 현재 언어에서 찾지 못하면 한국어로 fallback 시도
          if (currentLang !== 'ko' && DICTIONARY.ko) {
            let koResult: any = DICTIONARY.ko;
            let found = true;
            
            for (const kk of keys) {
              if (koResult && typeof koResult === 'object' && kk in koResult) {
                koResult = koResult[kk];
              } else {
                found = false;
                break;
              }
            }
            
            if (found && typeof koResult === 'string') {
              return koResult;
            }
          }
          
          // 키를 찾지 못함
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn(`[Translation] Key not found: "${key}"`, {
              lang: currentLang,
              searchedKey: k,
              availableKeys: result ? Object.keys(result).slice(0, 5) : [],
              fullPath: keys.join('.')
            });
          }
          return key;
        }
      }
      
      // 최종 값이 문자열이면 반환
      if (typeof result === 'string') {
        return result;
      }
      
      // 문자열이 아니면 키 반환
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn(`[Translation] Value is not a string: "${key}"`, {
          type: typeof result,
          value: result
        });
      }
      return key;
    } catch (error) {
      if (typeof window !== 'undefined') {
        console.error('[Translation] Error:', error, 'key:', key);
      }
      return key;
    }
  }, [language]); // language가 변경될 때마다 함수 재생성

  // Currency formatter
  // Assumes base amount is in KRW
  const formatPrice = useCallback((amountInKRW: number): string => {
    const targetCurrency = CURRENCIES[currency];
    const convertedAmount = amountInKRW * targetCurrency.rate;

    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2
    }).format(convertedAmount);
  }, [currency, language]); // currency와 language가 변경될 때마다 함수 재생성

  return (
    <LanguageContext.Provider value={{ language, currency, setLanguage, setCurrency, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
