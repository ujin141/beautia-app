'use client';

import { useEffect, useState, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
  actions?: NotificationAction[];
}

interface UseNotificationOptions {
  enabled?: boolean;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationClose?: (notification: Notification) => void;
}

/**
 * 브라우저 알림 권한 관리 및 알림 표시 React 훅
 */
export function useNotification(options: UseNotificationOptions = {}) {
  const {
    enabled = true,
    onPermissionGranted,
    onPermissionDenied,
    onNotificationClick,
    onNotificationClose,
  } = options;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('브라우저가 알림을 지원하지 않습니다.');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      onPermissionGranted?.();
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      onPermissionDenied?.();
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      
      if (result === 'granted') {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
      
      return result as NotificationPermission;
    } catch (error) {
      console.error('알림 권한 요청 오류:', error);
      setPermission('denied');
      onPermissionDenied?.();
      return 'denied';
    }
  }, [isSupported, onPermissionGranted, onPermissionDenied]);

  // 알림 표시
  const showNotification = useCallback((options: NotificationOptions): Notification | null => {
    if (!isSupported) {
      console.warn('브라우저가 알림을 지원하지 않습니다.');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn('알림 권한이 허용되지 않았습니다.');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
        // actions 속성은 ServiceWorker에서만 지원되는 경우가 많음
        // actions: options.actions, 
      } as any);

      // 알림 클릭 이벤트
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        onNotificationClick?.(notification);
        notification.close();
      };

      // 알림 닫기 이벤트
      notification.onclose = () => {
        onNotificationClose?.(notification);
      };

      // 자동으로 닫기 (5초 후)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('알림 표시 오류:', error);
      return null;
    }
  }, [isSupported, onNotificationClick, onNotificationClose]);

  // 알림 종료
  const closeNotification = useCallback((tag?: string) => {
    // 태그로 특정 알림만 닫기는 것은 브라우저 API에 없으므로,
    // 모든 알림을 닫거나 서비스 워커를 사용해야 함
    if ('serviceWorker' in navigator && 'getNotifications' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.getNotifications({ tag }).then((notifications) => {
          notifications.forEach((notification) => notification.close());
        });
      });
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    closeNotification,
    canNotify: isSupported && permission === 'granted',
  };
}
