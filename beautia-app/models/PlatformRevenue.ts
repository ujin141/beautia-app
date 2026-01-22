import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformRevenue extends Document {
  type: 'marketing_charge' | 'marketing_ad' | 'booking_commission' | 'subscription';
  partnerId?: mongoose.Types.ObjectId;
  shopId?: mongoose.Types.ObjectId;
  amount: number; // 플랫폼이 받은 수익 (원)
  originalAmount: number; // 원본 금액 (수수료 적용 전)
  commissionRate: number; // 수수료율 (예: 0.1 = 10%)
  currency: string; // 통화 (KRW, USD 등)
  description: string;
  transactionId?: mongoose.Types.ObjectId; // 관련 거래 ID (AdTransaction 등)
  stripePaymentIntentId?: string;
  status: 'pending' | 'completed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const PlatformRevenueSchema = new Schema<IPlatformRevenue>(
  {
    type: {
      type: String,
      required: true,
      enum: ['marketing_charge', 'marketing_ad', 'booking_commission', 'subscription'],
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'KRW',
    },
    description: {
      type: String,
      required: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      refPath: 'transactionType',
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
PlatformRevenueSchema.index({ partnerId: 1, createdAt: -1 });
PlatformRevenueSchema.index({ shopId: 1, createdAt: -1 });
PlatformRevenueSchema.index({ type: 1, createdAt: -1 });
PlatformRevenueSchema.index({ status: 1, createdAt: -1 });

const PlatformRevenue = mongoose.models.PlatformRevenue || mongoose.model<IPlatformRevenue>('PlatformRevenue', PlatformRevenueSchema);

export default PlatformRevenue;
