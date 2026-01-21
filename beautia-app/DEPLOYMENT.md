# 배포 가이드

## Git 원격 저장소 설정

1. GitHub에 새 저장소를 생성하세요.
2. 아래 명령어로 원격 저장소를 추가하세요:

```bash
git remote add origin https://github.com/YOUR_USERNAME/beautia-app.git
git branch -M main
git push -u origin main
```

## Vercel 배포

### 자동 배포 (권장)

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소를 연결
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. 환경 변수 설정 (필요시):
   - `MONGODB_URI`: MongoDB 연결 문자열
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe 공개 키
   - `STRIPE_SECRET_KEY`: Stripe 비밀 키
6. "Deploy" 클릭

### 수동 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```
MONGODB_URI=mongodb://localhost:27017/beautia
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

Vercel 대시보드에서도 환경 변수를 설정할 수 있습니다:
1. Project Settings → Environment Variables
2. Production, Preview, Development 각각 설정 가능
