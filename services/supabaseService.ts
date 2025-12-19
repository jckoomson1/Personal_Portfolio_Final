import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_PROFILE, MOCK_PROJECTS, MOCK_BLOGS } from '../constants';
import { Profile, Project, BlogPost } from '../types';

/**
 * Supabase Configuration
 * 
 * Attempts to retrieve environment variables for Supabase connection.
 * If variables are missing, the app will gracefully degrade to use mock data.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Only initialize if keys exist
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

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
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (!error && data) return data;
    }
    // Fallback if Supabase is not connected or returns error
    return MOCK_PROFILE;
  },

  getProjects: async (): Promise<Project[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return MOCK_PROJECTS;
  },

  getBlogPosts: async (): Promise<BlogPost[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return MOCK_BLOGS;
  },

  // --- Write Operations (Simulated if no backend) ---

  createProject: async (project: Omit<Project, 'id' | 'created_at'>): Promise<Project> => {
    if (supabase) {
      const { data, error } = await supabase.from('projects').insert([project]).select().single();
      if (data) return data;
      if (error) throw error;
    }
    // Mock simulation for demo: creates a fake object with a random ID
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    return newProject;
  },

  deleteProject: async (id: string): Promise<void> => {
    if (supabase) {
      await supabase.from('projects').delete().eq('id', id);
    }
    // If mocking, no action needed as state is handled in the component
  },

  updateProfile: async (profile: Partial<Profile>): Promise<void> => {
    if (supabase) {
        // Assumes single user system where ID is '1'
       await supabase.from('profiles').update(profile).eq('id', '1'); 
    }
  },

  // --- Site Content Operations ---
  
  /**
   * Gets a single site_content value by key
   * @param key - The key to retrieve
   * @returns The value string, or null if not found
   */
  getSiteContent: async (key: string): Promise<string | null> => {
    if (!supabase) {
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
    
    if (!supabase || keys.length === 0) {
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
  setSiteContent: async (key: string, value: string): Promise<void> => {
    if (!supabase) {
      return;
    }

    try {
      // Use upsert to insert or update
      await supabase
        .from('site_content')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    } catch (err) {
      console.error('Error setting site_content:', err);
      throw err;
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