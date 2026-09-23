import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    meetingId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.models.Message || mongoose.model<IMessageDocument>('Message', MessageSchema);
