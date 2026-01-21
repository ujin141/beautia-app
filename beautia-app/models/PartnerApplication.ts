import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerApplication extends Document {
  name: string;
  phone: string;
  email: string;
  shopName: string;
  address: string;
  category: string;
  shopImages?: string[]; // 가게 사진 URL 배열
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerApplicationSchema = new Schema<IPartnerApplication>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    shopName: { type: String, required: true },
    address: { type: String, required: true },
    category: { type: String, required: true },
    shopImages: { type: [String], default: [] }, // 가게 사진 URL 배열
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PartnerApplication || 
  mongoose.model<IPartnerApplication>('PartnerApplication', PartnerApplicationSchema);
