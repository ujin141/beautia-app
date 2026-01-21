import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  bookingId: string;
  userId: string;
  amount: number;
  method: 'card' | 'account' | 'easy' | 'virtual';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethodDetail?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { 
      type: String, 
      enum: ['card', 'account', 'easy', 'virtual'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'], 
      default: 'pending' 
    },
    paymentMethodDetail: { type: String },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.models.Payment || 
  mongoose.model<IPayment>('Payment', PaymentSchema);
