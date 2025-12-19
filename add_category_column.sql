-- Add missing 'category' column to selected_work table
-- Run this in your Supabase SQL Editor

-- Add category column if it doesn't exist
DO $$ 
BEGIN
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
END $$;

-- Also ensure all other required columns exist
DO $$ 
BEGIN
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

-- Update any existing rows to have default category if NULL
UPDATE public.selected_work 
SET category = '' 
WHERE category IS NULL;

