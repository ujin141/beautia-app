# APK 파일 이해하기

## ❌ APK 파일을 실행하려고 하셨나요?

APK 파일은 **실행 파일이 아닙니다**! PowerShell에서 직접 실행할 수 없습니다.

APK는 **Android 앱 설치 파일**입니다.

## ✅ 올바른 사용 방법

### 1. APK 생성 (빌드)

```bash
cd mobile
npx expo run:android
```

빌드가 완료되면 APK 파일이 생성됩니다:
```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. APK 설치

#### 방법 A: 자동 설치 스크립트 사용 (권장)
```powershell
cd mobile
.\install-apk.ps1
```

#### 방법 B: ADB로 수동 설치
```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
cd mobile
& $adbPath install android\app\build\outputs\apk\debug\app-debug.apk
```

### 3. 앱 실행

설치가 완료되면:
- 에뮬레이터/기기에서 BEAUTIA 앱 아이콘을 찾아 클릭
- 또는 ADB로 실행:
  ```powershell
  & $adbPath shell am start -n com.beautia.app/.MainActivity
  ```

## 🔍 빌드 상태 확인

빌드가 완료되었는지 확인:

```powershell
cd mobile
Test-Path "android\app\build\outputs\apk\debug\app-debug.apk"
```

`True`가 나오면 빌드 완료, `False`면 아직 빌드 중이거나 실패입니다.

## 📱 요약

1. **빌드**: `npx expo run:android` → APK 생성
2. **설치**: `.\install-apk.ps1` → 에뮬레이터/기기에 설치
3. **실행**: 에뮬레이터/기기에서 앱 아이콘 클릭

**APK 파일을 PowerShell에서 실행하지 마세요!** 설치 스크립트를 사용하세요.
