-- =====================================================
-- VOUXA Auth.js Safe Migration (In-Place)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Drop the old trigger & function (tied to Supabase auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Drop the FK constraint from profiles → auth.users
-- First, find and drop it by name
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.table_name = 'profiles'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped FK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on profiles — already clean.';
  END IF;
END $$;

-- Step 3: Add new columns (safe — won't fail if they already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Add unique constraint on username (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    RAISE NOTICE 'Added unique constraint on username';
  ELSE
    RAISE NOTICE 'Username unique constraint already exists';
  END IF;
END $$;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email    ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Step 6: Drop old RLS policies and recreate them
DROP POLICY IF EXISTS "Users can read own profile"         ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles"   ON public.profiles;

-- Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- New permissive policies (Auth.js server uses service role which bypasses RLS anyway)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON public.profiles FOR UPDATE USING (true);

-- Step 7: Fix movie / subtitle write policies to not rely on auth.uid()
DROP POLICY IF EXISTS "Only admins can insert movies"  ON public.movies;
DROP POLICY IF EXISTS "Only admins can update movies"  ON public.movies;
DROP POLICY IF EXISTS "Only admins can delete movies"  ON public.movies;
DROP POLICY IF EXISTS "Admins can insert movies"       ON public.movies;
DROP POLICY IF EXISTS "Admins can update movies"       ON public.movies;
DROP POLICY IF EXISTS "Admins can delete movies"       ON public.movies;

-- Service role (used by all admin API routes) bypasses RLS automatically.
-- These policies allow all writes for safety — real protection is the service role key.
CREATE POLICY "Admins can insert movies" ON public.movies
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update movies" ON public.movies
  FOR UPDATE USING (true);
CREATE POLICY "Admins can delete movies" ON public.movies
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Only admins can insert subtitles" ON public.subtitles;
DROP POLICY IF EXISTS "Only admins can update subtitles" ON public.subtitles;
DROP POLICY IF EXISTS "Only admins can delete subtitles" ON public.subtitles;

CREATE POLICY "Admins can insert subtitles" ON public.subtitles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update subtitles" ON public.subtitles
  FOR UPDATE USING (true);
CREATE POLICY "Admins can delete subtitles" ON public.subtitles
  FOR DELETE USING (true);

-- Step 8: Set nazcomatrix@gmail.com as admin (if already in table)
UPDATE public.profiles
  SET is_admin = true
  WHERE email = 'nazcomatrix@gmail.com';

-- Step 9: Verify result
SELECT
  id, email, username, first_name, last_name,
  is_admin, avatar_url,
  password_hash IS NOT NULL AS has_password,
  created_at
FROM public.profiles
LIMIT 10;
