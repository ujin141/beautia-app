# MongoDB Compass에서 연결 문자열 확인하기

## MongoDB Compass란?

MongoDB Compass는 MongoDB 데이터베이스에 연결하는 GUI 도구입니다. 
중요한 것은 **어떤 MongoDB 서버에 연결하고 있는지**입니다.

## 연결 정보 확인 방법

### 방법 1: Compass에서 연결 문자열 확인

1. **MongoDB Compass 실행**
2. 상단의 **연결 문자열** 확인
   - 연결 화면에 표시된 연결 문자열 복사
   - 또는 이미 연결된 경우: 좌측 상단의 연결 이름 클릭 → 연결 정보 확인

### 방법 2: 연결 정보 확인

**MongoDB Compass에서:**
1. 좌측 상단의 **연결 이름** 클릭
2. 또는 **File → Connect** 메뉴
3. 연결 정보에서 확인:
   - **로컬 MongoDB**: `mongodb://localhost:27017`
   - **MongoDB Atlas**: `mongodb+srv://...`
   - **다른 클라우드**: `mongodb://...`

## 현재 연결 상태 확인

### 로컬 MongoDB인 경우
- 연결 문자열: `mongodb://localhost:27017/beautia`
- ⚠️ **문제**: Vercel 배포 시 접근 불가능
- ✅ **해결**: MongoDB Atlas로 마이그레이션 필요

### MongoDB Atlas인 경우
- 연결 문자열: `mongodb+srv://username:password@cluster.mongodb.net/...`
- ✅ **완벽**: Vercel 배포 시 바로 사용 가능
- 연결 문자열을 그대로 Vercel에 설정하면 됩니다

## 다음 단계

### 1단계: 연결 문자열 확인

MongoDB Compass에서:
1. 연결 화면 또는 연결 정보에서 연결 문자열 복사
2. 연결 문자열 형식 확인:
   - `mongodb://localhost:...` → 로컬 MongoDB
   - `mongodb+srv://...` → MongoDB Atlas (클라우드)

### 2단계: 연결 문자열 형식에 따라 처리

#### A. 로컬 MongoDB인 경우 (`mongodb://localhost:...`)
```
현재: mongodb://localhost:27017/beautia
```
**해결 방법:**
1. MongoDB Atlas 무료 계정 생성
2. 로컬 데이터를 MongoDB Atlas로 마이그레이션
3. MongoDB Atlas 연결 문자열 사용

#### B. MongoDB Atlas인 경우 (`mongodb+srv://...`)
```
현재: mongodb+srv://username:password@cluster.mongodb.net/beautia?...
```
**해결 방법:**
1. 연결 문자열을 그대로 복사
2. Vercel에 환경 변수로 설정
3. 완료!

## MongoDB Compass에서 연결 문자열 찾기

### 방법 1: 새 연결 만들기
1. MongoDB Compass 실행
2. **"New Connection"** 클릭
3. 연결 문자열 입력 필드에 표시된 형식 확인

### 방법 2: 기존 연결 확인
1. MongoDB Compass 실행
2. 좌측 상단의 **연결 이름** 클릭
3. 연결 정보에서 연결 문자열 확인

### 방법 3: 연결 정보 수정
1. **File → Preferences** 또는 연결 설정
2. 연결 정보에서 연결 문자열 확인

## 연결 문자열 예시

### 로컬 MongoDB
```
mongodb://localhost:27017/beautia
또는
mongodb://127.0.0.1:27017/beautia
```

### MongoDB Atlas
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/beautia?retryWrites=true&w=majority
```

## 현재 상황 파악

MongoDB Compass에서 연결 문자열을 확인한 후:

1. **로컬 MongoDB**인 경우:
   - MongoDB Atlas로 마이그레이션 필요
   - 마이그레이션 가이드 제공 가능

2. **MongoDB Atlas**인 경우:
   - 연결 문자열을 Vercel에 설정하면 완료
   - 바로 배포 가능

## 도움 요청

MongoDB Compass에서 확인한 연결 문자열을 알려주시면:
- 로컬인지 클라우드인지 판단
- 다음 단계 안내
- Vercel 설정 도와드림

**연결 문자열 형식만 알려주세요:**
- `mongodb://localhost:...` 또는
- `mongodb+srv://...` 또는
- 다른 형식
