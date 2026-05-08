# SermonClipper

SermonClipper is a full-stack web application built with Next.js 14 that automatically transcribes video sermons and uses AI to identify and extract the most engaging segments for social media (9:16 format).

## Features

- **Upload or Link:** Support for local video file uploads or YouTube URLs.
- **AI Transcription:** Uses OpenAI Whisper for accurate, word-level transcription.
- **Smart Analysis:** Powered by Anthropic Claude (Claude 3.5 Sonnet) to find the most impactful moments.
- **Automated Video Editing:** Automatically cuts clips, crops to 9:16, and burns in captions using FFmpeg.
- **Real-time Progress:** Live updates via Server-Sent Events (SSE).

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js (v18+)**: [Download Node.js](https://nodejs.org/)
2. **FFmpeg**: 
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
3. **Python 3**: Needed for `yt-dlp` (YouTube downloads).
4. **yt-dlp**: `brew install yt-dlp` (or follow [installation guide](https://github.com/yt-dlp/yt-dlp))

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sermon-clipper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

   If you want to download YouTube videos reliably when YouTube detects bot-like traffic, also add one of these:
   ```env
   YTDLP_COOKIES_PATH=/path/to/youtube_cookies.txt
   # or
   YTDLP_COOKIES_BROWSER=chrome
   ```

   - `YTDLP_COOKIES_PATH` uses a cookies file exported from Chrome/Firefox.
   - `YTDLP_COOKIES_BROWSER` uses yt-dlp’s browser cookie extraction when available on the host.

   If neither value is set, some YouTube downloads may fail with a bot-block error.


4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying on Koyeb
If you deploy on Koyeb and want YouTube downloads to work for videos behind anti-bot checks, provide cookies to `yt-dlp` using one of these environment variables:

- `YTDLP_COOKIES_PATH=/path/to/youtube_cookies.txt`
- `YTDLP_COOKIES_BROWSER=chrome`

On Koyeb, you can:

1. Upload a cookies file as a mounted secret or volume.
2. Set `YTDLP_COOKIES_PATH` to the mounted file path.
3. Or set `YTDLP_COOKIES_BROWSER` if `yt-dlp` can access the host browser cookie store.

> Note: browser console errors are limited for server-side failures. Check your Koyeb logs for the exact yt-dlp error message and the route stack trace.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Transcription:** OpenAI Whisper
- **AI Analysis:** Anthropic Claude 3.5 Sonnet
- **Video Processing:** fluent-ffmpeg / FFmpeg
- **YouTube Downloads:** yt-dlp

## License

MIT
