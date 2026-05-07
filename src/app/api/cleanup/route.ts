import { NextRequest, NextResponse } from 'next/server';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
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
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
