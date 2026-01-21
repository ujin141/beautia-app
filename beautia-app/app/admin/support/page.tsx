'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Mail, Phone, User, Calendar, MessageSquare, Send, RefreshCw, AlertCircle, Languages } from 'lucide-react';
import { detectLanguage, translateText } from '@/lib/translation';

interface SupportMessage {
  id: string;
  type: 'customer' | 'partner';
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  repliedAt?: string;
  replyMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'customer', label: '고객' },
  { value: 'partner', label: '파트너' },
];

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '미확인' },
  { value: 'read', label: '확인' },
  { value: 'replied', label: '답변완료' },
];

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('unread');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [translatedMessage, setTranslatedMessage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [typeFilter, statusFilter, page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        type: typeFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/support/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('메시지 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/support/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      const data = await response.json();

      if (data.success) {
        // 메시지 목록 업데이트
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readAt: data.data.readAt }
            : msg
        ));

        // 선택된 메시지 업데이트
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, isRead: true, readAt: data.data.readAt });
        }
      }
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim() || replying) return;

    setReplying(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/support/messages/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyMessage: replyText.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // 메시지 목록 업데이트
        setMessages(prev => prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { 
                ...msg, 
                replyMessage: replyText.trim(),
                repliedAt: data.data.repliedAt,
                isRead: true,
              }
            : msg
        ));

        // 선택된 메시지 업데이트
        setSelectedMessage({
          ...selectedMessage,
          replyMessage: replyText.trim(),
          repliedAt: data.data.repliedAt,
          isRead: true,
        });

        setReplyText('');
        alert('답변이 전송되었습니다.');
      } else {
        alert(data.error || '답변 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('답변 전송 오류:', error);
      alert('답변 전송 중 오류가 발생했습니다.');
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const viewMessage = async (message: SupportMessage) => {
    setSelectedMessage(message);
    setTranslatedMessage(null);
    setShowOriginal(true);
    
    // 읽지 않은 메시지면 읽음 처리
    if (!message.isRead) {
      await handleReadMessage(message.id);
    }
    
    // 메시지 언어 감지 및 번역
    const detectedLang = detectLanguage(message.message);
    if (detectedLang !== 'ko') {
      // 한국어가 아니면 자동 번역
      handleTranslateMessage(message.message);
    }
  };

  const handleTranslateMessage = async (text: string) => {
    setTranslating(true);
    try {
      const translated = await translateText(text, 'ko');
      setTranslatedMessage(translated);
      setShowOriginal(false); // 기본적으로 번역문 표시
    } catch (error) {
      console.error('번역 오류:', error);
      setTranslatedMessage(null);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">지원 메시지</h2>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
        >
          {TYPE_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
        >
          {STATUS_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 메시지 목록 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-[16px]">메시지 목록</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">로딩 중...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">메시지가 없습니다.</div>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => viewMessage(message)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                        message.type === 'customer' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {message.type === 'customer' ? '고객' : '파트너'}
                      </span>
                      <span className="font-bold text-[14px]">{message.userName}</span>
                      {!message.isRead && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">{formatDate(message.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-gray-600 line-clamp-2 mb-2">
                    {message.message}
                    {detectLanguage(message.message) !== 'ko' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-medium">
                        {detectLanguage(message.message).toUpperCase()}
                      </span>
                    )}
                  </p>
                  {message.replyMessage && (
                    <div className="flex items-center gap-1 text-[11px] text-green-600">
                      <MessageSquare className="w-3 h-3" />
                      <span>답변완료</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-[13px] text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-[13px] disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 메시지 상세 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-[16px]">메시지 상세</h3>
          </div>
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {selectedMessage ? (
              <>
                {/* 사용자 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-[12px] font-bold ${
                      selectedMessage.type === 'customer' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedMessage.type === 'customer' ? '고객' : '파트너'}
                    </span>
                    <span className="font-bold text-[16px]">{selectedMessage.userName}</span>
                  </div>
                  <div className="space-y-2 text-[13px] text-gray-600">
                    {selectedMessage.userEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedMessage.userEmail}</span>
                      </div>
                    )}
                    {selectedMessage.userPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedMessage.userPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedMessage.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* 메시지 내용 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-[14px]">문의 내용</h4>
                    {selectedMessage.message && detectLanguage(selectedMessage.message) !== 'ko' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowOriginal(!showOriginal)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-medium hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                          disabled={translating || !translatedMessage}
                        >
                          <Languages className="w-3.5 h-3.5" />
                          {showOriginal ? '번역문 보기' : '원문 보기'}
                        </button>
                        {translating && (
                          <div className="text-[11px] text-gray-500">번역 중...</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
                    {showOriginal || !translatedMessage ? (
                      selectedMessage.message
                    ) : (
                      <div>
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <div className="text-[11px] text-gray-500 mb-1">번역문</div>
                          <div>{translatedMessage}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500 mb-1">원문</div>
                          <div className="text-gray-600">{selectedMessage.message}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 답변 */}
                {selectedMessage.replyMessage ? (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-bold text-[14px] mb-2">답변</h4>
                    <div className="bg-blue-50 rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.replyMessage}
                    </div>
                    {selectedMessage.repliedAt && (
                      <div className="text-[11px] text-gray-500 mt-2">
                        {formatDate(selectedMessage.repliedAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-bold text-[14px] mb-2">답변 작성</h4>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답변을 입력하세요..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || replying}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {replying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          전송 중...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          답변 전송
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 text-[13px]">
                메시지를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
