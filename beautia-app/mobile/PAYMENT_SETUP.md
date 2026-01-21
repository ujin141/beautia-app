# Stripe 결제 시스템 설정 가이드

## ✅ 완료된 작업

1. **Stripe React Native SDK 설치**
   - `@stripe/stripe-react-native` 패키지 추가
   - Expo 플러그인 설정 (`app.json`)

2. **StripeProvider 설정**
   - `App.tsx`에 StripeProvider 추가
   - Publishable Key 설정

3. **결제 화면 구현**
   - `PaymentScreen.tsx` 생성
   - PaymentSheet 통합

4. **백엔드 API 추가**
   - `/api/stripe/create-payment-intent` 엔드포인트 생성
   - PaymentIntent 생성 로직 구현

## 🔧 설정 필요 사항

### 1. Stripe Publishable Key 설정

`mobile/app.json` 파일에서 Stripe Publishable Key를 설정하세요:

```json
{
  "extra": {
    "stripePublishableKey": "pk_test_YOUR_ACTUAL_KEY_HERE"
  }
}
```

또는 환경 변수 사용:
- `.env` 파일에 `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` 추가

### 2. Stripe Secret Key 설정 (백엔드)

백엔드 `.env` 파일에 Stripe Secret Key가 설정되어 있어야 합니다:
```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

### 3. Apple Pay 설정 (iOS)

`app.json`에 이미 Merchant Identifier가 설정되어 있습니다:
```json
{
  "plugins": [
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.com.beautia.app",
        "enableGooglePay": true
      }
    ]
  ]
}
```

**중요**: 실제 배포 시 Apple Developer Portal에서 Merchant ID를 등록해야 합니다.

## 📱 사용 방법

### 결제 화면으로 이동

```typescript
navigation.navigate('Payment', {
  bookingId: 'booking-id',
  amount: 10000,
  currency: 'KRW',
  shopName: '매장 이름',
});
```

### 예약 후 결제 플로우

1. 예약 생성 (`BookingCreateScreen`)
2. 예약 성공 후 결제 화면으로 이동
3. PaymentSheet로 결제 진행
4. 결제 완료 후 예약 목록으로 이동

## 🧪 테스트

### 개발 환경
- Stripe 테스트 키 사용 (`pk_test_...`)
- 테스트 카드 번호 사용:
  - 성공: `4242 4242 4242 4242`
  - 실패: `4000 0000 0000 0002`

### 결제 테스트
1. 앱 실행
2. 예약 생성
3. 결제 화면으로 이동
4. 테스트 카드로 결제 시도

## ⚠️ 주의사항

1. **Expo Go 제한**: Apple Pay와 Google Pay는 Expo Go에서 작동하지 않습니다. EAS 빌드 또는 로컬 빌드 필요

2. **빌드 필요**: Stripe 네이티브 기능 사용을 위해 다음 중 하나 필요:
   - `npx expo prebuild`
   - `eas build`
   - `expo run:android` / `expo run:ios`

3. **백엔드 연동**: PaymentIntent 생성은 백엔드에서만 수행해야 합니다 (보안)

## 📚 참고 자료

- [Stripe React Native 문서](https://stripe.dev/stripe-react-native/)
- [Expo Stripe 플러그인](https://docs.expo.dev/versions/v50.0.0/sdk/stripe/)
- [Stripe 테스트 카드](https://stripe.com/docs/testing)
