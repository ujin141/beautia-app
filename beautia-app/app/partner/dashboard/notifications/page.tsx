'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Calendar, DollarSign, MessageSquare, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPartnerUser } from '../../../../lib/auth';

export default function PartnerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = getPartnerUser();
      if (!user?.id) {
        router.push('/partner/login');
        return;
      }

      const url = filter === 'all'
        ? `/api/partner/notifications`
        : `/api/partner/notifications?unreadOnly=true`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('partner_token') || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // data.data.notifications 배열 사용
          setNotifications(data.data.notifications || []);
        }
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const user = getPartnerUser();
      if (!user?.id) return;

      const partnerToken = localStorage.getItem('partner_token');
      if (!partnerToken) return;

      const response = await fetch(`/api/partner/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${partnerToken}`,
        },
      });
      
      if (response.ok) {
        // 알림 목록 새로고침
        fetchNotifications();
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };
  
  const handleNotificationClick = async (notification: any) => {
    // 읽음 처리
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    
    // 링크가 있으면 해당 페이지로 이동
    if (notification.link) {
      router.push(notification.link);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const user = getPartnerUser();
      if (!user?.id) return;

      const partnerToken = localStorage.getItem('partner_token');
      if (!partnerToken) return;

      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;

      const response = await fetch('/api/partner/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${partnerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadNotifications.map(n => n.id),
        }),
      });
      
      if (response.ok) {
        // 알림 목록 새로고침
        fetchNotifications();
      }
    } catch (error) {
      console.error('알림 일괄 읽음 처리 오류:', error);
    }
  };
  

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'review':
        return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'review':
        return 'bg-yellow-50 border-yellow-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-[24px] font-bold">알림</h2>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
          >
            <option value="all">전체</option>
            <option value="unread">읽지 않음</option>
          </select>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border-l-4 ${getNotificationColor(notif.type)} ${
                  !notif.isRead ? 'bg-blue-50/30' : ''
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[14px]">{notif.title}</h3>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                          읽음
                        </button>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-700 mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {new Date(notif.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </span>
                      {notif.link && (
                        <button
                          onClick={() => router.push(notif.link)}
                          className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                          보기 →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
