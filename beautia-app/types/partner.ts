export interface User {
  id: string;
  name: string;
  email: string;
  role: 'partner' | 'admin';
  shopId?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  date: string; // ISO Date String
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  paymentStatus: 'paid' | 'unpaid';
  memo?: string;
}

export interface RevenueStats {
  period: string; // '2026-01-14' or '2026-01'
  amount: number;
  count: number;
}

export interface ShopInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  images: string[];
  description: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}
