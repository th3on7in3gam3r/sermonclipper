import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface ITeamMember {
  userId?: string;
  email: string;
  name?: string;
  role: TeamRole;
  joinedAt?: Date;
}

export interface ITeamInvite {
  token: string;
  email: string;
  role: TeamRole;
  createdAt: Date;
  expiresAt: Date;
}

export interface ITeam extends Document {
  ownerId: string;
  name: string;
  seatLimit: number;
  members: ITeamMember[];
  pendingInvites: ITeamInvite[];
  createdAt: Date;
}

const TeamMemberSchema = new Schema({
  userId: { type: String },
  email: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
  joinedAt: { type: Date, default: Date.now },
});

const TeamInviteSchema = new Schema({
  token: { type: String, default: () => randomUUID() },
  email: { type: String, required: true },
  role: { type: String, enum: ['editor', 'viewer'], required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

const TeamSchema = new Schema({
  ownerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'My Team' },
  seatLimit: { type: Number, default: 5 },
  members: [TeamMemberSchema],
  pendingInvites: [TeamInviteSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
