# 구글 로그인 빠른 설정 가이드

## 단계별 설정

### 1단계: SHA-1 지문 확인
```powershell
# PowerShell에서 실행
cd flutter_app\android
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

출력에서 **SHA1:** 뒤의 값을 복사하세요 (예: `B7:51:D7:83:3F:BC:20:40:8F:9F:27:7E:02:84:86:F6:87:6C:C1:BE`)

### 2단계: Google Cloud Console 설정

1. **https://console.cloud.google.com/** 접속
2. 프로젝트 선택 또는 생성
3. **API 및 서비스** > **OAuth 동의 화면** 설정
   - 앱 이름: `Beautia`
   - 사용자 지원 이메일: 본인 이메일
   - 저장 후 계속
4. **API 및 서비스** > **사용자 인증 정보** 이동
5. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID**

#### Android 클라이언트 ID 생성:
- 애플리케이션 유형: `Android`
- 이름: `Beautia Android`
- 패키지 이름: `com.beautia.beautia_flutter`
- SHA-1 인증서 지문: 1단계에서 복사한 값 입력
- 만들기

#### Web 클라이언트 ID 생성:
- 애플리케이션 유형: `웹 애플리케이션`
- 이름: `Beautia Web Client`
- 만들기
- **클라이언트 ID 복사** (이 값이 `serverClientId`에 들어갑니다)

### 3단계: Flutter 앱 설정

`flutter_app/lib/services/social_auth_service.dart` 파일 수정:

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: '여기에_Web_클라이언트_ID_붙여넣기.apps.googleusercontent.com',
);
```

### 4단계: 테스트

```bash
cd flutter_app
flutter clean
flutter pub get
flutter run
```

## 현재 설정 확인

현재 `serverClientId`: `1026495033306-1pn1drjqds59pj51a1pf6gjc9h6fie5f.apps.googleusercontent.com`

이 값이 Google Cloud Console의 **Web 클라이언트 ID**와 일치하는지 확인하세요.

## 문제 해결

### 오류: ApiException: 10 (DEVELOPER_ERROR)
1. SHA-1 지문이 Google Cloud Console에 등록되었는지 확인
2. 패키지 이름이 `com.beautia.beautia_flutter`로 일치하는지 확인
3. Android 클라이언트 ID가 올바르게 생성되었는지 확인

### idToken이 null인 경우
1. `serverClientId`가 **Web 클라이언트 ID**인지 확인 (Android 클라이언트 ID 아님)
2. Google Cloud Console에서 Web 클라이언트 ID를 다시 생성하고 복사

### SHA-1 지문을 찾을 수 없는 경우
```powershell
# 다른 방법으로 SHA-1 확인
cd flutter_app
flutter build apk --debug
# 빌드 로그에서 SHA-1 확인
```

## 중요 사항

- ✅ **Web 클라이언트 ID**를 `serverClientId`에 사용
- ✅ **Android 클라이언트 ID**는 Google Cloud Console에만 등록 (앱 코드에서 사용 안 함)
- ✅ SHA-1 지문은 Debug와 Release 모두 등록 권장
- ❌ Firebase 설정 불필요 (MongoDB만 사용)
