'use client';

import { useEffect, useState } from 'react';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';
import { shouldShowPermissionPrompt, markPermissionPromptDismissed } from '@/lib/utils/notification';

/**
 * 알림 권한 프롬프트 래퍼 컴포넌트
 * 레이아웃에서 사용
 */
export function NotificationPromptWrapper() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 조건에 따라 프롬프트 표시
    if (shouldShowPermissionPrompt()) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <NotificationPermissionPrompt
      onGranted={() => {
        console.log('알림 권한이 허용되었습니다.');
        setShowPrompt(false);
      }}
      onDenied={() => {
        console.log('알림 권한이 거부되었습니다.');
        setShowPrompt(false);
        markPermissionPromptDismissed();
      }}
      onDismiss={() => {
        setShowPrompt(false);
        markPermissionPromptDismissed();
      }}
    />
  );
}
