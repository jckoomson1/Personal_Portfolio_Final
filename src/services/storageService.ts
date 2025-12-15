import { supabase } from '../lib/supabaseClient';

/**
 * Storage Service
 * 
 * Handles file uploads to Supabase Storage.
 * Used for storing project images in the 'project-images' bucket.
 */

const BUCKET_NAME = 'project-images';

/**
 * Uploads an image file to Supabase Storage
 * @param file - The image file to upload
 * @param projectId - Optional project ID for naming the file (if editing existing project)
 * @returns The public URL of the uploaded image, or null on error
 */
export const uploadProjectImage = async (
  file: File,
  projectId?: string
): Promise<string | null> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image must be less than 5MB');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = projectId 
      ? `${projectId}-${timestamp}-${randomString}.${fileExt}`
      : `project-${timestamp}-${randomString}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Unexpected error uploading image:', err);
    return null;
  }
};

/**
 * Deletes an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 * @returns true if successful, false on error
 */
export const deleteProjectImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(BUCKET_NAME) + 1).join('/');

    // Delete file from storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting image:', err);
    return false;
  }
};

