-- Vesper Studio — indexes & partial indexes for hot query paths
-- Run after 001_schema.sql and 003_triggers.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Foreign keys (Postgres indexes FK columns automatically on referencing side
-- for some ops, but explicit indexes help JOIN + CASCADE performance)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_user_onboarding_checklist_user ON user_onboarding_checklist(user_id);
CREATE INDEX idx_onboarding_email_log_user ON onboarding_email_log(user_id);
CREATE INDEX idx_oauth_connections_user ON oauth_connections(user_id);
CREATE INDEX idx_white_label_settings_user ON white_label_settings(user_id);
CREATE INDEX idx_teams_owner ON teams(owner_user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_invites_team ON team_invites(team_id);
CREATE INDEX idx_brand_kits_user ON brand_kits(user_id);
CREATE INDEX idx_sermon_sources_user ON sermon_sources(user_id);
CREATE INDEX idx_sermon_sources_team ON sermon_sources(team_id);
CREATE INDEX idx_processing_jobs_user ON processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_sermon ON processing_jobs(sermon_source_id);
CREATE INDEX idx_sermon_analyses_sermon ON sermon_analyses(sermon_source_id);
CREATE INDEX idx_clips_sermon ON clips(sermon_source_id);
CREATE INDEX idx_clip_platform_captions_clip ON clip_platform_captions(clip_id);
CREATE INDEX idx_clip_exports_clip ON clip_exports(clip_id);
CREATE INDEX idx_clip_exports_user ON clip_exports(user_id);
CREATE INDEX idx_clip_thumbnails_clip ON clip_thumbnails(clip_id);
CREATE INDEX idx_clip_thumbnails_user ON clip_thumbnails(user_id);
CREATE INDEX idx_youtube_thumbnail_tests_user ON youtube_thumbnail_tests(user_id);
CREATE INDEX idx_youtube_thumbnail_tests_clip ON youtube_thumbnail_tests(clip_id);
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_clip ON scheduled_posts(clip_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_user ON webhook_deliveries(user_id);
CREATE INDEX idx_ab_test_events_user ON ab_test_events(user_id);
CREATE INDEX idx_help_article_feedback_slug ON help_article_feedback(slug);

-- ---------------------------------------------------------------------------
-- Auth & billing lookups
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_users_referred_by ON users(referred_by_id) WHERE referred_by_id IS NOT NULL;
CREATE INDEX idx_users_plan ON users(plan);

-- White-label tenant routing (Host header lookup)
CREATE UNIQUE INDEX idx_white_label_verified_domain
  ON white_label_settings(custom_domain)
  WHERE custom_domain_verified = TRUE AND custom_domain IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 1. Clip library — every Studio visit
-- SELECT * FROM clips WHERE user_id = $1 ORDER BY created_at DESC
-- ---------------------------------------------------------------------------
CREATE INDEX idx_clips_user_created ON clips(user_id, created_at DESC);

-- Clips for a sermon results page
CREATE INDEX idx_clips_sermon_sort ON clips(sermon_source_id, sort_index);

-- Full-text search
CREATE INDEX clips_search_idx ON clips USING GIN(search_vector);

-- ---------------------------------------------------------------------------
-- 2. Processing queue — worker polls frequently
-- SELECT * FROM sermon_sources WHERE processing_status IN ('queued','processing')
--   ORDER BY created_at LIMIT $n
-- ---------------------------------------------------------------------------
CREATE INDEX idx_sources_status ON sermon_sources(processing_status, created_at)
  WHERE processing_status IN ('queued', 'processing');

CREATE INDEX idx_processing_jobs_queue ON processing_jobs(queue_status, updated_at)
  WHERE queue_status IN ('queued', 'processing');

-- Job lookup by id (progress polling)
CREATE INDEX idx_processing_jobs_updated ON processing_jobs(updated_at DESC);

-- Sermon archive dashboard
CREATE INDEX idx_sermon_sources_user_created ON sermon_sources(user_id, created_at DESC);
CREATE INDEX idx_sermon_sources_job ON sermon_sources(job_id);

-- ---------------------------------------------------------------------------
-- 3. Scheduled posts — scheduler runs every minute
-- SELECT * FROM scheduled_posts WHERE status = 'scheduled' AND scheduled_at <= NOW()
-- ---------------------------------------------------------------------------
CREATE INDEX idx_scheduled_posts_due ON scheduled_posts(scheduled_at, status)
  WHERE status = 'scheduled';

-- ---------------------------------------------------------------------------
-- 4. Notifications — unread badge on every page
-- SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE
-- ---------------------------------------------------------------------------
CREATE INDEX idx_notifications_unread ON notifications(user_id, read)
  WHERE read = FALSE;

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Monthly quota reset — nightly cron
-- SELECT id FROM users WHERE quota_reset_at <= NOW() AND clips_used_this_month > 0
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_quota_reset ON users(quota_reset_at)
  WHERE clips_used_this_month > 0;

-- ---------------------------------------------------------------------------
-- Additional hot paths from current Vesper API
-- ---------------------------------------------------------------------------

-- Team access: find teams for member
CREATE INDEX idx_team_members_user_accepted ON team_members(user_id, accepted_at)
  WHERE accepted_at IS NOT NULL;

-- Webhook delivery log
CREATE INDEX idx_webhook_deliveries_user_created ON webhook_deliveries(user_id, created_at DESC);

-- Admin metrics
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_ab_test_events_test_created ON ab_test_events(test_name, created_at DESC);
CREATE INDEX idx_nps_responses_created ON nps_responses(created_at DESC);

-- YouTube insights per clip
CREATE INDEX idx_youtube_thumbnail_tests_user_clip ON youtube_thumbnail_tests(user_id, clip_id, uploaded_at DESC);

-- OAuth provider lookup
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(user_id, provider)
  WHERE disconnected_at IS NULL;

COMMIT;
