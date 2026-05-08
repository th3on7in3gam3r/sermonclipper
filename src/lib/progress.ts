export interface ProgressUpdate {
  step: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  message?: string;
  progress?: number;
  filePath?: string;
  r2Key?: string;
  r2Url?: string;
  finalPath?: string;
}

class ProgressManager {
  private static instance: ProgressManager;
  private clients: Map<string, (data: ProgressUpdate) => void> = new Map();

  private constructor() {}

  public static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  public subscribe(id: string, callback: (data: ProgressUpdate) => void) {
    this.clients.set(id, callback);
  }

  public unsubscribe(id: string) {
    this.clients.delete(id);
  }

  public update(id: string, update: ProgressUpdate) {
    const callback = this.clients.get(id);
    if (callback) {
      callback(update);
    }
  }
}

export const progressManager = ProgressManager.getInstance();
