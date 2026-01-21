# 구글 로그인 설정 가이드

이 가이드는 Flutter 앱에서 구글 로그인을 설정하는 방법을 설명합니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성/선택
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 선택 또는 새 프로젝트 생성

### 1.2 OAuth 동의 화면 구성
1. **API 및 서비스** > **OAuth 동의 화면** 이동
2. **외부** 선택 (개인 Google 계정 사용 시)
3. 필수 정보 입력:
   - 앱 이름: `Beautia`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. **저장 후 계속** 클릭
5. **범위** 단계에서 **저장 후 계속** 클릭
6. **테스트 사용자** 단계에서 테스트할 이메일 추가 (선택)
7. **대시보드로 돌아가기** 클릭

### 1.3 OAuth 클라이언트 ID 생성

#### Android 앱용 OAuth 클라이언트 ID
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. **애플리케이션 유형**: `Android` 선택
4. **이름**: `Beautia Android` (또는 원하는 이름)
5. **패키지 이름**: `com.beautia.beautia_flutter`
6. **SHA-1 인증서 지문** 입력 (아래 참조)
7. **만들기** 클릭
8. 생성된 **클라이언트 ID** 복사 (예: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

#### Web용 OAuth 클라이언트 ID (서버 인증용)
1. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
2. **애플리케이션 유형**: `웹 애플리케이션` 선택
3. **이름**: `Beautia Web Client` (또는 원하는 이름)
4. **승인된 리디렉션 URI**: (필요 시 추가)
5. **만들기** 클릭
6. 생성된 **클라이언트 ID** 복사 (예: `123456789-xyz.apps.googleusercontent.com`)

## 2. SHA-1 인증서 지문 가져오기

### 2.1 Debug 키스토어 SHA-1
```bash
# Windows (PowerShell)
cd flutter_app/android
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# 또는 직접 경로 지정
keytool -list -v -keystore "C:\Users\사용자명\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### 2.2 Release 키스토어 SHA-1 (배포용)
```bash
# Release 키스토어가 있는 경우
keytool -list -v -keystore "경로/keystore.jks" -alias 키별칭
```

**중요**: SHA-1 지문은 `:` 없이 공백으로 구분된 형태입니다 (예: `B7 51 D7 83 3F BC 20 40 8F 9F 27 7E 02 84 86 F6 87 6C C1 BE`)

## 3. Flutter 앱 설정

### 3.1 `social_auth_service.dart` 수정
`flutter_app/lib/services/social_auth_service.dart` 파일에서 `serverClientId`를 Web 클라이언트 ID로 설정:

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Web 클라이언트 ID
);
```

### 3.2 Android 설정 확인
`flutter_app/android/app/build.gradle` 파일이 올바르게 설정되어 있는지 확인:
- `applicationId = "com.beautia.beautia_flutter"` (Google Cloud Console의 패키지 이름과 일치)
- Firebase 관련 플러그인은 제거되어 있음 (MongoDB만 사용)

## 4. 테스트

### 4.1 앱 실행
```bash
cd flutter_app
flutter run
```

### 4.2 로그인 테스트
1. 앱에서 구글 로그인 버튼 클릭
2. Google 계정 선택
3. 로그인 성공 확인

### 4.3 오류 발생 시 확인 사항
- **ApiException: 10 (DEVELOPER_ERROR)**: 
  - SHA-1 지문이 Google Cloud Console에 올바르게 등록되었는지 확인
  - 패키지 이름이 일치하는지 확인
  - `serverClientId`가 Web 클라이언트 ID인지 확인

- **idToken이 null인 경우**:
  - `serverClientId`가 올바르게 설정되었는지 확인
  - Web 클라이언트 ID를 사용해야 함 (Android 클라이언트 ID 아님)

## 5. 현재 설정 확인

### 현재 설정된 값:
- **패키지 이름**: `com.beautia.beautia_flutter`
- **serverClientId**: `1026495033306-1pn1drjqds59pj51a1pf6gjc9h6fie5f.apps.googleusercontent.com`

### 확인해야 할 사항:
1. Google Cloud Console에서 위 패키지 이름으로 Android OAuth 클라이언트 ID가 생성되었는지
2. SHA-1 지문이 올바르게 등록되었는지
3. `serverClientId`가 Web 클라이언트 ID인지

## 6. 문제 해결

### SHA-1 지문 찾기
```bash
# Flutter에서 직접 확인
cd flutter_app
flutter build apk --debug
# 빌드 후 출력된 SHA-1 확인

# 또는 Gradle 명령어
cd android
./gradlew signingReport
```

### Google Cloud Console 확인
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. 생성된 OAuth 클라이언트 ID 확인
3. Android 클라이언트 ID의 패키지 이름과 SHA-1 확인
4. Web 클라이언트 ID 복사하여 `serverClientId`에 설정

## 참고 사항

- **Firebase는 사용하지 않습니다**: 이 프로젝트는 MongoDB만 사용하므로 Firebase 설정이 필요 없습니다.
- **serverClientId**: Android 클라이언트 ID가 아닌 **Web 클라이언트 ID**를 사용해야 `idToken`을 받을 수 있습니다.
- **SHA-1 지문**: Debug와 Release 키스토어의 SHA-1이 다르므로, 둘 다 Google Cloud Console에 등록해야 합니다.
