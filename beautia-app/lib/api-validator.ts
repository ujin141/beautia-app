// API 요청 유효성 검사 유틸리티

import { validationErrorResponse } from './api-response';

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
}

/**
 * 요청 본문 유효성 검사
 */
export function validateRequestBody(
  body: any,
  rules: ValidationRule[] | { [key: string]: ValidationRule[] }
): { valid: boolean; error?: string; details?: any } {
  const errors: { [key: string]: string } = {};

  // 배열 형태인 경우 (기존 방식)
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      const value = body[rule.field];
      if (!rule.validator(value)) {
        errors[rule.field] = rule.message;
      }
    }
  } else {
    // 객체 형태인 경우 (새로운 방식: 필드별로 여러 검증 규칙)
    for (const [field, fieldRules] of Object.entries(rules)) {
      for (const rule of fieldRules) {
        const value = body[field];
        if (!rule.validator(value)) {
          errors[field] = rule.message;
          break; // 첫 번째 실패한 규칙만 기록
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      error: '입력값이 올바르지 않습니다.',
      details: errors,
    };
  }

  return { valid: true };
}

/**
 * 필수 필드 검증
 */
export function required(field: string, message?: string): ValidationRule {
  return {
    field,
    validator: (value) => value !== undefined && value !== null && value !== '',
    message: message || `${field}는 필수입니다.`,
  };
}

/**
 * 이메일 형식 검증
 */
export function email(field: string, message?: string): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (!value) return true; // optional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: message || `${field}는 올바른 이메일 형식이어야 합니다.`,
  };
}

/**
 * 최소 길이 검증
 */
export function minLength(field: string, min: number, message?: string): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (!value) return true; // optional
      return typeof value === 'string' && value.length >= min;
    },
    message: message || `${field}는 최소 ${min}자 이상이어야 합니다.`,
  };
}

/**
 * 숫자 범위 검증
 */
export function numberRange(field: string, min: number, max: number, message?: string): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (value === undefined || value === null) return true; // optional
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message: message || `${field}는 ${min}과 ${max} 사이의 숫자여야 합니다.`,
  };
}

/**
 * 숫자 타입 검증
 */
export function number(field: string, options?: { min?: number; max?: number; message?: string }): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (value === undefined || value === null) return true; // optional
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num)) return false;
      if (options?.min !== undefined && num < options.min) return false;
      if (options?.max !== undefined && num > options.max) return false;
      return true;
    },
    message: options?.message || (options?.min !== undefined 
      ? `${field}는 ${options.min} 이상의 숫자여야 합니다.`
      : `${field}는 숫자여야 합니다.`),
  };
}

/**
 * 문자열 타입 검증
 */
export function string(field: string, options?: { enum?: string[]; message?: string }): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (value === undefined || value === null) return true; // optional
      if (typeof value !== 'string') return false;
      if (options?.enum && !options.enum.includes(value)) return false;
      return true;
    },
    message: options?.message || (options?.enum 
      ? `${field}는 ${options.enum.join(', ')} 중 하나여야 합니다.`
      : `${field}는 문자열이어야 합니다.`),
  };
}

/**
 * MongoDB ObjectId 검증
 */
export function objectId(field: string, message?: string): ValidationRule {
  return {
    field,
    validator: (value) => {
      if (!value) return true; // optional
      const ObjectId = require('mongodb').ObjectId;
      return ObjectId.isValid(value);
    },
    message: message || `${field}는 유효한 ID 형식이어야 합니다.`,
  };
}
