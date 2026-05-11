import mongoose from 'mongoose';

const JobProgressSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  step: { type: String, default: 'Initializing' },
  status: { type: String, enum: ['pending', 'loading', 'completed', 'error'], default: 'pending' },
  message: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  analysis: { type: Object, default: null },
  finalPath: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on every save
JobProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.JobProgress || mongoose.model('JobProgress', JobProgressSchema);
