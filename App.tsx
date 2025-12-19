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
 * Admin authentication form with two flows:
 * 1. Existing admin: Email + Password login
 * 2. New admin: Email → OTP → Set Password
 */
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  // Initial state: ask if user has account
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for new account flow (OTP)
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Regular password login (for existing admins)
  const handlePasswordLogin = async (e: React.FormEvent) => {
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

      // Step 2: Try to sign in with password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('Login successful:', data.user.email);
        onLogin(); // Update global auth state
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for new account setup
  const handleSendOtpForNewAccount = async (e: React.FormEvent) => {
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
        setError('Email not found in admin users. Please contact an administrator to be added.');
        setLoading(false);
        return;
      }

      // Step 2: Send OTP for account setup
      setSendingOtp(true);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Allow creating user if they don't exist in auth
        },
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send verification code. Please try again.');
        setSendingOtp(false);
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setError(null);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send verification code. Please try again.');
      setSendingOtp(false);
    } finally {
      setLoading(false);
      setSendingOtp(false);
    }
  };

  // Verify OTP and set password for new account
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Verify OTP first
      const { data: otpData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      if (!otpData?.user) {
        setError('Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to set password. Please try again.');
        setLoading(false);
        return;
      }

      // Password set successfully, now log in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });

      if (signInError) {
        setError('Password set but login failed. Please try logging in with your new password.');
        setLoading(false);
        // Reset to account selection
        setHasAccount(true);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        return;
      }

      if (signInData?.user) {
        console.log('Password set and login successful:', signInData.user.email);
        onLogin(); // Update global auth state
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Password setup error:', err);
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
            {hasAccount === null
              ? 'Do you have an admin account?'
              : hasAccount && !otpSent
              ? 'Enter your email and password to sign in'
              : !hasAccount && !otpSent
              ? 'Enter your email to receive a verification code'
              : otpSent
              ? 'Set your password to complete account setup'
              : 'Access the admin dashboard'}
          </p>
        </div>
        
        {hasAccount === null ? (
          // Initial question: Do you have an account?
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={() => setHasAccount(true)}
                disabled={loading}
              >
                Yes, I have an account
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setHasAccount(false)}
                disabled={loading}
              >
                No, I'm new
              </Button>
            </div>
          </div>
        ) : hasAccount && !otpSent ? (
          // Existing admin: Email + Password login
          <form onSubmit={handlePasswordLogin} className="space-y-4">
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
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1" 
                onClick={() => {
                  setHasAccount(null);
                  setEmail('');
                  setPassword('');
                  setError(null);
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button className="flex-1" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        ) : !hasAccount && !otpSent ? (
          // New admin: Email input to get code
          <form onSubmit={handleSendOtpForNewAccount} className="space-y-4">
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
              disabled={loading || sendingOtp}
            />
            {sendingOtp ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-400 text-xs">Sending verification code...</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={() => {
                    setHasAccount(null);
                    setEmail('');
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button className="flex-1" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            )}
          </form>
        ) : otpSent ? (
          // OTP + Password setup form
          <form onSubmit={handleSetPassword} className="space-y-4">
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
              placeholder="Enter 8-digit code"
              required
              disabled={loading}
              maxLength={8}
            />
            <Input 
              label="New Password" 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Enter new password (min 6 characters)"
              required
              disabled={loading}
            />
            <Input 
              label="Confirm Password" 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1" 
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button className="flex-1" type="submit" disabled={loading}>
                {loading ? 'Setting Password...' : 'Set Password & Sign In'}
              </Button>
            </div>
          </form>
        ) : null}
        
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