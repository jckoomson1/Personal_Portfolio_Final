import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit,
  Upload,
  BarChart,
  CheckCircle,
  XCircle,
  Home
} from 'lucide-react';
import { DataService } from '../../services/supabaseService';
import { Project, BlogPost, Profile } from '../../types';
import { Button, Input, Textarea, Card } from '../ui/Components';
import { BarChart as ReBarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../../src/lib/supabaseClient';
import SelectedWorkManager from '../../src/components/admin/SelectedWorkManager';
import { getTotalPortfolioViews } from '../../src/services/analyticsService';
import { getMonthlyProjectActivity } from '../../src/services/adminService';

interface AdminDashboardProps {
  onLogout: () => void;
}

/**
 * AdminDashboard Component
 * 
 * Secure control panel for managing portfolio content.
 * Provides CRUD capabilities for Projects and Blog Posts.
 * Includes a Statistics Overview using Recharts.
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // --- Dashboard State ---
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SELECTED_WORK' | 'THOUGHTS' | 'SITE_CONTENT'>('OVERVIEW');
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [monthlyActivity, setMonthlyActivity] = useState<Array<{ month: string; activity_count: number }>>([]);
  
  // --- Form State (Project) ---
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});

  // --- Form State (Blog) ---
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost>>({});

  // Initial Data Fetch
  useEffect(() => {
    refreshData();
  }, []);

  /**
   * Refreshes all dashboard data from the DataService.
   * Called after any successful Create/Update/Delete operation.
   */
  const refreshData = async () => {
    const pData = await DataService.getProjects();
    const bData = await DataService.getBlogPosts();
    const profileData = await DataService.getProfile();
    const viewsData = await getTotalPortfolioViews();
    const activityData = await getMonthlyProjectActivity();
    setProjects(pData);
    setBlogs(bData);
    setProfile(profileData);
    setTotalViews(viewsData);
    setMonthlyActivity(activityData);
  };

  // --- Project CRUD Handlers ---
  
  // Saves a new or edited project
  const handleSaveProject = async () => {
    if (!currentProject.title || !currentProject.description) return alert("Title and Description required");
    try {
      await DataService.createProject(currentProject as Project); 
      setIsEditingProject(false);
      setCurrentProject({});
      refreshData();
    } catch (e) {
      alert("Error saving project");
    }
  };

  // Deletes a project by ID
  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this project?")) {
      await DataService.deleteProject(id);
      refreshData();
    }
  };

  // --- Blog CRUD Handlers ---

  // Saves a new or edited blog post
  const handleSaveBlog = async () => {
      // Logic for saving a blog post.
      // In a real application, this would send data to Supabase via DataService.createBlog
      // For this exam project, we mock the local state update.
      const newPost: BlogPost = {
          id: currentBlog.id || Math.random().toString(36).substr(2, 9),
          title: currentBlog.title || 'Untitled',
          slug: currentBlog.slug || 'untitled',
          content: currentBlog.content || '',
          published: currentBlog.published || false,
          created_at: new Date().toISOString()
      };
      
      const newBlogs = currentBlog.id 
        ? blogs.map(b => b.id === currentBlog.id ? newPost : b)
        : [newPost, ...blogs];
        
      setBlogs(newBlogs);
      setIsEditingBlog(false);
      setCurrentBlog({});
  };

  const handleDeleteBlog = (id: string) => {
      if(confirm("Delete this post?")) {
          setBlogs(blogs.filter(b => b.id !== id));
      }
  };

  /**
   * Render Function: Overview Tab
   * Shows statistics cards and a bar chart of content distribution.
   */
  const renderOverview = () => {
    const data = [
      { name: 'Projects', count: projects.length },
      { name: 'Posts', count: blogs.length },
      { name: 'Views', count: totalViews }, 
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-l-indigo-500">
            <div className="text-sm text-slate-400">Total Projects</div>
            <div className="text-3xl font-bold text-white">{projects.length}</div>
          </Card>
          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="text-sm text-slate-400">Published Posts</div>
            <div className="text-3xl font-bold text-white">{blogs.filter(b => b.published).length}</div>
          </Card>
          <Card className="p-6 border-l-4 border-l-pink-500">
            <div className="text-sm text-slate-400">Total Views</div>
            <div className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</div>
          </Card>
        </div>
        
        {/* Recharts Bar Chart */}
        <Card className="p-6 h-80">
          <h3 className="text-lg font-medium text-white mb-4">Content Analytics</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Project Activity Chart */}
        <Card className="p-6 h-80">
          <h3 className="text-lg font-medium text-white mb-4">Selected Work Activity (Monthly)</h3>
          {monthlyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activity_count" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No activity data available
            </div>
          )}
        </Card>
      </div>
    );
  };

  /**
   * Render Function: Projects Tab
   * Lists all projects and provides a form to add/edit them.
   */
  const renderProjects = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Project Management</h2>
        <Button onClick={() => { setCurrentProject({}); setIsEditingProject(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Edit Form */}
      {isEditingProject && (
        <Card className="p-6 space-y-4 border-indigo-500/50">
          <h3 className="text-lg font-medium text-white">{currentProject.id ? 'Edit' : 'Create'} Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Title" 
              value={currentProject.title || ''} 
              onChange={e => setCurrentProject({...currentProject, title: e.target.value})} 
            />
            <Input 
              label="Category" 
              value={currentProject.category || ''} 
              onChange={e => setCurrentProject({...currentProject, category: e.target.value})} 
            />
          </div>
          <Textarea 
            label="Description" 
            value={currentProject.description || ''} 
            onChange={e => setCurrentProject({...currentProject, description: e.target.value})} 
          />
          <Input 
            label="Image URL" 
            placeholder="https://..." 
            value={currentProject.image_url || ''} 
            onChange={e => setCurrentProject({...currentProject, image_url: e.target.value})} 
          />
          <Input 
            label="Tags (comma separated)" 
            placeholder="React, Next.js"
            value={currentProject.tags?.join(', ') || ''} 
            onChange={e => setCurrentProject({...currentProject, tags: e.target.value.split(',').map(s => s.trim())})} 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditingProject(false)}>Cancel</Button>
            <Button onClick={handleSaveProject}>Save Project</Button>
          </div>
        </Card>
      )}

      {/* Project List */}
      <div className="grid gap-4">
        {projects.map(project => (
          <Card key={project.id} className="p-4 flex items-center justify-between group hover:border-indigo-500/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden">
                {project.image_url && <img src={project.image_url} className="w-full h-full object-cover" />}
              </div>
              <div>
                <h4 className="font-bold text-white">{project.title}</h4>
                <div className="text-xs text-slate-500">{project.category} • {new Date(project.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" className="h-8 w-8 p-0" onClick={() => { setCurrentProject(project); setIsEditingProject(true); }}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="danger" className="h-8 w-8 p-0" onClick={() => handleDeleteProject(project.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  /**
   * Render Function: Blog Tab
   * Lists all blog posts and provides a form to add/edit them.
   */
  const renderBlog = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <Button onClick={() => { setCurrentBlog({ published: true }); setIsEditingBlog(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </div>

        {/* Edit Form */}
        {isEditingBlog && (
          <Card className="p-6 space-y-4 border-indigo-500/50">
            <h3 className="text-lg font-medium text-white">{currentBlog.id ? 'Edit' : 'Write'} Post</h3>
            <Input 
                label="Title" 
                value={currentBlog.title || ''} 
                onChange={e => setCurrentBlog({...currentBlog, title: e.target.value})} 
            />
            <Input 
                label="Slug" 
                value={currentBlog.slug || ''} 
                onChange={e => setCurrentBlog({...currentBlog, slug: e.target.value})} 
            />
            <Textarea 
                label="Content (Markdown)" 
                className="font-mono min-h-[200px]"
                value={currentBlog.content || ''} 
                onChange={e => setCurrentBlog({...currentBlog, content: e.target.value})} 
            />
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="published" 
                    checked={currentBlog.published} 
                    onChange={e => setCurrentBlog({...currentBlog, published: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="published" className="text-sm text-slate-300">Publish immediately</label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsEditingBlog(false)}>Cancel</Button>
              <Button onClick={handleSaveBlog}>Save Post</Button>
            </div>
          </Card>
        )}

        {/* Blog Post List */}
        <div className="grid gap-4">
            {blogs.map(blog => (
                <Card key={blog.id} className="p-4 flex items-center justify-between group hover:border-indigo-500/30">
                    <div>
                        <div className="flex items-center gap-2">
                             <h4 className="font-bold text-white">{blog.title}</h4>
                             {blog.published ? 
                                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800">Published</span> : 
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">Draft</span>
                             }
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">/{blog.slug} • {new Date(blog.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" className="h-8 w-8 p-0" onClick={() => { setCurrentBlog(blog); setIsEditingBlog(true); }}>
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" className="h-8 w-8 p-0" onClick={() => handleDeleteBlog(blog.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950/50 backdrop-blur-sm z-20 relative">
      {/* --- Persistent Header --- */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          J
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Admin</h1>
      </header>

      {/* --- Main Layout: Sidebar + Content --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- Sidebar Navigation --- */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
          <SidebarItem icon={<FolderOpen size={20} />} label="Selected Work" active={activeTab === 'SELECTED_WORK'} onClick={() => setActiveTab('SELECTED_WORK')} />
          <SidebarItem icon={<FileText size={20} />} label="Thoughts" active={activeTab === 'THOUGHTS'} onClick={() => setActiveTab('THOUGHTS')} />
          <SidebarItem icon={<Settings size={20} />} label="Site Content" active={activeTab === 'SITE_CONTENT'} onClick={() => setActiveTab('SITE_CONTENT')} />
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => {
              window.location.hash = '#/';
            }} 
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5"
          >
            <Home size={20} />
            <span>View Portfolio</span>
          </button>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              onLogout();
            }} 
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'SELECTED_WORK' && <SelectedWorkManager />}
            {activeTab === 'THOUGHTS' && renderBlog()}
            {activeTab === 'SITE_CONTENT' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Site Content</h2>
                  <Card className="p-6 space-y-4">
                      <Input label="Full Name" defaultValue={profile?.full_name} />
                      <Input label="Hero Title Line 1" defaultValue={profile?.hero_title_1} />
                      <Input label="Hero Title Line 2" defaultValue={profile?.hero_title_2} />
                      <Textarea label="Bio" defaultValue={profile?.bio} />
                      <Button>Save Changes</Button>
                  </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};


// Helper component for sidebar links
const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default AdminDashboard;