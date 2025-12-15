import { supabase } from '../lib/supabaseClient';

/**
 * Analytics Service
 * 
 * Handles portfolio analytics tracking with secure RLS policies.
 * Public users can increment views but cannot read analytics data.
 * Only authenticated admin users can read analytics.
 */

/**
 * Increments the portfolio view counter
 * This function is callable by public (anonymous) users via RLS policy
 * but they cannot read the analytics data.
 */
export const incrementPortfolioView = async (): Promise<void> => {
  try {
    // Call the PostgreSQL function to increment views atomically
    // This is secure because the function handles the increment server-side
    const { error } = await supabase.rpc('increment_portfolio_views');

    if (error) {
      console.error('Error incrementing portfolio view:', error);
      // Fail silently for analytics - don't break user experience
    }
  } catch (err) {
    console.error('Unexpected error incrementing view:', err);
    // Fail silently for analytics
  }
};

/**
 * Gets the total portfolio views count
 * Only accessible to authenticated admin users (enforced by RLS)
 * @returns Total view count, or 0 on error
 */
export const getTotalPortfolioViews = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('portfolio_analytics')
      .select('view_count')
      .single();

    if (error) {
      console.error('Error fetching portfolio views:', error);
      return 0;
    }

    return data?.view_count || 0;
  } catch (err) {
    console.error('Unexpected error fetching views:', err);
    return 0;
  }
};

