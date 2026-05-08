import { NextRequest, NextResponse } from 'next/server';
import * as ffmpeg from 'fluent-ffmpeg';
import { resolve, join } from 'path';
import { mkdir, writeFile, stat, readFile } from 'fs/promises';
import { existsSync, renameSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { progressManager } from '../../../lib/progress';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadBufferToR2 } from '@/lib/r2';
import { TMP_DIR } from '@/lib/paths';

const execAsync = promisify(exec);

let finalFfmpegPath = '';

// Strategy 1: Use ffmpeg-static path and resolve it
if (ffmpegPath) {
  const resolved = resolve(ffmpegPath);
  if (existsSync(resolved)) {
    finalFfmpegPath = resolved;
  }
}

// Strategy 2: Manual look in node_modules if Strategy 1 failed
if (!finalFfmpegPath) {
  const manualPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
  if (existsSync(manualPath)) {
    finalFfmpegPath = manualPath;
  }
}

// Strategy 3: Fallback to global ffmpeg
if (!finalFfmpegPath) {
  finalFfmpegPath = 'ffmpeg'; // Hope it's in the PATH
}

console.log('[Process] Final FFmpeg Path:', finalFfmpegPath);
ffmpeg.setFfmpegPath(finalFfmpegPath);

// Probe video to check for audio streams
async function probeVideoStreams(filePath: string): Promise<{ hasAudio: boolean; hasVideo: boolean; duration?: number }> {
  try {
    const probeCmd = `"${finalFfmpegPath}" -v error -select_streams v:0 -select_streams a:0 -show_entries stream=codec_type:format=duration -of default=noprint_wrappers=1:nokey=1:nk=1 "${filePath}"`;
    const { stdout } = await execAsync(probeCmd);
    const lines = stdout.trim().split('\n').filter(Boolean);
    
    const hasVideo = lines.includes('video');
    const hasAudio = lines.includes('audio');
    const duration = lines.find(line => /^\d+\.\d+$/.test(line)) ? parseFloat(lines.find(line => /^\d+\.\d+$/.test(line))!) : undefined;
    
    return {
      hasVideo,
      hasAudio,
      duration
    };
  } catch {
    console.warn('[Process] Failed to probe video streams, assuming audio exists');
    return { hasVideo: true, hasAudio: true };
  }}

// Parse time string like "0:15" or "1:30" into seconds
function parseTimeString(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const { 
      filePath, 
      clips, 
      transcription, 
      jobId, 
      summaries, 
      main_theme, 
      tone, 
      five_day_devotional, 
      sermon_images, 
      quotes_and_verses,
      social_captions
    } = await req.json();

    if (!filePath || !clips || !transcription) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Validate source file exists
    if (!existsSync(filePath)) {
      console.error(`[Process] Source file not found: ${filePath}`);
      return NextResponse.json({ error: `Source video file not found: ${filePath}` }, { status: 400 });
    }

    // Probe source video for streams and duration
    const sourceInfo = await probeVideoStreams(filePath);
    console.log(`[Process] Source video: duration=${sourceInfo.duration}s, hasVideo=${sourceInfo.hasVideo}, hasAudio=${sourceInfo.hasAudio}`);

    if (!sourceInfo.hasVideo) {
      return NextResponse.json({ error: 'Source video has no video stream' }, { status: 400 });
    }

    const clipsDir = join(TMP_DIR, 'clips', jobId);
    await mkdir(clipsDir, { recursive: true });

    progressManager.update(jobId, { 
      step: 'Cutting', 
      status: 'loading', 
      message: 'Processing clips...' 
    });

    const processedClips = [];

    for (let i = 0; i < clips.length; i++) {
      const rawClip = clips[i];
      const clipId = uuidv4();
      
      // Flexible property mapping with time parsing
      const clip = {
        title: rawClip.hook_title || rawClip.title || `Clip ${i + 1}`,
        start_time: Number(rawClip.start_time) || parseTimeString(rawClip.start) || 0,
        end_time: Number(rawClip.end_time) || parseTimeString(rawClip.end) || 0,
        ...rawClip
      };

      const duration = clip.end_time - clip.start_time;

      // Validate clip duration is reasonable (not too short or too long)
      if (duration < 5) {
        console.warn(`[Process] Clip ${i + 1} too short (${duration}s), minimum 5 seconds required, skipping`);
        continue;
      }
      if (duration > 120) {
        console.warn(`[Process] Clip ${i + 1} too long (${duration}s), maximum 120 seconds allowed, skipping`);
        continue;
      }

      // Validate clip doesn't exceed source video duration
      if (sourceInfo.duration && clip.end_time > sourceInfo.duration) {
        console.warn(`[Process] Clip ${i + 1} end time (${clip.end_time}s) exceeds source video duration (${sourceInfo.duration}s), skipping`);
        continue; // Skip clips that exceed source duration
      }

      // Additional validation: ensure start time is within bounds
      if (sourceInfo.duration && clip.start_time >= sourceInfo.duration) {
        console.warn(`[Process] Clip ${i + 1} start time (${clip.start_time}s) is beyond source video duration (${sourceInfo.duration}s), skipping`);
        continue;
      }

      console.log(`[Process] Processing clip ${i + 1}: ${clip.title} (${clip.start_time}s - ${clip.end_time}s, duration: ${duration}s)`);

      const outputFileName = `clip-${i + 1}-${clipId}.mp4`;
      const outputPath = join(clipsDir, outputFileName);

      progressManager.update(jobId, { 
        step: 'Cutting', 
        status: 'loading', 
        message: `Processing clip ${i + 1}/${clips.length}: ${clip.title}`,
        progress: (i / clips.length) * 100
      });

      let clipR2Url: string | undefined;
      let thumbR2Url: string | undefined;
      
      const hasWords = transcription && transcription.words && transcription.words.length > 0;
      if (hasWords) {
        try {
          const srtContent = generateSRT(transcription.words, clip.start_time, clip.end_time);
          const srtPath = join(clipsDir, `sub-${i + 1}.srt`);
          await writeFile(srtPath, srtContent);
        } catch (srtErr) {
          console.warn('[Process] Failed to generate SRT for clip:', i + 1, srtErr);
        }
      }

      // --- CLIP CUTTING WITH VALIDATION ---
      try {
        const filter = `crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920`;
        const clipDuration = clip.end_time - clip.start_time;

        const streams = await probeVideoStreams(filePath);
        console.log(`[Process] Source streams for clip ${i + 1}: video=${streams.hasVideo}, audio=${streams.hasAudio}`);

        let cutCmd: string;
        if (streams.hasAudio) {
          cutCmd = `"${finalFfmpegPath}" -ss ${clip.start_time} -i "${filePath}" -t ${clipDuration} -vf "${filter}" -map 0:v:0 -map 0:a:0 -c:v libx264 -profile:v main -level:v 3.0 -pix_fmt yuv420p -preset veryfast -crf 23 -tune fastdecode -movflags +faststart -c:a aac -b:a 128k -ac 2 -f mp4 -y "${outputPath}"`;
        } else {
          cutCmd = `"${finalFfmpegPath}" -ss ${clip.start_time} -i "${filePath}" -t ${clipDuration} -vf "${filter}" -f lavfi -i anullsrc=r=44100:cl=stereo -map 0:v:0 -map 1:a:0 -c:v libx264 -profile:v main -level:v 3.0 -pix_fmt yuv420p -preset veryfast -crf 23 -tune fastdecode -movflags +faststart -c:a aac -b:a 128k -ac 2 -shortest -f mp4 -y "${outputPath}"`;
        }

        console.log(`[Process] Cutting clip ${i + 1}: ${outputFileName}`);
        const { stderr } = await execAsync(cutCmd);
        if (stderr && stderr.includes('error')) {
          console.warn(`[Process] FFmpeg stderr for clip ${i + 1}:`, stderr.substring(0, 300));
        }

        if (!existsSync(outputPath)) {
          throw new Error(`FFmpeg failed to create output file: ${outputFileName}`);
        }

        const fileStat = await stat(outputPath);
        if (fileStat.size === 0) {
          throw new Error(`FFmpeg created empty file (0 bytes): ${outputFileName}`);
        }
        console.log(`[Process] Clip ${i + 1} file size: ${(fileStat.size / 1024 / 1024).toFixed(2)} MB`);

        try {
          const clipBuffer = await readFile(outputPath);
          const clipKey = `processed-clips/${jobId}/${outputFileName}`;
          clipR2Url = await uploadBufferToR2(clipKey, clipBuffer, 'video/mp4');
          console.log(`[Process] Uploaded clip ${i + 1} to R2: ${clipKey}`);
        } catch (clipR2Err: unknown) {
          const msg = clipR2Err instanceof Error ? clipR2Err.message : String(clipR2Err);
          console.warn('[Process] R2 clip upload skipped:', msg);
        }

        try {
          const outputStreams = await probeVideoStreams(outputPath);
          if (!outputStreams.hasVideo) {
            throw new Error(`Output file missing video stream: ${outputFileName}`);
          }
          if (!outputStreams.hasAudio) {
            console.warn(`[Process] Output file missing audio stream for clip ${i + 1}, regenerating with audio...`);
            const outputPathTemp = outputPath + '.tmp.mp4';
            const audioAddCmd = `"${finalFfmpegPath}" -i "${outputPath}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -b:a 128k -ac 2 -shortest -y "${outputPathTemp}"`;
            await execAsync(audioAddCmd);
            renameSync(outputPathTemp, outputPath);
            console.log(`[Process] Added audio to clip ${i + 1}`);
          }
          console.log(`[Process] Clip ${i + 1} verified: video=${outputStreams.hasVideo}, audio=${outputStreams.hasAudio}`);
        } catch (probeErr: unknown) {
          const msg = probeErr instanceof Error ? probeErr.message : String(probeErr);
          console.error(`[Process] Stream validation failed for clip ${i + 1}:`, msg);
          throw new Error(`Failed to validate output streams: ${msg}`);
        }

        try {
          const finalStreams = await probeVideoStreams(outputPath);
          if (!finalStreams.hasVideo) {
            throw new Error(`Final validation failed: no video stream in ${outputFileName}`);
          }
          if (finalStreams.duration && finalStreams.duration < 1) {
            throw new Error(`Final validation failed: clip too short (${finalStreams.duration}s) in ${outputFileName}`);
          }
          console.log(`[Process] Final validation passed for clip ${i + 1}: duration=${finalStreams.duration?.toFixed(1)}s`);
        } catch (finalErr: unknown) {
          const msg = finalErr instanceof Error ? finalErr.message : String(finalErr);
          console.error(`[Process] Final validation failed for clip ${i + 1}:`, msg);
          try {
            const fs = await import('fs');
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
          } catch {
            console.warn(`[Process] Failed to clean up corrupted file: ${outputFileName}`);
          }
          continue;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Process] Cut failed for clip ${i + 1}:`, msg);
        continue;
      }

      // --- THUMBNAIL GENERATION WITH VALIDATION ---
      const thumbFileName = outputFileName.replace('.mp4', '.jpg');
      const thumbPath = join(clipsDir, thumbFileName);

      try {
        const snapTime = clip.start_time + 1;
        const thumbCmd = `"${finalFfmpegPath}" -ss ${snapTime} -i "${filePath}" -vframes 1 -s 1080x1920 -f image2 -y "${thumbPath}"`;
        await execAsync(thumbCmd);

        if (existsSync(thumbPath)) {
          const tStat = await stat(thumbPath);
          if (tStat.size > 0) {
            console.log(`[Process] Thumbnail verified: ${(tStat.size / 1024).toFixed(1)} KB`);
          } else {
            console.warn(`[Process] Thumbnail is 0 bytes for clip ${i + 1}`);
          }
        }

        if (existsSync(thumbPath)) {
          try {
            const thumbBuffer = await readFile(thumbPath);
            const thumbKey = `processed-clips/${jobId}/${thumbFileName}`;
            thumbR2Url = await uploadBufferToR2(thumbKey, thumbBuffer, 'image/jpeg');
            console.log(`[Process] Uploaded thumbnail ${i + 1} to R2: ${thumbKey}`);
          } catch (thumbR2Err: unknown) {
            const msg = thumbR2Err instanceof Error ? thumbR2Err.message : String(thumbR2Err);
            console.warn('[Process] R2 thumbnail upload skipped:', msg);
          }
        }
      } catch (thumbErr: unknown) {
        const msg = thumbErr instanceof Error ? thumbErr.message : String(thumbErr);
        console.error(`[Process] Thumbnail failed for clip ${i + 1}:`, msg);
      }

      // --- ADD TO PROCESSED LIST ---
      processedClips.push({
        ...clip,
        id: clipId,
        url: `/api/clips/${outputFileName}`,
        thumbnailUrl: `/api/clips/${outputFileName}/thumbnail`,
        fileName: outputFileName,
        r2Url: clipR2Url,
        thumbnailR2Url: thumbR2Url,
      });
    }

    // Save final metadata
    const metadataPath = join(clipsDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify({
      clips: processedClips,
      summaries: summaries || null,
      main_theme: main_theme || '',
      tone: tone || '',
      five_day_devotional: five_day_devotional || [],
      sermon_images: sermon_images || [],
      quotes_and_verses: quotes_and_verses || [],
      social_captions: social_captions || []
    }));

    progressManager.update(jobId, { 
      step: 'Cutting', 
      status: 'completed', 
      message: 'All clips processed successfully' 
    });

    return NextResponse.json({ success: true, jobId, clips: processedClips });
  } catch (error: unknown) {
    console.error('Process clips error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface WordEntry {
  word: string;
  start: number;
  end: number;
}

function generateSRT(words: WordEntry[], start: number, end: number) {
  if (!words) return '';
  
  const clipWords = words.filter(w => w.start >= start && w.end <= end);
  let srt = '';
  
  // Group words into short segments (e.g., 3-5 words)
  const groupSize = 3;
  for (let i = 0; i < clipWords.length; i += groupSize) {
    const group = clipWords.slice(i, i + groupSize);
    const index = Math.floor(i / groupSize) + 1;
    const startTime = formatTime(group[0].start - start);
    const endTime = formatTime(group[group.length - 1].end - start);
    const text = group.map(w => w.word).join(' ');
    
    srt += `${index}\n${startTime} --> ${endTime}\n${text}\n\n`;
  }
  
  return srt;
}

function formatTime(seconds: number) {
  const date = new Date(0);
  date.setSeconds(seconds);
  const ms = Math.floor((seconds % 1) * 1000);
  return date.toISOString().substr(11, 8) + ',' + ms.toString().padStart(3, '0');
}
