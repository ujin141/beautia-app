import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerCoupon extends Document {
  userId: string; // CustomerUser ID
  promotionId: mongoose.Types.ObjectId; // Promotion ID
  code: string; // 쿠폰 코드
  title: string; // 쿠폰 제목
  description: string; // 쿠폰 설명
  discountType: 'percentage' | 'fixed'; // 할인 타입
  discountValue: number; // 할인 금액/비율
  minPurchaseAmount?: number; // 최소 구매 금액
  maxDiscountAmount?: number; // 최대 할인 금액
  shopId?: mongoose.Types.ObjectId; // 특정 매장용 쿠폰
  shopName?: string; // 매장 이름
  isUsed: boolean; // 사용 여부
  usedAt?: Date; // 사용 일시
  bookingId?: string; // 사용한 예약 ID
  issuedAt: Date; // 발급일
  expiresAt: Date; // 만료일
  createdAt: Date;
  updatedAt: Date;
}

const CustomerCouponSchema = new Schema<ICustomerCoupon>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    minPurchaseAmount: {
      type: Number,
    },
    maxDiscountAmount: {
      type: Number,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    shopName: {
      type: String,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
    },
    bookingId: {
      type: String,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
CustomerCouponSchema.index({ userId: 1, isUsed: 1 });
CustomerCouponSchema.index({ userId: 1, expiresAt: 1 });

export default mongoose.models.CustomerCoupon || 
  mongoose.model<ICustomerCoupon>('CustomerCoupon', CustomerCouponSchema);
