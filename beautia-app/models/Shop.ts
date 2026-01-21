import mongoose, { Schema, Document } from 'mongoose';

export interface IShopMenu {
  id: string;
  name: string;
  nameTranslations?: {
    ko?: string;
    en?: string;
    ja?: string;
    th?: string;
    zh?: string;
  };
  price: number;
  time: number; // minutes
}

export interface IShop extends Document {
  partnerId: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  imageUrls?: string[];
  portfolioImages?: string[]; // 포트폴리오 사진들
  rating: number;
  reviewCount: number;
  menus: IShopMenu[];
  businessHours: {
    openTime: string; // HH:mm
    closeTime: string; // HH:mm
    holidays: string[]; // ['월', '화', ...]
  };
  city?: string;
  isRecommended?: boolean;
  latitude?: number; // 위도
  longitude?: number; // 경도
  createdAt: Date;
  updatedAt: Date;
}

const ShopMenuSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameTranslations: {
    ko: String,
    en: String,
    ja: String,
    th: String,
    zh: String,
  },
  price: { type: Number, required: true },
  time: { type: Number, required: true },
}, { _id: false });

const ShopSchema = new Schema<IShop>(
  {
    partnerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    description: { type: String },
    imageUrls: [String],
    portfolioImages: [String], // 포트폴리오 사진들
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    menus: [ShopMenuSchema],
    businessHours: {
      openTime: { type: String, default: '10:00' },
      closeTime: { type: String, default: '20:00' },
      holidays: [String],
    },
    city: { type: String },
    isRecommended: { type: Boolean, default: false },
    latitude: { type: Number }, // 위도
    longitude: { type: Number }, // 경도
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
ShopSchema.index({ partnerId: 1 });
ShopSchema.index({ category: 1 });
ShopSchema.index({ city: 1 });
ShopSchema.index({ isRecommended: 1 });
// 위치 기반 검색을 위한 2dsphere 인덱스 (좌표가 있을 때만)
ShopSchema.index({ location: '2dsphere' }, { sparse: true });

export default mongoose.models.Shop || 
  mongoose.model<IShop>('Shop', ShopSchema);
