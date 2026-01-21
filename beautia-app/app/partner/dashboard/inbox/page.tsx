'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Search, Send, MoreVertical, Image as ImageIcon, Loader2, Languages, X, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';
import { useSearchParams } from 'next/navigation';

interface ChatListItem {
  userId: string;
  userName: string;
  userPhone?: string;
  lastMsg: string;
  lastMsgTime: string;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'partner' | 'user';
  createdAt: string;
  read: boolean;
  translatedContent?: string; // 번역된 메시지
  showTranslation?: boolean; // 번역 표시 여부
  isTranslating?: boolean; // 번역 중 여부
}

interface CustomerDetail {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  profileImage?: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  bookingCount: number;
}

function InboxPageContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams?.get('customerId');
  
  const { t, formatPrice, language } = useLanguage();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTranslations, setShowTranslations] = useState(true); // 번역 표시 여부
  const translatingMessagesRef = useRef<Set<string>>(new Set()); // 번역 중인 메시지 ID
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const readChatRoomsRef = useRef<Set<string>>(new Set()); // 읽은 채팅방 ID 추적

  // localStorage에서 읽은 채팅방 목록 로드
  const loadReadChatRooms = () => {
    try {
      const stored = localStorage.getItem('partner_read_chat_rooms');
      if (stored) {
        const roomIds = JSON.parse(stored) as string[];
        readChatRoomsRef.current = new Set(roomIds);
      }
    } catch (error) {
      console.error('Failed to load read chat rooms from localStorage', error);
    }
  };

  // localStorage에 읽은 채팅방 목록 저장
  const saveReadChatRooms = () => {
    try {
      const roomIds = Array.from(readChatRoomsRef.current);
      localStorage.setItem('partner_read_chat_rooms', JSON.stringify(roomIds));
    } catch (error) {
      console.error('Failed to save read chat rooms to localStorage', error);
    }
  };

  // 메시지 목록 로드
  useEffect(() => {
    // localStorage에서 읽은 채팅방 목록 복원
    loadReadChatRooms();

    async function fetchChats() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/partner/messages', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
          },
          cache: 'no-store', // 캐시를 사용하지 않도록 설정
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 읽은 채팅방의 unread를 0으로 설정
            const chatsWithReadStatus = (data.data || []).map((chat: ChatListItem) => {
              if (readChatRoomsRef.current.has(chat.userId)) {
                return { ...chat, unread: 0 };
              }
              return chat;
            });
            setChats(chatsWithReadStatus);
            if (data.data.length > 0 && !selectedUserId) {
              setSelectedUserId(data.data[0].userId);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch chats', error);
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, []);

  // 채팅 목록 새로고침
  const refreshChats = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) return;

      const response = await fetch('/api/partner/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
        },
        cache: 'no-store', // 캐시를 사용하지 않도록 설정
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 읽은 채팅방의 unread를 항상 0으로 유지
          setChats(() => {
            const newChats = data.data || [];
            return newChats.map((newChat: ChatListItem) => {
              // 읽은 채팅방 목록에 있으면 unread를 0으로 설정
              if (readChatRoomsRef.current.has(newChat.userId)) {
                return { ...newChat, unread: 0 };
              }
              return newChat;
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh chats', error);
    }
  };

  // 선택된 고객의 메시지 로드
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedUserId) return;

      try {
        const partner = getPartnerUser();
        if (!partner) return;

        const response = await fetch(`/api/partner/messages?userId=${selectedUserId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
          },
          cache: 'no-store', // 캐시를 사용하지 않도록 설정
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const fetchedMessages = (data.data.messages || []).map((msg: Message) => ({
              ...msg,
              showTranslation: showTranslations,
            }));
            setMessages(fetchedMessages);
            // 메시지 자동 번역 (고객 메시지만)
            const userMessages = fetchedMessages.filter((msg: Message) => msg.sender === 'user');
            translateMessages(userMessages);
            
            // 현재 선택된 채팅방을 읽은 채팅방 목록에 추가
            if (selectedUserId) {
              readChatRoomsRef.current.add(selectedUserId);
              saveReadChatRooms(); // localStorage에 저장
            }
            
            // 메시지를 읽은 후 채팅 목록 새로고침 (알림 숫자 업데이트)
            // 백엔드 업데이트가 완료되도록 충분한 지연
            setTimeout(() => {
              refreshChats();
            }, 800);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    }
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, showTranslations]);

  // 언어 변경 시 메시지 재번역
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      
      // 번역 정보 초기화 후 재번역
      const resetMessages = prev.map(msg => ({
        ...msg,
        translatedContent: undefined,
        isTranslating: false,
        showTranslation: showTranslations,
      }));
      
      // 재번역 수행 (고객 메시지만)
      setTimeout(() => {
        const userMessages = resetMessages.filter((msg: Message) => msg.sender === 'user');
        translateMessages(userMessages);
      }, 100);
      
      return resetMessages;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, showTranslations]);

  // 메시지 번역 함수
  const translateMessages = async (messagesToTranslate: Message[]) => {
    const targetLang = language; // 현재 선택된 언어
    
    for (const msg of messagesToTranslate) {
      // 이미 번역된 메시지, 파트너가 보낸 메시지, 텍스트가 없는 메시지는 건너뛰기
      if (msg.translatedContent || 
          msg.sender === 'partner' || 
          !msg.content || 
          msg.content.trim().length === 0 ||
          translatingMessagesRef.current.has(msg.id)) {
        continue;
      }

      // 번역 중 표시
      translatingMessagesRef.current.add(msg.id);
      setMessages(prev => prev.map(m => 
        m.id === msg.id ? { ...m, isTranslating: true } : m
      ));

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msg.content,
            targetLang: targetLang,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.translated && data.translated !== msg.content) {
            setMessages(prev => prev.map(m => 
              m.id === msg.id 
                ? { ...m, translatedContent: data.translated, isTranslating: false, showTranslation: showTranslations }
                : m
            ));
          } else {
            setMessages(prev => prev.map(m => 
              m.id === msg.id ? { ...m, isTranslating: false } : m
            ));
          }
        }
      } catch (error) {
        console.error('Failed to translate message', error);
        setMessages(prev => prev.map(m => 
          m.id === msg.id ? { ...m, isTranslating: false } : m
        ));
      } finally {
        translatingMessagesRef.current.delete(msg.id);
      }
    }
  };

  // 단일 메시지 번역
  const translateSingleMessage = async (message: Message) => {
    if (message.translatedContent || 
        message.sender === 'partner' || 
        !message.content || 
        message.content.trim().length === 0) {
      return;
    }

    translatingMessagesRef.current.add(message.id);
    setMessages(prev => prev.map(m => 
      m.id === message.id ? { ...m, isTranslating: true } : m
    ));

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          targetLang: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translated && data.translated !== message.content) {
          setMessages(prev => prev.map(m => 
            m.id === message.id 
              ? { ...m, translatedContent: data.translated, isTranslating: false, showTranslation: showTranslations }
              : m
          ));
        } else {
          setMessages(prev => prev.map(m => 
            m.id === message.id ? { ...m, isTranslating: false } : m
          ));
        }
      } else {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, isTranslating: false } : m
        ));
      }
    } catch (error) {
      console.error('Failed to translate message', error);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, isTranslating: false } : m
      ));
    } finally {
      translatingMessagesRef.current.delete(message.id);
    }
  };

  // 주기적으로 새 메시지 확인 및 자동 번역 (30초마다)
  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/partner/messages?userId=${selectedUserId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
          },
          cache: 'no-store', // 캐시를 사용하지 않도록 설정
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const fetchedMessages = data.data.messages || [];
            
            setMessages(prev => {
              // 새 메시지가 있는지 확인
              if (fetchedMessages.length > prev.length) {
                const newMessages = fetchedMessages.slice(prev.length);
                const updatedMessages = fetchedMessages.map((msg: Message) => {
                  const existingMsg = prev.find(m => m.id === msg.id);
                  return existingMsg ? existingMsg : {
                    ...msg,
                    showTranslation: showTranslations,
                  };
                });
                
                // 새 메시지만 번역
                setTimeout(() => {
                  const userMessages = newMessages.filter((msg: Message) => msg.sender === 'user');
                  translateMessages(userMessages.map((msg: Message) => ({
                    ...msg,
                    showTranslation: showTranslations,
                  })));
                }, 100);
                
                return updatedMessages;
              }
              return prev;
            });
            
            // 새 메시지를 읽은 후 채팅 목록 새로고침 (알림 숫자 업데이트)
            // 약간의 지연을 두어 백엔드 업데이트가 완료되도록 함
            setTimeout(() => {
              refreshChats();
            }, 300);
          }
        }
      } catch (error) {
        console.error('Failed to check new messages', error);
      }
    }, 30000); // 30초마다

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, showTranslations]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return;

    const partner = getPartnerUser();
    if (!partner) return;

    const selectedChat = chats.find(c => c.userId === selectedUserId);
    if (!selectedChat) return;

    setSending(true);
    try {
      const response = await fetch('/api/partner/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          content: messageText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessageText('');
          // 메시지 목록 새로고침
          const refreshResponse = await fetch('/api/partner/messages', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
            },
            cache: 'no-store', // 캐시를 사용하지 않도록 설정
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setChats(refreshData.data || []);
            }
          }
          // 현재 대화 메시지 새로고침
          const msgResponse = await fetch(`/api/partner/messages?userId=${selectedUserId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
            },
            cache: 'no-store', // 캐시를 사용하지 않도록 설정
          });
          if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            if (msgData.success && msgData.data) {
              const fetchedMessages = (msgData.data.messages || []).map((msg: Message) => ({
                ...msg,
                showTranslation: showTranslations,
              }));
              setMessages(fetchedMessages);
              // 새로 받은 메시지만 번역 (파트너가 보낸 메시지는 제외)
              const userMessages = fetchedMessages.filter((msg: Message) => msg.sender === 'user');
              translateMessages(userMessages);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 고객 상세 정보 조회
  // 모두 읽음 처리
  const handleMarkAllRead = async () => {
    if (!confirm(t('partner_dashboard.inbox_mark_all_read_confirm'))) {
      return;
    }

    try {
      const partner = getPartnerUser();
      if (!partner) return;

      const response = await fetch('/api/partner/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
        },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 모든 채팅방을 읽은 채팅방 목록에 추가
          chats.forEach(chat => {
            readChatRoomsRef.current.add(chat.userId);
          });
          saveReadChatRooms(); // localStorage에 저장

          // 채팅 목록 새로고침
          setTimeout(() => {
            refreshChats();
          }, 300);
        }
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleShowCustomerDetail = async (userId: string) => {
    setIsLoadingCustomer(true);
    setShowCustomerModal(true);
    
    try {
      const partner = getPartnerUser();
      if (!partner) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 고객 목록에서 해당 고객 정보 찾기
      const response = await fetch('/api/partner/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const customer = data.data.find((c: CustomerDetail) => c.userId === userId);
          if (customer) {
            setSelectedCustomerDetail(customer);
          } else {
            // 고객 목록에 없으면 기본 정보로 표시
            const chat = chats.find(c => c.userId === userId);
            if (chat) {
              setSelectedCustomerDetail({
                userId: chat.userId,
                userName: chat.userName,
                userEmail: '',
                userPhone: chat.userPhone || '',
                visits: 0,
                lastVisit: '-',
                totalSpent: 0,
                bookingCount: 0,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('고객 정보 조회 오류:', error);
      // 오류 발생 시 기본 정보로 표시
      const chat = chats.find(c => c.userId === userId);
      if (chat) {
        setSelectedCustomerDetail({
          userId: chat.userId,
          userName: chat.userName,
          userEmail: '',
          userPhone: chat.userPhone || '',
          visits: 0,
          lastVisit: '-',
          totalSpent: 0,
          bookingCount: 0,
        });
      }
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // 언어별 로케일 매핑
    const localeMap: { [key: string]: string } = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      th: 'th-TH',
      zh: 'zh-CN',
    };
    const locale = localeMap[language] || 'en-US';

    if (days === 0) {
      // 12시간 형식 사용 여부 결정 (한국어, 영어, 일본어는 12시간 형식 사용)
      const use12Hour = ['ko-KR', 'en-US', 'ja-JP'].includes(locale);
      return date.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: use12Hour
      });
    } else if (days === 1) {
      return t('partner_dashboard.inbox_yesterday');
    } else if (days < 7) {
      const daysAgoText = t('partner_dashboard.inbox_days_ago');
      return daysAgoText.replace('{days}', days.toString());
    } else {
      return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChat = chats.find(c => c.userId === selectedUserId);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-lilac" /></div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-2xl border border-line flex overflow-hidden">
      {/* List */}
      <div className="w-[320px] border-r border-line flex flex-col">
         <div className="p-4 border-b border-line">
            <div className="flex items-center justify-between mb-4">
               <h2 className="font-bold text-[18px]">{t('partner_dashboard.inbox_title')}</h2>
               {chats.some(chat => chat.unread > 0) && (
                  <button
                     onClick={handleMarkAllRead}
                     className="text-[12px] text-brand-lilac hover:text-brand-pink font-medium px-2 py-1 rounded-lg hover:bg-surface transition-colors"
                  >
                     {t('partner_dashboard.inbox_mark_all_read')}
                  </button>
               )}
            </div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder={t('partner_dashboard.inbox_search_placeholder')} 
                 className="w-full pl-10 pr-4 py-2 bg-surface rounded-xl text-[14px] focus:outline-none"
               />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
               <div className="p-4 text-center text-secondary text-[14px]">
                  {searchTerm ? '검색 결과가 없습니다.' : t('partner_dashboard.reservations_empty')}
               </div>
            ) : (
               filteredChats.map((chat) => (
                  <div 
                     key={chat.userId}
                     onClick={async () => {
                        // 이전 선택된 채팅의 unread가 0이었던 상태를 저장
                        const prevSelectedUserId = selectedUserId;
                        
                        // 이전에 선택한 채팅방을 읽은 채팅방 목록에 추가
                        if (prevSelectedUserId) {
                          readChatRoomsRef.current.add(prevSelectedUserId);
                        }
                        
                        // 새 채팅방 선택
                        setSelectedUserId(chat.userId);
                        
                        // 새로 선택한 채팅방도 읽은 채팅방 목록에 추가
                        readChatRoomsRef.current.add(chat.userId);
                        saveReadChatRooms(); // localStorage에 저장
                        
                        // 메시지를 클릭했을 때 즉시 로컬 상태에서 unread 숫자를 0으로 설정
                        setChats(prevChats => 
                           prevChats.map(c => {
                              // 읽은 채팅방 목록에 있으면 unread를 0으로 설정
                              if (readChatRoomsRef.current.has(c.userId)) {
                                 return { ...c, unread: 0 };
                              }
                              return c;
                           })
                        );
                        
                        // 채팅방 변경 시 목록 새로고침 (약간의 지연을 두어 읽음 처리가 완료되도록)
                        setTimeout(() => {
                           refreshChats();
                        }, 500);
                     }}
                     className={`p-4 flex gap-3 cursor-pointer hover:bg-surface transition-colors ${
                        selectedUserId === chat.userId ? 'bg-surface' : ''
                     }`}
                  >
                     <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-[14px]">{chat.userName}</span>
                           <span className="text-[12px] text-secondary">{formatTime(chat.lastMsgTime)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <p className="text-[13px] text-secondary truncate">{chat.lastMsg}</p>
                           {chat.unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-brand-lilac text-white text-[10px] flex items-center justify-center font-bold">
                                 {chat.unread}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Chat Room */}
      <div className="flex-1 flex flex-col">
         {selectedChat ? (
            <>
               <div className="h-16 border-b border-line flex items-center justify-between px-6">
                  <div className="font-bold">{selectedChat.userName}</div>
                  <div className="flex items-center gap-2">
                     {/* 번역 토글 버튼 */}
                     <button
                        onClick={() => {
                          const newShowTranslations = !showTranslations;
                          setShowTranslations(newShowTranslations);
                          setMessages(prev => prev.map(msg => ({
                            ...msg,
                            showTranslation: newShowTranslations,
                          })));
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          showTranslations 
                            ? 'bg-brand-lilac/10 text-brand-lilac' 
                            : 'hover:bg-surface text-secondary hover:text-primary'
                        }`}
                        title={showTranslations ? '번역 숨기기' : '번역 보기'}
                     >
                        <Languages className="w-5 h-5" />
                     </button>
                     <button 
                        onClick={() => handleShowCustomerDetail(selectedChat.userId)}
                        className="p-2 hover:bg-surface rounded-lg text-secondary hover:text-primary transition-colors"
                        title="고객 정보"
                     >
                        <MoreVertical className="w-5 h-5" />
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 bg-surface p-6 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                     <div className="text-center text-secondary text-[14px] py-8">
                        메시지가 없습니다. 첫 메시지를 보내보세요!
                     </div>
                  ) : (
                     messages.map((msg, idx) => {
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                        
                        return (
                           <React.Fragment key={msg.id}>
                              {showDate && (
                                 <div className="flex justify-center">
                                    <span className="bg-black/10 text-secondary text-[11px] px-3 py-1 rounded-full">
                                       {new Date(msg.createdAt).toLocaleDateString('ko-KR')}
                                    </span>
                                 </div>
                              )}
                              <div className={`flex ${msg.sender === 'partner' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`px-4 py-2 rounded-2xl max-w-[70%] text-[14px] ${
                                    msg.sender === 'partner' 
                                       ? 'bg-primary text-white rounded-tr-none' 
                                       : 'bg-white border border-line rounded-tl-none'
                                 }`}>
                                    {/* 원문 메시지 */}
                                    <div>{msg.content}</div>
                                    
                                    {/* 번역된 메시지 (고객 메시지만 표시) */}
                                    {msg.sender === 'user' && msg.translatedContent && 
                                     msg.showTranslation && 
                                     msg.translatedContent !== msg.content && (
                                       <div className="mt-2 pt-2 border-t border-current/20">
                                          <div className="flex items-center gap-1 mb-1">
                                             <Languages className="w-3 h-3 opacity-70" />
                                             <span className="text-[11px] opacity-70">번역</span>
                                          </div>
                                          <div className="text-[13px] opacity-90">
                                             {msg.translatedContent}
                                          </div>
                                       </div>
                                    )}
                                    
                                    {/* 번역 중 표시 */}
                                    {msg.sender === 'user' && 
                                     msg.isTranslating && 
                                     !msg.translatedContent && (
                                       <div className="mt-2 pt-2 border-t border-current/20 flex items-center gap-2">
                                          <Loader2 className="w-3 h-3 animate-spin opacity-70" />
                                          <span className="text-[11px] opacity-70">번역 중...</span>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </React.Fragment>
                        );
                     })
                  )}
               </div>

               <div className="p-4 bg-white border-t border-line">
                  <div className="flex items-center gap-2">
                     <button className="p-2 hover:bg-surface rounded-full text-secondary">
                        <ImageIcon className="w-5 h-5" />
                     </button>
                     <input 
                        type="text" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('partner_dashboard.inbox_message_placeholder')} 
                        className="flex-1 px-4 py-2 bg-surface rounded-xl focus:outline-none"
                        disabled={sending}
                     />
                     <button 
                        onClick={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        className="p-2 bg-brand-lilac text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
            </>
         ) : (
            <div className="flex-1 flex items-center justify-center text-secondary">
               {t('partner_dashboard.reservations_empty')}
            </div>
         )}
      </div>

      {/* 고객 정보 모달 */}
      {showCustomerModal && selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {isLoadingCustomer ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-lilac" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[20px] font-bold">{t('partner_dashboard.customers_detail_title')}</h3>
                  <button 
                    onClick={() => setShowCustomerModal(false)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    {selectedCustomerDetail.profileImage ? (
                      <img 
                        src={selectedCustomerDetail.profileImage} 
                        alt={selectedCustomerDetail.userName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-mint to-brand-lilac flex items-center justify-center text-white font-bold text-[24px]">
                        {selectedCustomerDetail.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-[20px] font-bold">{selectedCustomerDetail.userName}</div>
                      {selectedCustomerDetail.userEmail && (
                        <div className="text-[13px] text-secondary flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {selectedCustomerDetail.userEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_contact')}</label>
                    <div className="text-[16px] flex items-center gap-2">
                      {selectedCustomerDetail.userPhone ? (
                        <>
                          <Phone className="w-4 h-4" />
                          {selectedCustomerDetail.userPhone}
                        </>
                      ) : (
                        <span className="text-secondary">{t('partner_dashboard.customers_not_registered')}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_visits_label')}</label>
                    <div className="text-[16px] font-bold">{selectedCustomerDetail.visits}{language === 'ko' ? '회' : language === 'ja' ? '回' : language === 'zh' ? '次' : ''}</div>
                  </div>

                  <div>
                    <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_last_visit_label')}</label>
                    <div className="text-[16px]">{selectedCustomerDetail.lastVisit}</div>
                  </div>

                  <div>
                    <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_total_spent_label')}</label>
                    <div className="text-[16px] font-bold">{formatPrice(selectedCustomerDetail.totalSpent)}</div>
                  </div>

                  <div>
                    <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_booking_count_label')}</label>
                    <div className="text-[16px] font-bold">{selectedCustomerDetail.bookingCount || selectedCustomerDetail.visits}{language === 'ko' ? '건' : language === 'ja' ? '件' : language === 'zh' ? '次' : ''}</div>
                  </div>

                  <div className="pt-4 border-t border-line flex gap-2">
                    <button 
                      onClick={() => {
                        setShowCustomerModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-brand-lilac text-white rounded-lg font-medium hover:bg-brand-lilac/90 transition-colors"
                    >
                      {t('partner_dashboard.customers_send_message')}
                    </button>
                    {selectedCustomerDetail.userPhone && (
                      <button 
                        onClick={() => {
                          setShowCustomerModal(false);
                          window.location.href = `tel:${selectedCustomerDetail.userPhone}`;
                        }}
                        className="flex-1 px-4 py-2 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors"
                      >
                        {t('partner_dashboard.customers_call')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="p-8">로딩 중...</div>}>
      <InboxPageContent />
    </Suspense>
  );
}
