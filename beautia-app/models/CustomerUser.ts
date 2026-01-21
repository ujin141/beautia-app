import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  profileImage?: string;
  socialProvider?: 'google' | 'apple' | 'kakao' | 'line' | 'facebook';
  socialId?: string;
  emailVerified?: boolean;
  activeTokens?: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
    lastUsedAt?: Date;
  }>;
  location?: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  lastLoginAt?: Date;
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerUserSchema = new Schema<ICustomerUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String }, // 소셜 로그인 사용자는 비밀번호 없을 수 있음
    name: { type: String, required: true },
    phone: { type: String },
    profileImage: { type: String },
    socialProvider: { type: String, enum: ['google', 'apple', 'kakao', 'line', 'facebook'] },
    socialId: { type: String },
    emailVerified: { type: Boolean, default: false },
    activeTokens: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      lastUsedAt: { type: Date },
    }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [longitude, latitude]
    },
    lastLoginAt: { type: Date },
    joinDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// 위치 기반 검색을 위한 인덱스
CustomerUserSchema.index({ location: '2dsphere' });

export default mongoose.models.CustomerUser || 
  mongoose.model<ICustomerUser>('CustomerUser', CustomerUserSchema);
