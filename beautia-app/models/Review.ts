import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  shopId: string;
  shopName?: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  date: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  reply?: string;
  replyDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    shopId: { type: String, required: true, index: true },
    shopName: { type: String },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    date: { type: String, required: true },
    sentiment: { 
      type: String, 
      enum: ['positive', 'neutral', 'negative'],
    },
    reply: { type: String },
    replyDate: { type: String },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
ReviewSchema.index({ shopId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });

export default mongoose.models.Review || 
  mongoose.model<IReview>('Review', ReviewSchema);
