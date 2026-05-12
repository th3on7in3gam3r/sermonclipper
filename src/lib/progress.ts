import connectDB from './mongodb';
import JobProgress from '../models/JobProgress';

export interface ProgressUpdate {
  step: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  message?: string;
  progress?: number;
  filePath?: string;
  r2Key?: string;
  r2Url?: string;
  finalPath?: string;
  analysis?: Record<string, unknown>;
  userId?: string;
}

class ProgressManager {
  private static instance: ProgressManager;

  private constructor() {}

  public static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  public async update(id: string, update: ProgressUpdate) {
    try {
      await connectDB();
      const existing = await JobProgress.findOne({ jobId: id });
      
      const updateData = {
        ...update,
        jobId: id,
        updatedAt: new Date()
      };

      if (existing) {
        // Merge analysis if provided
        if (update.analysis) {
          updateData.analysis = update.analysis;
        }
        await JobProgress.updateOne({ jobId: id }, { $set: updateData });
      } else {
        await JobProgress.create(updateData);
      }
      
      console.log(`[Progress] Updated ${id}: ${update.step} (${update.status})`);
    } catch (err) {
      console.error(`[Progress] Failed to update ${id}:`, err);
    }
  }

  public async get(id: string): Promise<ProgressUpdate | null> {
    try {
      await connectDB();
      const job = await JobProgress.findOne({ jobId: id });
      return job ? job.toObject() : null;
    } catch (err) {
      console.error(`[Progress] Failed to get ${id}:`, err);
      return null;
    }
  }
}

export const progressManager = ProgressManager.getInstance();
