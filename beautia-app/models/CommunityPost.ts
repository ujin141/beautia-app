import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: 'question' | 'review' | 'tip' | 'free' | 'notice';
  images?: string[];
  likes: number;
  views: number;
  commentCount: number;
  isPinned?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  reportedCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['question', 'review', 'tip', 'free', 'notice'],
      required: true,
      index: true,
    },
    images: [{ type: String }],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    reportedCount: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
CommunityPostSchema.index({ category: 1, createdAt: -1 });
CommunityPostSchema.index({ isPinned: -1, createdAt: -1 });
CommunityPostSchema.index({ isDeleted: 1 });
CommunityPostSchema.index({ userId: 1 });

export default mongoose.models.CommunityPost || 
  mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
