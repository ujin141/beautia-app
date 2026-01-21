'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNotification } from './useNotification';

export type RealtimeEventType = 'message' | 'booking' | 'notification' | 'connected' | 'error';

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: any;
}

interface UseRealtimeOptions {
  token: string;
  enabled?: boolean;
  onMessage?: (data: any) => void;
  onBooking?: (data: any) => void;
  onNotification?: (data: any) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
  showBrowserNotifications?: boolean; // 브라우저 알림 표시 여부
}

/**
 * 실시간 이벤트를 구독하는 React 훅 (SSE 사용)
 */
export function useRealtime(options: UseRealtimeOptions) {
  const {
    token,
    enabled = true,
    onMessage,
    onBooking,
    onNotification,
    onConnected,
    onError,
    showBrowserNotifications = false,
  } = options;

  const { showNotification, canNotify } = useNotification({
    enabled: showBrowserNotifications,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('최대 재연결 시도 횟수에 도달했습니다.');
      return;
    }

    setIsConnected(false);
    reconnectAttempts.current += 1;
    
    // 지수 백오프: 1초, 2초, 4초, 8초, 16초
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      // connect 함수를 직접 호출하기 위해 ref 사용
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      connectInternal();
    }, delay);
  }, []);

  const processStream = useCallback(async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onMessage?: (data: any) => void,
    onBooking?: (data: any) => void,
    onNotification?: (data: any) => void,
    onConnected?: () => void,
    onError?: (error: Error) => void
  ) => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = 'message';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.substring(6).trim();
          } else if (line === '' && eventData) {
            try {
              const data = JSON.parse(eventData);
              
              if (eventType === 'connected') {
                setIsConnected(true);
                reconnectAttempts.current = 0;
                onConnected?.();
              } else if (eventType === 'message') {
                onMessage?.(data);
                // 브라우저 알림 표시
                if (showBrowserNotifications && canNotify) {
                  showNotification({
                    title: '새 메시지',
                    body: `${data.senderName}: ${data.message}`,
                    icon: '/favicon.ico',
                    tag: `message-${data.id}`,
                    data: { type: 'message', id: data.id, roomId: data.roomId },
                  });
                }
              } else if (eventType === 'booking') {
                onBooking?.(data);
                // 브라우저 알림 표시
                if (showBrowserNotifications && canNotify) {
                  const statusMap: Record<string, string> = {
                    pending: '새 예약 요청',
                    confirmed: '예약이 확정되었습니다',
                    completed: '예약이 완료되었습니다',
                    cancelled: '예약이 취소되었습니다',
                    cancellation_requested: '예약 취소 요청',
                  };
                  const statusText = statusMap[data.status] || '예약 상태 변경';
                  
                  showNotification({
                    title: statusText,
                    body: `${data.shopName} - 예약 상태가 변경되었습니다`,
                    icon: '/favicon.ico',
                    tag: `booking-${data.bookingId}`,
                    data: { type: 'booking', id: data.bookingId },
                  });
                }
              } else if (eventType === 'notification') {
                onNotification?.(data);
                // 브라우저 알림 표시
                if (showBrowserNotifications && canNotify) {
                  showNotification({
                    title: data.title || '새 알림',
                    body: data.message,
                    icon: '/favicon.ico',
                    tag: `notification-${data.id}`,
                    data: { type: 'notification', id: data.id },
                  });
                }
              } else if (eventType === 'error') {
                const error = new Error(data.error || '알 수 없는 오류');
                setError(error);
                onError?.(error);
              }
            } catch (e) {
              console.error('이벤트 파싱 오류:', e, eventData);
            }
            
            eventData = '';
            eventType = 'message';
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        throw err;
      }
    }
  }, []);

  const connectInternal = useCallback(() => {
    if (!enabled || !token) {
      return;
    }

    // 기존 연결 종료
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      readerRef.current.cancel();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetch('/api/realtime/stream', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        readerRef.current = reader;

        processStream(reader, onMessage, onBooking, onNotification, onConnected, onError)
          .catch((err: any) => {
            if (err.name !== 'AbortError') {
              setError(err);
              onError?.(err);
              handleReconnect();
            }
          });
      })
      .catch((err: any) => {
        if (err.name !== 'AbortError') {
          setError(err);
          onError?.(err);
          handleReconnect();
        }
      });
  }, [token, enabled, onMessage, onBooking, onNotification, onConnected, onError, processStream, handleReconnect]);

  const connect = connectInternal;

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    if (enabled && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
}
