# 모바일 앱 빠른 시작 가이드

## 🚀 앱 실행하기

### 방법 1: 배치 파일 실행 (Windows)
```bash
# mobile 폴더에서 실행
.\run-app.bat
```

### 방법 2: PowerShell 스크립트 실행
```powershell
# mobile 폴더에서 실행
.\run-app.ps1
```

### 방법 3: 직접 실행
```bash
cd mobile
npm start
```

## 📋 실행 전 확인사항

### 1. 백엔드 서버 실행 확인
백엔드 서버가 실행 중이어야 합니다:

```bash
# 루트 디렉토리에서
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행되어야 합니다.

### 2. 의존성 설치 확인
```bash
cd mobile
npm install
```

## 📱 앱 실행 옵션

Expo 개발 서버가 시작되면 다음 옵션이 표시됩니다:

- **`a`** - Android 에뮬레이터에서 실행
- **`i`** - iOS 시뮬레이터에서 실행 (macOS만)
- **`w`** - 웹 브라우저에서 실행
- **`r`** - 앱 리로드
- **`m`** - 개발자 메뉴 열기

## 📲 실제 기기에서 실행

### 1. Expo Go 앱 설치
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. QR 코드 스캔
1. Expo 개발 서버가 시작되면 터미널에 QR 코드가 표시됩니다
2. Expo Go 앱을 열고 QR 코드를 스캔하세요
3. 앱이 로드됩니다

### 3. 네트워크 설정
- 컴퓨터와 모바일 기기가 **같은 Wi-Fi 네트워크**에 연결되어 있어야 합니다
- 또는 터널 모드 사용: `npm start -- --tunnel`

## 🔧 문제 해결

### 포트 충돌
```bash
# 다른 포트 사용
npx expo start --port 8081
```

### Android 에뮬레이터 실행
1. Android Studio 실행
2. AVD Manager 열기
3. 가상 기기 시작
4. `a` 키 누르기 또는 `npm run android`

### API 연결 실패
- 백엔드 서버가 실행 중인지 확인
- Android 에뮬레이터 사용 시 `app.json`의 `apiBaseUrl`을 `http://10.0.2.2:3000`로 변경
- 실제 기기 사용 시 컴퓨터의 IP 주소 사용

### Android 에뮬레이터용 API URL 변경
`mobile/app.json` 파일 수정:
```json
{
  "extra": {
    "apiBaseUrl": "http://10.0.2.2:3000"
  }
}
```

## 💡 개발 팁

- **핫 리로드**: 코드 저장 시 자동 리로드
- **개발자 메뉴**: 
  - Android: `Cmd+M` 또는 기기 흔들기
  - iOS: `Cmd+D` 또는 기기 흔들기
- **로그 확인**: 터미널에서 실시간 로그 확인

## 🎯 다음 단계

앱이 실행되면:
1. 로그인 화면이 표시됩니다
2. 회원가입 또는 로그인 가능
3. 예약, 매장 조회, 프로필 관리 기능 사용 가능
