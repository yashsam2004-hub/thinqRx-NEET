-- Bookmarks/Saved Content System
-- Allows users to bookmark/save important notes sections or concepts

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  
  -- Content details
  section_title TEXT NOT NULL,
  content_text TEXT NOT NULL, -- Up to 100MB technically, but we'll store text
  content_type TEXT NOT NULL CHECK (content_type IN ('note_section', 'concept', 'formula', 'exam_tip', 'custom')),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  color_tag TEXT, -- For visual organization (purple, blue, green, etc.)
  notes TEXT, -- User's personal notes about why they bookmarked this
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id, section_title)
);

-- Indexes for performance
CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_topic_id ON public.user_bookmarks(topic_id);
CREATE INDEX idx_user_bookmarks_created_at ON public.user_bookmarks(created_at DESC);
CREATE INDEX idx_user_bookmarks_content_type ON public.user_bookmarks(content_type);
CREATE INDEX idx_user_bookmarks_tags ON public.user_bookmarks USING GIN(tags);

-- RLS Policies
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.user_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
  ON public.user_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON public.user_bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.user_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_bookmarks_timestamp
  BEFORE UPDATE ON public.user_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_bookmarks_updated_at();

-- Comments
COMMENT ON TABLE public.user_bookmarks IS 'User bookmarked content from notes - up to 100MB per user';
COMMENT ON COLUMN public.user_bookmarks.content_text IS 'The actual content saved (text format, supports large content)';
COMMENT ON COLUMN public.user_bookmarks.color_tag IS 'Color for visual organization: purple, blue, green, orange, red, yellow';
COMMENT ON COLUMN public.user_bookmarks.tags IS 'User-defined tags for organization (e.g., ["important", "exam", "difficult"])';

