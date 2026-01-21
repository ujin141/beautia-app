import mongoose, { Schema, Document } from 'mongoose';

export interface IAdTransaction extends Document {
  partnerId: mongoose.Types.ObjectId;
  type: 'charge' | 'spend' | 'refund';
  amount: number;
  description: string;
  adId?: mongoose.Types.ObjectId; // 광고 관련 거래인 경우
  stripeSessionId?: string; // Stripe 결제 세션 ID
  stripePaymentIntentId?: string; // Stripe Payment Intent ID
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const AdTransactionSchema = new Schema<IAdTransaction>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['charge', 'spend', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'Ad',
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
AdTransactionSchema.index({ partnerId: 1, createdAt: -1 });
AdTransactionSchema.index({ stripeSessionId: 1 });

export default mongoose.models.AdTransaction || 
  mongoose.model<IAdTransaction>('AdTransaction', AdTransactionSchema);
