import React, { useState, useEffect } from 'react';
import StarBackground from './components/StarBackground';
import PublicPortfolio from './components/pages/PublicPortfolio';
import AdminDashboard from './components/pages/AdminDashboard';
import { Button, Input, Card } from './components/ui/Components';
import { DataService } from './services/supabaseService';

/**
 * LoginScreen Component
 * 
 * A simple authentication form for the admin area.
 * In a real app, this would handle JWT tokens or session cookies.
 */
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth network delay
    setTimeout(async () => {
        const { error } = await DataService.signIn(email);
        if (!error) {
            onLogin(); // Update global auth state
        } else {
            alert('Login failed');
        }
        setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-20 px-4">
      <Card className="w-full max-w-md p-8 space-y-6 border-slate-700 bg-slate-900/80">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">CMS Login</h1>
          <p className="text-slate-400 text-sm">Enter your credentials to access the dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="admin@example.com"
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>
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
  
  // Custom Router State
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/');

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
   */
  const renderRoute = () => {
    // 1. Admin Dashboard (Protected)
    if (currentPath === '/admin/dashboard') {
      if (isAuthenticated) {
        return (
          <AdminDashboard 
            onLogout={() => {
              setIsAuthenticated(false);
              navigate('/admin');
            }} 
          />
        );
      } else {
        // Redirect to login if not authenticated
        // Use timeout to avoid state update during render
        setTimeout(() => navigate('/admin'), 0);
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Redirecting...</div>;
      }
    }

    // 2. Admin Login
    if (currentPath === '/admin') {
      if (isAuthenticated) {
        // Already logged in, go to dashboard
        setTimeout(() => navigate('/admin/dashboard'), 0);
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Redirecting...</div>;
      } else {
        return (
          <LoginScreen 
            onLogin={() => {
              setIsAuthenticated(true);
              navigate('/admin/dashboard');
            }} 
          />
        );
      }
    }

    // 3. Public Portfolio (Default for '/' and unknown routes)
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