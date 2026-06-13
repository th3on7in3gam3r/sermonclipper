import mongoose from 'mongoose';

const JobProgressSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  userId: { type: String, required: false },
  step: { type: String, default: 'Initializing' },
  status: { type: String, enum: ['pending', 'loading', 'completed', 'error'], default: 'pending' },
  queueStatus: {
    type: String,
    enum: ['queued', 'processing', 'complete', 'failed'],
    default: 'queued',
  },
  retryCount: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' },
  outputUrls: { type: [String], default: [] },
  payload: { type: Object, default: null },
  message: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  analysis: { type: Object, default: null },
  finalPath: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

// updatedAt is managed manually in the progress manager

export default mongoose.models.JobProgress || mongoose.model('JobProgress', JobProgressSchema);
