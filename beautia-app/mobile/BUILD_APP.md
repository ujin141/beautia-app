# 실제 앱 빌드 가이드

## 📱 Expo Go vs 실제 앱

### Expo Go (개발용)
- 개발 중 빠른 테스트용
- Expo Go 앱 설치 필요
- 네이티브 모듈 제한
- **실제 앱이 아님**

### 실제 앱 (네이티브 빌드)
- 독립 실행형 앱 (.apk/.aab/.ipa)
- 앱 스토어 배포 가능
- 모든 네이티브 기능 사용 가능
- **실제 앱**

## 🔨 실제 앱 빌드 방법

### 방법 1: 로컬 빌드 (권장 - 빠름)

#### Android APK 빌드
```bash
cd mobile

# 1. 네이티브 코드 생성
npx expo prebuild --clean

# 2. Android 앱 빌드
npx expo run:android --variant release

# 또는 Gradle 직접 사용
cd android
./gradlew assembleRelease
# APK 파일: android/app/build/outputs/apk/release/app-release.apk
```

#### Android AAB 빌드 (Google Play 배포용)
```bash
cd mobile/android
./gradlew bundleRelease
# AAB 파일: android/app/build/outputs/bundle/release/app-release.aab
```

### 방법 2: EAS Build (클라우드 빌드)

#### EAS CLI 설치
```bash
npm install -g eas-cli
```

#### EAS 로그인
```bash
eas login
```

#### 빌드 설정
```bash
cd mobile
eas build:configure
```

#### Android 빌드
```bash
# 개발 빌드
eas build --platform android --profile development

# 프로덕션 빌드
eas build --platform android --profile production
```

## 📋 빌드 전 필수 설정

### 1. app.json 확인
- 앱 이름, 버전, 번들 ID 확인
- 아이콘 및 스플래시 스크린 경로 확인

### 2. 서명 키 설정 (Android)

#### 개발용 키스토어 생성
```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore beautia-release.keystore -alias beautia-key -keyalg RSA -keysize 2048 -validity 10000
```

#### 키스토어 정보를 gradle.properties에 추가
`mobile/android/gradle.properties`:
```properties
BEAUTIA_UPLOAD_STORE_FILE=beautia-release.keystore
BEAUTIA_UPLOAD_KEY_ALIAS=beautia-key
BEAUTIA_UPLOAD_STORE_PASSWORD=your-password
BEAUTIA_UPLOAD_KEY_PASSWORD=your-password
```

### 3. 네이티브 모듈 확인
다음 모듈들이 네이티브 빌드 필요:
- `@stripe/stripe-react-native`
- `expo-image-picker`
- `expo-notifications`
- `expo-auth-session`

## 🚀 빠른 빌드 가이드

### 1단계: 네이티브 코드 생성
```bash
cd mobile
npx expo prebuild --clean
```

### 2단계: Android 앱 빌드
```bash
# 개발 빌드 (디버그 가능)
npx expo run:android

# 릴리스 빌드 (배포용)
npx expo run:android --variant release
```

### 3단계: APK 파일 찾기
빌드 완료 후:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

이 파일을 Android 기기에 설치할 수 있습니다.

## 📦 빌드 옵션

### 개발 빌드
- 디버깅 가능
- 개발 서버 연결 가능
- 빠른 빌드

### 프로덕션 빌드
- 최적화됨
- 작은 크기
- 배포 준비 완료

## ⚠️ 주의사항

1. **첫 빌드는 시간이 오래 걸립니다** (10-30분)
   - Gradle 의존성 다운로드
   - 네이티브 코드 컴파일

2. **Android Studio 필요**
   - Android SDK 및 빌드 도구 필요
   - 자동으로 설치되지만 시간 소요

3. **서명 키 보안**
   - 키스토어 파일과 비밀번호를 안전하게 보관
   - `.gitignore`에 추가

## 🎯 다음 단계

빌드가 완료되면:
1. APK 파일을 Android 기기에 전송
2. 설치 및 테스트
3. Google Play Console에 업로드 (배포 시)
