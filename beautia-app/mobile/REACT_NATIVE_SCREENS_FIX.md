# react-native-screens 타입 오류 해결

## ❌ 오류

```
Unknown prop type for "onAppear": "undefined"
Unknown prop type for "onAttached": "undefined"
```

## 🔍 원인

`react-native-screens@4.19.0` 버전이 React Native Codegen과 호환성 문제가 있습니다.

## ✅ 해결

`react-native-screens`를 Expo SDK 50과 호환되는 버전으로 다운그레이드:

```powershell
cd mobile
npm install react-native-screens@3.31.1
```

## 🔄 다음 단계

1. **캐시 정리**
   ```powershell
   Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
   ```

2. **Metro 서버 재시작**
   ```powershell
   $env:EXPO_NO_METRO_LAZY = "1"
   npx expo start --clear
   ```

3. **앱 재시작**
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath shell am force-stop com.beautia
   & $adbPath shell am start -n com.beautia/.MainActivity
   ```

## 📋 버전 정보

- **이전**: `react-native-screens@4.19.0` (호환성 문제)
- **현재**: `react-native-screens@3.31.1` (Expo SDK 50 호환)

## ⚠️ 주의사항

- Expo SDK 50과 호환되는 버전을 사용해야 합니다
- `npx expo install react-native-screens`를 사용하면 자동으로 호환 버전을 설치합니다
- 하지만 현재는 3.31.1 버전을 수동으로 설치했습니다
