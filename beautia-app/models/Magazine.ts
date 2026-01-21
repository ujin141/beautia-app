import mongoose, { Schema, Document } from 'mongoose';

export interface IMagazine extends Document {
  title: string;
  titleTranslations?: {
    ko?: string;
    en?: string;
    ja?: string;
    th?: string;
    zh?: string;
  };
  description: string;
  descriptionTranslations?: {
    ko?: string;
    en?: string;
    ja?: string;
    th?: string;
    zh?: string;
  };
  category: string;
  imageUrl: string;
  readTime: string; // 예: "5 min"
  date: string; // 예: "2026.01.10"
  content?: string; // 상세 내용 (옵션)
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MagazineSchema = new Schema<IMagazine>(
  {
    title: { type: String, required: true },
    titleTranslations: {
      ko: String,
      en: String,
      ja: String,
      th: String,
      zh: String,
    },
    description: { type: String, required: true },
    descriptionTranslations: {
      ko: String,
      en: String,
      ja: String,
      th: String,
      zh: String,
    },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    readTime: { type: String, required: true },
    date: { type: String, required: true },
    content: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// 인덱스 추가
MagazineSchema.index({ isPublished: 1, createdAt: -1 });
MagazineSchema.index({ category: 1 });

export default mongoose.models.Magazine || 
  mongoose.model<IMagazine>('Magazine', MagazineSchema);
