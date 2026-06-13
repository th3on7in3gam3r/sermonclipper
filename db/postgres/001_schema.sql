-- Vesper Studio — normalized Postgres schema
-- Maps from MongoDB models + planned features (Postgres target state)
-- Run: psql $DATABASE_URL -f db/postgres/001_schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------------------------------------------------------------------------
-- Enum-like domains (CHECK constraints keep migrations simple)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Accounts / Auth
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id              TEXT UNIQUE NOT NULL,
  email                 CITEXT UNIQUE NOT NULL,
  name                  TEXT,
  avatar_url            TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'creator', 'church_pro')),
  subscription_status   TEXT NOT NULL DEFAULT 'active'
                          CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  clips_used_this_month INT NOT NULL DEFAULT 0 CHECK (clips_used_this_month >= 0),
  quota_reset_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_email_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  email_unsubscribed    BOOLEAN NOT NULL DEFAULT FALSE,
  email_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  referral_code         TEXT UNIQUE,
  referred_by_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_rewarded     BOOLEAN NOT NULL DEFAULT FALSE,
  referral_upgrade_count INT NOT NULL DEFAULT 0,
  last_recap_month      TEXT,
  last_active_at        TIMESTAMPTZ,
  last_seen_changelog_date DATE,
  shortcuts_tip_shown   BOOLEAN NOT NULL DEFAULT FALSE,
  quota_warning_sent_at TIMESTAMPTZ,
  quota_reached_sent_at TIMESTAMPTZ,
  is_admin              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_onboarding_checklist (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  uploaded_sermon       BOOLEAN NOT NULL DEFAULT FALSE,
  created_clip          BOOLEAN NOT NULL DEFAULT FALSE,
  customized_caption    BOOLEAN NOT NULL DEFAULT FALSE,
  exported_reel         BOOLEAN NOT NULL DEFAULT FALSE,
  connected_social      BOOLEAN NOT NULL DEFAULT FALSE,
  invited_team_member   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_email_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sequence_day          INT NOT NULL CHECK (sequence_day BETWEEN 1 AND 30),
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sequence_day)
);

-- OAuth tokens (YouTube, Instagram, TikTok, Planning Center)
CREATE TABLE oauth_connections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL
                          CHECK (provider IN ('youtube', 'instagram', 'tiktok', 'planning_center')),
  access_token          TEXT NOT NULL,
  refresh_token         TEXT,
  token_expires_at      TIMESTAMPTZ,
  scopes                TEXT[],
  provider_account_id   TEXT,
  connected_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at       TIMESTAMPTZ,
  UNIQUE (user_id, provider)
);

-- ---------------------------------------------------------------------------
-- White label (Church Pro)
-- ---------------------------------------------------------------------------
CREATE TABLE white_label_settings (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  church_name           TEXT,
  logo_url              TEXT,
  primary_color         TEXT,
  custom_domain         CITEXT,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  custom_domain_verified_at TIMESTAMPTZ,
  email_domain          CITEXT,
  email_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_reply_to        CITEXT,
  show_powered_by       BOOLEAN NOT NULL DEFAULT TRUE,
  default_thumbnail_style JSONB,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Teams (Church Pro)
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL DEFAULT 'My Team',
  seat_limit            INT NOT NULL DEFAULT 5 CHECK (seat_limit > 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id               UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  email                 CITEXT NOT NULL,
  name                  TEXT,
  role                  TEXT NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at           TIMESTAMPTZ,
  UNIQUE (team_id, email),
  UNIQUE (team_id, user_id)
);

CREATE TABLE team_invites (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id               UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token                 UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email                 CITEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ NOT NULL,
  accepted_at           TIMESTAMPTZ,
  UNIQUE (team_id, email)
);

-- ---------------------------------------------------------------------------
-- Brand kits
-- ---------------------------------------------------------------------------
CREATE TABLE brand_kits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  logo_url              TEXT,
  primary_color         TEXT,
  accent_color          TEXT,
  font_family           TEXT,
  default_caption_template TEXT,
  default_filter        TEXT,
  default_animation     TEXT,
  watermark_position    TEXT NOT NULL DEFAULT 'bottom-right'
                          CHECK (watermark_position IN (
                            'top-left', 'top-right', 'bottom-left', 'bottom-right', 'none'
                          )),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Sermon sources & processing
-- ---------------------------------------------------------------------------
CREATE TABLE sermon_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id               UUID REFERENCES teams(id) ON DELETE SET NULL,
  job_id                TEXT NOT NULL UNIQUE,
  title                 TEXT,
  speaker               TEXT,
  series_name           TEXT,
  main_theme            TEXT,
  source_type           TEXT NOT NULL CHECK (source_type IN ('upload', 'youtube')),
  youtube_url           TEXT,
  storage_key           TEXT,
  video_url             TEXT,
  duration_seconds      INT CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  file_size_bytes       BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  processing_status     TEXT NOT NULL DEFAULT 'queued'
                          CHECK (processing_status IN ('queued', 'processing', 'complete', 'failed')),
  error_message         TEXT,
  retry_count           INT NOT NULL DEFAULT 0,
  created_by_name       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Async worker state (maps JobProgress)
CREATE TABLE processing_jobs (
  job_id                TEXT PRIMARY KEY,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  sermon_source_id      UUID REFERENCES sermon_sources(id) ON DELETE CASCADE,
  queue_status          TEXT NOT NULL DEFAULT 'queued'
                          CHECK (queue_status IN ('queued', 'processing', 'complete', 'failed')),
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'loading', 'completed', 'error')),
  step                  TEXT NOT NULL DEFAULT 'Initializing',
  message               TEXT NOT NULL DEFAULT '',
  progress              INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  payload               JSONB,
  analysis              JSONB,
  output_urls           TEXT[] NOT NULL DEFAULT '{}',
  final_storage_key     TEXT,
  retry_count           INT NOT NULL DEFAULT 0,
  error_message         TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sermon-level AI analysis blob (summary, devotional, carousel, etc.)
CREATE TABLE sermon_analyses (
  sermon_source_id      UUID PRIMARY KEY REFERENCES sermon_sources(id) ON DELETE CASCADE,
  summary               TEXT,
  tone                  TEXT,
  analysis_json         JSONB NOT NULL DEFAULT '{}',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Clips
-- ---------------------------------------------------------------------------
CREATE TABLE clips (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sermon_source_id      UUID NOT NULL REFERENCES sermon_sources(id) ON DELETE CASCADE,
  sort_index            INT NOT NULL DEFAULT 0,
  title                 TEXT,
  hook_title            TEXT,
  main_quote            TEXT,
  engagement_hook       TEXT,
  start_time_seconds    NUMERIC(10, 3) NOT NULL,
  end_time_seconds      NUMERIC(10, 3) NOT NULL,
  duration_seconds      NUMERIC(10, 3) GENERATED ALWAYS AS (end_time_seconds - start_time_seconds) STORED,
  impact_score          INT CHECK (impact_score IS NULL OR impact_score BETWEEN 0 AND 100),
  caption_text          TEXT,
  caption_template      TEXT,
  color_grade           TEXT,
  font_family           TEXT,
  animation             TEXT,
  storage_key           TEXT,
  thumbnail_key         TEXT,
  reel_cover_key        TEXT,
  export_count          INT NOT NULL DEFAULT 0,
  search_vector         TSVECTOR,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sermon_source_id, sort_index)
);

CREATE TABLE clip_platform_captions (
  clip_id               UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL
                          CHECK (platform IN ('tiktok', 'instagram', 'youtube_shorts', 'x', 'facebook')),
  caption               TEXT NOT NULL,
  PRIMARY KEY (clip_id, platform)
);

CREATE TABLE clip_exports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id               UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key           TEXT,
  render_url            TEXT,
  template              TEXT,
  filter_name           TEXT,
  font_family           TEXT,
  animation             TEXT,
  trim_start_seconds    NUMERIC(10, 3),
  trim_end_seconds      NUMERIC(10, 3),
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'loading', 'complete', 'error')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clip_thumbnails (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id               UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source                TEXT NOT NULL CHECK (source IN ('frame', 'ai', 'canvas')),
  storage_key           TEXT,
  public_url            TEXT,
  style                 TEXT,
  frame_time_seconds    NUMERIC(10, 3),
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- YouTube thumbnail A/B tracking
CREATE TABLE youtube_thumbnail_tests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clip_id               UUID REFERENCES clips(id) ON DELETE SET NULL,
  youtube_video_id      TEXT NOT NULL,
  thumbnail_url         TEXT,
  ctr                   NUMERIC(6, 4),
  has_text_overlay      BOOLEAN NOT NULL DEFAULT FALSE,
  style_json            JSONB,
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Scheduled posts
-- ---------------------------------------------------------------------------
CREATE TABLE scheduled_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clip_id               UUID REFERENCES clips(id) ON DELETE SET NULL,
  platform              TEXT NOT NULL
                          CHECK (platform IN ('instagram', 'tiktok', 'youtube_shorts', 'x', 'facebook')),
  caption               TEXT,
  scheduled_at          TIMESTAMPTZ NOT NULL,
  posted_at             TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'posted', 'failed', 'canceled')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,
  message               TEXT NOT NULL,
  link                  TEXT,
  read                  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Webhooks
-- ---------------------------------------------------------------------------
CREATE TABLE webhooks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url                   TEXT NOT NULL,
  events                TEXT[] NOT NULL,
  secret                TEXT NOT NULL,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id            UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event                 TEXT NOT NULL,
  payload               JSONB NOT NULL DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'success', 'failed')),
  attempts              INT NOT NULL DEFAULT 0,
  last_error            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Feature flags & experiments
-- ---------------------------------------------------------------------------
CREATE TABLE feature_flags (
  flag_name             TEXT PRIMARY KEY,
  enabled               BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percentage    INT NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  description           TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ab_test_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name             TEXT NOT NULL,
  variant               TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  event_type            TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'signup')),
  anonymous_id          TEXT,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Feedback & NPS
-- ---------------------------------------------------------------------------
CREATE TABLE nps_responses (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score                 INT NOT NULL CHECK (score BETWEEN 0 AND 10),
  feedback              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE help_article_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL,
  helpful               BOOLEAN NOT NULL,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
