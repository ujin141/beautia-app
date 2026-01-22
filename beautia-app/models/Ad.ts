import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  partnerId: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId;
  type: 'main_banner' | 'category_top' | 'search_powerlink' | 'local_push' | 
        'search_top' | 'trending_first' | 'todays_pick_top' | 'editors_pick' | 
        'popular_brands' | 'category_banner' | 'category_middle' | 
        'shop_detail_top' | 'menu_middle' | 'community_middle' | 'chat_top';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  cost: number; // 총 비용
  dailyCost?: number; // 일일 비용 (노출형 광고)
  costPerClick?: number; // 클릭당 비용 (검색 파워링크)
  costPerAction?: number; // 건당 비용 (지역 푸시)
  budget?: number; // 예산 (검색 파워링크)
  keywords?: string[]; // 검색 키워드 (검색 파워링크)
  category?: string; // 카테고리 (카테고리별 광고용)
  impressions: number; // 노출 수
  clicks: number; // 클릭 수
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'main_banner', 'category_top', 'search_powerlink', 'local_push',
        'search_top', 'trending_first', 'todays_pick_top', 'editors_pick',
        'popular_brands', 'category_banner', 'category_middle',
        'shop_detail_top', 'menu_middle', 'community_middle', 'chat_top'
      ],
      required: true,
    },
    category: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyCost: {
      type: Number,
      min: 0,
    },
    costPerClick: {
      type: Number,
      min: 0,
    },
    costPerAction: {
      type: Number,
      min: 0,
    },
    budget: {
      type: Number,
      min: 0,
    },
    keywords: [{
      type: String,
    }],
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
AdSchema.index({ partnerId: 1, status: 1 });
AdSchema.index({ shopId: 1, status: 1 });
AdSchema.index({ type: 1, status: 1 });
AdSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);
