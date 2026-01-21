// 어드민 API 호출 공통 헬퍼 함수
// 모든 어드민 API 호출에 인증 헤더를 추가하고 401 응답을 처리합니다.

import { getAdminToken, logoutAdmin } from './auth';

/**
 * 어드민 API 공통 fetch 함수
 * - 인증 토큰을 자동으로 헤더에 추가
 * - 401 응답 시 자동 로그아웃 처리
 */
export async function adminFetch(
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
      // localStorage 완전히 비우기
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // 로그아웃 처리
      logoutAdmin();
    }
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  return response;
}

/**
 * 어드민 API JSON 응답 파싱 헬퍼
 */
export async function adminFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await adminFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
    throw new Error(errorData.error || `요청 실패 (${response.status})`);
  }
  
  const data = await response.json();
  
  if (data.success === false) {
    throw new Error(data.error || '요청에 실패했습니다.');
  }
  
  return data.data || data;
}
