import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  applicationId?: string;
  lastLoginAt?: Date;
  marketingPoints?: number; // 마케팅 포인트
  stripeCustomerId?: string; // Stripe Customer ID
  defaultPaymentMethodId?: string; // 기본 결제 수단 ID
  stripeConnectAccountId?: string; // Stripe Connect 계정 ID (해외 파트너 정산용)
  stripeConnectAccountStatus?: 'pending' | 'restricted' | 'enabled' | 'disabled'; // Connect 계정 상태
  isVerified?: boolean; // 검증된 파트너 여부
  accountInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    verified?: boolean;
  };
  activeTokens?: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
    lastUsedAt?: Date;
  }>; // 활성 토큰 목록
  createdAt: Date;
  updatedAt: Date;
}

const PartnerUserSchema = new Schema<IPartnerUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    applicationId: { type: String },
    lastLoginAt: { type: Date },
    marketingPoints: { type: Number, default: 0 }, // 마케팅 포인트 기본값 0
    stripeCustomerId: { type: String }, // Stripe Customer ID
    defaultPaymentMethodId: { type: String }, // 기본 결제 수단 ID
    stripeConnectAccountId: { type: String }, // Stripe Connect 계정 ID
    stripeConnectAccountStatus: { 
      type: String, 
      enum: ['pending', 'restricted', 'enabled', 'disabled'],
      default: 'pending'
    }, // Connect 계정 상태
    isVerified: { type: Boolean, default: false }, // 검증된 파트너 여부
    accountInfo: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolder: { type: String },
      verified: { type: Boolean, default: false },
    },
    activeTokens: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      lastUsedAt: { type: Date },
    }],
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
PartnerUserSchema.index({ email: 1 });
PartnerUserSchema.index({ 'activeTokens.token': 1 });

export default mongoose.models.PartnerUser || 
  mongoose.model<IPartnerUser>('PartnerUser', PartnerUserSchema);
