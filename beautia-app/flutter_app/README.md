# BEAUTIA Flutter 앱

Flutter로 개발된 BEAUTIA 모바일 애플리케이션입니다. 백엔드 API와 완전히 연동되어 있으며, 브랜드 아이덴티티를 반영한 프리미엄 디자인 시스템이 적용되었습니다.

## 브랜드 아이덴티티

### 디자인 철학
**"BEAUTIA는 '깨끗한 프리미엄'이 기본이고, 감성은 '살짝'만 얹는다."**

### 컬러 시스템
- **Primary Gradient**: Soft Pink (#F9B4C9) → Mint (#B6E6D8) → Lilac (#B9B7F5)
- **Neutrals**: Background (#FFFFFF), Surface (#F7F7FB), Text Primary (#111114), Text Secondary (#6B6B76)
- **Status Colors**: Success (#17B26A), Warning (#F79009), Error (#F04438), Info (#2E90FA)

### 타이포그래피
- **폰트**: Manrope (Google Fonts)
- **스타일**: Display (28/32), H1 (22/28), H2 (18/24), Body (15/22), Caption (12/16)

### UI 컴포넌트
- **버튼**: 그라데이션 배경 + 흰 텍스트 (48-52px 높이)
- **카드**: 화이트 + 라인 (#EAEAEE) 또는 소프트 섀도우
- **배지**: 파스텔 톤 배경 + 진한 텍스트
- **라운드**: 기본 16px, 카드/모달 20-24px, 입력창 12-14px

## 주요 기능

- ✅ 사용자 인증 (로그인/회원가입) - 백엔드 API 연동
- ✅ 파트너/고객/어드민 구분 로그인
- ✅ 홈 화면 - 트렌딩 매장, 매거진 표시
- ✅ 매장 상세 화면 - 리뷰, 예약 기능
- ✅ 예약 관리 - 백엔드 API 연동
- ✅ 프로필 관리
- ✅ 다국어 지원 (한국어/영어)

## 백엔드 연동 기능

### 공개 API
- 트렌딩 매장 목록 조회 (`/api/public/trending-shops`)
- 개별 매장 정보 조회 (`/api/public/shop/[id]`)
- 매장별 리뷰 조회 (`/api/public/shop/[id]/reviews`)
- 매거진 목록 조회 (`/api/public/magazines`)
- 리뷰 티커용 리뷰 조회 (`/api/public/reviews`)
- 도시별 샵 정보 조회 (`/api/public/cities`)

### 사용자 API
- 고객 로그인/회원가입
- 예약 생성/조회
- 프로필 관리

## 실행 방법

### 1. 의존성 설치

```bash
cd flutter_app
flutter pub get
```

### 2. API URL 설정

기본 API URL은 `lib/services/api_service.dart`에서 설정됩니다:
- Android 에뮬레이터: `http://10.0.2.2:3000`
- iOS 시뮬레이터: `http://localhost:3000`
- 실제 디바이스: 서버의 실제 IP 주소 사용

### 2-1. Stripe 결제 설정 (백엔드)

백엔드 서버의 `.env.local` 파일에 Stripe 키를 설정해야 합니다:

```bash
# .env.local 파일 생성
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

**Stripe 키 확인 방법:**
1. https://dashboard.stripe.com/test/apikeys 에서 테스트 키 확인
2. `STRIPE_SECRET_KEY`: Secret key (sk_test_로 시작)
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key (pk_test_로 시작)

**참고:** Flutter 앱은 백엔드 API에서 자동으로 publishable key를 받아옵니다.

### 3. Android 에뮬레이터에서 실행

```bash
flutter run
```

### 4. 특정 디바이스에서 실행

```bash
flutter devices  # 사용 가능한 디바이스 확인
flutter run -d <device-id>
```

## 프로젝트 구조

```
lib/
├── main.dart                 # 앱 진입점
├── providers/                # 상태 관리
│   ├── auth_provider.dart
│   └── language_provider.dart
├── services/                 # API 및 서비스
│   ├── api_service.dart
│   └── auth_service.dart
├── screens/                  # 화면
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── booking/
│   │   └── booking_list_screen.dart
│   └── profile/
│       └── profile_screen.dart
├── routes/                   # 라우팅
│   └── app_router.dart
└── theme/                     # 테마
    └── app_theme.dart
```

## 프로젝트 구조

```
lib/
├── main.dart                 # 앱 진입점
├── providers/                # 상태 관리
│   ├── auth_provider.dart    # 인증 상태 관리
│   └── language_provider.dart # 언어 상태 관리
├── services/                 # API 및 서비스
│   ├── api_service.dart      # 백엔드 API 연동 (완전 연동 완료)
│   ├── auth_service.dart     # 인증 서비스
│   └── payment_service.dart  # 결제 서비스
├── screens/                  # 화면
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── home/
│   │   └── home_screen.dart  # 트렌딩 매장, 매거진 표시
│   ├── shop/
│   │   ├── shop_detail_screen.dart  # 매장 상세 + 리뷰
│   │   └── booking_bottom_sheet.dart # 예약 바텀시트
│   ├── booking/
│   │   └── booking_list_screen.dart  # 예약 목록
│   └── profile/
│       └── profile_screen.dart
├── models/                   # 데이터 모델
│   ├── shop.dart            # 매장 모델 (백엔드 형식 맞춤)
│   └── booking.dart         # 예약 모델
├── routes/                   # 라우팅
│   └── app_router.dart
└── theme/                     # 테마
    └── app_theme.dart
```

## 추가 패키지

- `cached_network_image` - 이미지 캐싱
- `intl` - 날짜/통화 포맷팅
- `pull_to_refresh` - Pull to refresh 기능
- `google_fonts` - Manrope 폰트 (브랜드 타이포그래피)

## 브랜드 디자인 컴포넌트

### BeautiaGradientButton
그라데이션 배경을 가진 프리미엄 버튼 컴포넌트
```dart
BeautiaGradientButton(
  text: '예약하기',
  gradient: BeautiaColors.primaryGradient,
  onPressed: () {},
)
```

### BeautiaCard
프리미엄 카드 컴포넌트 (라운드 코너, 라인/섀도우)
```dart
BeautiaCard(
  padding: EdgeInsets.all(20),
  onTap: () {},
  child: Text('내용'),
)
```

### BeautiaBadge
파스텔 톤 배지 컴포넌트
```dart
BeautiaBadge(
  text: '카테고리',
  backgroundColor: BeautiaColors.lilac.withOpacity(0.15),
  textColor: BeautiaColors.lilac,
)
```

## 브랜드 가이드라인 준수

모든 화면은 다음 브랜드 가이드라인을 준수합니다:
- ✅ 컬러 시스템 일관성 (Soft Pink, Mint, Lilac 그라데이션)
- ✅ Manrope 폰트 사용
- ✅ 미니멀하고 깨끗한 UI
- ✅ 프리미엄한 느낌의 라운드 코너 및 간격
- ✅ 짧고 부드러운 카피 (브랜드 보이스)
- ✅ 8pt 그리드 기반 레이아웃
