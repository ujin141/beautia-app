# 배포용 MongoDB Atlas 설정 가이드

## 전체 과정 요약

1. MongoDB Atlas 무료 계정 생성
2. 클러스터 생성
3. 데이터베이스 사용자 생성
4. 네트워크 접근 설정 (Vercel 접근 허용)
5. 연결 문자열 확인
6. Vercel에 환경 변수 설정
7. (선택) 로컬 데이터 마이그레이션

## 1단계: MongoDB Atlas 계정 생성

1. https://cloud.mongodb.com 접속
2. **"Try Free"** 또는 **"Sign Up"** 클릭
3. Google, GitHub, 또는 이메일로 가입
4. 무료 계정으로 시작 (Free Tier)

## 2단계: 클러스터 생성

### 2-1. 초기 설정
1. Organization/Project 설정
   - Organization 이름 입력 (예: `beautia`)
   - Project 이름 입력 (예: `beautia-app`)

### 2-2. 클러스터 생성
1. **"Build a Database"** 또는 **"Create"** 클릭
2. **"Free (M0)"** 플랜 선택 (완전 무료)
3. Cloud Provider 선택: AWS, Google Cloud, Azure 중 선택
4. Region 선택: 가장 가까운 지역 (예: `Seoul (ap-northeast-2)`)
5. Cluster Name: `Cluster0` (기본값) 또는 원하는 이름
6. **"Create Cluster"** 클릭
7. ⏳ 3-5분 정도 생성 대기

## 3단계: 데이터베이스 사용자 생성

1. 좌측 사이드바에서 **"Database Access"** 클릭
2. **"Add New Database User"** 버튼 클릭
3. Authentication Method: **"Password"** 선택
4. 사용자 정보 입력:
   - **Username**: `beautia-admin` (또는 원하는 이름)
   - **Password**: 
     - **"Autogenerate Secure Password"** 클릭 (권장)
     - 또는 직접 입력 (강력한 비밀번호)
   - ⚠️ **비밀번호를 반드시 복사/저장!** (나중에 볼 수 없음)
5. User Privileges: **"Atlas admin"** 선택
6. **"Add User"** 클릭

## 4단계: 네트워크 접근 설정 (필수!)

Vercel 서버가 MongoDB Atlas에 접근할 수 있도록 설정:

1. 좌측 사이드바에서 **"Network Access"** 클릭
2. **"Add IP Address"** 버튼 클릭
3. **"Allow Access from Anywhere"** 클릭
   - 또는 IP 주소 입력: `0.0.0.0/0`
   - ⚠️ 개발/테스트용: 모든 IP 허용
   - 🔒 운영 환경: 나중에 Vercel IP만 허용하도록 변경 가능
4. **"Confirm"** 클릭

## 5단계: 연결 문자열 확인

### 5-1. Connect 버튼 클릭
1. 좌측 사이드바에서 **"Database"** 클릭
2. 클러스터 목록에서 클러스터 옆의 **"Connect"** 버튼 클릭

### 5-2. 연결 방법 선택
1. **"Connect your application"** 선택 (두 번째 옵션)

### 5-3. 연결 문자열 복사
1. Driver: **"Node.js"** 선택
2. Version: **"5.5 or later"** 선택
3. 연결 문자열 표시:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **"Copy"** 버튼 클릭하여 복사

### 5-4. 연결 문자열 수정
복사한 연결 문자열에서:
- `<username>` → 3단계에서 만든 사용자명으로 교체
- `<password>` → 3단계에서 저장한 비밀번호로 교체
- `/` 뒤에 데이터베이스 이름 추가: `/beautia`

**최종 형식 예시:**
```
mongodb+srv://beautia-admin:yourpassword@cluster0.xxxxx.mongodb.net/beautia?retryWrites=true&w=majority
```

## 6단계: Vercel에 환경 변수 설정

### 방법 1: Vercel CLI로 설정 (터미널)

```bash
# Production 환경에 추가
vercel env add MONGODB_URI production

# 연결 문자열 입력 (위에서 만든 최종 연결 문자열)
# mongodb+srv://beautia-admin:password@cluster0.xxxxx.mongodb.net/beautia?retryWrites=true&w=majority

# Preview 환경에도 추가 (선택)
vercel env add MONGODB_URI preview

# Development 환경에도 추가 (선택)
vercel env add MONGODB_URI development
```

### 방법 2: Vercel 대시보드에서 설정

1. https://vercel.com 접속
2. 프로젝트 선택 (`beautia-app`)
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭
5. **Add New** 버튼 클릭
6. 다음 정보 입력:
   - **Key**: `MONGODB_URI`
   - **Value**: 연결 문자열 (위에서 만든 최종 연결 문자열)
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development (모두 선택)
7. **Save** 클릭

### 추가 환경 변수 설정

```bash
NEXT_PUBLIC_BASE_URL=https://beautia.io
NEXT_PUBLIC_API_URL=https://beautia.io
```

## 7단계: 재배포

환경 변수를 설정한 후:

1. Vercel 대시보드에서 **Deployments** 클릭
2. 가장 최근 배포에서 **"Redeploy"** 클릭
3. 또는 Git에 푸시하면 자동 배포

## 8단계: 연결 확인

배포 후:
1. https://beautia.io 접속
2. Vercel 대시보드 → Deployments → Functions Logs 확인
3. **"MongoDB connected successfully"** 메시지 확인
4. 어드민 대시보드 로그인 테스트: https://beautia.io/admin

## (선택) 로컬 데이터 마이그레이션

로컬 MongoDB에 데이터가 있다면:

### 방법 1: MongoDB Compass 사용
1. 로컬 MongoDB Compass에서 데이터베이스 내보내기 (Export)
2. MongoDB Atlas Compass로 연결
3. 데이터 가져오기 (Import)

### 방법 2: mongodump/mongorestore 사용
```bash
# 로컬 데이터 백업
mongodump --uri="mongodb://localhost:27017/beautia" --out=./backup

# MongoDB Atlas로 복원
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/beautia" ./backup/beautia
```

## 문제 해결

### 연결 오류 발생 시
1. MongoDB Atlas Network Access 확인 (`0.0.0.0/0` 추가했는지)
2. 사용자 이름/비밀번호 확인
3. 연결 문자열 형식 확인
4. Vercel Functions Logs 확인

### 권한 오류 발생 시
1. Database Access에서 사용자 권한 확인 (Atlas admin인지)
2. 사용자 재생성

## 완료!

이제 Vercel 배포 환경에서 MongoDB Atlas를 사용할 수 있습니다!
