# Vercel 배포 가이드

## 방법 1: Vercel 웹 인터페이스 사용 (권장, 가장 간단)

1. **Vercel 계정 생성/로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 추가**
   - Dashboard에서 "Add New..." → "Project" 클릭
   - GitHub 저장소 선택: `ujin141/beautia-app`
   - 또는 "Import Git Repository"에서 URL 입력: `https://github.com/ujin141/beautia-app.git`

3. **프로젝트 설정**
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)

4. **환경 변수 설정** (필요시)
   - Environment Variables 섹션에서 추가:
     ```
     MONGODB_URI=your_mongodb_uri
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
     STRIPE_SECRET_KEY=your_stripe_secret
     ```
   - 또는 나중에 Project Settings에서 추가 가능

5. **배포**
   - "Deploy" 버튼 클릭
   - 배포 완료까지 약 2-3분 소요

## 방법 2: Vercel CLI 사용

### 1단계: 인증
브라우저에서 다음 URL을 열고 인증:
```
https://vercel.com/oauth/device?user_code=FQJR-ZVRV
```

또는 명령어 실행:
```bash
npx vercel login
```

### 2단계: 배포
```bash
npx vercel
```

프로덕션 배포:
```bash
npx vercel --prod
```

## 방법 3: GitHub 연동 자동 배포

1. Vercel에서 GitHub 저장소 연결
2. `main` 브랜치에 푸시할 때마다 자동 배포
3. Pull Request 생성 시 Preview 배포 자동 생성

## 환경 변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서:

- **Production, Preview, Development** 각각 설정 가능
- 주요 환경 변수:
  - `MONGODB_URI`: MongoDB 연결 문자열
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe 공개 키
  - `STRIPE_SECRET_KEY`: Stripe 비밀 키
  - `NEXT_PUBLIC_API_URL`: API URL (자동 설정됨)

## 배포 후 확인

배포 완료 후:
- Vercel이 자동으로 도메인 생성 (예: `beautia-app.vercel.app`)
- Custom Domain 설정 가능 (Project Settings → Domains)

## 문제 해결

### 빌드 에러 발생 시
1. Vercel Dashboard → Deployments → 해당 배포 클릭
2. "View Function Logs" 확인
3. 로컬에서 빌드 테스트: `npm run build`

### 환경 변수 누락
- Vercel Dashboard에서 환경 변수 확인
- 환경 변수 추가 후 재배포
