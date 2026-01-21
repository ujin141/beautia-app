// 캐싱 유틸리티 (메모리 기반)

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 기본 5분

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 만료된 경우 삭제
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 캐시에서 데이터 삭제
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 특정 패턴의 키 삭제
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 전체 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 크기 조회
   */
  size(): number {
    return this.cache.size;
  }
}

export const cache = new MemoryCache();

// 주기적으로 만료된 항목 정리 (1분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 60000);
}

/**
 * 캐시 래퍼 함수
 * 함수 실행 결과를 캐시하고, 캐시가 있으면 캐시된 값을 반환
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 캐시에서 조회
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 함수 실행
  const result = await fn();

  // 캐시에 저장
  cache.set(key, result, ttl);

  return result;
}

/**
 * 캐시 키 생성 헬퍼
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}
