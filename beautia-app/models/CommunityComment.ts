import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityComment extends Document {
  postId: string;
  userId: string;
  userName: string;
  content: string;
  parentCommentId?: string; // 대댓글인 경우
  likes: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  reportedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    parentCommentId: { type: String, index: true },
    likes: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    reportedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
CommunityCommentSchema.index({ postId: 1, createdAt: -1 });
CommunityCommentSchema.index({ userId: 1 });

export default mongoose.models.CommunityComment || 
  mongoose.model<ICommunityComment>('CommunityComment', CommunityCommentSchema);
