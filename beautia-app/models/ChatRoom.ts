import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  customerId: string; // 고객 ID
  partnerId: string; // 파트너 ID
  shopId?: string; // 매장 ID (선택적)
  shopName?: string; // 매장 이름 (캐싱용)
  lastMessage?: string; // 마지막 메시지 내용
  lastMessageAt?: Date; // 마지막 메시지 시간
  unreadCount: number; // 읽지 않은 메시지 수 (고객 기준)
  partnerUnreadCount: number; // 읽지 않은 메시지 수 (파트너 기준)
  isActive: boolean; // 채팅방 활성화 여부
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    customerId: { type: String, required: true, index: true },
    partnerId: { type: String, required: true, index: true },
    shopId: { type: String, index: true },
    shopName: { type: String },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadCount: { type: Number, default: 0 },
    partnerUnreadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스: 고객-파트너 조합은 유일해야 함
ChatRoomSchema.index({ customerId: 1, partnerId: 1 }, { unique: true });
ChatRoomSchema.index({ customerId: 1, lastMessageAt: -1 });
ChatRoomSchema.index({ partnerId: 1, lastMessageAt: -1 });

export default mongoose.models.ChatRoom || 
  mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
