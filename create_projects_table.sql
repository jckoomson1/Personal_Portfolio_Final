-- Create projects table for the Projects tab in AdminDashboard
-- Run this in your Supabase SQL Editor

-- Create projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;

-- Policy 1: Allow authenticated users to read projects
CREATE POLICY "Allow authenticated users to read projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to insert projects
CREATE POLICY "Allow authenticated users to insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update projects
CREATE POLICY "Allow authenticated users to update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete projects
CREATE POLICY "Allow authenticated users to delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (true);

-- Policy 5: Allow public read access (for public portfolio page)
CREATE POLICY "Allow public read access to projects"
ON public.projects
FOR SELECT
TO public
USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

