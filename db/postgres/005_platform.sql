-- Platform features: API keys, moderation, audit, beta, collections
-- Run after 001-003 when migrating to Postgres

BEGIN;

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  last4 TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'test')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);

CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('pass', 'flag', 'block')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'cleared', 'blocked', 'approved')),
  automated BOOLEAN NOT NULL DEFAULT TRUE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_pending ON moderation_log(status) WHERE status = 'pending_review';

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);

CREATE TABLE beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  works_well TEXT,
  confusing TEXT,
  missing TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_church_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_usage_frequency TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_changelog_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_feedback_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_bible_translation TEXT DEFAULT 'ESV';

ALTER TABLE sermon_sources ADD COLUMN IF NOT EXISTS manuscript_text TEXT;

CREATE TABLE clip_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_clip_id TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clip_collection_items (
  collection_id UUID NOT NULL REFERENCES clip_collections(id) ON DELETE CASCADE,
  clip_id TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, clip_id)
);

COMMIT;
