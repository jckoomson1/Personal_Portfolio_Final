import { supabase } from '../lib/supabaseClient';

/**
 * Storage Service
 * 
 * Handles file uploads to Supabase Storage.
 * Used for storing project images in the 'project-images' bucket.
 */

const BUCKET_NAME = 'project-images';
const RESUME_BUCKET_NAME = 'resumes';

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
      // Provide more specific error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        throw new Error(`Storage bucket '${BUCKET_NAME}' does not exist. Please create it in Supabase Storage.`);
      } else if (error.message?.includes('new row violates row-level security')) {
        throw new Error(`Permission denied. Please check RLS policies for bucket '${BUCKET_NAME}'.`);
      } else if (error.message?.includes('JWT')) {
        throw new Error('Authentication error. Please ensure you are logged in.');
      }
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('Image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err: any) {
    console.error('Unexpected error uploading image:', err);
    // Return the error message instead of null for better debugging
    throw err instanceof Error ? err : new Error('Failed to upload image');
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

/**
 * Uploads a resume file to Supabase Storage
 * @param file - The resume file to upload (PDF, DOC, DOCX)
 * @returns The public URL of the uploaded resume, or null on error
 */
export const uploadResume = async (file: File): Promise<string | null> => {
  try {
    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Resume must be a PDF, DOC, or DOCX file');
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Resume must be less than 10MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `resume-${timestamp}-${randomString}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading resume:', error);
      // Provide more specific error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        throw new Error(`Storage bucket '${RESUME_BUCKET_NAME}' does not exist. Please create it in Supabase Storage.`);
      } else if (error.message?.includes('new row violates row-level security')) {
        throw new Error(`Permission denied. Please check RLS policies for bucket '${RESUME_BUCKET_NAME}'.`);
      } else if (error.message?.includes('JWT')) {
        throw new Error('Authentication error. Please ensure you are logged in.');
      }
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(RESUME_BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded resume');
    }

    console.log('Resume uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err: any) {
    console.error('Unexpected error uploading resume:', err);
    throw err instanceof Error ? err : new Error('Failed to upload resume');
  }
};

/**
 * Deletes a resume from Supabase Storage
 * @param resumeUrl - The public URL of the resume to delete
 * @returns true if successful, false on error
 */
export const deleteResume = async (resumeUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = resumeUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(RESUME_BUCKET_NAME) + 1).join('/');

    // Delete file from storage
    const { error } = await supabase.storage
      .from(RESUME_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting resume:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting resume:', err);
    return false;
  }
};

