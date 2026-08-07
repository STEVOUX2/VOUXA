-- =====================================================
-- VOUXA Watch Parties Foreign Key Fix
-- Run this in your Supabase SQL Editor
-- =====================================================

-- This script fixes the foreign key constraint that fails when 
-- NextAuth users try to create a Watch Party.

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- 1. Find the exact name of the foreign key constraint on host_id
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'watch_parties'
    AND kcu.column_name = 'host_id'
    AND tc.constraint_type = 'FOREIGN KEY';
  
  -- 2. Drop the old constraint that points to auth.users
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.watch_parties DROP CONSTRAINT ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped old FK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No FK constraint found for host_id on watch_parties.';
  END IF;

  -- 3. Add the correct constraint pointing to public.profiles
  -- Using ON DELETE CASCADE so if a user deletes their account, their watch parties are deleted
  ALTER TABLE public.watch_parties 
    ADD CONSTRAINT watch_parties_host_id_fkey 
    FOREIGN KEY (host_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Successfully added correct foreign key pointing to public.profiles';
END $$;
