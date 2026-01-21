'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, HelpCircle, X, Send, Minimize2, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpToggleProps {
  className?: string;
  variant?: 'customer' | 'partner'; // 고객용 또는 파트너용
}

const CUSTOMER_FAQ_DATA: FAQItem[] = [
  {
    question: '예약은 어떻게 하나요?',
    answer: '원하는 매장을 선택하고 원하는 날짜와 시간을 선택한 후 결제를 진행하시면 됩니다. 예약 확인은 이메일과 앱 알림으로 받으실 수 있습니다.',
  },
  {
    question: '예약을 취소할 수 있나요?',
    answer: '예약은 서비스 시작 24시간 전까지 무료로 취소 가능합니다. 24시간 이내 취소 시 취소 수수료가 발생할 수 있습니다.',
  },
  {
    question: '결제 방법은 무엇이 있나요?',
    answer: '신용카드, 체크카드, 페이팔, 구글페이 등 다양한 결제 수단을 지원합니다. 안전한 결제 처리를 위해 SSL 암호화를 사용합니다.',
  },
  {
    question: '리뷰를 작성하려면 어떻게 해야 하나요?',
    answer: '서비스 이용 후 마이페이지에서 예약 내역을 확인하고 리뷰를 작성하실 수 있습니다. 리뷰 작성 시 포인트가 적립됩니다.',
  },
  {
    question: '계정을 삭제할 수 있나요?',
    answer: '마이페이지 > 설정에서 계정 삭제가 가능합니다. 계정 삭제 시 모든 데이터가 영구적으로 삭제되므로 신중히 결정해주세요.',
  },
];

const PARTNER_FAQ_DATA: FAQItem[] = [
  {
    question: '파트너 등록은 어떻게 하나요?',
    answer: '파트너 신청 페이지에서 필요한 정보를 입력하고 제출하시면 됩니다. 심사 후 승인되면 대시보드를 사용하실 수 있습니다.',
  },
  {
    question: '수익 정산은 언제 이루어지나요?',
    answer: '월별 정산은 매월 말일에 이루어지며, 정산 금액은 다음 달 5일까지 입금됩니다. 정산 내역은 대시보드에서 확인하실 수 있습니다.',
  },
  {
    question: '예약 관리는 어떻게 하나요?',
    answer: '대시보드의 예약 관리 메뉴에서 모든 예약을 확인하고, 승인/거절/완료 처리를 할 수 있습니다. 실시간 알림도 받으실 수 있습니다.',
  },
  {
    question: '리뷰에 답변할 수 있나요?',
    answer: '네, 고객 리뷰에 답변을 작성할 수 있습니다. 대시보드의 리뷰 관리 메뉴에서 리뷰를 확인하고 답변을 작성하실 수 있습니다.',
  },
  {
    question: '프로모션을 등록하려면 어떻게 해야 하나요?',
    answer: '대시보드의 프로모션 메뉴에서 새로운 프로모션을 등록할 수 있습니다. 할인율, 기간, 사용 조건 등을 설정하실 수 있습니다.',
  },
];

export function HelpToggle({ className = '', variant = 'customer' }: HelpToggleProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  
  // 번역된 FAQ 데이터 생성
  const FAQ_DATA: FAQItem[] = variant === 'partner' ? [
    {
      question: t('help_toggle.partner_faq.q1'),
      answer: t('help_toggle.partner_faq.a1'),
    },
    {
      question: t('help_toggle.partner_faq.q2'),
      answer: t('help_toggle.partner_faq.a2'),
    },
    {
      question: t('help_toggle.partner_faq.q3'),
      answer: t('help_toggle.partner_faq.a3'),
    },
    {
      question: t('help_toggle.partner_faq.q4'),
      answer: t('help_toggle.partner_faq.a4'),
    },
    {
      question: t('help_toggle.partner_faq.q5'),
      answer: t('help_toggle.partner_faq.a5'),
    },
  ] : [
    {
      question: t('help_toggle.customer_faq.q1'),
      answer: t('help_toggle.customer_faq.a1'),
    },
    {
      question: t('help_toggle.customer_faq.q2'),
      answer: t('help_toggle.customer_faq.a2'),
    },
    {
      question: t('help_toggle.customer_faq.q3'),
      answer: t('help_toggle.customer_faq.a3'),
    },
    {
      question: t('help_toggle.customer_faq.q4'),
      answer: t('help_toggle.customer_faq.a4'),
    },
    {
      question: t('help_toggle.customer_faq.q5'),
      answer: t('help_toggle.customer_faq.a5'),
    },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('faq');
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isUser: boolean; time: string; reply?: boolean }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // 메시지 목록 로드
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      loadMessages();
    }
  }, [isOpen, activeTab]);

  const loadMessages = async () => {
    let userId = '';
    
    if (variant === 'partner') {
      const partnerUser = localStorage.getItem('partner_user');
      if (partnerUser) {
        try {
          const user = JSON.parse(partnerUser);
          userId = user.id || '';
        } catch (e) {
          console.error('파트너 정보 파싱 오류:', e);
        }
      }
    } else {
      const customerUser = localStorage.getItem('customer_user');
      if (customerUser) {
        try {
          const user = JSON.parse(customerUser);
          userId = user.id || '';
        } catch (e) {
          console.error('고객 정보 파싱 오류:', e);
        }
      }
    }

    if (!userId) return;

    try {
      const response = await fetch(`/api/support/messages?type=${variant}&userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const loadedMessages = data.data.map((msg: any) => [
          {
            text: msg.message,
            isUser: true,
            time: new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...(msg.replyMessage ? [{
            text: msg.replyMessage,
            isUser: false,
            time: msg.repliedAt ? new Date(msg.repliedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '',
            reply: true,
          }] : []),
        ]).flat();

        setChatMessages(loadedMessages);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || loading) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setLoading(true);

    // 사용자 정보 가져오기
    let userId = '';
    let userName = '';
    let userEmail = '';

    if (variant === 'partner') {
      const partnerUser = localStorage.getItem('partner_user');
      if (partnerUser) {
        try {
          const user = JSON.parse(partnerUser);
          userId = user.id || '';
          userName = user.name || '';
          userEmail = user.email || '';
        } catch (e) {
          console.error('파트너 정보 파싱 오류:', e);
        }
      }
    } else {
      const customerUser = localStorage.getItem('customer_user');
      if (customerUser) {
        try {
          const user = JSON.parse(customerUser);
          userId = user.id || '';
          userName = user.name || '';
          userEmail = user.email || '';
        } catch (e) {
          console.error('고객 정보 파싱 오류:', e);
        }
      }
    }

    // 로컬에 먼저 표시
    const newMessage = {
      text: messageText,
      isUser: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMessage]);

    try {
      // API로 메시지 전송
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: variant,
          userId,
          userName: userName || '사용자',
          message: messageText,
          userEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageSent(true);
        
        // 성공 메시지 추가
        const successResponse = {
          text: '메시지가 전송되었습니다. 관리자가 확인 후 답변드리겠습니다.',
          isUser: false,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, successResponse]);
        
        // 잠시 후 메시지 목록 새로고침 (답변이 있을 수 있으므로)
        setTimeout(() => {
          loadMessages();
        }, 2000);
      } else {
        throw new Error(data.error || '메시지 전송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('메시지 전송 오류:', error);
      
      // 에러 메시지 추가
      const errorResponse = {
        text: '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-brand-pink to-brand-lilac rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white hover:scale-110 ${className}`}
        aria-label="도움말 열기"
      >
        {isOpen ? (
          <Minimize2 className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* 위젯 패널 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-brand-pink to-brand-lilac text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[16px]">{t('help_toggle.title')}</h3>
                <p className="text-[12px] text-white/90">{t('help_toggle.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex-1 px-4 py-3 text-[14px] font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'faq'
                  ? 'bg-white text-brand-pink border-b-2 border-brand-pink'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {t('help_toggle.faq_tab')}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-[14px] font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-white text-brand-pink border-b-2 border-brand-pink'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {t('help_toggle.chat_tab')}
            </button>
          </div>

          {/* 내용 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'faq' ? (
              <div className="p-4 space-y-3">
                {FAQ_DATA.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[14px] font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <span className={`text-gray-400 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-4 pb-3 text-[13px] text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* 채팅 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-[14px]">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{t('help_toggle.chat_empty')}</p>
                      <p className="text-[12px] mt-2 text-gray-400">
                        {t('help_toggle.chat_placeholder')}
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.isUser
                              ? 'bg-brand-pink text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-[13px] leading-relaxed">{message.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              message.isUser ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 채팅 입력 */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('help_toggle.chat_placeholder_input')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-brand-pink"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || loading}
                      className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="전송"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
