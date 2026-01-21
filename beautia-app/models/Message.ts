import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  partnerId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  sender: 'partner' | 'user';
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    partnerId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userPhone: { type: String },
    sender: { type: String, enum: ['partner', 'user'], required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
MessageSchema.index({ partnerId: 1, userId: 1, createdAt: -1 });
MessageSchema.index({ partnerId: 1, read: 1 });

export default mongoose.models.Message || 
  mongoose.model<IMessage>('Message', MessageSchema);
