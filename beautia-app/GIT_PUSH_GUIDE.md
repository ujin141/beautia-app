# Git 푸시 가이드

## 현재 상황
GitHub 서버에서 HTTP 500 에러가 발생하고 있습니다. 다음 방법들을 시도해보세요.

## 방법 1: 잠시 후 재시도
```bash
git push origin main
```

## 방법 2: SSH 사용 (권장)
1. GitHub에서 SSH 키를 설정하세요: https://github.com/settings/keys
2. 원격 저장소 URL을 SSH로 변경:
```bash
git remote set-url origin git@github.com:ujin141/beautia-app.git
git push origin main
```

## 방법 3: GitHub Desktop 사용
GitHub Desktop 앱을 사용하여 푸시할 수 있습니다.

## 방법 4: 작은 배치로 나눠서 푸시
```bash
# 먼저 작은 커밋만 푸시
git push origin main --dry-run

# 실제 푸시
git push origin main
```

## 현재 커밋 확인
로컬에 커밋된 내용:
```bash
git log --oneline -5
```

## 저장소 확인
GitHub 웹에서 저장소가 비어있는지 확인:
https://github.com/ujin141/beautia-app

만약 이미 파일이 있다면 푸시가 성공한 것입니다.
