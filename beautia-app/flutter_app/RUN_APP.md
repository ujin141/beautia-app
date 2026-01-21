# Flutter 앱 실행 가이드

## 빠른 시작

### 1. 의존성 설치

```powershell
cd flutter_app
flutter pub get
```

### 2. Android 에뮬레이터에서 실행

```powershell
flutter run
```

### 3. 특정 디바이스 선택

```powershell
# 사용 가능한 디바이스 확인
flutter devices

# 특정 디바이스에서 실행
flutter run -d <device-id>
```

## 주요 명령어

### 앱 빌드

```powershell
# Debug APK 빌드
flutter build apk --debug

# Release APK 빌드
flutter build apk --release

# Android App Bundle (Play Store용)
flutter build appbundle --release
```

### 핫 리로드

앱 실행 중:
- `r` 키: 핫 리로드
- `R` 키: 핫 리스타트
- `q` 키: 종료

## 문제 해결

### 에뮬레이터가 보이지 않는 경우

```powershell
# Android Studio에서 에뮬레이터 실행
# 또는
flutter emulators
flutter emulators --launch <emulator-id>
```

### 패키지 오류

```powershell
flutter clean
flutter pub get
```

### 빌드 오류

```powershell
flutter doctor
flutter doctor -v
```

## API 설정

기본 API URL은 `lib/services/api_service.dart`에서 설정됩니다:

- Android 에뮬레이터: `http://10.0.2.2:3000`
- iOS 시뮬레이터: `http://localhost:3000`
- 실제 디바이스: 서버의 실제 IP 주소 (예: `http://192.168.1.100:3000`)

## 다음 단계

1. **Stripe 결제 통합** - `flutter_stripe` 패키지 추가
2. **이미지 업로드** - `image_picker` 패키지 추가
3. **소셜 로그인** - `google_sign_in` 패키지 추가
4. **푸시 알림** - `flutter_local_notifications` 패키지 추가
