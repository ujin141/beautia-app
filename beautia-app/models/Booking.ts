import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: string;
  userName: string;
  userPhone: string;
  shopId: string;
  shopName: string;
  partnerId: string;
  serviceId: string;
  serviceName: string;
  staffId?: string; // 선택한 스태프 ID
  staffName?: string; // 선택한 스태프 이름
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  price: number; // 최종 결제 금액 (할인 적용 후)
  originalPrice?: number; // 원래 금액 (할인 전)
  couponId?: string; // 사용한 쿠폰 ID
  couponDiscount?: number; // 쿠폰 할인 금액
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow' | 'cancellation_requested';
  paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'deposit_paid'; // deposit_paid: 보증금만 결제
  paymentType?: 'full' | 'deposit' | 'direct'; // full: 전체 결제, deposit: 보증금 결제, direct: 직접 결제
  depositAmount?: number; // 보증금 금액
  remainingAmount?: number; // 잔여 금액 (직접 결제 시 현장에서 결제)
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    shopId: { type: String, required: true },
    shopName: { type: String, required: true },
    partnerId: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    staffId: { type: String },
    staffName: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    couponId: { type: String },
    couponDiscount: { type: Number },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'noshow', 'cancellation_requested'], 
      default: 'pending' 
    },
    paymentStatus: { 
      type: String, 
      enum: ['paid', 'unpaid', 'refunded', 'deposit_paid'], 
      default: 'unpaid' 
    },
    paymentType: {
      type: String,
      enum: ['full', 'deposit', 'direct'],
      default: 'full',
    },
    depositAmount: {
      type: Number,
    },
    remainingAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
BookingSchema.index({ userId: 1 });
BookingSchema.index({ partnerId: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.models.Booking || 
  mongoose.model<IBooking>('Booking', BookingSchema);
