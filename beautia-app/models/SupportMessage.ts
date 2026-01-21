import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportMessage extends Document {
  type: 'customer' | 'partner'; // 고객 또는 파트너
  userId: string; // 고객 ID 또는 파트너 ID
  userName: string; // 사용자 이름
  userEmail?: string; // 사용자 이메일
  userPhone?: string; // 사용자 전화번호
  message: string; // 메시지 내용
  isRead: boolean; // 읽음 여부
  readAt?: Date; // 읽은 시간
  repliedAt?: Date; // 답변 시간
  replyMessage?: string; // 답변 내용
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    type: {
      type: String,
      enum: ['customer', 'partner'],
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String },
    userPhone: { type: String },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    repliedAt: { type: Date },
    replyMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
SupportMessageSchema.index({ type: 1, isRead: 1, createdAt: -1 });
SupportMessageSchema.index({ userId: 1, createdAt: -1 });
SupportMessageSchema.index({ createdAt: -1 });

export default mongoose.models.SupportMessage || 
  mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);
