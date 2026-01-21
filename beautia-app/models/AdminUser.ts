import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator'; // 권한 레벨
  permissions?: string[]; // 세부 권한
  lastLoginAt?: Date;
  isActive: boolean;
  activeTokens?: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
    lastUsedAt?: Date;
  }>; // 활성 토큰 목록
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['super_admin', 'admin', 'moderator'],
      default: 'admin',
      required: true 
    },
    permissions: [{ type: String }],
    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true },
    activeTokens: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      lastUsedAt: { type: Date },
    }],
  },
  {
    timestamps: true,
  }
);

// 인덱스
AdminUserSchema.index({ email: 1 });
AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ isActive: 1 });

export default mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
