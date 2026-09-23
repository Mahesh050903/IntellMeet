import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamDocument extends Document {
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
}

const TeamSchema = new Schema<ITeamDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true },
    memberIds: [{ type: String }],
  },
  { timestamps: true }
);

export const TeamModel = mongoose.models.Team || mongoose.model<ITeamDocument>('Team', TeamSchema);
