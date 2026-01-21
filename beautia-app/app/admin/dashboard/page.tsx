'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, AlertTriangle, ArrowRight, DollarSign, Activity } from 'lucide-react';
import { AdminApi } from '../../../lib/api';
import { DashboardStats } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { isAdminLoggedIn } from '../../../lib/auth';

interface TrafficData {
  label: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [trafficMax, setTrafficMax] = useState(1);
  const [trafficRange, setTrafficRange] = useState<'24h' | '7d'>('24h');
  const [trafficLoading, setTrafficLoading] = useState(true);
  const { t, formatPrice } = useLanguage();

  useEffect(() => {
    // 인증 확인
    if (!isAdminLoggedIn()) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [statsData, trafficResponse] = await Promise.all([
          AdminApi.getStats(),
          fetch(`/api/admin/stats/traffic?range=${trafficRange}`).then(res => res.json()),
        ]);
        
        setStats(statsData);
        
        if (trafficResponse.success && trafficResponse.data) {
          setTrafficData(trafficResponse.data.data || []);
          setTrafficMax(trafficResponse.data.maxValue || 1);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
        // 인증 오류는 이미 AdminApi에서 처리됨
        // 에러 발생 시 기본값 설정
        setStats({
          totalSales: 0,
          reservationCount: 0,
          reviewCount: 0,
          customerCount: 0,
          highRiskCount: 0,
          salesGrowth: 0,
          reservationGrowth: 0,
        });
      } finally {
        setLoading(false);
        setTrafficLoading(false);
      }
    }
    fetchData();
    
    // 트래픽 데이터 주기적 업데이트 (5분마다)
    const trafficInterval = setInterval(() => {
      fetch(`/api/admin/stats/traffic?range=${trafficRange}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setTrafficData(data.data.data || []);
            setTrafficMax(data.data.maxValue || 1);
          }
        })
        .catch(err => console.error('Traffic update error:', err));
    }, 5 * 60 * 1000);

    return () => clearInterval(trafficInterval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-[14px]">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-[24px] font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-[13px]">{t('admin.subtitle')}</p>
         </div>
         <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[12px] font-bold rounded-full border border-green-500/20 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               System Normal
            </span>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
            { label: t('admin.total_revenue'), value: formatPrice(stats.totalSales), change: `+${stats.salesGrowth}%`, icon: DollarSign, color: 'text-blue-400' },
            { label: t('admin.total_bookings'), value: `${stats.reservationCount.toLocaleString()}`, change: `+${stats.reservationGrowth}%`, icon: Calendar, color: 'text-purple-400' },
            { label: t('admin.active_users'), value: `${stats.customerCount.toLocaleString()}`, change: '+5.2%', icon: Users, color: 'text-pink-400' },
            { label: t('admin.risk_detected') || '위험 예약', value: `${(stats.highRiskCount || 0).toLocaleString()}`, change: '-2', icon: AlertTriangle, color: 'text-red-400' },
         ].map((stat, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all">
               <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg bg-gray-800 ${stat.color}`}>
                     <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">{stat.change}</span>
               </div>
               <div className="text-[12px] text-gray-400 font-medium mb-1">{stat.label}</div>
               <div className="text-[22px] font-bold text-white tracking-tight">{stat.value}</div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Real-time Traffic Chart */}
         <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> Real-time Traffic
               </h3>
               <select 
                 value={trafficRange}
                 onChange={async (e) => {
                   const newRange = e.target.value as '24h' | '7d';
                   setTrafficRange(newRange);
                   setTrafficLoading(true);
                   try {
                     const response = await fetch(`/api/admin/stats/traffic?range=${newRange}`);
                     const data = await response.json();
                     if (data.success && data.data) {
                       setTrafficData(data.data.data || []);
                       setTrafficMax(data.data.maxValue || 1);
                     }
                   } catch (error) {
                     console.error('Traffic data fetch error:', error);
                   } finally {
                     setTrafficLoading(false);
                   }
                 }}
                 className="bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded border border-gray-700 outline-none"
               >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
               </select>
            </div>
            {trafficLoading ? (
               <div className="h-[240px] flex items-center justify-center">
                  <div className="text-gray-500 text-[13px]">로딩 중...</div>
               </div>
            ) : trafficData.length === 0 ? (
               <div className="h-[240px] flex items-center justify-center">
                  <div className="text-gray-500 text-[13px]">데이터가 없습니다.</div>
               </div>
            ) : (
               <>
                  <div className="h-[240px] flex items-end justify-between gap-1 px-2">
                     {trafficData.map((item, i) => {
                        const height = trafficMax > 0 ? (item.value / trafficMax) * 100 : 0;
                        return (
                           <div key={i} className="flex-1 bg-gray-800 rounded-t-sm relative group" title={`${item.label}: ${item.value}건`}>
                              <div 
                                 className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-500 group-hover:from-purple-600 group-hover:to-purple-400"
                                 style={{ height: `${Math.max(height, 2)}%` }}
                              />
                              {item.value > 0 && (
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {item.value}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
                  <div className="flex justify-between mt-4 text-[11px] text-gray-500 font-mono">
                     {trafficRange === '24h' ? (
                        <>
                           <span>{trafficData[0]?.label || '00:00'}</span>
                           <span>{trafficData[Math.floor(trafficData.length / 4)]?.label || '06:00'}</span>
                           <span>{trafficData[Math.floor(trafficData.length / 2)]?.label || '12:00'}</span>
                           <span>{trafficData[Math.floor(trafficData.length * 3 / 4)]?.label || '18:00'}</span>
                           <span>{trafficData[trafficData.length - 1]?.label || '23:59'}</span>
                        </>
                     ) : (
                        <>
                           {trafficData.map((item, i) => {
                              if (i === 0 || i === Math.floor(trafficData.length / 2) || i === trafficData.length - 1) {
                                 const date = new Date(item.label);
                                 return (
                                    <span key={i}>
                                       {date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                                    </span>
                                 );
                              }
                              return null;
                           })}
                        </>
                     )}
                  </div>
               </>
            )}
         </div>

         {/* AI Analysis Widget */}
         <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               AI Risk Monitor
            </h3>
            <div className="space-y-3">
               {[
                  { msg: 'High-risk booking detected (No-show likely)', time: '2m ago', level: 'high' },
                  { msg: 'Abnormal traffic from IP 192.168.0.1', time: '15m ago', level: 'medium' },
                  { msg: 'Payment gateway latency increased', time: '1h ago', level: 'low' },
               ].map((alert, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700 flex gap-3 items-start">
                     <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        alert.level === 'high' ? 'text-red-500' : 
                        alert.level === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                     }`} />
                     <div>
                        <div className="text-[12px] text-gray-300 font-medium leading-snug mb-1">{alert.msg}</div>
                        <div className="text-[11px] text-gray-500">{alert.time}</div>
                     </div>
                  </div>
               ))}
            </div>
            <button 
              onClick={() => {
                // 알림 페이지로 이동 (추후 구현)
                window.location.href = '/admin/logs';
              }}
              className="w-full mt-4 py-2 text-[12px] text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
               View All Alerts
            </button>
         </div>
      </div>
    </div>
  );
}
