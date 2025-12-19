# Supabase Storage Setup Guide

This guide will help you set up the required storage buckets in Supabase for image and resume uploads.

## Required Buckets

You need to create **2 storage buckets**:

1. **`project-images`** - For project/selected work images
2. **`resumes`** - For resume file uploads

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### 2. Navigate to Storage

1. In the left sidebar, click on **"Storage"**
2. You should see a list of buckets (may be empty if this is your first time)

### 3. Create the `project-images` Bucket

1. Click the **"New bucket"** button (or **"Create bucket"**)
2. Fill in the bucket details:
   - **Name**: `project-images` (must be exactly this)
   - **Public bucket**: ✅ **Check this box** (important for public access to images)
   - **File size limit**: `5242880` (5MB) or leave default
   - **Allowed MIME types**: Leave empty or add: `image/jpeg,image/png,image/gif,image/webp`
3. Click **"Create bucket"**

### 4. Set Up RLS Policies for `project-images`

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Click on the **`project-images`** bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Users to Upload

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  (bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Authenticated Users to Update

- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  (bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 3: Allow Authenticated Users to Delete

- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  (bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 4: Allow Public Read Access

- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'project-images'::text
  ```
- Click **"Review"** then **"Save policy"**

### 5. Create the `resumes` Bucket

1. Click **"New bucket"** again
2. Fill in the bucket details:
   - **Name**: `resumes` (must be exactly this)
   - **Public bucket**: ✅ **Check this box** (important for public access to resumes)
   - **File size limit**: `10485760` (10MB) or leave default
   - **Allowed MIME types**: Leave empty or add: `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`
3. Click **"Create bucket"**

### 6. Set Up RLS Policies for `resumes`

1. Click on the **`resumes`** bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Users to Upload

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  (bucket_id = 'resumes'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Authenticated Users to Update

- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  (bucket_id = 'resumes'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 3: Allow Authenticated Users to Delete

- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  (bucket_id = 'resumes'::text) AND (auth.role() = 'authenticated'::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 4: Allow Public Read Access

- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'resumes'::text
  ```
- Click **"Review"** then **"Save policy"**

## Quick Setup (Using SQL Editor) - RECOMMENDED

**This is the fastest way to set everything up!**

1. Go to your Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste the entire contents of `setup_storage_policies.sql` file
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

This will:

- Create both buckets if they don't exist
- Set up all required RLS policies
- Make both buckets public

**OR** run this simplified SQL:

```sql
-- Create buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-images', 'project-images', true),
  ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to resumes" ON storage.objects;

-- PROJECT-IMAGES POLICIES
CREATE POLICY "Allow authenticated uploads to project-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Allow authenticated updates to project-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Allow authenticated deletes from project-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-images');

CREATE POLICY "Allow public read access to project-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'project-images');

-- RESUMES POLICIES
CREATE POLICY "Allow authenticated uploads to resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated updates to resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated deletes from resumes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes');

CREATE POLICY "Allow public read access to resumes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'resumes');
```

## Verification

After setting up the buckets:

1. Go back to your application
2. Try uploading an image in the Selected Work section
3. Check the browser console for any errors
4. If you see errors, verify:
   - Bucket names are exactly `project-images` and `resumes`
   - Both buckets are marked as **Public**
   - All RLS policies are created correctly
   - You are logged in as an authenticated user

## Troubleshooting

### Error: "Bucket not found"

- Verify the bucket name is exactly `project-images` (case-sensitive)
- Make sure the bucket was created successfully

### Error: "new row violates row-level security"

- Check that RLS policies are set up correctly
- Ensure you're logged in as an authenticated user
- Verify the policy definitions match the examples above

### Error: "JWT" or authentication errors

- Make sure you're logged into the admin dashboard
- Check that your Supabase auth is working correctly

### Images not displaying

- Verify the bucket is marked as **Public**
- Check that the "Allow public read access" policy is created
- Verify the public URL is being generated correctly

## Notes

- Bucket names are **case-sensitive** - must be exactly `project-images` and `resumes`
- Both buckets must be **public** for images/resumes to be accessible
- RLS policies ensure only authenticated users can upload/delete, but anyone can view
- File size limits are enforced (5MB for images, 10MB for resumes)
