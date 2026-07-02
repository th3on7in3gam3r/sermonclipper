import { MAX_DIRECT_UPLOAD_LABEL } from '@/lib/uploadLimits';

/** Free browser-based converter — paste a YouTube link, download MP3/MP4 locally. */
export const YOUTUBE_CONVERTER_URL = 'https://media.ytmp3.gg/';

export const HANDBRAKE_URL = 'https://handbrake.fr/';

export type PrepareFileStep = {
  title: string;
  detail: string;
  link?: { href: string; label: string };
};

export const PREPARE_FILE_STEPS: PrepareFileStep[] = [
  {
    title: 'Copy your YouTube sermon link',
    detail: 'Grab the full video URL from YouTube (Share → Copy link).',
  },
  {
    title: 'Convert to MP3 or MP4',
    detail:
      'Paste the link into a free converter, choose MP4 (video) or MP3/M4A (audio), and download the file to your computer.',
    link: { href: YOUTUBE_CONVERTER_URL, label: 'Open media.ytmp3.gg' },
  },
  {
    title: `Compress under ${MAX_DIRECT_UPLOAD_LABEL} if needed`,
    detail: `Long sermons can exceed 1GB. Use HandBrake (free), try the Fast 720p30 preset, and export until the file is under ${MAX_DIRECT_UPLOAD_LABEL}.`,
    link: { href: HANDBRAKE_URL, label: 'Get HandBrake' },
  },
  {
    title: 'Upload to Vesper',
    detail:
      'Use Upload file above, drop your MP4/M4A/MP3, and let Vesper find clips and export reels. On desktop, very large files may open our segment trimmer first.',
  },
];

export const YOUTUBE_PREVIEW_ONLY_NOTE =
  'YouTube links here are preview-only — no reel export. Follow the steps below, then use Upload file.';

export const UPLOAD_PREP_SUMMARY =
  'Have a YouTube link? Convert to MP4 or MP3 first, compress with HandBrake if needed, then upload here.';
