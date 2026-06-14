import mongoose, { Schema, Document } from 'mongoose';

export interface IPodcastFeed extends Document {
  userId: string;
  feedUrl: string;
  title?: string;
  autoProcess: boolean;
  lastEpisodeGuid?: string;
  lastPolledAt?: Date;
  createdAt: Date;
}

const PodcastFeedSchema = new Schema({
  userId: { type: String, required: true, index: true },
  feedUrl: { type: String, required: true },
  title: { type: String },
  autoProcess: { type: Boolean, default: false },
  lastEpisodeGuid: { type: String },
  lastPolledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

PodcastFeedSchema.index({ userId: 1, feedUrl: 1 }, { unique: true });

export default mongoose.models.PodcastFeed || mongoose.model<IPodcastFeed>('PodcastFeed', PodcastFeedSchema);
