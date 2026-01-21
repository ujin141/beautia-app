# MongoDB Atlas 연결 문자열 가져오기 가이드

## 단계별 안내

### 1단계: MongoDB Atlas 로그인

1. https://cloud.mongodb.com 접속
2. 로그인 (Google, GitHub 등으로 로그인 가능)

### 2단계: 프로젝트/클러스터 확인

1. 좌측 상단에서 **프로젝트 선택** (Organization/Project 드롭다운)
2. 원하는 프로젝트 선택

### 3단계: 데이터베이스 클러스터 접근

**방법 A: Database 메뉴 사용**
1. 좌측 사이드바에서 **"Database"** 클릭
2. 클러스터 목록이 표시됩니다
3. 클러스터를 클릭하거나 **"Connect"** 버튼 클릭

**방법 B: 클러스터 직접 클릭**
1. Dashboard에서 **"Browse Collections"** 또는 클러스터 이름 클릭
2. 클러스터 상세 페이지에서 **"Connect"** 버튼 클릭

### 4단계: 연결 방법 선택

**연결 방법 선택 창**이 나타나면:
1. **"Connect your application"** 옵션 선택 (두 번째 또는 세 번째 옵션)
   - ⚠️ "Connect with MongoDB Compass" (첫 번째) - 이것은 아닙니다
   - ✅ "Connect your application" (두 번째) - 이것입니다!
   - "Connect using VS Code" (세 번째) - 이것도 아닙니다

### 5단계: 연결 정보 확인

**"Connect your application"** 선택 후:
1. **Driver**: `Node.js` 선택
2. **Version**: `5.5 or later` 선택
3. 연결 문자열이 표시됩니다:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **"Copy"** 버튼 클릭하여 복사

### 6단계: 연결 문자열 수정

복사한 연결 문자열에서:
- `<username>` → 실제 사용자명으로 교체
- `<password>` → 실제 비밀번호로 교체
- 맨 끝에 데이터베이스 이름 추가: `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority` (그대로 두고)
- 또는 데이터베이스명을 지정: `/beautia?retryWrites=true&w=majority`

**최종 형식 예시:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/beautia?retryWrites=true&w=majority
```

## 클러스터가 없는 경우

### 새 클러스터 생성하기

1. **"Build a Database"** 또는 **"Create"** 버튼 클릭
2. **Free (M0)** 플랜 선택 (무료)
3. Cloud Provider 및 Region 선택 (가장 가까운 지역 선택)
4. 클러스터 이름 입력 (예: `Cluster0`)
5. **"Create Cluster"** 클릭
6. 생성 완료까지 3-5분 소요

## 데이터베이스 사용자 생성 (필수)

연결 문자열을 사용하려면 먼저 데이터베이스 사용자를 만들어야 합니다:

1. 좌측 사이드바에서 **"Database Access"** 클릭
2. **"Add New Database User"** 버튼 클릭
3. Authentication Method: **"Password"** 선택
4. 사용자 정보 입력:
   - **Username**: 원하는 사용자명 (예: `beautia-admin`)
   - **Password**: 강력한 비밀번호 (자동 생성 또는 직접 입력)
   - ⚠️ **비밀번호 복사/저장 필수!** (나중에 볼 수 없음)
5. User Privileges: **"Atlas admin"** 또는 **"Read and write to any database"** 선택
6. **"Add User"** 클릭

## 네트워크 접근 설정 (필수)

1. 좌측 사이드바에서 **"Network Access"** 클릭
2. **"Add IP Address"** 버튼 클릭
3. **"Allow Access from Anywhere"** 클릭 (또는 `0.0.0.0/0` 입력)
   - ⚠️ 개발/테스트용: 모든 IP 허용
   - 🔒 운영 환경: Vercel IP 범위만 허용 권장
4. **"Confirm"** 클릭

## 스크린샷 위치 참고

**MongoDB Atlas 메인 화면:**
- 좌측 사이드바: Database, Network Access, Database Access 등 메뉴
- 가운데: 클러스터 목록
- 각 클러스터 옆에 "Connect" 버튼 있음

**"Connect" 버튼 클릭 후:**
1. "Connect with MongoDB Compass" (첫 번째)
2. **"Connect your application" ← 여기!** (두 번째)
3. "Connect using VS Code" (세 번째)

## 문제 해결

### "Connect your application" 옵션이 보이지 않는 경우:
1. 클러스터가 완전히 생성되었는지 확인 (상태가 "Idle"이어야 함)
2. 다른 브라우저나 시크릿 모드에서 시도
3. 페이지 새로고침 (F5)

### 클러스터가 없는 경우:
- "Build a Database" 버튼을 클릭하여 새 클러스터 생성

## 도움이 필요한 경우

스크린샷을 보여주시면 더 정확히 안내해드릴 수 있습니다!
