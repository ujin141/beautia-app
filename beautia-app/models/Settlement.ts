import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  partnerId: string;
  partnerName: string;
  shopName: string;
  period: string; // 정산 기간 (예: "2026-01-01 ~ 2026-01-07")
  periodStart: Date;
  periodEnd: Date;
  totalSales: number; // 총 매출
  fee: number; // 수수료
  payout: number; // 실 지급액
  bookingCount: number; // 예약 건수
  status: 'pending' | 'processing' | 'completed' | 'failed'; // 정산 상태
  accountInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  transferInfo?: {
    transferId?: string; // 이체 ID (은행 API에서 받은 ID)
    transferDate?: Date; // 이체 일시
    transferMethod?: string; // 이체 방법 (manual, openbanking, stripe 등)
    receiptUrl?: string; // 영수증 URL
  };
  notes?: string; // 관리자 메모
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    partnerId: { type: String, required: true, index: true },
    partnerName: { type: String, required: true },
    shopName: { type: String, required: true },
    period: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalSales: { type: Number, required: true, default: 0 },
    fee: { type: Number, required: true, default: 0 },
    payout: { type: Number, required: true, default: 0 },
    bookingCount: { type: Number, required: true, default: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    accountInfo: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolder: { type: String },
    },
    transferInfo: {
      transferId: { type: String },
      transferDate: { type: Date },
      transferMethod: { type: String },
      receiptUrl: { type: String },
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// 중복 정산 방지 인덱스
SettlementSchema.index({ partnerId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

export default mongoose.models.Settlement || 
  mongoose.model<ISettlement>('Settlement', SettlementSchema);
