# 앱 실행 가이드

## 🚀 현재 실행 중

Expo 개발 서버가 백그라운드에서 시작되었습니다.

## 📱 앱 실행 방법

### 방법 1: 터미널에서 직접 실행 (권장)

Expo 개발 서버 터미널이 열리면:

1. **Android 에뮬레이터에서 실행**
   - 터미널에서 **`a`** 키 누르기
   - 또는 `npm run android` 실행

2. **실제 기기에서 실행**
   - Expo Go 앱 설치 (Android/iOS)
   - 터미널에 표시된 QR 코드 스캔

### 방법 2: 별도 터미널에서 실행

```bash
cd mobile
npm run android
```

## ✅ 실행 전 확인사항

### 1. 백엔드 서버 실행
백엔드 서버가 `http://localhost:3000`에서 실행 중이어야 합니다:

```bash
# 루트 디렉토리에서
npm run dev
```

### 2. Android 에뮬레이터 실행
에뮬레이터가 실행 중이어야 합니다:

```powershell
cd mobile
.\start-android.ps1
```

또는 Android Studio에서 직접 실행

## 🔍 문제 해결

### Expo 개발 서버가 시작되지 않는 경우

1. **캐시 정리 후 재시작**
   ```powershell
   cd mobile
   Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
   $env:EXPO_NO_METRO_LAZY = "1"
   npm start
   ```

2. **Node.js 버전 확인**
   - 권장: Node.js v20.x LTS
   - 현재 버전: `node --version`

### 앱이 에뮬레이터에 설치되지 않는 경우

1. **에뮬레이터 완전 부팅 확인**
   - Android 홈 화면이 표시되어야 합니다
   - 잠금 화면이 있으면 잠금 해제

2. **ADB 연결 확인**
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath devices
   ```
   `emulator-xxxxx device`가 표시되어야 합니다.

3. **에뮬레이터 재시작**
   ```powershell
   .\start-android.ps1
   ```

## 📝 참고

- **API URL**: Android 에뮬레이터에서는 `http://10.0.2.2:3000` 사용
- **핫 리로드**: 코드 저장 시 자동 리로드
- **개발자 메뉴**: `Ctrl+M` (Windows)로 열기

## 🎯 다음 단계

앱이 실행되면:
1. 로그인 화면 확인
2. 회원가입 또는 로그인 테스트
3. 주요 기능 테스트 (예약, 결제, 이미지 업로드 등)
