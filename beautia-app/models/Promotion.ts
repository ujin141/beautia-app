import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  shopId?: mongoose.Types.ObjectId; // 선택적: undefined이면 전역 쿠폰 (어떤 샵에서도 사용 가능)
  title: string;
  description: string;
  type: 'discount' | 'flash_sale' | 'package' | 'coupon';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  targetServices?: mongoose.Types.ObjectId[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  code?: string; // 쿠폰 코드 (자동 생성 또는 사용자가 입력)
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: false, // 전역 쿠폰을 위해 선택적으로 변경
      index: { sparse: true }, // null/undefined 값 허용을 위한 sparse 인덱스
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['discount', 'flash_sale', 'package', 'coupon'],
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    targetServices: [{
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }],
    minPurchaseAmount: {
      type: Number,
    },
    maxDiscountAmount: {
      type: Number,
    },
    usageLimit: {
      type: Number,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    code: {
      type: String,
      index: true, // 쿠폰 코드로 검색
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가 (sparse 인덱스 사용하여 null 값 허용)
PromotionSchema.index({ shopId: 1, isActive: 1 }, { sparse: true });
PromotionSchema.index({ isActive: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ code: 1 }, { sparse: true }); // 쿠폰 코드로 빠른 검색

// Mongoose 모델이 이미 존재하면 삭제하고 다시 생성 (캐시 문제 해결)
if (mongoose.models.Promotion) {
  delete mongoose.models.Promotion;
}

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
