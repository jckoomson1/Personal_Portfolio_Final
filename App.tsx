import React, { useState, useEffect } from 'react';
import StarBackground from './components/StarBackground';
import PublicPortfolio from './components/pages/PublicPortfolio';
import AdminDashboard from './components/pages/AdminDashboard';
import ProjectDetail from './components/pages/ProjectDetail';
import BlogDetail from './components/pages/BlogDetail';
import { Button, Input, Card } from './components/ui/Components';
import { supabase } from './src/lib/supabaseClient';

/**
 * LoginScreen Component
 * 
 * Admin authentication form using email-only authentication.
 * Checks if email exists in both auth.users and public.admin_users.
 * Uses passwordless OTP authentication.
 */
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check if email exists in public.admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('email, role')
        .eq('email', email)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        setError('Email not found in admin users. Please contact an administrator.');
        setLoading(false);
        return;
      }

      console.log('Admin user found:', adminUser.email);

      // Step 2: Send OTP to verify user exists in auth.users
      // This will only work if the email exists in auth.users
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create user if they don't exist
        },
      });

      if (otpError) {
        console.error('OTP error details:', otpError);
        
        if (otpError.message?.includes('User not found') || otpError.message?.includes('not registered')) {
          setError('Email not found in authentication system. Please ensure your account is set up in Supabase Auth.');
        } else {
          setError(otpError.message || 'Failed to send verification code. Please try again.');
        }
        setLoading(false);
        return;
      }

      // OTP sent successfully - this confirms user exists in auth.users
      setOtpSent(true);
      console.log('OTP sent successfully to:', email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify OTP and complete login
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('Login successful:', data.user.email);
        onLogin(); // Update global auth state
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-20 px-4">
      <Card className="w-full max-w-md p-8 space-y-6 border-slate-700 bg-slate-900/80">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">CMS Login</h1>
          <p className="text-slate-400 text-sm">
            {otpSent ? 'Enter the verification code sent to your email' : 'Enter your email to access the dashboard'}
          </p>
        </div>
        
        {!otpSent ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}
            <Input 
              label="Email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="p-3 rounded-md bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 text-sm">
              Verification code sent to <strong>{email}</strong>
            </div>
            <Input 
              label="Verification Code" 
              type="text" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              placeholder="Enter 6-digit code"
              required
              disabled={loading}
              maxLength={6}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1" 
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError(null);
                }}
                disabled={loading}
              >
                Change Email
              </Button>
              <Button className="flex-1" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
            </div>
          </form>
        )}
        
        <div className="text-center">
          <a href="#/" className="text-sm text-indigo-400 hover:text-indigo-300">Back to Portfolio</a>
        </div>
      </Card>
    </div>
  );
};

/**
 * App Root Component
 * 
 * Handles client-side routing and global layout.
 * Implements a custom lightweight hash router to avoid dependency version conflicts.
 */
const App: React.FC = () => {
  // Global Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Custom Router State
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/');

  // Check authentication status on mount and when auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      // Normalize hash path (e.g., "#/admin" -> "/admin")
      const path = window.location.hash.replace('#', '') || '/';
      setCurrentPath(path);
    };

    // Initialize hash if empty
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    
    // Set initial path
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  /**
   * Programmatic navigation helper
   */
  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
  };

  /**
   * Route Rendering Logic
   * 
   * Protection Strategy:
   * - Any route starting with '/admin' (except '/admin/login') requires authentication
   * - Unauthenticated users are redirected to '/admin/login'
   * - Authenticated users accessing '/admin/login' are redirected to '/admin/dashboard'
   */
  const renderRoute = () => {
    // Show loading state while checking authentication
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 font-mono text-sm">Loading...</span>
          </div>
        </div>
      );
    }

    // Check if route is an admin route
    const isAdminRoute = currentPath.startsWith('/admin');
    const isLoginRoute = currentPath === '/admin/login';
    
    // Check if route is a project detail page
    const projectDetailMatch = currentPath.match(/^\/project\/(.+)$/);
    
    // Check if route is a blog/article detail page
    const blogDetailMatch = currentPath.match(/^\/article\/(.+)$/);

    // 1. Project Detail Route
    if (projectDetailMatch) {
      const projectId = projectDetailMatch[1];
      return (
        <ProjectDetail 
          projectId={projectId}
          onBack={() => navigate('/')}
        />
      );
    }

    // 2. Blog/Article Detail Route
    if (blogDetailMatch) {
      const blogId = blogDetailMatch[1];
      return (
        <BlogDetail 
          blogId={blogId}
          onBack={() => navigate('/')}
        />
      );
    }

    // 3. Admin Login Route
    if (isLoginRoute) {
      if (isAuthenticated) {
        // Already logged in, redirect to dashboard
        setTimeout(() => navigate('/admin/dashboard'), 0);
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Redirecting...</div>;
      } else {
        return (
          <LoginScreen 
            onLogin={() => {
              // Navigation handled by auth state change listener
              navigate('/admin/dashboard');
            }} 
          />
        );
      }
    }

    // 4. Protected Admin Routes (any /admin/* except /admin/login)
    if (isAdminRoute && !isLoginRoute) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        setTimeout(() => navigate('/admin/login'), 0);
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Redirecting to login...</div>;
      } else {
        // Authenticated - render dashboard or other admin routes
        if (currentPath === '/admin/dashboard') {
          return (
            <AdminDashboard 
              onLogout={async () => {
                await supabase.auth.signOut();
                navigate('/admin/login');
              }} 
            />
          );
        }
        // For other admin routes, redirect to dashboard for now
        setTimeout(() => navigate('/admin/dashboard'), 0);
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Redirecting...</div>;
      }
    }

    // 5. Public Portfolio (Default for '/' and unknown routes)
    return <PublicPortfolio />;
  };

  return (
    <div className="text-slate-50 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background stays persistent across routes */}
      <StarBackground />
      
      {/* Route Content */}
      {renderRoute()}
    </div>
  );
};

export default App;