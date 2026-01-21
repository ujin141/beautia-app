# 앱 실행 상태 확인

## 현재 실행 중인 프로세스

### Android 에뮬레이터
- **상태**: 확인 중
- **명령어**: `adb devices`로 확인

### Expo 개발 서버
- **상태**: 확인 중
- **명령어**: `npm start` 또는 `npm run android`

## 앱 실행 방법

### 방법 1: 자동 실행 (권장)
```bash
cd mobile
npm run android
```

이 명령어는:
1. Expo 개발 서버를 시작합니다
2. Android 에뮬레이터를 감지합니다
3. 앱을 자동으로 빌드하고 설치합니다
4. 앱을 실행합니다

### 방법 2: 수동 실행
1. **Expo 개발 서버 시작**
   ```bash
   cd mobile
   npm start
   ```

2. **에뮬레이터에서 앱 실행**
   - Expo 개발 서버 터미널에서 `a` 키 누르기
   - 또는 에뮬레이터가 실행 중이면 자동으로 연결됩니다

## 문제 해결

### 에뮬레이터가 감지되지 않는 경우

1. **에뮬레이터 실행 확인**
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath devices
   ```
   `emulator-xxxxx device`가 표시되어야 합니다.

2. **에뮬레이터 재시작**
   ```powershell
   cd mobile
   .\start-android.ps1
   ```

### 앱이 설치되지 않는 경우

1. **에뮬레이터 완전 부팅 확인**
   - Android 홈 화면이 표시되어야 합니다
   - 잠금 화면이 있으면 잠금 해제

2. **Expo 개발 서버 재시작**
   ```bash
   cd mobile
   npm start
   ```
   그 다음 `a` 키 누르기

### 포트 충돌

다른 포트 사용:
```bash
npx expo start --port 8081 --android
```

## 성공 확인

앱이 정상적으로 실행되면:
- ✅ 에뮬레이터에 BEAUTIA 앱 아이콘 표시
- ✅ 앱이 자동으로 열림
- ✅ 로그인 화면 표시
- ✅ 에뮬레이터에서 앱 인터랙션 가능
