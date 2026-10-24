import type { SermonClip, UserStatus } from '@/lib/studio/types';
import type { QuotableMoment } from '@/lib/quotes/extractQuotables';

/** A clip as returned by analysis (no index yet). */
export type AnalysisClip = Omit<SermonClip, 'index'> & {
  start_time?: string | number;
  end_time?: string | number;
  is_audio?: boolean;
  [key: string]: unknown;
};

/** A clip paired with its position in the analysis — what most UI handlers need. */
export type IndexedClip = AnalysisClip & { index: number };

export type SermonAnalysis = {
  clips?: AnalysisClip[];
  sermon_title?: string;
  main_theme?: string;
  summary?: string;
  speaker?: string;
  church_name?: string;
  source_type?: string;
  quotable_moments?: QuotableMoment[];
  [key: string]: unknown;
};

export type ResultsUserStatus = UserStatus & { [key: string]: unknown };

export type ThumbnailEntry = {
  status: string;
  url?: string;
  variants?: string[];
  reelCoverUrl?: string;
};

export type CarouselData = {
  slides: { slide_number: number; heading: string; content: string }[];
  post_caption: string;
};
