# APK 파일 설치 가이드

## 📱 APK 파일은 실행 파일이 아닙니다!

APK 파일은 **설치 파일**입니다. PowerShell에서 직접 실행할 수 없고, Android 기기나 에뮬레이터에 **설치**해야 합니다.

## 🔧 APK 설치 방법

### 방법 1: 에뮬레이터에 설치 (ADB 사용)

#### 1단계: 에뮬레이터 연결 확인
```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath devices
```

출력 예시:
```
List of devices attached
emulator-5554    device
```

#### 2단계: APK 파일 설치
```powershell
cd mobile
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath install android\app\build\outputs\apk\debug\app-debug.apk
```

#### 3단계: 앱 실행
설치 후 에뮬레이터에서 BEAUTIA 앱을 찾아 실행하세요.

### 방법 2: 실제 Android 기기에 설치

#### USB 디버깅 활성화
1. Android 기기에서 **설정 > 개발자 옵션**으로 이동
2. **USB 디버깅** 활성화
3. USB 케이블로 PC에 연결

#### 설치
```powershell
cd mobile
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath install android\app\build\outputs\apk\debug\app-debug.apk
```

### 방법 3: APK 파일 직접 전송

1. APK 파일을 Android 기기로 전송 (이메일, USB, 클라우드 등)
2. 기기에서 파일 관리자로 APK 파일 열기
3. "알 수 없는 소스에서 설치 허용" 체크 (필요시)
4. 설치 버튼 클릭

## 🚀 빠른 설치 스크립트

`mobile/install-apk.ps1` 스크립트를 실행하세요:

```powershell
cd mobile
.\install-apk.ps1
```

## ✅ 설치 확인

설치 후:
1. 에뮬레이터/기기 홈 화면에서 BEAUTIA 앱 아이콘 확인
2. 앱 실행 테스트
3. 정상 작동 확인

## ⚠️ 주의사항

1. **빌드 완료 확인**: APK 파일이 생성되었는지 확인하세요
2. **에뮬레이터 실행**: 에뮬레이터가 실행 중이어야 합니다
3. **USB 권한**: 실제 기기 사용 시 USB 디버깅 권한 필요

## 🎯 다음 단계

앱이 설치되면:
1. 앱 실행
2. 기능 테스트
3. 문제 발생 시 로그 확인 (`adb logcat`)
