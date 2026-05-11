import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Support both frontend versions (jobId and id)
  const id = searchParams.get('jobId') || searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  // Safe dynamic check for different method names
  const manager = progressManager as any;
  const progress = manager.get ? await manager.get(id) : (manager.getProgress ? await manager.getProgress(id) : null);

  if (!progress) {
    return NextResponse.json({ 
      step: 'Waiting', 
      status: 'loading', 
      message: 'Neural Stream initializing...' 
    });
  }

  return NextResponse.json(progress);
}
