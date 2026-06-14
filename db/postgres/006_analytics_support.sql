-- Clip metrics snapshots for analytics trends (Postgres target; Mongo is runtime today)
CREATE TABLE IF NOT EXISTS clip_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  clip_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  saves BIGINT NOT NULL DEFAULT 0,
  watch_time_seconds BIGINT NOT NULL DEFAULT 0,
  avg_view_duration_seconds INT NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  completion_rate REAL NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clip_metrics_clip_platform_time
  ON clip_metrics (clip_id, platform, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_clip_metrics_user_time
  ON clip_metrics (user_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan TEXT,
  priority BOOLEAN NOT NULL DEFAULT FALSE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
