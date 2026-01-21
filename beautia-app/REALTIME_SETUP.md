# 실시간 기능 구현 완료

## 구현된 기능

### 1. SSE (Server-Sent Events) 기반 실시간 스트림 API
- **엔드포인트**: `/api/realtime/stream`
- **지원 이벤트**:
  - `message`: 채팅 메시지 실시간 수신
  - `booking`: 예약 상태 실시간 업데이트
  - `notification`: 알림 실시간 표시
  - `connected`: 연결 확인
  - `error`: 오류 발생

### 2. React Hook (`useRealtime`)
- **위치**: `lib/hooks/useRealtime.ts`
- **기능**:
  - 자동 재연결 (지수 백오프)
  - 연결 상태 관리
  - 이벤트 핸들러 등록

## 사용 방법

### 채팅 화면에서 사용 예시

```typescript
import { useRealtime } from '@/lib/hooks/useRealtime';

function ChatPage() {
  const token = localStorage.getItem('partner_token') || '';
  const [messages, setMessages] = useState([]);

  useRealtime({
    token,
    enabled: true,
    onMessage: (data) => {
      // 새 메시지가 도착하면 상태 업데이트
      setMessages(prev => [...prev, data]);
    },
    onConnected: () => {
      console.log('실시간 연결 완료');
    },
    onError: (error) => {
      console.error('실시간 연결 오류:', error);
    },
  });

  // ... 나머지 코드
}
```

### 예약 화면에서 사용 예시

```typescript
import { useRealtime } from '@/lib/hooks/useRealtime';

function ReservationsPage() {
  const token = localStorage.getItem('partner_token') || '';
  const [reservations, setReservations] = useState([]);

  useRealtime({
    token,
    enabled: true,
    onBooking: (data) => {
      // 예약 상태가 변경되면 목록 업데이트
      setReservations(prev => prev.map(booking => 
        booking.id === data.bookingId 
          ? { ...booking, status: data.status, paymentStatus: data.paymentStatus }
          : booking
      ));
      
      // 새 예약 추가
      if (data.status === 'pending') {
        fetchReservations(); // 전체 목록 다시 불러오기
      }
    },
  });

  // ... 나머지 코드
}
```

### 알림 화면에서 사용 예시

```typescript
import { useRealtime } from '@/lib/hooks/useRealtime';

function NotificationsPage() {
  const token = localStorage.getItem('customer_token') || '';
  const [notifications, setNotifications] = useState([]);

  useRealtime({
    token,
    enabled: true,
    onNotification: (data) => {
      // 새 알림 추가
      setNotifications(prev => [data, ...prev]);
      
      // 브라우저 알림 표시 (선택사항)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
        });
      }
    },
  });

  // ... 나머지 코드
}
```

## MongoDB Change Streams

실시간 기능은 MongoDB Change Streams를 사용하여 데이터베이스 변경사항을 감지합니다:

- **채팅 메시지**: `chatmessages` 컬렉션 변경 감지
- **예약**: `bookings` 컬렉션 변경 감지
- **알림**: `notifications` 컬렉션 변경 감지

## 자동 재연결

- 최대 5회 재연결 시도
- 지수 백오프: 1초, 2초, 4초, 8초, 16초
- 연결이 끊어지면 자동으로 재연결 시도

## 주의사항

1. **토큰 필요**: 모든 실시간 연결에는 인증 토큰이 필요합니다
2. **연결 수 제한**: 동시에 여러 연결을 열 수 있지만, 필요시 연결을 정리해야 합니다
3. **리소스 사용**: MongoDB Change Streams는 서버 리소스를 사용하므로 적절히 관리해야 합니다

## 다음 단계

1. 채팅 화면에 실시간 기능 통합
2. 예약 화면에 실시간 기능 통합
3. 알림 화면에 실시간 기능 통합
4. 브라우저 알림 권한 요청 추가 (선택사항)
