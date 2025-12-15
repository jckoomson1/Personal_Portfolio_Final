# Supabase Storage Setup for Project Images

This document explains how to set up Supabase Storage for project image uploads.

## Storage Bucket Setup

### 1. Create the Storage Bucket

1. Open your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `project-images`
   - **Public bucket**: ✅ Enable (so images can be accessed publicly)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/*` (or leave empty for all)

5. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

#### Policy 1: Allow authenticated users to upload images (Admins only)

```sql
-- Allow authenticated admin users to upload images
CREATE POLICY "Admin users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.role = 'admin'
  )
);
```

#### Policy 2: Allow authenticated users to read images

```sql
-- Allow authenticated admin users to read images
CREATE POLICY "Admin users can read images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.role = 'admin'
  )
);
```

#### Policy 3: Allow public read access (for displaying images)

```sql
-- Allow public read access to images
CREATE POLICY "Public can read project images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');
```

#### Policy 4: Allow authenticated users to delete images (Admins only)

```sql
-- Allow authenticated admin users to delete images
CREATE POLICY "Admin users can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.role = 'admin'
  )
);
```

### 3. Apply Policies via Supabase Dashboard (Alternative)

If you prefer using the UI:

1. Go to **Storage** → **Policies** for the `project-images` bucket
2. Click **New Policy**
3. For each policy:
   - **Policy name**: As specified above
   - **Allowed operation**: SELECT, INSERT, or DELETE
   - **Policy definition**: Copy the USING/WITH CHECK clause from the SQL above
   - **Target roles**: `authenticated` or `public` as specified

### Summary

- **Bucket Name**: `project-images`
- **Public Access**: ✅ Enabled (for public image display)
- **Upload Access**: Authenticated admin users only
- **File Size Limit**: 5MB
- **Allowed Types**: Images only

## Code Implementation

The image upload functionality is implemented in:

- **Service**: `src/services/storageService.ts`
  - `uploadProjectImage()` - Uploads image file and returns public URL
  - `deleteProjectImage()` - Deletes image from storage (optional, for future use)

- **Component**: `src/components/admin/SelectedWorkManager.tsx`
  - File input replaces URL input
  - Image preview before upload
  - Upload progress handling
  - Error handling for file validation

## Testing

1. Log in as admin
2. Navigate to Admin Dashboard → Selected Work
3. Create or edit a project
4. Click "Choose Image File" and select an image
5. Verify the image preview appears
6. Submit the form
7. Verify the image is displayed in the project list

## Troubleshooting

### "Bucket not found" error
- Ensure the bucket name is exactly `project-images`
- Check that the bucket exists in your Supabase project

### "New row violates row-level security policy" error
- Verify RLS policies are correctly set up
- Ensure you're logged in as an admin user
- Check that your email exists in `admin_users` table with `role='admin'`

### Images not displaying publicly
- Verify the bucket is set to **Public**
- Check the "Public can read project images" policy is active
- Verify the image URL is correctly saved in the `selected_work` table

