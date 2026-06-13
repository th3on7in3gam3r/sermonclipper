-- Vesper Studio — triggers & helper functions

BEGIN;

-- ---------------------------------------------------------------------------
-- Auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER sermon_sources_updated_at
  BEFORE UPDATE ON sermon_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER clips_updated_at
  BEFORE UPDATE ON clips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER white_label_settings_updated_at
  BEFORE UPDATE ON white_label_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Full-text search on clips
-- ---------------------------------------------------------------------------
CREATE TRIGGER clips_search_update
  BEFORE INSERT OR UPDATE OF title, hook_title, main_quote, caption_text ON clips
  FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(
      search_vector,
      'pg_catalog.english',
      title,
      hook_title,
      main_quote,
      caption_text
    );

COMMIT;
