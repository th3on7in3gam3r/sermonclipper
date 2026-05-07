import { NextResponse } from 'next/server';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST() {
  try {
    const tmpDir = join(process.cwd(), 'tmp');
    
    if (existsSync(tmpDir)) {
      // Remove the directory and all its contents
      await rm(tmpDir, { recursive: true, force: true });
      // Re-create the empty tmp directory
      await mkdir(tmpDir, { recursive: true });
      
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
