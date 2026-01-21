# 소셜 로그인 설정 가이드

## ✅ 완료된 작업

1. **expo-auth-session 설치**
   - `expo-auth-session`, `expo-web-browser` 패키지 추가

2. **소셜 로그인 서비스 구현**
   - `socialAuth.ts` - Google 로그인 훅 및 유틸리티
   - `social.ts` - 백엔드 소셜 로그인 API

3. **로그인 화면 업데이트**
   - Google 로그인 버튼 추가
   - 소셜 로그인 플로우 구현

4. **백엔드 API 구현**
   - `/api/auth/social` 엔드포인트 생성
   - Google 토큰 검증
   - 사용자 생성/업데이트

## 🔧 설정 필요 사항

### 1. Google OAuth 클라이언트 ID 설정

`mobile/app.json` 파일에서 Google Client ID를 설정하세요:

```json
{
  "extra": {
    "googleWebClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    "googleIosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

### 2. Google Cloud Console 설정

1. **프로젝트 생성**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 생성 또는 선택

2. **OAuth 동의 화면 설정**
   - APIs & Services > OAuth consent screen
   - 앱 정보 입력

3. **OAuth 클라이언트 ID 생성**
   - APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Web client ID 생성
   - iOS client ID 생성 (Bundle ID: `com.beautia.app`)
   - Android client ID 생성 (Package name: `com.beautia.app`, SHA-1 필요)

4. **리다이렉트 URI 설정**
   - Web client: `https://auth.expo.io/@your-username/beautia-mobile`
   - 또는: `beautia://auth`

### 3. Android SHA-1 확인

```bash
# Android 키스토어의 SHA-1 가져오기
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 4. app.json 설정

```json
{
  "expo": {
    "scheme": "beautia",
    "extra": {
      "googleWebClientId": "...",
      "googleIosClientId": "...",
      "googleAndroidClientId": "..."
    }
  }
}
```

## 📱 사용 방법

### 로그인 화면에서
1. "Google로 로그인" 버튼 클릭
2. Google 계정 선택
3. 권한 승인
4. 자동으로 로그인 완료

### 백엔드 연동
- 소셜 로그인 성공 시 백엔드 API로 토큰 전송
- 백엔드에서 사용자 생성/업데이트
- 앱 토큰 반환 및 저장

## 🧪 테스트

### 개발 환경
- Google 테스트 계정 사용
- OAuth 동의 화면을 "Testing" 모드로 설정

### 실제 기기 테스트
- 소셜 로그인은 실제 기기에서만 완전히 작동합니다
- 에뮬레이터/시뮬레이터에서도 테스트 가능하지만 제한적

## ⚠️ 주의사항

1. **리다이렉트 URI**
   - Google Cloud Console에 등록된 URI와 정확히 일치해야 합니다
   - 대소문자, 슬래시 등 모든 문자가 일치해야 합니다

2. **빌드 필요**
   - 네이티브 모듈 사용 시 `npx expo prebuild` 필요
   - 또는 EAS 빌드 사용

3. **프로덕션 준비**
   - OAuth 동의 화면 검토 승인 필요
   - 프로덕션 빌드에서 테스트

## 📚 참고 자료

- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth 설정](https://docs.expo.dev/guides/google-authentication/)
- [Google Cloud Console](https://console.cloud.google.com/)
