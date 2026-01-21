// API 핸들러 래퍼 유틸리티
// 에러 처리와 응답 표준화를 위한 래퍼

import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse, successResponse } from './api-response';
import { logger } from './logger';
import connectDB from './mongodb';

export type ApiHandler<T = any> = (
  request: NextRequest,
  context?: any
) => Promise<T>;

/**
 * API 핸들러 래퍼
 * 에러 처리와 데이터베이스 연결을 자동으로 처리
 */
export function withApiHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;

    try {
      // API 요청 로깅
      logger.apiRequest(method, path, {
        query: Object.fromEntries(request.nextUrl.searchParams),
      });

      // 데이터베이스 연결 (필요한 경우)
      if (options?.requireDB !== false) {
        await connectDB();
      }

      // 핸들러 실행
      const result = await handler(request, context);

      // 결과가 이미 NextResponse인 경우 그대로 반환
      if (result instanceof NextResponse) {
        const duration = Date.now() - startTime;
        logger.apiResponse(method, path, result.status, { duration });
        return result;
      }

      // 그 외의 경우 성공 응답으로 래핑
      const response = successResponse(result);
      const duration = Date.now() - startTime;
      logger.apiResponse(method, path, 200, { duration });
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Handler Error', error, { method, path, duration });
      const response = serverErrorResponse(error);
      logger.apiResponse(method, path, response.status, { duration });
      return response;
    }
  };
}

/**
 * GET 핸들러 래퍼
 */
export function withGetHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return withApiHandler(handler, options);
}

/**
 * POST 핸들러 래퍼
 */
export function withPostHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return withApiHandler(handler, options);
}

/**
 * PUT 핸들러 래퍼
 */
export function withPutHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return withApiHandler(handler, options);
}

/**
 * DELETE 핸들러 래퍼
 */
export function withDeleteHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return withApiHandler(handler, options);
}

/**
 * PATCH 핸들러 래퍼
 */
export function withPatchHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireAuth?: boolean;
    requireDB?: boolean;
  }
) {
  return withApiHandler(handler, options);
}
