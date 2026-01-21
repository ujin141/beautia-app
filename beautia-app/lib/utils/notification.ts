/**
 * 알림 관련 유틸리티 함수
 */

/**
 * 브라우저 알림 지원 여부 확인
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * 현재 알림 권한 상태 확인
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('알림 권한 요청 오류:', error);
    return 'denied';
  }
}

/**
 * 알림 표시
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    console.warn('브라우저가 알림을 지원하지 않습니다.');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('알림 권한이 허용되지 않았습니다.');
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag,
      requireInteraction: options?.requireInteraction || false,
      data: options?.data,
    });

    // 클릭 시 창 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 자동으로 닫기 (5초 후, requireInteraction이 false인 경우)
    if (!options?.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  } catch (error) {
    console.error('알림 표시 오류:', error);
    return null;
  }
}

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

/**
 * localStorage에서 알림 권한 프롬프트 표시 여부 확인
 */
export function shouldShowPermissionPrompt(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // 이미 권한이 결정된 경우 표시하지 않음
  if (getNotificationPermission() !== 'default') {
    return false;
  }

  // 이전에 사용자가 닫은 경우 표시하지 않음
  const dismissed = localStorage.getItem('notification_prompt_dismissed');
  if (dismissed === 'true') {
    return false;
  }

  // 마지막으로 표시한 시간 확인 (24시간 내에는 다시 표시하지 않음)
  const lastShown = localStorage.getItem('notification_prompt_last_shown');
  if (lastShown) {
    const lastShownTime = parseInt(lastShown, 10);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - lastShownTime < oneDay) {
      return false;
    }
  }

  return true;
}

/**
 * 알림 권한 프롬프트 닫기 기록
 */
export function markPermissionPromptDismissed() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('notification_prompt_dismissed', 'true');
  localStorage.setItem('notification_prompt_last_shown', Date.now().toString());
}
