// app/api/transcribe/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Transcribe API called");

    const body = await req.json();
    const { filePath, jobId } = body;

    console.log("📁 File path:", filePath);
    console.log("🆔 Job ID:", jobId);

    if (!filePath) {
      return Response.json({ error: "No file path provided" }, { status: 400 });
    }

    // TODO: Your transcription logic here (FFmpeg + Whisper, etc.)

    // For now, just return success so we can see if it passes this point
    return Response.json({
      success: true,
      message: "Transcription started",
      jobId: jobId || "temp-" + Date.now(),
      longSermonMode: false,
      durationSeconds: 0,
      transcription: {
        text: "This is a mock transcription for testing purposes. In a real implementation, this would contain the full transcribed text from the audio file.",
        words: [
          { word: "This", start: 0, end: 0.5 },
          { word: "is", start: 0.5, end: 1 },
          { word: "a", start: 1, end: 1.2 },
          { word: "mock", start: 1.2, end: 1.8 },
          { word: "transcription", start: 1.8, end: 2.5 }
        ]
      }
    });

  } catch (error: any) {
    console.error("🔥 TRANSCRIBE API ERROR:", error);
    console.error("Stack:", error?.stack);
    console.error("Message:", error?.message);

    return Response.json({
      error: "Transcription failed",
      message: error?.message || "Unknown error occurred",
      code: error?.code
    }, { status: 500 });
  }
}
