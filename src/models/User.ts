import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IUser extends Document {
  clerkId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'creator' | 'church_pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  usageCount: number;
  lastUsageReset: Date;
  onboardingComplete: boolean;
  youtubeTokens?: Record<string, unknown>;
  welcomeEmailSent?: boolean;
  emailUnsubscribed?: boolean;
  email?: string;
  emailUnsubscribeToken?: string;
  socialConnections?: Record<string, boolean>;
  quotaWarningSentAt?: Date;
  quotaReachedSentAt?: Date;
  lastRecapMonth?: string;
  referralCode?: string;
  referredBy?: string;
  referralRewarded?: boolean;
  referralUpgradeCount?: number;
  lastActiveAt?: Date;
  checklist?: {
    uploadedSermon?: boolean;
    createdClip?: boolean;
    customizedCaption?: boolean;
    exportedReel?: boolean;
    connectedSocial?: boolean;
    invitedTeamMember?: boolean;
  };
  onboardingEmailsSent?: number[];
  lastSeenChangelogDate?: Date;
  shortcutsTipShown?: boolean;
  whiteLabel?: {
    churchName?: string;
    logoUrl?: string;
    primaryColor?: string;
    customDomain?: string;
    customDomainVerified?: boolean;
    customDomainVerifiedAt?: Date;
    emailDomain?: string;
    emailDomainVerified?: boolean;
    emailReplyTo?: string;
    showPoweredBy?: boolean;
    defaultThumbnailStyle?: Record<string, unknown>;
  };
  youtubeThumbnailTests?: {
    videoId: string;
    clipIndex?: number;
    thumbnailUrl?: string;
    ctr?: number;
    hasTextOverlay?: boolean;
    style?: Record<string, unknown>;
    uploadedAt?: Date;
  }[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  stripeCustomerId: { type: String, unique: true, sparse: true },
  stripeSubscriptionId: { type: String, unique: true, sparse: true },
  plan: { type: String, enum: ['free', 'creator', 'church_pro'], default: 'free' },
  status: { type: String, default: 'active' },
  usageCount: { type: Number, default: 0 },
  lastUsageReset: { type: Date, default: Date.now },
  onboardingComplete: { type: Boolean, default: false },
  youtubeTokens: { type: Schema.Types.Mixed },
  welcomeEmailSent: { type: Boolean, default: false },
  emailUnsubscribed: { type: Boolean, default: false },
  emailUnsubscribeToken: { type: String, default: () => randomUUID() },
  email: { type: String },
  socialConnections: { type: Schema.Types.Mixed, default: {} },
  quotaWarningSentAt: { type: Date },
  quotaReachedSentAt: { type: Date },
  lastRecapMonth: { type: String },
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: String, index: true },
  referralRewarded: { type: Boolean, default: false },
  referralUpgradeCount: { type: Number, default: 0 },
  lastActiveAt: { type: Date },
  checklist: {
    uploadedSermon: { type: Boolean, default: false },
    createdClip: { type: Boolean, default: false },
    customizedCaption: { type: Boolean, default: false },
    exportedReel: { type: Boolean, default: false },
    connectedSocial: { type: Boolean, default: false },
    invitedTeamMember: { type: Boolean, default: false },
  },
  onboardingEmailsSent: { type: [Number], default: [] },
  lastSeenChangelogDate: { type: Date },
  shortcutsTipShown: { type: Boolean, default: false },
  whiteLabel: { type: Schema.Types.Mixed },
  youtubeThumbnailTests: { type: [Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
