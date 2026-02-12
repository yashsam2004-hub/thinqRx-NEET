-- AI Cache Table for reducing OpenAI/Anthropic API costs
-- Caches AI-generated study notes, explanations, and summaries

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  content_type TEXT NOT NULL, -- 'note', 'explanation', 'summary'
  exam TEXT NOT NULL, -- 'GPAT'
  subject TEXT NOT NULL, -- 'Pharmacology', 'Pharmaceutics', etc.
  topic TEXT, -- Optional: specific topic
  version TEXT NOT NULL DEFAULT 'V1', -- Allows regeneration
  metadata JSONB, -- Additional data like tokens used, model, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_exam_subject ON public.ai_cache(exam, subject);
CREATE INDEX idx_ai_cache_content_type ON public.ai_cache(content_type);

-- RLS Policies (read-only for authenticated users, write for service role)
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read cached content
CREATE POLICY "Authenticated users can read ai_cache"
  ON public.ai_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update cache
CREATE POLICY "Service role can manage ai_cache"
  ON public.ai_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to generate deterministic cache key
CREATE OR REPLACE FUNCTION generate_cache_key(
  p_content_type TEXT,
  p_exam TEXT,
  p_subject TEXT,
  p_topic TEXT DEFAULT NULL,
  p_version TEXT DEFAULT 'V1'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_topic IS NOT NULL THEN
    RETURN p_content_type || ':' || p_exam || ':' || p_subject || ':' || p_topic || ':' || p_version;
  ELSE
    RETURN p_content_type || ':' || p_exam || ':' || p_subject || ':' || p_version;
  END IF;
END;
$$;

COMMENT ON TABLE public.ai_cache IS 'Caches AI-generated content to reduce API costs';
COMMENT ON COLUMN public.ai_cache.cache_key IS 'Deterministic key: content_type:exam:subject:topic:version';
COMMENT ON COLUMN public.ai_cache.content IS 'AI-generated content stored as JSONB';
COMMENT ON COLUMN public.ai_cache.version IS 'Version for content regeneration (V1, V2, etc.)';
