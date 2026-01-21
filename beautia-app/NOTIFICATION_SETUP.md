# 브라우저 알림 설정 가이드

## 구현된 기능

### 1. 알림 권한 관리 Hook (`useNotification`)
- **위치**: `lib/hooks/useNotification.ts`
- **기능**:
  - 알림 권한 요청
  - 권한 상태 확인
  - 알림 표시
  - 브라우저 지원 여부 확인

### 2. 알림 권한 프롬프트 컴포넌트
- **위치**: `components/NotificationPermissionPrompt.tsx`
- **컴포넌트**:
  - `NotificationPermissionPrompt`: 알림 권한 요청 프롬프트
  - `NotificationStatus`: 알림 권한 상태 표시

### 3. 알림 유틸리티 함수
- **위치**: `lib/utils/notification.ts`
- **기능**:
  - 알림 권한 확인
  - 알림 표시
  - 프롬프트 표시 여부 관리

### 4. 실시간 기능과 통합
- `useRealtime` Hook에 `showBrowserNotifications` 옵션 추가
- 실시간 이벤트 수신 시 자동으로 브라우저 알림 표시

## 사용 방법

### 1. 알림 권한 프롬프트 표시 (레이아웃에 추가)

```tsx
// app/layout.tsx 또는 특정 페이지
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { shouldShowPermissionPrompt } from '@/lib/utils/notification';

export default function Layout({ children }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 조건에 따라 프롬프트 표시
    if (shouldShowPermissionPrompt()) {
      setShowPrompt(true);
    }
  }, []);

  return (
    <>
      {children}
      {showPrompt && (
        <NotificationPermissionPrompt
          onGranted={() => {
            console.log('알림 권한이 허용되었습니다.');
            setShowPrompt(false);
          }}
          onDenied={() => {
            console.log('알림 권한이 거부되었습니다.');
            setShowPrompt(false);
          }}
          onDismiss={() => {
            setShowPrompt(false);
          }}
        />
      )}
    </>
  );
}
```

### 2. 실시간 기능과 함께 사용

```tsx
import { useRealtime } from '@/lib/hooks/useRealtime';

function ChatPage() {
  const token = localStorage.getItem('partner_token') || '';
  const [messages, setMessages] = useState([]);

  useRealtime({
    token,
    enabled: true,
    showBrowserNotifications: true, // 브라우저 알림 활성화
    onMessage: (data) => {
      // 새 메시지 처리
      setMessages(prev => [...prev, data]);
      // 브라우저 알림은 자동으로 표시됨
    },
  });

  // ...
}
```

### 3. 수동으로 알림 표시

```tsx
import { useNotification } from '@/lib/hooks/useNotification';

function MyComponent() {
  const { showNotification, requestPermission, canNotify } = useNotification({
    onPermissionGranted: () => {
      console.log('알림 권한이 허용되었습니다.');
    },
  });

  const handleShowNotification = () => {
    if (canNotify) {
      showNotification({
        title: '알림 제목',
        body: '알림 내용',
        icon: '/favicon.ico',
        tag: 'unique-tag',
        data: { url: '/some-page' },
      });
    } else {
      // 권한 요청
      requestPermission();
    }
  };

  return (
    <button onClick={handleShowNotification}>
      알림 표시
    </button>
  );
}
```

### 4. 알림 상태 표시 (설정 페이지 등)

```tsx
import { NotificationStatus } from '@/components/NotificationPermissionPrompt';

function SettingsPage() {
  return (
    <div>
      <h2>알림 설정</h2>
      <NotificationStatus />
    </div>
  );
}
```

## 주요 기능

### 자동 알림 표시
- 실시간 이벤트 수신 시 자동으로 브라우저 알림 표시
- 메시지, 예약 상태 변경, 알림 등 모든 실시간 이벤트 지원

### 스마트 프롬프트 관리
- 사용자가 닫은 경우 24시간 동안 다시 표시하지 않음
- 이미 권한이 결정된 경우 표시하지 않음
- localStorage를 사용하여 상태 관리

### 알림 클릭 처리
- 알림 클릭 시 해당 페이지로 이동
- 창 포커스 처리
- 커스텀 데이터 전달 가능

## 브라우저 호환성

- ✅ Chrome (데스크톱/모바일)
- ✅ Firefox (데스크톱/모바일)
- ✅ Safari (데스크톱/모바일)
- ✅ Edge
- ❌ Internet Explorer (지원하지 않음)

## 알림 권한 상태

1. **default**: 아직 권한 요청하지 않음
2. **granted**: 권한 허용됨
3. **denied**: 권한 거부됨 (사용자가 수동으로 브라우저 설정에서 변경해야 함)

## 주의사항

1. **HTTPS 필수**: 프로덕션 환경에서는 HTTPS가 필요합니다
2. **사용자 경험**: 알림 권한 요청은 적절한 시점에 해야 합니다
3. **과도한 알림 방지**: 중요한 알림만 표시하도록 필터링 권장
4. **모바일 고려**: 모바일 브라우저에서는 알림 동작이 다를 수 있습니다

## 다음 단계

1. 레이아웃에 알림 권한 프롬프트 추가
2. 실시간 기능에서 브라우저 알림 활성화
3. 알림 클릭 시 적절한 페이지로 이동하는 로직 구현
4. 알림 설정 페이지 추가 (선택사항)
