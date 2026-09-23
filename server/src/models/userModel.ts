import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'admin' | 'member' | 'guest';
  teamIds: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: ['admin', 'member', 'guest'], default: 'member' },
    teamIds: [{ type: String }],
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
