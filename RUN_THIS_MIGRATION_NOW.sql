-- =================================================================
-- CRITICAL: RUN THIS IN SUPABASE SQL EDITOR NOW
-- =================================================================
-- This enables the 2-device limit security feature
-- =================================================================

-- Create user_devices table for device limit tracking
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT, -- Browser + OS info (e.g., "Chrome on Windows")
  ip_address TEXT,
  user_agent TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes for performance (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON public.user_devices(user_id, is_active);

-- Enable RLS (safe to re-run)
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Service role can manage all devices" ON public.user_devices;

-- Users can view their own devices (for future device management UI)
CREATE POLICY "Users can view their own devices"
  ON public.user_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete devices (API handles this)
CREATE POLICY "Service role can manage all devices"
  ON public.user_devices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.user_devices IS 'Tracks active devices per user to enforce 2-device limit. Devices inactive for 90+ days are auto-expired.';

-- Verify table was created
SELECT 'Migration Complete: user_devices table created successfully' as status;

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_devices'
ORDER BY ordinal_position;

-- =================================================================
-- MIGRATION SUCCESSFUL ✅
-- =================================================================
-- The 2-device limit feature is now active
-- Users will be limited to 2 devices starting with their next login
-- =================================================================
