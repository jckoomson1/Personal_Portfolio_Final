-- Create selected_work table for the Selected Work tab
-- Run this in your Supabase SQL Editor

-- Create selected_work table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.selected_work (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add missing columns if table already exists (for existing tables)
DO $$ 
BEGIN
  -- Add category column if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'selected_work' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.selected_work 
    ADD COLUMN category TEXT DEFAULT '';
  END IF;

  -- Add tags column if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'selected_work' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.selected_work 
    ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Add image_url column if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'selected_work' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.selected_work 
    ADD COLUMN image_url TEXT DEFAULT '';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'selected_work' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.selected_work 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.selected_work ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read selected_work" ON public.selected_work;
DROP POLICY IF EXISTS "Allow authenticated users to insert selected_work" ON public.selected_work;
DROP POLICY IF EXISTS "Allow authenticated users to update selected_work" ON public.selected_work;
DROP POLICY IF EXISTS "Allow authenticated users to delete selected_work" ON public.selected_work;
DROP POLICY IF EXISTS "Allow public read access to selected_work" ON public.selected_work;

-- Policy 1: Allow authenticated users to read selected_work
CREATE POLICY "Allow authenticated users to read selected_work"
ON public.selected_work
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to insert selected_work
CREATE POLICY "Allow authenticated users to insert selected_work"
ON public.selected_work
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update selected_work
CREATE POLICY "Allow authenticated users to update selected_work"
ON public.selected_work
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete selected_work
CREATE POLICY "Allow authenticated users to delete selected_work"
ON public.selected_work
FOR DELETE
TO authenticated
USING (true);

-- Policy 5: Allow public read access (for public portfolio page)
CREATE POLICY "Allow public read access to selected_work"
ON public.selected_work
FOR SELECT
TO public
USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_selected_work_created_at ON public.selected_work(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_selected_work_updated_at ON public.selected_work;
CREATE TRIGGER update_selected_work_updated_at
    BEFORE UPDATE ON public.selected_work
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

