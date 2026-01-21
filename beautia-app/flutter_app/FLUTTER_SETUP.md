# Flutter 앱 설정 및 실행 가이드

## ✅ 완료된 작업

1. **Flutter 프로젝트 생성**
   - 프로젝트 위치: `flutter_app/`
   - 패키지명: `com.beautia.app`

2. **주요 기능 구현**
   - ✅ 인증 시스템 (로그인/회원가입)
   - ✅ API 서비스
   - ✅ 상태 관리 (Provider)
   - ✅ 네비게이션 (GoRouter)
   - ✅ 로컬 스토리지 (SharedPreferences)
   - ✅ 다국어 지원 준비

3. **화면 구현**
   - ✅ 로그인 화면
   - ✅ 회원가입 화면
   - ✅ 홈 화면
   - ✅ 예약 목록 화면
   - ✅ 프로필 화면

## 🚀 실행 방법

### Android 에뮬레이터에서 실행

```powershell
cd flutter_app
flutter run
```

또는 특정 디바이스 지정:

```powershell
flutter run -d emulator-5554
```

### 빌드

```powershell
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release
```

## 📱 현재 구현된 기능

### 인증
- 파트너/고객 구분 로그인
- 회원가입
- 로그아웃
- 토큰 관리

### 네비게이션
- 하단 탭 네비게이션
- 화면 간 이동
- 인증 상태에 따른 라우팅

### API 통신
- RESTful API 클라이언트
- 자동 토큰 추가
- 에러 처리

## 🔧 설정

### API Base URL

`lib/services/api_service.dart`에서 설정:

```dart
static const String baseUrl = 'http://10.0.2.2:3000'; // Android 에뮬레이터
// static const String baseUrl = 'http://localhost:3000'; // iOS 시뮬레이터
```

실제 디바이스에서는 서버의 실제 IP 주소를 사용하세요.

## 📦 주요 패키지

- `http` - HTTP 통신
- `provider` - 상태 관리
- `go_router` - 네비게이션
- `shared_preferences` - 로컬 스토리지

## 🔄 React Native와의 차이점

### 장점
- ✅ 단일 코드베이스로 iOS/Android 지원
- ✅ 더 나은 성능 (네이티브 컴파일)
- ✅ 풍부한 위젯 라이브러리
- ✅ 핫 리로드 지원

### 다음 단계
1. Stripe 결제 통합
2. 이미지 업로드
3. 소셜 로그인
4. 푸시 알림
5. 예약 상세 화면 구현

## 🐛 문제 해결

### 빌드 오류
```powershell
flutter clean
flutter pub get
flutter run
```

### 에뮬레이터 확인
```powershell
flutter devices
```

### 의존성 확인
```powershell
flutter doctor
```
