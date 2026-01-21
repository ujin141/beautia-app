# APK 설치 가이드 (간단 버전)

## 🚀 빠른 설치 방법

### 방법 1: 직접 명령어 실행

PowerShell에서 다음 명령어를 실행하세요:

```powershell
cd mobile
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
& $adbPath install $apkPath
```

### 방법 2: 한 줄 명령어

```powershell
cd mobile; & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install android\app\build\outputs\apk\debug\app-debug.apk
```

## ✅ 설치 전 확인

### 1. 에뮬레이터/기기 연결 확인

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

출력 예시:
```
List of devices attached
emulator-5554    device
```

### 2. APK 파일 확인

```powershell
cd mobile
Test-Path "android\app\build\outputs\apk\debug\app-debug.apk"
```

`True`가 나오면 APK 파일이 있습니다.

## 📱 설치 후

설치가 완료되면:
1. 에뮬레이터/기기에서 BEAUTIA 앱 아이콘 찾기
2. 앱 실행
3. 테스트 시작!

## 🔄 앱 재설치

기존 앱을 제거하고 재설치하려면:

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath uninstall com.beautia.app
& $adbPath install mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

## ⚠️ 문제 해결

### "device not found" 오류
- 에뮬레이터가 실행 중인지 확인
- `adb devices`로 연결 확인

### "INSTALL_FAILED" 오류
- 기존 앱 제거 후 재설치
- `adb uninstall com.beautia.app` 실행
