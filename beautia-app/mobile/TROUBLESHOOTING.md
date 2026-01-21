# 문제 해결 가이드

## Windows에서 발생하는 일반적인 오류

### 1. `ENOENT: no such file or directory, mkdir 'node:sea'` 오류

**원인**: Windows에서 파일/폴더 이름에 콜론(`:`)을 사용할 수 없는데, Expo가 `node:sea`라는 디렉토리를 만들려고 시도합니다.

**해결 방법**:

1. **캐시 삭제**
   ```powershell
   cd mobile
   Remove-Item -Recurse -Force .expo
   Remove-Item -Recurse -Force node_modules\.cache
   ```

2. **Metro 설정 수정**
   `metro.config.js` 파일이 생성되어 있습니다. 이 파일은 Windows 호환성을 위해 설정되었습니다.

3. **다시 시작**
   ```bash
   npm start
   ```

### 2. 포트 충돌

**해결 방법**:
```bash
npx expo start --port 8081
```

### 3. 에뮬레이터 연결 실패

**해결 방법**:
1. 에뮬레이터가 완전히 부팅되었는지 확인
2. ADB 연결 확인:
   ```powershell
   $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adbPath devices
   ```
3. 에뮬레이터 재시작:
   ```powershell
   .\start-android.ps1
   ```

### 4. API 연결 실패

**해결 방법**:
1. 백엔드 서버가 실행 중인지 확인 (`http://localhost:3000`)
2. `app.json`의 `apiBaseUrl` 확인:
   - Android 에뮬레이터: `http://10.0.2.2:3000`
   - 실제 기기: 컴퓨터의 IP 주소 사용

### 5. 의존성 설치 오류

**해결 방법**:
```bash
cd mobile
rm -rf node_modules
npm install
```

Windows PowerShell:
```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
npm install
```

## 빠른 재시작 가이드

문제가 발생하면 다음 순서로 시도하세요:

1. **캐시 정리**
   ```powershell
   cd mobile
   Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
   ```

2. **에뮬레이터 재시작** (필요한 경우)
   ```powershell
   .\start-android.ps1
   ```

3. **Expo 개발 서버 재시작**
   ```bash
   npm start
   ```

4. **앱 실행**
   - 터미널에서 `a` 키 누르기
   - 또는 `npm run android`
