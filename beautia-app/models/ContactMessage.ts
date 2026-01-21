import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  type: string;
  email: string;
  message: string;
  status?: 'open' | 'resolved' | 'archived';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    type: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved', 'archived'], default: 'open' },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ContactMessage || 
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
