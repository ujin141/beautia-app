# 테스트 가이드

## 테스트 구조

```
tests/
├── api/              # API 테스트
├── unit/             # 단위 테스트
└── integration/      # 통합 테스트
```

## 테스트 실행

### Jest 사용 (권장)

```bash
npm install --save-dev jest @types/jest ts-jest
npm test
```

### Vitest 사용

```bash
npm install --save-dev vitest @vitest/ui
npm run test
```

## 테스트 예시

### API 테스트

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Partner Stats API', () => {
  it('should return stats data', async () => {
    const response = await fetch('http://localhost:3000/api/partner/stats?partnerId=test');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### 단위 테스트

```typescript
import { validateRequestBody, required } from '@/lib/api-validator';

describe('API Validator', () => {
  it('should validate required fields', () => {
    const validation = validateRequestBody(
      { email: 'test@example.com' },
      [required('email', '이메일이 필요합니다.')]
    );
    expect(validation.valid).toBe(true);
  });
});
```

## 테스트 커버리지

```bash
npm run test:coverage
```

## CI/CD 통합

GitHub Actions 등에서 자동으로 테스트를 실행하도록 설정할 수 있습니다.
