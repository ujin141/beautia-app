# BEAUTIA 모바일 앱

## 기술 스택

- **React Native** - 크로스 플랫폼 모바일 앱 개발
- **TypeScript** - 타입 안정성
- **Expo** (선택사항) - 빠른 개발 및 배포

## 프로젝트 구조

```
mobile/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts     # API 클라이언트 설정
│   │   ├── auth.ts       # 인증 관련 API
│   │   ├── bookings.ts   # 예약 관련 API
│   │   └── ...
│   ├── components/       # 재사용 가능한 컴포넌트
│   ├── screens/          # 화면 컴포넌트
│   │   ├── auth/
│   │   ├── home/
│   │   ├── booking/
│   │   └── ...
│   ├── navigation/       # 네비게이션 설정
│   ├── contexts/         # Context API
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/            # 커스텀 훅
│   ├── utils/            # 유틸리티 함수
│   └── types/            # TypeScript 타입 정의
├── assets/               # 이미지, 폰트 등
└── app.json              # Expo 설정
```

## 설치 방법

### React Native CLI 사용

```bash
# React Native 프로젝트 생성
npx react-native init BeautiaApp --template react-native-template-typescript

# 또는 Expo 사용
npx create-expo-app BeautiaApp --template
```

### 의존성 설치

```bash
cd mobile
npm install

# 네비게이션
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 상태 관리
npm install @tanstack/react-query axios

# UI 라이브러리
npm install react-native-paper react-native-vector-icons

# 기타
npm install @react-native-async-storage/async-storage
```

## API 연동

백엔드 API와 연동하기 위한 클라이언트가 `src/api/` 디렉토리에 준비되어 있습니다.

### API Base URL 설정

`.env` 파일에 다음을 추가하세요:

```
API_BASE_URL=http://localhost:3000
# 또는 프로덕션
# API_BASE_URL=https://api.beautia.com
```

## 개발 시작

```bash
# iOS
npm run ios

# Android
npm run android

# Expo
npm start
```

## 주요 기능

- ✅ 로그인/회원가입
- ✅ 예약 시스템
- ✅ 프로필 관리
- ✅ 결제 시스템 (Stripe)
- ✅ 다국어 지원
- ✅ 푸시 알림
