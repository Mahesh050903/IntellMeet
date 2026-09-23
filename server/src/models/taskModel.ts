import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskDocument extends Document {
  teamId?: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  sourceMeetingId?: string;
  createdAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    teamId: { type: String },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigneeId: { type: String },
    assigneeName: { type: String },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    sourceMeetingId: { type: String },
  },
  { timestamps: true }
);

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
