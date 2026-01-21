# Android 에뮬레이터 실행 가이드

## 빠른 실행

### 1. Android 에뮬레이터 시작

방법 1: 스크립트 사용 (권장)
```powershell
cd mobile
.\start-android.ps1
```

방법 2: 직접 실행
```powershell
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
& $emulatorPath -avd Pixel_5
```

방법 3: Android Studio 사용
1. Android Studio 실행
2. Tools > Device Manager 열기
3. 원하는 가상 기기 옆의 ▶️ 버튼 클릭

### 2. Expo 앱 실행

에뮬레이터가 부팅되면 (보통 1-2분 소요):

**방법 1: Expo 개발 서버에서 실행**
```
Expo 개발 서버 터미널에서 'a' 키 누르기
```

**방법 2: 명령어로 직접 실행**
```bash
cd mobile
npm run android
```

## 중요 사항

### API URL 설정

Android 에뮬레이터에서는 `localhost` 대신 `10.0.2.2`를 사용해야 합니다.

`mobile/app.json` 파일이 이미 설정되어 있습니다:
```json
{
  "extra": {
    "apiBaseUrl": "http://10.0.2.2:3000"
  }
}
```

이 설정은 백엔드 서버가 로컬호스트에서 실행 중일 때 에뮬레이터에서 접근할 수 있도록 합니다.

### 백엔드 서버 확인

백엔드 서버가 `http://localhost:3000`에서 실행 중이어야 합니다:
```bash
# 루트 디렉토리에서
npm run dev
```

## 문제 해결

### 에뮬레이터가 시작되지 않는 경우

1. **Android Studio 확인**
   - Android Studio가 설치되어 있는지 확인
   - SDK Manager에서 필요한 컴포넌트 설치 확인

2. **가상 기기 확인**
   ```powershell
   $emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
   & $emulatorPath -list-avds
   ```
   가상 기기가 없다면 Android Studio에서 생성하세요.

3. **하이퍼-V 확인** (Windows)
   - BIOS에서 가상화 기능 활성화 필요
   - Windows 기능에서 Hyper-V 활성화 확인

### 앱이 에뮬레이터에 설치되지 않는 경우

1. **에뮬레이터 부팅 확인**
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath devices
   ```
   `emulator-xxxxx` 항목이 표시되어야 합니다.

2. **Expo 개발 서버 재시작**
   ```bash
   cd mobile
   npm start
   ```
   그 다음 `a` 키 누르기

3. **포트 확인**
   - Expo가 사용하는 포트(기본 8081)가 방화벽에서 차단되지 않았는지 확인

### API 연결 실패

1. **백엔드 서버 실행 확인**
   - `http://localhost:3000`에서 서버가 실행 중인지 확인

2. **API URL 확인**
   - `mobile/app.json`의 `apiBaseUrl`이 `http://10.0.2.2:3000`로 설정되어 있는지 확인

3. **에뮬레이터 네트워크 확인**
   - 에뮬레이터가 인터넷에 연결되어 있는지 확인
   - 에뮬레이터 브라우저에서 `http://10.0.2.2:3000` 접근 테스트

## 개발 팁

- **빠른 재시작**: 에뮬레이터는 처음 시작만 느리고, 이후에는 빠릅니다
- **핫 리로드**: 코드를 저장하면 자동으로 앱이 리로드됩니다
- **개발자 메뉴**: `Ctrl+M` (Windows) 또는 `Cmd+M` (Mac)으로 열기
- **로그 확인**: 에뮬레이터에서 `Ctrl+M` > "Debug Remote JS" 선택
