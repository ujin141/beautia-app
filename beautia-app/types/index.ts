export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'partner' | 'admin';
  avatar?: string;
  joinDate: string;
  status: 'active' | 'banned' | 'withdrawal';
}

export interface Shop {
  id: string;
  partnerId: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  services: Service[];
  menus?: Service[]; // 호환성을 위해
}

export interface Service {
  id: string;
  shopId: string;
  name: string;
  price: number;
  duration: number; // minutes
  category: string;
  imageUrl?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  shopId: string;
  shopName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow' | 'cancellation_requested';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  aiRiskScore?: number; // 0-100
  aiRiskReason?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  shopId: string;
  shopName?: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reply?: string;
}

export interface Magazine {
  id: string;
  title: string;
  description: string; // Added description
  category: string;
  imageUrl: string;
  readTime: string;
  date: string;
  content?: string; // 상세 내용 (옵션)
}

export interface DashboardStats {
  totalSales: number;
  reservationCount: number;
  reviewCount: number;
  customerCount: number;
  highRiskCount?: number;
  salesGrowth: number; // percentage
  reservationGrowth: number;
}
