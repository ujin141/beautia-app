// 인증 관련 유틸리티 함수

// 파트너 사용자 정보 타입
export interface PartnerUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  shopName: string;
  category: string;
  address?: string;
  applicationId: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

// 고객 사용자 정보 타입
export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user';
  status: 'active' | 'banned' | 'withdrawal';
  joinDate: string;
  lastLoginAt?: string;
}

// 로컬 스토리지에서 파트너 토큰 가져오기
export function getPartnerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('partner_token');
}

// 로컬 스토리지에서 파트너 사용자 정보 가져오기
export function getPartnerUser(): PartnerUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('partner_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 로그인 상태 확인
export function isPartnerLoggedIn(): boolean {
  return !!getPartnerToken() && !!getPartnerUser();
}

// 로그아웃
export async function logoutPartner(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const token = getPartnerToken();
  
  // 서버에서 토큰 제거
  if (token) {
    try {
      await fetch('/api/partner/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }
  }
  
  // 클라이언트에서 토큰 제거
  localStorage.removeItem('partner_token');
  localStorage.removeItem('partner_user');
  sessionStorage.clear();
  
  window.location.href = '/partner/login';
}

// 인증 필요 페이지 보호 (클라이언트 사이드)
export function requireAuth(redirectTo: string = '/partner/login'): PartnerUser | null {
  const user = getPartnerUser();
  if (!user || !isPartnerLoggedIn()) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }
  return user;
}

// ==========================================
// 고객 인증 함수
// ==========================================

// 로컬 스토리지에서 고객 토큰 가져오기
export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customer_token');
}

// 로컬 스토리지에서 고객 사용자 정보 가져오기
export function getCustomerUser(): CustomerUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('customer_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 고객 로그인 상태 확인
export function isCustomerLoggedIn(): boolean {
  return !!getCustomerToken() && !!getCustomerUser();
}

// 고객 로그아웃
export function logoutCustomer(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
  window.location.href = '/';
}

// ==========================================
// 어드민 인증 함수
// ==========================================

// 로컬 스토리지에서 어드민 토큰 가져오기
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

// 로컬 스토리지에서 어드민 사용자 정보 가져오기
export function getAdminUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('admin_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 어드민 로그인 상태 확인
export function isAdminLoggedIn(): boolean {
  return !!getAdminToken() && !!getAdminUser();
}

// 어드민 로그아웃
export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  
  // 토큰 가져오기
  const token = localStorage.getItem('admin_token');
  
  // 서버에 토큰 제거 요청 (비동기지만 결과를 기다리지 않음)
  if (token) {
    fetch('/api/admin/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }).catch((error) => {
      console.error('로그아웃 API 오류:', error);
    });
  }
  
  // localStorage 완전히 비우기
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  
  // 세션 스토리지도 비우기 (있다면)
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_user');
  
  // 즉시 리다이렉트 (replace로 히스토리에서 제거)
  window.location.replace('/admin/login');
}

// 어드민 인증 필요 페이지 보호 (클라이언트 사이드)
export function requireAdminAuth(redirectTo: string = '/admin/login'): any | null {
  const user = getAdminUser();
  if (!user || !isAdminLoggedIn()) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }
  return user;
}
