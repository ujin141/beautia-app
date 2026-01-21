import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: string; // 채팅방 ID
  senderId: string; // 발신자 ID (고객 ID 또는 파트너 ID)
  senderType: 'customer' | 'partner'; // 발신자 타입
  senderName: string; // 발신자 이름
  message: string; // 메시지 내용
  messageType: 'text' | 'image' | 'file'; // 메시지 타입
  imageUrl?: string; // 이미지 URL (이미지 타입인 경우)
  isRead: boolean; // 읽음 여부
  readAt?: Date; // 읽은 시간
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderType: {
      type: String,
      enum: ['customer', 'partner'],
      required: true,
      index: true,
    },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    imageUrl: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
ChatMessageSchema.index({ roomId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1, createdAt: -1 });
ChatMessageSchema.index({ isRead: 1, createdAt: -1 });

export default mongoose.models.ChatMessage || 
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
