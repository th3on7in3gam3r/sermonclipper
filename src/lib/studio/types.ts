export interface SermonClip {
  start: string | number;
  end: string | number;
  hook_title?: string;
  main_quote?: string;
  suggested_captions?: string[];
  engagement_hook?: string;
  viral_score?: number;
  index: number;
}

export interface ExportSettings {
  template: string;
  filter: string;
  font: string;
  animation: string;
  trimStart: number;
  trimEnd: number;
  caption: string;
}

export interface RenderState {
  status: string;
  url?: string;
  error?: string;
}

export interface UserStatus {
  youtubeConnected?: boolean;
  plan?: string | null;
  usageCount?: number;
  limit?: number;
  lastUsageReset?: string;
  isAdmin?: boolean;
}
