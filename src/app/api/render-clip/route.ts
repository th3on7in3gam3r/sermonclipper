import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { writeFileSync, existsSync, unlinkSync, createReadStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadStreamToR2 } from '../../../lib/r2';
import { progressManager } from '../../../lib/progress';
import { TMP_DIR } from '../../../lib/paths';

const execAsync = promisify(exec);

// Helper for ASS time format
function formatAssTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// Helper to parse potential string times
const parseTime = (timeVal: any): number => {
  if (typeof timeVal === 'number') return Math.floor(timeVal);
  if (!timeVal) return 0;
  const str = String(timeVal);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
  }
  return Math.floor(Number(str)) || 0;
};

// Generates the .ass subtitle file content
function generateAssFile(captions: string[], durationSeconds: number) {
  const chunkDuration = durationSeconds / (captions?.length || 1);
  let events = '';
  
  if (!captions || captions.length === 0) {
    captions = ["Inspirational Moment"]; // Fallback text
  }

  for (let i = 0; i < captions.length; i++) {
    const start = i * chunkDuration;
    const end = (i + 1) * chunkDuration;
    // Replace commas with newlines to force TikTok-style stacked text formatting
    const formattedText = captions[i].replace(/,/g, '\\N');
    events += `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${formattedText}\n`;
  }

  // 1080x1920 is standard 9:16 vertical Reel size
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,84,&H0000FFFF,&H000000FF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,3,14,0,2,20,20,350,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, clip, index } = await req.json();
    
    if (!jobId || !clip) {
      return NextResponse.json({ error: 'Missing jobId or clip data' }, { status: 400 });
    }

    const state = progressManager.get(jobId);
    if (!state || !state.finalPath) {
      return NextResponse.json({ error: 'Master video not found or still processing. Please wait for the master download to complete.' }, { status: 404 });
    }

    const masterUrl = state.finalPath;
    const startSec = parseTime(clip.start);
    const endSec = parseTime(clip.end);
    let duration = endSec - startSec;
    if (duration <= 0) duration = 30; // Fallback to 30s if invalid times

    const renderId = uuidv4();
    const assPath = join(TMP_DIR, `${renderId}.ass`);
    const outputPath = join(TMP_DIR, `${renderId}.mp4`);

    // 1. Generate ASS Subtitle File locally
    const assContent = generateAssFile(clip.suggested_captions, duration);
    writeFileSync(assPath, assContent);

    // 2. FFmpeg Processing Command
    // -ss to seek instantly. -t for duration.
    // crop=ih*9/16:ih dynamically centers and crops a horizontal YouTube video to 9:16 vertical Reel format.
    // scale=1080:1920 scales the crop to standard TikTok/Reel size.
    // subtitles=... burns the ASS file onto the scaled video.
    const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    const ffmpegCmd = `ffmpeg -y -ss ${startSec} -i "${masterUrl}" -t ${duration} -vf "crop=ih*9/16:ih,scale=1080:1920,subtitles='${escapedAssPath}'" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
    
    console.log('[Render Engine] Executing FFmpeg Render:', ffmpegCmd);
    await execAsync(ffmpegCmd);

    // 3. Upload to R2 for persistent download link
    const r2Url = await uploadStreamToR2(`renders/${jobId}_clip_${index || 0}_${renderId.substring(0,6)}.mp4`, createReadStream(outputPath), 'video/mp4');

    // 4. Cleanup Local Temp Files
    if (existsSync(assPath)) unlinkSync(assPath);
    if (existsSync(outputPath)) unlinkSync(outputPath);

    return NextResponse.json({ success: true, downloadUrl: r2Url });

  } catch (e: any) {
    console.error('[Render Engine] Critical Failure:', e);
    return NextResponse.json({ error: e.message || 'Render pipeline failed' }, { status: 500 });
  }
}
