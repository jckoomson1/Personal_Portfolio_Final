import React, { useState, useEffect, useMemo } from 'react';
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
  Home,
  Loader2
} from 'lucide-react';
import { DataService } from '../../services/supabaseService';
import { Project, BlogPost, Profile } from '../../types';
import { Button, Input, Textarea, Card } from '../ui/Components';
import { BarChart as ReBarChart, Bar, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../../src/lib/supabaseClient';
import SelectedWorkManager from '../../src/components/admin/SelectedWorkManager';
import { getTotalPortfolioViews } from '../../src/services/analyticsService';
import { getMonthlyProjectActivity } from '../../src/services/adminService';
import { uploadResume } from '../../src/services/storageService';

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

  // --- Form State (Profile/Resume) ---
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // --- Form State (Contact Section) ---
  const [contactForm, setContactForm] = useState({
    contact_bio: '',
    linkedin_url: '',
    email_url: ''
  });
  const [contactLoading, setContactLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    refreshData();
  }, []);

  // Initialize profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name,
        hero_title_1: profile.hero_title_1,
        hero_title_2: profile.hero_title_2,
        bio: profile.bio,
        subtitle: profile.subtitle,
        resume_url: profile.resume_url
      });
    }
  }, [profile]);

  // Load contact section data when switching to SITE_CONTENT tab
  useEffect(() => {
    if (activeTab === 'SITE_CONTENT') {
      loadContactData();
    }
  }, [activeTab]);

  // Calculate stable Y-axis domain for Content Analytics chart
  // This must be at the top level, not inside renderOverview, to follow Rules of Hooks
  const chartData = useMemo(() => [
    { name: 'Projects', count: projects.length },
    { name: 'Posts', count: blogs.length },
    { name: 'Views', count: totalViews }, 
  ], [projects.length, blogs.length, totalViews]);

  const { maxTick, ticks } = useMemo(() => {
    const maxValue = Math.max(...chartData.map(d => d.count), 0);
    // Round up to a "nice" number to prevent domain changes
    let calculatedMaxTick = 5; // Default minimum
    if (maxValue > 0) {
      // Round up to nearest nice number (5, 10, 50, 100, 500, etc.)
      const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
      const normalized = maxValue / magnitude;
      let niceValue;
      if (normalized <= 1) niceValue = 1;
      else if (normalized <= 2) niceValue = 2;
      else if (normalized <= 5) niceValue = 5;
      else niceValue = 10;
      calculatedMaxTick = niceValue * magnitude;
      // Add some padding (20%)
      calculatedMaxTick = Math.ceil(calculatedMaxTick * 1.2);
    }
    // Limit ticks to reasonable number and ensure they're integers
    const tickCount = Math.min(calculatedMaxTick + 1, 11);
    const calculatedTicks = Array.from({ length: tickCount }, (_, i) => i);
    return { maxTick: calculatedMaxTick, ticks: calculatedTicks };
  }, [chartData]);

  const loadContactData = async () => {
    setContactLoading(true);
    try {
      const data = await DataService.getSiteContentMultiple([
        'contact_bio',
        'linkedin_url',
        'email_url'
      ]);
      setContactForm({
        contact_bio: data.contact_bio || '',
        linkedin_url: data.linkedin_url || '',
        email_url: data.email_url || ''
      });
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setContactLoading(false);
    }
  };

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
    if (!currentProject.title || !currentProject.description) {
      alert("Title and Description required");
      return;
    }
    
    try {
      if (currentProject.id) {
        // Update existing project
        await DataService.updateProject(currentProject.id, {
          title: currentProject.title,
          description: currentProject.description,
          category: currentProject.category || '',
          image_url: currentProject.image_url || '',
          tags: currentProject.tags || [],
        });
        console.log('Project updated');
      } else {
        // Create new project
        await DataService.createProject({
          title: currentProject.title!,
          description: currentProject.description!,
          category: currentProject.category || '',
          image_url: currentProject.image_url || '',
          tags: currentProject.tags || [],
        });
        console.log('Project created');
      }
      
      setIsEditingProject(false);
      setCurrentProject({});
      await refreshData();
      alert("Project saved successfully!");
    } catch (error: any) {
      console.error('Error saving project:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error('Full error details:', error);
      alert(`Error saving project: ${errorMessage}\n\nCheck the browser console for more details.`);
    }
  };

  // Deletes a project by ID
  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this project?")) {
      try {
        await DataService.deleteProject(id);
        await refreshData();
        alert("Project deleted successfully!");
      } catch (error: any) {
        console.error('Error deleting project:', error);
        alert(`Error deleting project: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  // --- Blog CRUD Handlers ---

  // Saves a new or edited blog post
  const handleSaveBlog = async () => {
    if (!currentBlog.title || !currentBlog.slug || !currentBlog.content) {
      alert("Title, Slug, and Content are required");
      return;
    }
    
    try {
      let result: BlogPost;
      if (currentBlog.id) {
        // Update existing post
        result = await DataService.updateBlog(currentBlog.id, {
          title: currentBlog.title,
          slug: currentBlog.slug,
          summary: currentBlog.summary || null,
          content: currentBlog.content,
          published: currentBlog.published ?? true,
        });
        console.log('Blog post updated:', result);
      } else {
        // Create new post
        result = await DataService.createBlog({
          title: currentBlog.title,
          slug: currentBlog.slug,
          summary: currentBlog.summary || null,
          content: currentBlog.content,
          published: currentBlog.published ?? true,
        });
        console.log('Blog post created:', result);
      }
      
      setIsEditingBlog(false);
      setCurrentBlog({});
      await refreshData(); // Reload data from database
      alert("Post saved successfully!");
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Error saving post: ${errorMessage}. Please check the console for details.`);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (confirm("Delete this post?")) {
      try {
        await DataService.deleteBlog(id);
        refreshData(); // Reload data from database
      } catch (error) {
        console.error('Error deleting blog post:', error);
        alert("Error deleting post. Please try again.");
      }
    }
  };

  // --- Profile/Resume Handlers ---
  const handleResumeUpload = async () => {
    if (!resumeFile) {
      alert('Please select a resume file');
      return;
    }

    setResumeUploading(true);
    try {
      const resumeUrl = await uploadResume(resumeFile);
      if (resumeUrl) {
        // Update profile with new resume URL
        await DataService.updateProfile({ resume_url: resumeUrl });
        setProfileForm({ ...profileForm, resume_url: resumeUrl });
        setResumeFile(null);
        // Refresh profile data
        const updatedProfile = await DataService.getProfile();
        setProfile(updatedProfile);
        alert('Resume uploaded successfully!');
      } else {
        alert('Failed to upload resume. Please try again.');
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Error uploading resume: ${errorMessage}`);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await DataService.updateProfile(profileForm);
      // Refresh profile data
      const updatedProfile = await DataService.getProfile();
      setProfile(updatedProfile);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Error updating profile: ${errorMessage}`);
    }
  };

  const handleSaveContact = async () => {
    try {
      // Save all contact fields
      await Promise.all([
        DataService.setSiteContent('contact_bio', contactForm.contact_bio),
        DataService.setSiteContent('linkedin_url', contactForm.linkedin_url),
        DataService.setSiteContent('email_url', contactForm.email_url)
      ]);
      alert('Contact section updated successfully!');
    } catch (error: any) {
      console.error('Error updating contact section:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Error updating contact section: ${errorMessage}`);
    }
  };

  /**
   * Render Function: Overview Tab
   * Shows statistics cards and a bar chart of content distribution.
   */
  const renderOverview = () => {

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
            <ReBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis 
                stroke="#64748b"
                allowDecimals={false}
                domain={[0, maxTick]}
                ticks={ticks}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar 
                dataKey="count" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={300}
              />
            </ReBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Project Activity Chart */}
        <Card className="p-6 h-80">
          <h3 className="text-lg font-medium text-white mb-4">Selected Work Activity (Monthly)</h3>
          {monthlyActivity.length > 0 ? (() => {
            const maxValue = Math.max(...monthlyActivity.map(d => d.activity_count));
            const maxTick = Math.max(maxValue + 1, 5); // At least show up to 5
            const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
            
            return (
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
                    allowDecimals={false}
                    domain={[0, maxTick]}
                    ticks={ticks}
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
            );
          })() : (
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
                placeholder="my-thought-post"
            />
            <Textarea 
                label="Summary (Optional)" 
                value={currentBlog.summary || ''} 
                onChange={e => setCurrentBlog({...currentBlog, summary: e.target.value})} 
                placeholder="A brief summary of this post..."
                className="min-h-[80px]"
            />
            <Textarea 
                label="Content (Markdown)" 
                className="font-mono min-h-[200px]"
                value={currentBlog.content || ''} 
                onChange={e => setCurrentBlog({...currentBlog, content: e.target.value})} 
                required
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
                        {blog.summary && (
                          <p className="text-sm text-slate-400 mt-2 line-clamp-1">{blog.summary}</p>
                        )}
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
            {activeTab === 'OVERVIEW' && <div key="overview">{renderOverview()}</div>}
            {activeTab === 'SELECTED_WORK' && (
              <div className="space-y-6 animate-in fade-in duration-500" key="selected-work">
                <SelectedWorkManager />
              </div>
            )}
            {activeTab === 'THOUGHTS' && <div key="thoughts">{renderBlog()}</div>}
            {activeTab === 'SITE_CONTENT' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                  <h2 className="text-2xl font-bold text-white">Site Content</h2>
                  
                  {/* Profile Information */}
                  <Card className="p-6 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                      <Input 
                        label="Full Name" 
                        value={profileForm.full_name || ''} 
                        onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} 
                      />
                      <Input 
                        label="Subtitle" 
                        value={profileForm.subtitle || ''} 
                        onChange={e => setProfileForm({...profileForm, subtitle: e.target.value})} 
                        placeholder="e.g., Product Designer & Creative Director"
                      />
                      <Input 
                        label="Hero Title Line 1" 
                        value={profileForm.hero_title_1 || ''} 
                        onChange={e => setProfileForm({...profileForm, hero_title_1: e.target.value})} 
                      />
                      <Input 
                        label="Hero Title Line 2" 
                        value={profileForm.hero_title_2 || ''} 
                        onChange={e => setProfileForm({...profileForm, hero_title_2: e.target.value})} 
                      />
                      <Textarea 
                        label="Bio" 
                        value={profileForm.bio || ''} 
                        onChange={e => setProfileForm({...profileForm, bio: e.target.value})} 
                      />
                      <Button onClick={handleSaveProfile}>Save Profile Changes</Button>
                  </Card>

                  {/* Resume Upload */}
                  <Card className="p-6 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Resume Upload</h3>
                      {profile?.resume_url && (
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-400 mb-1">Current Resume</p>
                              <a 
                                href={profile.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                              >
                                {profile.resume_url}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">
                          Upload New Resume (PDF, DOC, or DOCX)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setResumeFile(file);
                            }
                          }}
                          className="block w-full text-sm text-slate-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-600 file:text-white
                            hover:file:bg-indigo-700
                            file:cursor-pointer
                            cursor-pointer"
                        />
                        {resumeFile && (
                          <p className="text-sm text-slate-400">
                            Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                        <Button 
                          onClick={handleResumeUpload} 
                          disabled={!resumeFile || resumeUploading}
                          className="w-full"
                        >
                          {resumeUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Resume
                            </>
                          )}
                        </Button>
                      </div>
                  </Card>

                  {/* Contact Section Management */}
                  <Card className="p-6 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Let's Shape the Future Section</h3>
                      {contactLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                          <span className="ml-3 text-slate-400">Loading contact data...</span>
                        </div>
                      ) : (
                        <>
                          <Textarea 
                            label="Contact Bio Text" 
                            value={contactForm.contact_bio} 
                            onChange={e => setContactForm({...contactForm, contact_bio: e.target.value})} 
                            placeholder="I'm always open to discussing product strategy, creative direction, or new opportunities."
                            className="min-h-[100px]"
                          />
                          <Input 
                            label="LinkedIn URL" 
                            value={contactForm.linkedin_url} 
                            onChange={e => setContactForm({...contactForm, linkedin_url: e.target.value})} 
                            placeholder="https://linkedin.com/in/yourprofile"
                            type="url"
                          />
                          <Input 
                            label="Email (mailto: link)" 
                            value={contactForm.email_url} 
                            onChange={e => setContactForm({...contactForm, email_url: e.target.value})} 
                            placeholder="your.email@example.com"
                            type="email"
                          />
                          <div className="pt-2">
                            <Button onClick={handleSaveContact} className="w-full">
                              Save Contact Section
                            </Button>
                          </div>
                          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-xs text-slate-400 mb-2 font-semibold">Site Content Keys Used:</p>
                            <ul className="text-xs text-slate-500 space-y-1 font-mono">
                              <li>• <code className="text-indigo-400">contact_bio</code> - Bio text for contact section</li>
                              <li>• <code className="text-indigo-400">linkedin_url</code> - LinkedIn profile URL</li>
                              <li>• <code className="text-indigo-400">email_url</code> - Email address (mailto: link)</li>
                            </ul>
                          </div>
                        </>
                      )}
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