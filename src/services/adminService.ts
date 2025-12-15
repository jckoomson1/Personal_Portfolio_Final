import { supabase } from '../lib/supabaseClient';
import { Project } from '../../types';

/**
 * Admin Service
 * 
 * Provides CRUD operations for the selected_work table in Supabase.
 * All functions include basic error handling and return appropriate responses.
 */

/**
 * Fetches all projects from the selected_work table
 * @returns Array of Project objects, or empty array on error
 */
export const getAdminProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('selected_work')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching projects:', err);
    return [];
  }
};

/**
 * Creates a new project in the selected_work table
 * @param project - Project data (without id and created_at, which are auto-generated)
 * @returns The created Project object, or null on error
 */
export const createProject = async (
  project: Omit<Project, 'id' | 'created_at'>
): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('selected_work')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error creating project:', err);
    return null;
  }
};

/**
 * Updates an existing project in the selected_work table
 * @param id - The project ID to update
 * @param project - Partial project data to update
 * @returns The updated Project object, or null on error
 */
export const updateProject = async (
  id: string,
  project: Partial<Omit<Project, 'id' | 'created_at'>>
): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('selected_work')
      .update(project)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error updating project:', err);
    return null;
  }
};

/**
 * Deletes a project from the selected_work table
 * @param id - The project ID to delete
 * @returns true if successful, false on error
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('selected_work')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting project:', err);
    return false;
  }
};

/**
 * Gets monthly activity statistics for selected work projects
 * Counts both creation and update events grouped by month (YYYY-MM)
 * @returns Array of objects with month and activity_count, or empty array on error
 */
export const getMonthlyProjectActivity = async (): Promise<Array<{ month: string; activity_count: number }>> => {
  try {
    // Fetch all projects with created_at and updated_at timestamps
    const { data, error } = await supabase
      .from('selected_work')
      .select('created_at, updated_at');

    if (error) {
      console.error('Error fetching project activity:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Aggregate activities by month
    // Create a map to count activities per month
    const monthlyActivity = new Map<string, number>();

    data.forEach(project => {
      // Count creation activity
      if (project.created_at) {
        const createMonth = new Date(project.created_at).toISOString().slice(0, 7); // YYYY-MM
        monthlyActivity.set(createMonth, (monthlyActivity.get(createMonth) || 0) + 1);
      }

      // Count update activity (only if updated_at is different from created_at)
      if (project.updated_at && project.created_at) {
        const updateDate = new Date(project.updated_at);
        const createDate = new Date(project.created_at);
        // Only count as update if updated_at is significantly different (more than 1 second)
        if (updateDate.getTime() - createDate.getTime() > 1000) {
          const updateMonth = updateDate.toISOString().slice(0, 7); // YYYY-MM
          monthlyActivity.set(updateMonth, (monthlyActivity.get(updateMonth) || 0) + 1);
        }
      }
    });

    // Convert map to sorted array
    const result = Array.from(monthlyActivity.entries())
      .map(([month, activity_count]) => ({ month, activity_count }))
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort by month ascending

    return result;
  } catch (err) {
    console.error('Unexpected error fetching monthly activity:', err);
    return [];
  }
};

