// 레이트 리미팅 유틸리티

import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './api-response';

interface RateLimitOptions {
  windowMs: number; // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
  keyGenerator?: (request: NextRequest) => string; // 키 생성 함수
  message?: string; // 에러 메시지
}

// 간단한 메모리 기반 레이트 리미터
class MemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    // 레코드가 없거나 만료된 경우
    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    // 요청 수가 최대치를 초과한 경우
    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // 요청 수 증가
    record.count++;
    this.requests.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  // 만료된 레코드 정리
  cleanup() {
    const now = Date.now();
    for (const [key, record] of Array.from(this.requests.entries())) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const rateLimiter = new MemoryRateLimiter();

// 주기적으로 정리 작업 수행 (1분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60000);
}

/**
 * 레이트 리미팅 미들웨어
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 키 생성 (기본값: IP 주소)
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // 레이트 리미트 체크
    const result = rateLimiter.check(key, options.windowMs, options.maxRequests);

    // 헤더에 레이트 리미트 정보 추가
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', options.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // 요청이 차단된 경우
    if (!result.allowed) {
      const response = errorResponse(
        options.message || '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
      
      // 헤더 추가
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      return response;
    }

    // 핸들러 실행
    const response = await handler(request);
    
    // 응답 헤더에 레이트 리미트 정보 추가
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * IP 기반 레이트 리미터
 */
export function withIpRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15분
) {
  return withRateLimit(handler, {
    windowMs,
    maxRequests,
    keyGenerator: (request) => {
      return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    },
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  });
}

/**
 * 사용자 기반 레이트 리미터
 */
export function withUserRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxRequests: number = 200,
  windowMs: number = 15 * 60 * 1000 // 15분
) {
  return withRateLimit(handler, {
    windowMs,
    maxRequests,
    keyGenerator: (request) => {
      // Authorization 헤더에서 사용자 ID 추출
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // Bearer 토큰에서 사용자 정보 추출 (실제로는 토큰에서 사용자 ID를 파싱해야 함)
        return `user:${authHeader}`;
      }
      // 쿠키에서 사용자 정보 추출
      const token = request.cookies.get('partner_token') || request.cookies.get('admin_token');
      if (token) {
        return `user:${token.value}`;
      }
      // IP 주소로 폴백
      return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    },
    message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  });
}
