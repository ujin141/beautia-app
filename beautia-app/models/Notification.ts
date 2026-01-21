import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'partners' | 'users';
  isActive: boolean;
  expiresAt?: Date;
  link?: string; // 알림 클릭 시 이동할 링크 (예: '/bookings', '/promotions')
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'warning', 'success', 'error'], 
      default: 'info' 
    },
    target: { 
      type: String, 
      enum: ['all', 'partners', 'users'], 
      default: 'all',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, index: true },
    link: { type: String }, // 알림 클릭 시 이동할 링크
  },
  { timestamps: true }
);

// 만료된 알림 필터링을 위한 인덱스
NotificationSchema.index({ isActive: 1, expiresAt: 1, target: 1 });

// 모델 재컴파일 방지 (개발 환경)
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
