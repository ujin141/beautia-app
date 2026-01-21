// API 응답 표준화 유틸리티

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(process.env.NODE_ENV === 'development' && details && { details }),
    },
    { status }
  );
}

/**
 * 서버 에러 응답 생성
 */
export function serverErrorResponse(
  error: Error | unknown,
  customMessage?: string
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
  console.error('API Server Error:', error);
  
  return NextResponse.json(
    {
      success: false,
      error: customMessage || '서버 오류가 발생했습니다.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    },
    { status: 500 }
  );
}

/**
 * 인증 에러 응답 생성
 */
export function unauthorizedResponse(message: string = '인증이 필요합니다.'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

/**
 * 권한 없음 에러 응답 생성
 */
export function forbiddenResponse(message: string = '권한이 없습니다.'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

/**
 * 리소스 없음 에러 응답 생성
 */
export function notFoundResponse(message: string = '리소스를 찾을 수 없습니다.'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'NOT_FOUND',
    },
    { status: 404 }
  );
}

/**
 * 유효성 검사 에러 응답 생성
 */
export function validationErrorResponse(
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      ...(details && { details }),
    },
    { status: 400 }
  );
}
