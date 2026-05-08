import { NextResponse } from 'next/server';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST() {
  try {
    const clipsDir = join('/tmp', 'clips');
    
    if (existsSync(clipsDir)) {
      await rm(clipsDir, { recursive: true, force: true });
      await mkdir(clipsDir, { recursive: true });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Workspace cache cleared successfully' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache was already empty' 
    });
  } catch (error: unknown) {
    console.error('Cleanup error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
