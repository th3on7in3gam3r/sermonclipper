import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Accept both 'id' and 'jobId' for maximum compatibility
  const id = searchParams.get('jobId') || searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const update = progressManager.get(id);

  // Return the progress data as a standard JSON object
  return NextResponse.json(update || { 
    id, 
    step: 'Initializing', 
    status: 'loading', 
    message: 'Preparing neural stream...' 
  });
}
