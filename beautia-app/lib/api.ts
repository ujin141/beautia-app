import { User, Shop, Reservation, Review, Magazine, DashboardStats } from '../types';
import { getPartnerUser, getAdminToken, logoutAdmin } from './auth';

// ==========================================
// MOCK DATABASE
// ==========================================

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ji-min Kim', email: 'jimin@example.com', role: 'user', joinDate: '2025-10-10', status: 'active' },
  { id: 'u2', name: 'Sarah Lee', email: 'sarah@example.com', role: 'user', joinDate: '2025-11-05', status: 'active' },
  { id: 'u3', name: 'Mike Ross', email: 'mike@example.com', role: 'user', joinDate: '2025-12-01', status: 'banned' },
];

const MOCK_SHOPS: Shop[] = [
  {
    id: 's1',
    partnerId: 'p1',
    name: 'Chahong Room',
    category: 'Hair',
    address: 'Dosan-daero, Seoul',
    rating: 4.9,
    reviewCount: 1240,
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
    description: 'Personal Hippie Perm + Cut',
    services: [
      { id: 'sv1', shopId: 's1', name: 'Hippie Perm', price: 180000, duration: 120, category: 'Perm' },
    ]
  },
  {
    id: 's2',
    partnerId: 'p2',
    name: 'Ginza Haruka',
    category: 'Head Spa',
    address: 'Ginza, Tokyo',
    rating: 5.0,
    reviewCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1000&auto=format&fit=crop',
    description: 'Premium Scalp Detox Spa',
    services: [
      { id: 'sv2', shopId: 's2', name: 'Scalp Detox', price: 12000, duration: 60, category: 'Spa' },
    ]
  },
  {
    id: 's3',
    partnerId: 'p3',
    name: 'Oasis Spa',
    category: 'Massage',
    address: 'Sukhumvit, Bangkok',
    rating: 4.9,
    reviewCount: 850,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop',
    description: 'Aromatherapy Full Course',
    services: [
      { id: 'sv3', shopId: 's3', name: 'Aromatherapy', price: 2500, duration: 90, category: 'Massage' },
    ]
  },
  {
    id: 's4',
    partnerId: 'p1',
    name: 'Muse Clinic',
    category: 'Skin',
    address: 'Gangnam, Seoul',
    rating: 4.8,
    reviewCount: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1000&auto=format&fit=crop',
    description: 'Glass Skin Aqua Peel',
    services: [
      { id: 'sv4', shopId: 's4', name: 'Aqua Peel', price: 99000, duration: 40, category: 'Facial' },
    ]
  },
  {
    id: 's5',
    partnerId: 'p2',
    name: 'Nailography',
    category: 'Nail',
    address: 'Orchard, Singapore',
    rating: 4.9,
    reviewCount: 430,
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1000&auto=format&fit=crop',
    description: 'Luxury Gel Art Design',
    services: [
      { id: 'sv5', shopId: 's5', name: 'Gel Art', price: 120, duration: 60, category: 'Nail' },
    ]
  },
];

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Ji-min Kim',
    userPhone: '010-1234-5678',
    shopId: 's1',
    shopName: 'Chahong Room',
    serviceId: 'sv1',
    serviceName: 'Hippie Perm',
    date: '2026-01-20',
    time: '14:00',
    price: 180000,
    status: 'pending',
    paymentStatus: 'paid',
    aiRiskScore: 12,
    createdAt: '2026-01-14T09:00:00Z'
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Sarah Lee',
    userPhone: '010-9876-5432',
    shopId: 's4',
    shopName: 'Muse Clinic',
    serviceId: 'sv4',
    serviceName: 'Aqua Peel',
    date: '2026-01-21',
    time: '11:00',
    price: 99000,
    status: 'confirmed',
    paymentStatus: 'paid',
    aiRiskScore: 5,
    createdAt: '2026-01-13T15:30:00Z'
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'Mike Ross',
    userPhone: '010-1111-2222',
    shopId: 's2',
    shopName: 'Ginza Haruka',
    serviceId: 'sv2',
    serviceName: 'Scalp Detox',
    date: '2026-01-22',
    time: '16:00',
    price: 12000,
    status: 'pending',
    paymentStatus: 'unpaid',
    aiRiskScore: 85,
    aiRiskReason: 'Frequent cancellations history',
    createdAt: '2026-01-14T10:00:00Z'
  }
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rv1',
    shopId: 's1',
    userId: 'u1',
    userName: 'Ji-min Kim',
    rating: 5,
    content: 'Absolutely loved the perm! My hair looks so voluminous.',
    date: '2026-01-10',
    sentiment: 'positive',
    reply: 'Thank you for your lovely review, Ji-min!'
  },
  {
    id: 'rv2',
    shopId: 's1',
    userId: 'u2',
    userName: 'Sarah',
    rating: 4,
    content: 'Good service but a bit expensive.',
    date: '2026-01-12',
    sentiment: 'neutral'
  }
];

const MOCK_MAGAZINES: Magazine[] = [
  {
    id: 'm1',
    title: '2026 K-Beauty Trends: Glass Skin & Beyond',
    description: 'Discover the latest skincare routines that are taking over Seoul this season.',
    category: 'Trend Report',
    imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80',
    readTime: '5 min',
    date: '2026.01.10'
  },
  {
    id: 'm2',
    title: 'Top 5 Spas in Gangnam You Must Visit',
    description: 'From luxury hotels to hidden gems, here are the best places to relax.',
    category: 'Hot Place',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80',
    readTime: '3 min',
    date: '2026.01.08'
  },
  {
    id: 'm3',
    title: 'How to get idol eyelashes',
    description: 'Step-by-step guide to achieving that doll-like look perfectly.',
    category: 'Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80',
    readTime: '4 min',
    date: '2026.01.05'
  }
];

// ==========================================
// API SERVICE (Simulated)
// ==========================================

// 1. PUBLIC API (Landing Page)
export const PublicApi = {
  getTrendingShops: async (options?: { city?: string; category?: string; limit?: number }): Promise<Shop[]> => {
    try {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.category) params.append('category', options.category);
      params.append('limit', (options?.limit || 20).toString());
      
      const response = await fetch(`/api/public/trending-shops?${params}`);
      if (!response.ok) {
        throw new Error('트렌딩 샵 목록을 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '트렌딩 샵 목록을 불러오지 못했습니다.');
      }
      return data.data || [];
    } catch (error) {
      console.error('트렌딩 샵 조회 오류:', error);
      // 에러 발생 시 빈 배열 반환
      return [];
    }
  },
  
  getShop: async (shopId: string): Promise<Shop | null> => {
    try {
      const response = await fetch(`/api/public/shop/${shopId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('매장 정보를 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '매장 정보를 불러오지 못했습니다.');
      }
      return data.data || null;
    } catch (error) {
      console.error('매장 조회 오류:', error);
      return null;
    }
  },
  
  getShopReviews: async (shopId: string, options?: { limit?: number; offset?: number }): Promise<{ reviews: Review[]; total: number }> => {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      const response = await fetch(`/api/public/shop/${shopId}/reviews?${params}`);
      if (!response.ok) {
        throw new Error('리뷰 목록을 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '리뷰 목록을 불러오지 못했습니다.');
      }
      return {
        reviews: data.data || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
      return { reviews: [], total: 0 };
    }
  },
  getMagazines: async (limit?: number, lang?: string): Promise<Magazine[]> => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      else params.append('limit', '10');
      
      // 언어 파라미터 추가
      if (lang) {
        params.append('lang', lang);
      }
      
      const response = await fetch(`/api/public/magazines?${params}`);
      if (!response.ok) {
        throw new Error('매거진 목록을 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '매거진 목록을 불러오지 못했습니다.');
      }
      return data.data || [];
    } catch (error) {
      console.error('매거진 조회 오류:', error);
      // 에러 발생 시 빈 배열 반환
      return [];
    }
  },
  getReviews: async (limit?: number): Promise<Review[]> => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      else params.append('limit', '10');
      
      const response = await fetch(`/api/public/reviews?${params}`);
      if (!response.ok) {
        throw new Error('리뷰 목록을 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '리뷰 목록을 불러오지 못했습니다.');
      }
      return data.data || [];
    } catch (error) {
      console.error('리뷰 조회 오류:', error);
      // 에러 발생 시 빈 배열 반환
      return [];
    }
  },
  getCities: async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/public/cities');
      if (!response.ok) {
        throw new Error('도시별 샵 정보를 불러오지 못했습니다.');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '도시별 샵 정보를 불러오지 못했습니다.');
      }
      return data.data || [];
    } catch (error) {
      console.error('도시별 샵 조회 오류:', error);
      // 에러 발생 시 빈 배열 반환
      return [];
    }
  }
};

// 2. PARTNER API (Partner Dashboard)
export const PartnerApi = {
  // 스케줄 관리
  getSchedules: async (partnerId: string, options?: { startDate?: string; endDate?: string; staffName?: string }) => {
    const params = new URLSearchParams({ partnerId });
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.staffName) params.append('staffName', options.staffName);
    
    const response = await fetch(`/api/partner/schedule?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스케줄 조회에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  addSchedule: async (scheduleData: {
    partnerId: string;
    staffId?: string;
    staffName: string;
    date: string;
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
    notes?: string;
  }) => {
    const response = await fetch('/api/partner/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스케줄 추가에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  updateSchedule: async (scheduleData: {
    scheduleId: string;
    partnerId: string;
    staffName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    notes?: string;
  }) => {
    const response = await fetch('/api/partner/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스케줄 수정에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  deleteSchedule: async (scheduleId: string, partnerId: string) => {
    const params = new URLSearchParams({ scheduleId, partnerId });
    const response = await fetch(`/api/partner/schedule?${params}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '스케줄 삭제에 실패했습니다.');
    }
    const data = await response.json();
    return data;
  },

  // 직원 관리
  getStaffs: async (partnerId: string, includeInactive?: boolean) => {
    const params = new URLSearchParams({ partnerId });
    if (includeInactive) params.append('includeInactive', 'true');
    
    const response = await fetch(`/api/partner/staff?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '직원 목록 조회에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  addStaff: async (staffData: {
    partnerId: string;
    name: string;
    role?: string;
    specialty?: string;
    phone?: string;
    email?: string;
    profileImage?: string;
    color?: string;
  }) => {
    const response = await fetch('/api/partner/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '직원 추가에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  updateStaff: async (staffData: {
    staffId: string;
    partnerId: string;
    name?: string;
    role?: string;
    specialty?: string;
    phone?: string;
    email?: string;
    profileImage?: string;
    color?: string;
    isActive?: boolean;
  }) => {
    const response = await fetch(`/api/partner/staff/${staffData.staffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: staffData.name,
        role: staffData.role,
        specialty: staffData.specialty,
        phone: staffData.phone,
        email: staffData.email,
        profileImage: staffData.profileImage,
        color: staffData.color,
        isActive: staffData.isActive,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '직원 수정에 실패했습니다.');
    }
    const data = await response.json();
    return data.data;
  },

  deleteStaff: async (staffId: string, partnerId: string) => {
    const response = await fetch(`/api/partner/staff/${staffId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '직원 삭제에 실패했습니다.');
    }
    const data = await response.json();
    return data;
  },
  getStats: async (partnerId: string): Promise<DashboardStats> => {
    const response = await fetch(`/api/partner/stats?partnerId=${partnerId}`);
    if (!response.ok) {
      throw new Error('통계 데이터를 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '통계 데이터를 불러오지 못했습니다.');
    }
    return data.data;
  },
  getReservations: async (partnerId: string): Promise<Reservation[]> => {
    const response = await fetch(`/api/bookings?partnerId=${partnerId}`);
    if (!response.ok) {
      throw new Error('예약 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    // API가 success 필드 없이 직접 bookings 배열을 반환하는 경우 처리
    if (data.success === false) {
      throw new Error(data.error || '예약 목록을 불러오지 못했습니다.');
    }
    // 응답 형식: { bookings: [...], count: ... } 또는 { success: true, data: [...] }
    return data.bookings || data.data || [];
  },
  getReviews: async (partnerId: string): Promise<Review[]> => {
    const response = await fetch(`/api/partner/reviews?partnerId=${partnerId}`);
    if (!response.ok) {
      throw new Error('리뷰 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '리뷰 목록을 불러오지 못했습니다.');
    }
    return data.data;
  },
  // --- Mutations ---
  updateReservationStatus: async (id: string, status: Reservation['status']): Promise<void> => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '예약 상태 변경에 실패했습니다.');
    }
  },
  replyToReview: async (reviewId: string, content: string): Promise<void> => {
    const response = await fetch(`/api/partner/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: content }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '답글 작성에 실패했습니다.');
    }
  },
  updateShopSettings: async (settings: { menus?: any[], businessHours?: any }): Promise<void> => {
    // partnerId는 localStorage에서 가져오기
    const partnerUser = getPartnerUser();
    if (!partnerUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/partner/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId: partnerUser.id,
        ...settings,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '매장 설정 저장에 실패했습니다.');
    }
  },
  chargePoints: async (amount: number, currency?: string): Promise<{ sessionId: string; url: string }> => {
    const partnerUser = getPartnerUser();
    if (!partnerUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const response = await fetch('/api/partner/marketing/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency: currency || 'krw',
      }),
    });

    const responseText = await response.text();
    let data: any = {};
    
    try {
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error(`서버 응답을 처리할 수 없습니다. 상태: ${response.status}`);
    }

    if (!response.ok) {
      const errorMsg = data.error || data.message || `포인트 충전 실패 (상태: ${response.status})`;
      throw new Error(errorMsg);
    }

    if (data.success && data.data?.checkoutUrl) {
      return { sessionId: data.data.sessionId, url: data.data.checkoutUrl };
    }

    throw new Error('포인트 충전 세션 생성에 실패했습니다.');
  },

  // 마케팅 포인트 조회
  getMarketingPoints: async (): Promise<number> => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const response = await fetch('/api/partner/marketing/points', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '포인트 조회에 실패했습니다.');
    }

    const data = await response.json();
    console.log('포인트 조회 응답:', data); // 디버깅용
    
    if (!data.success) {
      throw new Error(data.error || '포인트 조회에 실패했습니다.');
    }

    // 응답 구조 확인: data.data.points 또는 data.points
    // withGetHandler가 successResponse를 다시 래핑할 수 있으므로 여러 구조 확인
    let points = 0;
    if (data.data?.points !== undefined) {
      points = data.data.points;
    } else if (data.data !== undefined && typeof data.data === 'number') {
      points = data.data;
    } else if (data.points !== undefined) {
      points = data.points;
    }
    
    console.log('파싱된 포인트:', points, '타입:', typeof points, '원본 데이터:', data); // 디버깅용
    
    // 숫자로 변환
    const numPoints = typeof points === 'number' ? points : parseInt(String(points || 0), 10);
    console.log('최종 포인트:', numPoints); // 디버깅용
    return isNaN(numPoints) ? 0 : numPoints;
  },

  // 광고 구매/활성화
  purchaseAd: async (adData: {
    adType: 'main_banner' | 'category_top' | 'search_powerlink' | 'local_push' | 
            'search_top' | 'trending_first' | 'todays_pick_top' | 'editors_pick' | 
            'popular_brands' | 'category_banner' | 'category_middle' | 
            'shop_detail_top' | 'menu_middle' | 'community_middle' | 'chat_top';
    duration?: number;
    budget?: number;
    keywords?: string[];
    category?: string;
  }): Promise<{ adId: string; remainingPoints: number; startDate: string; endDate: string }> => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const response = await fetch('/api/partner/marketing/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(adData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '광고 구매에 실패했습니다.');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '광고 구매에 실패했습니다.');
    }

    return data.data;
  },

  // 활성 광고 목록 조회
  getActiveAds: async (): Promise<any[]> => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const response = await fetch('/api/partner/marketing/ads', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '광고 목록 조회에 실패했습니다.');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '광고 목록 조회에 실패했습니다.');
    }

    return data.data.ads || [];
  },

  // 광고 리포트 조회
  getAdReport: async (options?: {
    adId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const params = new URLSearchParams();
    if (options?.adId) params.append('adId', options.adId);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response = await fetch(`/api/partner/marketing/ads/report?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '광고 리포트 조회에 실패했습니다.');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '광고 리포트 조회에 실패했습니다.');
    }

    return data.data;
  },

  // 광고 중지
  stopAd: async (adId: string): Promise<{ refundedPoints: number; remainingPoints: number }> => {
    const token = localStorage.getItem('partner_token');
    if (!token) {
      throw new Error('인증 토큰이 필요합니다.');
    }

    const response = await fetch(`/api/partner/marketing/ads/${adId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '광고 중지에 실패했습니다.');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '광고 중지에 실패했습니다.');
    }

    return data.data;
  },

  // 프로모션 관리
  getPromotions: async (partnerId: string, type?: string): Promise<any[]> => {
    const token = localStorage.getItem('partner_token');
    if (!token) throw new Error('인증 토큰이 필요합니다.');

    const params = new URLSearchParams({ partnerId });
    if (type) params.append('type', type);

    const response = await fetch(`/api/partner/promotions?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '프로모션 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.data || [];
  },

  deletePromotion: async (promotionId: string): Promise<void> => {
    const token = localStorage.getItem('partner_token');
    if (!token) throw new Error('인증 토큰이 필요합니다.');

    const response = await fetch(`/api/partner/promotions?id=${promotionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '프로모션 삭제에 실패했습니다.');
    }
  },

  // 마케팅 제안 (AI Suggestion)
  getMarketingSuggestions: async (partnerId: string): Promise<any[]> => {
    const token = localStorage.getItem('partner_token');
    if (!token) throw new Error('인증 토큰이 필요합니다.');

    const response = await fetch(`/api/partner/marketing/suggestions?partnerId=${partnerId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '마케팅 제안 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.data || [];
  },

  // 타겟 모수 추정
  getPushTargetEstimate: async (shopId: string, radius: number, criteria?: any): Promise<{ count: number; estimatedCost: number }> => {
    const token = localStorage.getItem('partner_token');
    if (!token) throw new Error('인증 토큰이 필요합니다.');

    const response = await fetch('/api/partner/marketing/push/estimate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ shopId, radius, criteria }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '타겟 추정에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 키워드 입찰가 조회
  getAdBidEstimate: async (keyword: string): Promise<{ topBid: number; recommendedBid: number }> => {
    const token = localStorage.getItem('partner_token');
    if (!token) throw new Error('인증 토큰이 필요합니다.');

    const response = await fetch(`/api/partner/marketing/ads/bid-estimate?keyword=${encodeURIComponent(keyword)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '입찰가 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },
};

// 어드민 API 공통 fetch 헬퍼 (인증 헤더 자동 추가 + 401 처리)
async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
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
      logoutAdmin();
    }
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  return response;
}

// 3. ADMIN API (Admin Dashboard)
export const AdminApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await adminFetch('/api/admin/stats');
    if (!response.ok) {
      throw new Error('통계 데이터를 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '통계 데이터를 불러오지 못했습니다.');
    }
    return data.data;
  },
  getAllReservations: async (): Promise<Reservation[]> => {
    const response = await adminFetch('/api/admin/bookings');
    if (!response.ok) {
      throw new Error('예약 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '예약 목록을 불러오지 못했습니다.');
    }
    return data.data;
  },
  getAllUsers: async (): Promise<User[]> => {
    const response = await adminFetch('/api/admin/users');
    if (!response.ok) {
      throw new Error('사용자 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '사용자 목록을 불러오지 못했습니다.');
    }
    return data.data;
  },
  getPromotions: async (type?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const response = await adminFetch(`/api/admin/promotions?${params}`);
    if (!response.ok) {
      throw new Error('프로모션 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '프로모션 목록을 불러오지 못했습니다.');
    }
    return data.data;
  },
  updatePromotionStatus: async (promotionId: string, isActive: boolean): Promise<void> => {
    const response = await adminFetch('/api/admin/promotions', {
      method: 'PATCH',
      body: JSON.stringify({ promotionId, isActive }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '프로모션 상태 변경에 실패했습니다.');
    }
  },
  deletePromotion: async (promotionId: string): Promise<void> => {
    const response = await adminFetch(`/api/admin/promotions?id=${promotionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '프로모션 삭제에 실패했습니다.');
    }
  }
};
