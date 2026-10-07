import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role: 'admin' | 'member' | 'guest';
  teamIds: string[];
  googleId?: string;
  authProvider?: 'local' | 'google';
  twoFactorEnabled?: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    avatar: { type: String },
    role: { type: String, enum: ['admin', 'member', 'guest'], default: 'member' },
    teamIds: [{ type: String }],
    googleId: { type: String, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    twoFactorEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
