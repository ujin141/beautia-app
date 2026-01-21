// 어드민 페이지에서 사용할 공통 fetch 헬퍼
// 모든 fetch 호출을 이 함수로 래핑하면 인증 헤더가 자동으로 추가됩니다.

import { getAdminToken, logoutAdmin } from './auth';

/**
 * 어드민 API 호출을 위한 fetch 래퍼
 * - 인증 토큰 자동 추가
 * - 401 응답 시 자동 로그아웃
 */
export async function adminFetchWrapper(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 Unauthorized 응답 시 자동 로그아웃
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      logoutAdmin();
    }
  }

  return response;
}

/**
 * 어드민 API JSON 응답 파싱 헬퍼
 */
export async function adminFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await adminFetchWrapper(url, options);
  
  if (response.status === 401) {
    throw new Error('인증이 만료되었습니다.');
  }
  
  const data = await response.json().catch(() => ({ error: '서버 응답을 파싱할 수 없습니다.' }));
  return data;
}
