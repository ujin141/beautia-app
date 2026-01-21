'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LogEntry {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'user' | 'payment' | 'booking' | 'security';
  message: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/logs');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLogs(data.data || []);
        }
      }
    } catch (error) {
      console.error('로그 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const csvContent = `타입,카테고리,메시지,사용자,IP주소,시간\n${filteredLogs.map(log => 
      `${log.type},${log.category},${log.message.replace(/,/g, ';')},${log.userName || 'N/A'},${log.ipAddress || 'N/A'},${log.createdAt}`
    ).join('\n')}`;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `시스템로그_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!log.message.toLowerCase().includes(query) &&
          !log.userName?.toLowerCase().includes(query) &&
          !log.ipAddress?.includes(query)) {
        return false;
      }
    }
    if (typeFilter !== 'all' && log.type !== typeFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && log.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">시스템 로그/감사</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> 로그 다운로드
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="메시지, 사용자, IP주소 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            <option value="all">전체 타입</option>
            <option value="info">정보</option>
            <option value="success">성공</option>
            <option value="warning">경고</option>
            <option value="error">오류</option>
          </select>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
          >
            <option value="all">전체 카테고리</option>
            <option value="system">시스템</option>
            <option value="user">사용자</option>
            <option value="payment">결제</option>
            <option value="booking">예약</option>
            <option value="security">보안</option>
          </select>
        </div>
      </div>

      {/* 로그 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">로그가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 border-l-4 ${getTypeColor(log.type)} hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getTypeIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase px-2 py-0.5 bg-gray-100 rounded">
                        {log.category}
                      </span>
                      <span className="text-[12px] text-gray-500">
                        {new Date(log.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium">{log.message}</p>
                    {(log.userName || log.ipAddress) && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        {log.userName && <span>사용자: {log.userName}</span>}
                        {log.ipAddress && <span className="ml-3">IP: {log.ipAddress}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 로그 상세 모달 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">로그 상세</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">타입</label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedLog.type)}
                  <span className="text-[14px] font-bold">{selectedLog.type}</span>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">카테고리</label>
                <span className="text-[14px]">{selectedLog.category}</span>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">메시지</label>
                <p className="text-[14px] text-gray-700">{selectedLog.message}</p>
              </div>
              {selectedLog.userName && (
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">사용자</label>
                  <span className="text-[14px]">{selectedLog.userName} ({selectedLog.userId})</span>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">IP 주소</label>
                  <span className="text-[14px]">{selectedLog.ipAddress}</span>
                </div>
              )}
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">시간</label>
                <span className="text-[14px]">{new Date(selectedLog.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              {selectedLog.metadata && (
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase mb-1">추가 정보</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-[12px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
