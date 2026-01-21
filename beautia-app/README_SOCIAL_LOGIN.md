# 소셜 로그인 설정 가이드

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Kakao OAuth
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# LINE OAuth
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Apple OAuth
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret_jwt

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 각 소셜 로그인 설정 방법

### 1. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI에 추가:
   - `http://localhost:3000/api/auth/google` (개발)
   - `https://yourdomain.com/api/auth/google` (프로덕션)

### 2. Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 생성
3. "앱 설정" > "플랫폼"에서 Web 플랫폼 추가
4. "제품 설정" > "카카오 로그인" 활성화
5. "카카오 로그인" > "Redirect URI"에 추가:
   - `http://localhost:3000/api/auth/kakao` (개발)
   - `https://yourdomain.com/api/auth/kakao` (프로덕션)
6. REST API 키 복사하여 환경 변수에 설정

### 3. LINE OAuth 설정

1. [LINE Developers](https://developers.line.biz/) 접속
2. Provider 생성
3. Channel 생성 (LINE Login)
4. Channel ID와 Channel Secret 복사
5. Callback URL에 추가:
   - `http://localhost:3000/api/auth/line` (개발)
   - `https://yourdomain.com/api/auth/line` (프로덕션)

### 4. Facebook OAuth 설정

1. [Meta for Developers](https://developers.facebook.com/) 접속
2. 앱 생성
3. Facebook 로그인 제품 추가
4. 설정 > 기본 설정에서:
   - 앱 도메인 설정
   - 사이트 URL 설정
5. Facebook 로그인 > 설정에서 유효한 OAuth 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/facebook` (개발)
   - `https://yourdomain.com/api/auth/facebook` (프로덕션)
6. 앱 ID와 앱 시크릿 복사

### 5. Apple OAuth 설정

1. [Apple Developer](https://developer.apple.com/) 접속
2. Certificates, Identifiers & Profiles 이동
3. Identifiers에서 App ID 생성 (Sign in with Apple 활성화)
4. Services IDs 생성 및 Sign in with Apple 설정
5. Keys에서 Key 생성 (Sign in with Apple 활성화)
6. Client ID와 Client Secret (JWT 형식) 생성

## 작동 방식

1. 사용자가 소셜 로그인 버튼 클릭
2. `/api/auth/{provider}` 엔드포인트로 리다이렉트
3. 각 제공자의 OAuth 인증 페이지로 리다이렉트
4. 사용자 인증 후 콜백으로 돌아옴
5. 백엔드에서 토큰 교환 및 사용자 정보 가져오기
6. `/api/auth/social`로 사용자 정보 전달하여 로그인 처리
7. 세션 토큰 생성 후 쿠키에 저장
8. 홈 페이지로 리다이렉트
