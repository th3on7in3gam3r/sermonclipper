-- Vesper Studio — EXPLAIN ANALYZE templates for the 5 most frequent queries
-- Run against a populated database after indexes are applied.
-- Target: Index Scan or Bitmap Index Scan — never Seq Scan on large tables.

-- Replace :user_id, :job_id, etc. with real UUIDs before running.

-- ---------------------------------------------------------------------------
-- Q1: Clip library (dashboard / Studio)
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.*
FROM clips c
WHERE c.user_id = :'user_id'
ORDER BY c.created_at DESC
LIMIT 50;
-- Expected: Index Scan using idx_clips_user_created

-- ---------------------------------------------------------------------------
-- Q2: Processing queue worker
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT s.id, s.job_id, s.user_id, s.processing_status, s.created_at
FROM sermon_sources s
WHERE s.processing_status IN ('queued', 'processing')
ORDER BY s.created_at ASC
LIMIT 10;
-- Expected: Index Scan using idx_sources_status

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT j.*
FROM processing_jobs j
WHERE j.queue_status IN ('queued', 'processing')
ORDER BY j.updated_at ASC
LIMIT 10;
-- Expected: Index Scan using idx_processing_jobs_queue

-- ---------------------------------------------------------------------------
-- Q3: Scheduled post scheduler (cron every minute)
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT sp.*
FROM scheduled_posts sp
WHERE sp.status = 'scheduled'
  AND sp.scheduled_at <= NOW()
ORDER BY sp.scheduled_at ASC
LIMIT 100;
-- Expected: Index Scan using idx_scheduled_posts_due

-- ---------------------------------------------------------------------------
-- Q4: Unread notification badge
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)::INT AS unread_count
FROM notifications n
WHERE n.user_id = :'user_id'
  AND n.read = FALSE;
-- Expected: Index Only Scan or Bitmap Index Scan on idx_notifications_unread

-- ---------------------------------------------------------------------------
-- Q5: Monthly quota reset cron
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.id, u.email, u.clips_used_this_month, u.quota_reset_at
FROM users u
WHERE u.clips_used_this_month > 0
  AND u.quota_reset_at <= NOW();
-- Expected: Index Scan using idx_users_quota_reset

-- ---------------------------------------------------------------------------
-- Bonus: Sermon archive (dashboard)
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT s.*
FROM sermon_sources s
WHERE s.user_id = :'user_id'
ORDER BY s.created_at DESC
LIMIT 30;
-- Expected: Index Scan using idx_sermon_sources_user_created

-- ---------------------------------------------------------------------------
-- Bonus: White-label Host header tenant lookup
-- ---------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT w.user_id, w.church_name, w.logo_url, w.primary_color
FROM white_label_settings w
WHERE w.custom_domain = :'domain'
  AND w.custom_domain_verified = TRUE;
-- Expected: Index Scan using idx_white_label_verified_domain

-- ---------------------------------------------------------------------------
-- If you see Seq Scan on clips, sermon_sources, notifications, or users:
--   1. Run ANALYZE on the table
--   2. Confirm partial index WHERE clause matches query filters exactly
--   3. Check row count — Postgres may seq-scan tiny tables (< ~1000 rows) by design
-- ---------------------------------------------------------------------------
