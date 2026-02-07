-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.name IS 'User full name';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);
