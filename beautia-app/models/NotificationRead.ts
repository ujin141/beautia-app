import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationRead extends Document {
  notificationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userType: 'customer' | 'partner';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationReadSchema = new Schema<INotificationRead>(
  {
    notificationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Notification', 
      required: true,
      index: true,
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      index: true,
    },
    userType: { 
      type: String, 
      enum: ['customer', 'partner'], 
      required: true,
      index: true,
    },
    isRead: { 
      type: Boolean, 
      default: false,
      index: true,
    },
    readAt: { 
      type: Date,
    },
  },
  { timestamps: true }
);

// 복합 인덱스: 사용자별 알림 읽음 상태 조회 최적화
NotificationReadSchema.index({ userId: 1, userType: 1, notificationId: 1 }, { unique: true });
NotificationReadSchema.index({ notificationId: 1, userType: 1, isRead: 1 });

// 모델 재컴파일 방지 (개발 환경)
if (mongoose.models.NotificationRead) {
  delete mongoose.models.NotificationRead;
}

const NotificationRead: Model<INotificationRead> = mongoose.model<INotificationRead>('NotificationRead', NotificationReadSchema);

export default NotificationRead;
