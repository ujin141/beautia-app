import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  partnerId: mongoose.Types.ObjectId;
  name: string; // 직원 이름
  role?: string; // 역할/직책 (예: 원장, 실장, 디자이너, 스탭)
  specialty?: string; // 전문 분야 (예: 컷트, 펌, 염색)
  phone?: string; // 연락처
  email?: string; // 이메일
  profileImage?: string; // 프로필 이미지 URL
  color?: string; // 스케줄 표시용 색상
  isActive: boolean; // 활성 상태
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
    },
    specialty: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    color: {
      type: String,
      default: '#8B5CF6', // 기본 색상 (brand-lilac)
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스: 파트너별 조회 최적화
StaffSchema.index({ partnerId: 1, isActive: 1 });

const Staff = mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);

export default Staff;
