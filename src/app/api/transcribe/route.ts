import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { progressManager } from '../../../lib/progress';
import { TMP_DIR } from '../../../lib/paths';

export async function POST(req: NextRequest) {
  let currentJobId = '';
  try {
    const { filePath, jobId } = await req.json();
    currentJobId = jobId;

    if (!filePath || !jobId) {
      return NextResponse.json({ error: "Missing filePath or jobId" }, { status: 400 });
    }

    progressManager.update(jobId, { step: 'Analysis', status: 'loading', message: 'Extracting Spiritual Audio...' });

    const audioPath = join(TMP_DIR, `${jobId}_audio.mp3`);

    // ── Optimized Audio Extraction for AI ──────────────────────────────
    // 16kHz Mono 64kbps is the 'Sweet Spot' for Whisper/Groq
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          '-vn',
          '-acodec libmp3lame',
          '-ar 16000',
          '-ac 1',
          '-b:a 64k'
        ])
        .save(audioPath)
        .on('start', (cmd) => console.log('[Transcribe] FFMPEG Start:', cmd))
        .on('progress', (p) => {
          progressManager.update(jobId, { 
            step: 'Analysis', 
            status: 'loading', 
            message: `Extracting Audio: ${Math.round(p.percent || 0)}%` 
          });
        })
        .on('end', resolve)
        .on('error', (err) => {
          console.error('[Transcribe] FFMPEG Error:', err);
          reject(err);
        });
    });

    progressManager.update(jobId, { step: 'Analysis', status: 'loading', message: 'Neural Transcription Active...' });

    // ── AI Transcription Stage ──────────────────────────────────────────
    // Note: Here is where you would integrate OpenAI Whisper or Groq.
    // For now, we simulate a deep analysis.
    await new Promise(r => setTimeout(r, 3000));

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: 'Transcription Complete' 
    });

    return NextResponse.json({
      success: true,
      jobId,
      audioPath,
      transcript: "Transcription generated successfully. Ready for social clipping."
    });

  } catch (error: any) {
    console.error("🔥 TRANSCRIBE ERROR:", error);
    if (currentJobId) {
      progressManager.update(currentJobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: `Analysis Failed: ${error.message}` 
      });
    }

    return NextResponse.json({ 
      error: "Transcription failed", 
      message: error.message 
    }, { status: 500 });
  }
}
