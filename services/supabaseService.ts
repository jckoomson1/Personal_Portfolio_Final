import { MOCK_PROFILE, MOCK_PROJECTS, MOCK_BLOGS } from '../constants';
import { Profile, Project, BlogPost } from '../types';
import { supabase } from '../src/lib/supabaseClient';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.trim() !== '' && key.trim() !== '');
};

/**
 * DataService Singleton
 * 
 * Abstraction layer for data access. 
 * Allows the application to switch transparently between a live Supabase backend
 * and local mock data (useful for development or when backend is offline).
 */
export const DataService = {
  // --- Read Operations ---

  getProfile: async (): Promise<Profile> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (!error && data) return data;
    }
    // Fallback if Supabase is not connected or returns error
    return MOCK_PROFILE;
  },

  getProjects: async (): Promise<Project[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return MOCK_PROJECTS;
  },

  getBlogPosts: async (): Promise<BlogPost[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('thought_posts').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return MOCK_BLOGS;
  },

  // --- Write Operations (Simulated if no backend) ---

  createProject: async (project: Omit<Project, 'id' | 'created_at'>): Promise<Project> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    console.log('Creating project with data:', project);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating project:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    console.log('Project created successfully:', data);
    return data;
  },

  updateProject: async (id: string, project: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    console.log('Updating project with data:', project);
    
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating project:', error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    console.log('Project updated successfully:', data);
    return data;
  },

  deleteProject: async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    console.log('Deleting project:', id);
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting project:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
    
    console.log('Project deleted successfully');
  },

  updateProfile: async (profile: Partial<Profile>): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    console.log('Updating profile with data:', profile);
    
    // Try to update by ID '1' first, or get the first profile if ID doesn't exist
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    const profileId = existingProfile?.id || '1';
    
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', profileId);
    
    if (error) {
      console.error('Supabase error updating profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    
    console.log('Profile updated successfully');
  },

  // --- Site Content Operations ---
  
  /**
   * Gets a single site_content value by key
   * @param key - The key to retrieve
   * @returns The value string, or null if not found
   */
  getSiteContent: async (key: string): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', key)
        .single();
      
      if (!error && data) {
        return data.value;
      }
    } catch (err) {
      console.warn('Error fetching site_content (table may not exist yet):', err);
    }
    
    return null;
  },

  /**
   * Gets multiple site_content values by keys
   * @param keys - Array of keys to retrieve
   * @returns Object mapping keys to values
   */
  getSiteContentMultiple: async (keys: string[]): Promise<Record<string, string | null>> => {
    // Return object with null values for all keys if no keys provided
    const result: Record<string, string | null> = {};
    keys.forEach(key => { result[key] = null; });
    
    if (!isSupabaseConfigured() || keys.length === 0) {
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', keys);
      
      if (!error && data) {
        keys.forEach(key => {
          const item = data.find(d => d.key === key);
          result[key] = item ? item.value : null;
        });
      }
      // If there's an error (e.g., table doesn't exist), return null values
      // This allows the page to load even if site_content table isn't set up yet
    } catch (err) {
      console.warn('Error fetching site_content (table may not exist yet):', err);
      // Return null values to allow page to load
    }
    
    return result;
  },

  /**
   * Sets or updates a site_content value
   * @param key - The key to set
   * @param value - The value to set
   */
  // --- Blog/Thought Post Operations ---
  
  createBlog: async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    const postData: any = {
      title: post.title,
      slug: post.slug,
      summary: post.summary || null,
      content: post.content,
      published: post.published ?? true,
    };
    
    // Set published_at only if publishing
    if (post.published) {
      postData.published_at = new Date().toISOString();
    } else {
      postData.published_at = null;
    }
    
    console.log('Creating blog post with data:', postData);
    
    const { data, error } = await supabase
      .from('thought_posts')
      .insert([postData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating blog post:', error);
      throw new Error(`Failed to create blog post: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    console.log('Blog post created successfully:', data);
    return data;
  },

  updateBlog: async (id: string, post: Partial<Omit<BlogPost, 'id' | 'created_at'>>): Promise<BlogPost> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (post.title !== undefined) updateData.title = post.title;
    if (post.slug !== undefined) updateData.slug = post.slug;
    if (post.summary !== undefined) updateData.summary = post.summary;
    if (post.content !== undefined) updateData.content = post.content;
    if (post.published !== undefined) {
      updateData.published = post.published;
      // Set published_at if publishing for the first time
      if (post.published) {
        // Check if already published by fetching current post
        const { data: currentPost } = await supabase
          .from('thought_posts')
          .select('published_at')
          .eq('id', id)
          .single();
        
        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      } else {
        updateData.published_at = null;
      }
    }
    
    console.log('Updating blog post with data:', updateData);
    
    const { data, error } = await supabase
      .from('thought_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating blog post:', error);
      throw new Error(`Failed to update blog post: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    console.log('Blog post updated successfully:', data);
    return data;
  },

  deleteBlog: async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }
    
    console.log('Deleting blog post:', id);
    
    const { error } = await supabase
      .from('thought_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting blog post:', error);
      throw new Error(`Failed to delete blog post: ${error.message}`);
    }
    
    console.log('Blog post deleted successfully');
  },

  setSiteContent: async (key: string, value: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    }

    console.log('Setting site content:', key, value);

    try {
      // Use upsert to insert or update
      const { error } = await supabase
        .from('site_content')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      
      if (error) {
        console.error('Supabase error setting site_content:', error);
        throw new Error(`Failed to set site content: ${error.message}`);
      }
      
      console.log('Site content set successfully');
    } catch (err: any) {
      console.error('Error setting site_content:', err);
      throw err instanceof Error ? err : new Error('Failed to set site content');
    }
  },
  
  // --- Auth Mocks ---
  
  signIn: async (email: string) => {
      // Allow any login for demo purposes if Supabase isn't real
      if(!supabase) return { user: { email }, error: null };
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: 'password' });
      return { user: data.user, error };
  }
};