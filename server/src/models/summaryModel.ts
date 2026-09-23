import mongoose, { Schema, Document } from 'mongoose';

export interface ISummaryDocument extends Document {
  meetingId: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{
    title: string;
    description: string;
    assigneeName?: string;
    dueDate?: string;
  }>;
  createdAt: Date;
}

const SummarySchema = new Schema<ISummaryDocument>(
  {
    meetingId: { type: String, required: true, unique: true },
    executiveSummary: { type: String, required: true },
    keyPoints: [{ type: String }],
    decisions: [{ type: String }],
    actionItems: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        assigneeName: { type: String },
        dueDate: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const SummaryModel = mongoose.models.Summary || mongoose.model<ISummaryDocument>('Summary', SummarySchema);
