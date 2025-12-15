-- Portfolio Analytics Migration
-- Run this SQL in your Supabase SQL Editor to create the analytics table and secure functions

-- 1. Create the portfolio_analytics table
CREATE TABLE IF NOT EXISTS public.portfolio_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  view_count BIGINT DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Insert initial row if it doesn't exist (ensure single row)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio_analytics) THEN
    INSERT INTO public.portfolio_analytics (view_count) VALUES (0);
  END IF;
END $$;

-- 3. Create function to increment views atomically (thread-safe)
-- Uses SECURITY DEFINER to bypass RLS and update the table
CREATE OR REPLACE FUNCTION public.increment_portfolio_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the first (and should be only) row
  UPDATE public.portfolio_analytics
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = (SELECT id FROM public.portfolio_analytics ORDER BY created_at ASC LIMIT 1);
  
  -- If no row exists, create one (safety fallback)
  IF NOT FOUND THEN
    INSERT INTO public.portfolio_analytics (view_count) VALUES (1);
  END IF;
END;
$$;

-- 4. Enable Row Level Security
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Deny public read access" ON public.portfolio_analytics;
DROP POLICY IF EXISTS "Deny public write access" ON public.portfolio_analytics;
DROP POLICY IF EXISTS "Admin users can read analytics" ON public.portfolio_analytics;

-- 6. Create RLS Policy: Deny all direct access by default
-- This prevents public users from reading or modifying the table
CREATE POLICY "Deny public read access"
ON public.portfolio_analytics
FOR SELECT
USING (false);

CREATE POLICY "Deny public write access"
ON public.portfolio_analytics
FOR ALL
USING (false)
WITH CHECK (false);

-- 7. Create RLS Policy: Authenticated admin users can read analytics
-- This checks if the user is in the admin_users table
CREATE POLICY "Admin users can read analytics"
ON public.portfolio_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.email = (auth.jwt() ->> 'email')
    AND admin_users.role = 'admin'
  )
);

-- 8. Grant execute permission on the function to anonymous and authenticated users
-- This allows anyone to call the increment function, but RLS prevents direct table access
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views() TO anon;
GRANT EXECUTE ON FUNCTION public.increment_portfolio_views() TO authenticated;

-- Summary:
-- - Public (anonymous) users can call increment_portfolio_views() function to increment views
-- - Public users CANNOT read or modify the portfolio_analytics table directly (blocked by RLS)
-- - Only authenticated admin users (verified via admin_users table) can read analytics
-- - The increment function uses SECURITY DEFINER to bypass RLS and update the counter atomically
-- - Thread-safe: Concurrent increments are handled safely by PostgreSQL

