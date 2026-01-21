# 모바일 앱 실행 가이드

## 실행 방법

### 1. Expo 개발 서버 시작

```bash
cd mobile
npm start
```

또는

```bash
npm run start
```

### 2. 앱 실행 옵션

Expo 개발 서버가 시작되면 다음 옵션이 표시됩니다:

- **`a`** - Android 에뮬레이터에서 실행
- **`i`** - iOS 시뮬레이터에서 실행 (macOS만)
- **`w`** - 웹 브라우저에서 실행
- **`r`** - 앱 리로드
- **`m`** - 개발자 메뉴 열기

### 3. 실제 기기에서 실행

1. **Expo Go 앱 설치**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **QR 코드 스캔**
   - 개발 서버가 시작되면 터미널에 QR 코드가 표시됩니다
   - Expo Go 앱으로 QR 코드를 스캔하세요

3. **같은 네트워크에 연결**
   - 컴퓨터와 모바일 기기가 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다
   - 또는 `--tunnel` 옵션 사용: `npm start -- --tunnel`

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트로 실행
npx expo start --port 8081
```

### Android 에뮬레이터가 실행되지 않는 경우

1. Android Studio에서 AVD Manager 열기
2. 가상 기기 생성 또는 시작
3. `npm run android` 실행

### API 연결 실패

- `app.json`의 `extra.apiBaseUrl` 확인
- 백엔드 서버가 실행 중인지 확인 (`npm run dev`)
- Android 에뮬레이터에서는 `localhost` 대신 `10.0.2.2` 사용 필요

## 개발 팁

- **핫 리로드**: 코드를 저장하면 자동으로 리로드됩니다
- **개발자 메뉴**: 기기에서 흔들거나 `Cmd+D` (iOS) / `Cmd+M` (Android) 누르기
- **로그 확인**: 터미널에서 로그 확인 또는 React Native Debugger 사용
