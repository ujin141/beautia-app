# 모의 데이터 생성 가이드

파트너 대시보드 테스트를 위한 모의 데이터를 생성하는 방법입니다.

## 사전 요구사항

1. MongoDB가 실행 중이어야 합니다.
2. `.env.local` 파일에 `MONGODB_URI`가 설정되어 있어야 합니다.

## 설치

먼저 필요한 패키지를 설치합니다:

```bash
npm install
```

## 실행

모의 데이터를 생성하려면 다음 명령을 실행하세요:

```bash
npm run seed
```

또는

```bash
npx tsx scripts/seed-partner-data.ts
```

## 생성되는 데이터

스크립트는 다음 데이터를 생성합니다:

- **파트너 계정**: 2개
  - `partner1@example.com` / `password123`
  - `partner2@example.com` / `password123`

- **고객 계정**: 4개
  - `customer1@example.com` / `password123`
  - `customer2@example.com` / `password123`
  - `customer3@example.com` / `password123`
  - `customer4@example.com` / `password123`

- **매장**: 3개
  - 차홍룸 (헤어살롱)
  - 뮤즈 클리닉 (스킨케어)
  - 긴자 하루카 (두피스파)

- **예약**: 7개
  - 대기 중 (pending): 2개
  - 확정 (confirmed): 1개
  - 완료 (completed): 4개

- **리뷰**: 3개
  - 완료된 예약에 대한 리뷰

## 주의사항

- 스크립트는 기존 데이터를 삭제하지 않습니다 (중복 방지를 위해 기존 데이터가 있으면 건너뜁니다).
- 모든 데이터를 초기화하려면 스크립트 내의 주석 처리된 삭제 코드를 활성화하세요.

## 테스트

생성된 데이터로 파트너 대시보드에 로그인하여 테스트할 수 있습니다:

1. 파트너 로그인 페이지: `/partner/login`
2. 이메일: `partner1@example.com`
3. 비밀번호: `password123`

로그인 후 대시보드에서 통계, 예약, 리뷰 등의 데이터를 확인할 수 있습니다.
