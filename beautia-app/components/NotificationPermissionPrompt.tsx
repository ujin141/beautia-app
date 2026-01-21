'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCircle2, XCircle } from 'lucide-react';
import { useNotification } from '@/lib/hooks/useNotification';

interface NotificationPermissionPromptProps {
  onGranted?: () => void;
  onDenied?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * 알림 권한 요청 프롬프트 컴포넌트
 */
export function NotificationPermissionPrompt({
  onGranted,
  onDenied,
  onDismiss,
  className = '',
}: NotificationPermissionPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { requestPermission, permission, isSupported } = useNotification({
    onPermissionGranted: onGranted,
    onPermissionDenied: onDenied,
  });

  // 브라우저가 알림을 지원하지 않거나 권한이 이미 결정된 경우 표시하지 않음
  if (!isSupported || permission !== 'default' || isDismissed) {
    return null;
  }

  const handleRequest = async () => {
    setIsRequesting(true);
    const result = await requestPermission();
    setIsRequesting(false);
    
    if (result === 'denied') {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            알림을 받으시겠습니까?
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            새 메시지, 예약 상태 변경, 중요한 업데이트를 실시간으로 알려드립니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRequest}
              disabled={isRequesting}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRequesting ? '요청 중...' : '알림 허용'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * 알림 권한 상태 표시 컴포넌트
 */
export function NotificationStatus({ className = '' }: { className?: string }) {
  const { permission, requestPermission, isSupported } = useNotification();

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
        <XCircle className="w-4 h-4" />
        <span>알림을 지원하지 않는 브라우저입니다</span>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-600 ${className}`}>
        <CheckCircle2 className="w-4 h-4" />
        <span>알림이 활성화되어 있습니다</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 text-xs text-red-600 ${className}`}>
        <XCircle className="w-4 h-4" />
        <span>알림이 차단되었습니다</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      className={`flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 ${className}`}
    >
      <Bell className="w-4 h-4" />
      <span>알림 권한 요청</span>
    </button>
  );
}
