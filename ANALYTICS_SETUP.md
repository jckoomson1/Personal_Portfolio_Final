# Portfolio Views Analytics Setup

This document explains how the portfolio views counter is implemented and how to set it up.

## Overview

The portfolio views counter tracks how many times the public portfolio page is loaded. The implementation uses Supabase with Row Level Security (RLS) to ensure that:

- Public users can increment the view counter but cannot read analytics data
- Only authenticated admin users can read the total view count
- View increments are thread-safe and secure

## Database Setup

### 1. Run the SQL Migration

Open your Supabase Dashboard → SQL Editor and run the contents of `supabase_migration.sql`.

This will:
- Create the `portfolio_analytics` table
- Create a `increment_portfolio_views()` PostgreSQL function
- Set up Row Level Security policies
- Grant appropriate permissions

### 2. Table Structure

**Table: `portfolio_analytics`**
- `id` (UUID, Primary Key)
- `view_count` (BIGINT) - The total number of views
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp

The table maintains a single row that tracks the total view count.

## Security Model

### Row Level Security Policies

1. **Deny Public Access**: Blocks all direct table access by default
   - Public users cannot SELECT, INSERT, UPDATE, or DELETE

2. **Admin Read Access**: Allows authenticated admin users to read analytics
   - Checks if the user's email exists in `admin_users` table with `role='admin'`
   - Uses `auth.jwt() ->> 'email'` to get the authenticated user's email

3. **Increment Function**: Public users can execute `increment_portfolio_views()`
   - The function uses `SECURITY DEFINER` to bypass RLS
   - Atomically increments the counter in a thread-safe manner
   - Handles the case where no row exists (creates one)

## Code Implementation

### Files Modified

1. **`src/services/analyticsService.ts`** (NEW)
   - `incrementPortfolioView()` - Called by public users to track views
   - `getTotalPortfolioViews()` - Called by admin users to fetch total views

2. **`components/pages/PublicPortfolio.tsx`**
   - Added `useEffect` hook that calls `incrementPortfolioView()` on component mount
   - View is tracked every time the portfolio page loads

3. **`components/pages/AdminDashboard.tsx`**
   - Added `totalViews` state
   - Fetches total views in `refreshData()` function
   - Displays total views in the Overview tab (replaces hardcoded "1,204")
   - Updates the analytics chart to include views

## Where View Increments Happen

View increments occur in:
- **File**: `components/pages/PublicPortfolio.tsx`
- **Location**: `useEffect` hook on component mount (line ~49)
- **Function**: `incrementPortfolioView()` from `analyticsService.ts`
- **Database**: Calls PostgreSQL function `increment_portfolio_views()` via Supabase RPC

## How It Works

1. **Public User Visits Portfolio**:
   - `PublicPortfolio` component mounts
   - `useEffect` calls `incrementPortfolioView()`
   - Supabase RPC calls `increment_portfolio_views()` PostgreSQL function
   - Function atomically increments `view_count` in the database
   - Public user cannot read the updated count (blocked by RLS)

2. **Admin Views Dashboard**:
   - Admin is authenticated (email exists in `admin_users` table)
   - `AdminDashboard` calls `getTotalPortfolioViews()`
   - RLS policy checks admin status and allows SELECT
   - Total view count is displayed in the Overview tab

## Testing

1. Visit the public portfolio page multiple times
2. Check the browser console for any errors (increment failures are logged but don't break the UI)
3. Log in as admin and check the dashboard Overview tab
4. Verify the total views count updates correctly

## Troubleshooting

### Views not incrementing
- Check browser console for errors
- Verify `increment_portfolio_views()` function exists in Supabase
- Check that RLS policies are correctly configured
- Ensure the function has `EXECUTE` permission for `anon` role

### Admin cannot see views
- Verify admin is authenticated (has session)
- Check that admin email exists in `admin_users` table with `role='admin'`
- Verify RLS policy "Admin users can read analytics" is active
- Check browser console for errors in `getTotalPortfolioViews()`

### Permission errors
- Ensure the SQL migration was run completely
- Check that RLS is enabled on `portfolio_analytics` table
- Verify function permissions: `GRANT EXECUTE ON FUNCTION public.increment_portfolio_views() TO anon;`

