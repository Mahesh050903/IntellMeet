import mongoose, { Schema, Document } from 'mongoose';

export interface IMeetingDocument extends Document {
  title: string;
  hostId: string;
  hostName: string;
  teamId?: string;
  participants: Array<{
    userId: string;
    name: string;
    avatar?: string;
    joinedAt: Date;
    leftAt?: Date;
  }>;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  passCode?: string;
  recordingUrl?: string;
  createdAt: Date;
}

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: { type: String, required: true, trim: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    teamId: { type: String },
    participants: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        avatar: { type: String },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'active',
    },
    passCode: { type: String },
    recordingUrl: { type: String },
  },
  { timestamps: true }
);

export const MeetingModel = mongoose.models.Meeting || mongoose.model<IMeetingDocument>('Meeting', MeetingSchema);
