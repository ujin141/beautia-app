# Vercel MongoDB 환경 변수 설정 가이드

## 방법 1: Vercel 대시보드에서 설정 (권장)

1. https://vercel.com 접속
2. 프로젝트 선택 (`beautia-app`)
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭
5. **Add New** 버튼 클릭
6. 다음 정보 입력:
   - **Key**: `MONGODB_URI`
   - **Value**: MongoDB 연결 문자열
   - **Environment**: Production, Preview, Development 모두 선택
7. **Save** 클릭
8. 재배포 필요 (자동 또는 수동)

## 방법 2: Vercel CLI로 설정

```bash
# Production 환경에 추가
vercel env add MONGODB_URI production

# Preview 환경에 추가
vercel env add MONGODB_URI preview

# Development 환경에 추가
vercel env add MONGODB_URI development
```

## MongoDB 연결 문자열 형식

### MongoDB Atlas (클라우드)
```
mongodb+srv://username:password@cluster.mongodb.net/beautia?retryWrites=true&w=majority
```

### 로컬 MongoDB
```
mongodb://localhost:27017/beautia
```

### 커스텀 MongoDB
```
mongodb://username:password@host:port/database
```

## 필요한 다른 환경 변수들

추가로 설정해야 할 환경 변수:

```bash
# MongoDB 연결
MONGODB_URI=mongodb+srv://...

# 도메인/API URL
NEXT_PUBLIC_BASE_URL=https://beautia.io
NEXT_PUBLIC_API_URL=https://beautia.io

# Stripe (결제)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 어드민 비밀번호 솔트
ADMIN_PASSWORD_SALT=your-salt-value

# NODE_ENV
NODE_ENV=production
```

## MongoDB Atlas 네트워크 접근 설정

MongoDB Atlas를 사용하는 경우:

1. https://cloud.mongodb.com 접속
2. 프로젝트 선택
3. **Network Access** 클릭
4. **Add IP Address** 클릭
5. Vercel 서버 접근을 위해:
   - `0.0.0.0/0` (모든 IP 허용 - 개발/테스트용)
   - 또는 Vercel IP 범위 추가 (운영 환경 권장)
6. **Confirm** 클릭

## 환경 변수 설정 후

1. **재배포 필요**: Vercel 대시보드에서 Deployments → Redeploy
2. **연결 확인**: 
   - Functions Logs에서 "MongoDB connected successfully" 확인
   - https://beautia.io 접속 테스트

## 문제 해결

### 연결 오류 발생 시
- MongoDB Atlas Network Access 확인
- 연결 문자열 형식 확인
- 사용자 이름/비밀번호 확인
- Vercel Functions Logs 확인
