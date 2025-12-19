import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Linkedin, Mail, ExternalLink, Download, X, ArrowRight, Loader2, Send } from 'lucide-react';
import { DataService } from '../../services/supabaseService';
import { Profile, Project, BlogPost } from '../../types';
import { Button, Card, Input, Textarea } from '../ui/Components';
import { supabase } from '../../src/lib/supabaseClient';
import { incrementPortfolioView } from '../../src/services/analyticsService';

/**
 * PublicPortfolio Component
 * 
 * The main public-facing view of the application.
 * It fetches data from Supabase (or mocks) and renders the portfolio sections:
 * Hero, Projects Grid, Blog Insights, and Contact Form.
 */
const PublicPortfolio: React.FC = () => {
  // --- State Management ---
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [contactData, setContactData] = useState({
    contact_bio: '',
    linkedin_url: '',
    email_url: ''
  });
  
  // UI State: Tracks which project is currently opened in the modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Contact Form State
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- Data Fetching Function ---
  const loadData = async () => {
    try {
      // Load main data first
      const profileData = await DataService.getProfile();
      const blogsData = await DataService.getBlogPosts();
      
      setProfile(profileData);
      setBlogs(blogsData.filter(b => b.published));
      
      // Load contact section data separately (non-blocking)
      try {
        const contactSectionData = await DataService.getSiteContentMultiple([
          'contact_bio',
          'linkedin_url',
          'email_url'
        ]);
        setContactData({
          contact_bio: contactSectionData.contact_bio || '',
          linkedin_url: contactSectionData.linkedin_url || '',
          email_url: contactSectionData.email_url || ''
        });
      } catch (contactError) {
        // If contact data fails, use defaults
        console.warn('Contact section data not available:', contactError);
        setContactData({
          contact_bio: '',
          linkedin_url: '',
          email_url: ''
        });
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Set defaults to allow page to render
      setContactData({
        contact_bio: '',
        linkedin_url: '',
        email_url: ''
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    loadData();
  }, []);

  // --- Refresh articles when page gains focus (e.g., returning from admin) ---
  useEffect(() => {
    const handleFocus = () => {
      // Reload blogs when window gains focus
      const refreshBlogs = async () => {
        try {
          const blogsData = await DataService.getBlogPosts();
          setBlogs(blogsData.filter(b => b.published));
        } catch (error) {
          console.error('Error refreshing blogs:', error);
        }
      };
      refreshBlogs();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // --- Track Portfolio View ---
  useEffect(() => {
    // Track a view when the portfolio page loads
    incrementPortfolioView();
  }, []);

  // --- Projects Data Fetching from Supabase (selected_work table) ---
  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        const { data, error } = await supabase
          .from('selected_work')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching selected work:', error);
          setProjects([]);
        } else {
          setProjects(data || []);
        }
      } catch (err) {
        console.error('Error loading selected work:', err);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    loadProjects();
  }, []);

  /**
   * Smooth Scroll Helper
   * Manually scrolls to an element ID because standard anchor links (#id) 
   * conflict with React Router's HashRouter strategy.
   */
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Form Submission Handler
   * Simulates a network request delay and shows success state.
   */
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      // Reset form
      setFormState({ name: '', email: '', message: '' });
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    }, 1500);
  };

  // --- Loading State ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-500 font-mono text-sm tracking-widest uppercase">Initializing Starfall...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative z-10 pb-20 overflow-x-hidden">
      {/* --- Navigation Bar --- */}
      {/* Sticky header with blur effect for modern glassmorphism look */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-lg md:text-xl tracking-tighter text-white truncate max-w-[200px] md:max-w-none">
            {profile?.full_name}
          </div>
          {/* Desktop Links */}
          <div className="flex gap-6 text-sm text-slate-300 font-medium hidden md:flex">
            <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">Bio</button>
            <button onClick={() => scrollToSection('projects')} className="hover:text-white transition-colors">Work</button>
            <button onClick={() => scrollToSection('insights')} className="hover:text-white transition-colors">Insights</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button>
            <a href="#/admin/login" className="text-indigo-400 hover:text-indigo-300 ml-4">Admin</a>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="about" className="pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Animated Text Block */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4"
          >
            <h2 className="text-indigo-400 font-medium tracking-[0.2em] uppercase text-xs md:text-sm pl-1">{profile?.subtitle}</h2>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-white leading-[0.95]">
              {profile?.hero_title_1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {profile?.hero_title_2}
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-400 max-w-2xl leading-relaxed pt-4">
              {profile?.bio}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex gap-4 pt-4"
          >
            <Button onClick={() => scrollToSection('projects')} className="h-12 px-8 text-base rounded-full">
              View Selected Work
            </Button>
            <Button 
              variant="secondary" 
              onClick={async () => {
                if (profile?.resume_url) {
                  try {
                    // Fetch the file and trigger download
                    const response = await fetch(profile.resume_url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    // Extract filename from URL or use default
                    const urlParts = profile.resume_url.split('/');
                    const filename = urlParts[urlParts.length - 1] || 'resume.pdf';
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading resume:', error);
                    // Fallback to opening in new tab if download fails
                    window.open(profile.resume_url, '_blank');
                  }
                }
              }} 
              className="h-12 px-8 text-base rounded-full bg-transparent border-slate-700 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Resumé
            </Button>
          </motion.div>
        </div>
      </section>

      {/* --- Projects Grid Section --- */}
      <section id="projects" className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Selected Work</h2>
              <p className="text-slate-400">A curation of product and creative direction.</p>
            </div>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mr-3" />
              <span className="text-slate-400">Loading projects...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    // Navigate to project detail page
                    window.location.hash = `#/project/${project.id}`;
                  }}
                  className="cursor-pointer group"
                >
                  {/* Project Card */}
                  <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-800 relative">
                      {project.image_url ? (
                        <img 
                          src={project.image_url} 
                          alt={project.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-600">No Image</div>
                      )}
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                      
                      <div className="absolute bottom-0 left-0 p-6 w-full">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">{project.category}</span>
                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">{project.title}</h3>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- Insights / Blog Section --- */}
      <section id="insights" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
           <div className="flex items-end justify-between mb-12 border-b border-slate-800 pb-8">
             <h2 className="text-3xl md:text-4xl font-bold text-white">Thoughts & Insights</h2>
           </div>
           <div className="space-y-8">
              {(showAllArticles ? blogs : blogs.slice(0, 3)).map(blog => (
                <div 
                  key={blog.id} 
                  className="group cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate to blog detail page
                    window.location.hash = `#/article/${blog.id}`;
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{blog.title}</h3>
                    <span className="text-sm text-slate-500 font-mono">{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                  {/* Use summary if available, otherwise show content preview */}
                  <p className="text-slate-400 line-clamp-2 max-w-2xl">
                    {blog.summary || blog.content.substring(0, 150).replace(/[#*_]/g, '')}...
                  </p>
                  <div className="mt-4 flex items-center text-sm text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Read Article <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              ))}
              {blogs.length === 0 && <p className="text-slate-500 italic">No insights published yet.</p>}
              {blogs.length > 3 && !showAllArticles && (
                <div className="pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowAllArticles(true)}
                    className="w-full md:w-auto"
                  >
                    See All Articles ({blogs.length})
                  </Button>
                </div>
              )}
              {showAllArticles && blogs.length > 3 && (
                <div className="pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowAllArticles(false);
                      scrollToSection('insights');
                    }}
                    className="w-full md:w-auto"
                  >
                    Show Less
                  </Button>
                </div>
              )}
           </div>
        </div>
      </section>

      {/* --- Contact & Footer Section --- */}
      <section id="contact" className="py-24 px-6 border-t border-slate-900 bg-slate-950/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">Let's shape the future.</h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              {contactData.contact_bio || "I'm always open to discussing product strategy, creative direction, or new opportunities."}
            </p>
            <div className="flex gap-4">
              {contactData.linkedin_url && (
                <a 
                  href={contactData.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 rounded-full bg-slate-900 border border-slate-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white text-slate-400 transition-all"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {contactData.email_url && (
                <a 
                  href={`mailto:${contactData.email_url}`}
                  className="p-4 rounded-full bg-slate-900 border border-slate-800 hover:bg-green-600 hover:border-green-500 hover:text-white text-slate-400 transition-all"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Interactive Contact Form */}
          <Card className="p-8 border-slate-800 bg-slate-900/50">
            {submitted ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 animate-in fade-in">
                 <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                   <Send className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                 <p className="text-slate-400">Thanks for reaching out. I'll get back to you shortly.</p>
               </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Name</label>
                  <Input 
                    required 
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                    placeholder="Jane Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input 
                    required 
                    type="email"
                    value={formState.email}
                    onChange={e => setFormState({...formState, email: e.target.value})}
                    placeholder="jane@company.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Message</label>
                  <Textarea 
                    required 
                    value={formState.message}
                    onChange={e => setFormState({...formState, message: e.target.value})}
                    placeholder="Tell me about your project..." 
                    className="min-h-[120px]"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
                </Button>
              </form>
            )}
          </Card>
        </div>
        <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {profile?.full_name}. Powered by Supabase & Starfall.
        </footer>
      </section>

      {/* --- Project Detail Modal --- */}
      {/* AnimatePresence allows components to animate out when removed from the DOM */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative"
              onClick={e => e.stopPropagation()} // Prevent click from closing modal when clicking inside
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="relative h-64 md:h-96 w-full">
                <img 
                  src={selectedProject.image_url} 
                  className="w-full h-full object-cover" 
                  alt={selectedProject.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                   <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">
                        {selectedProject.category}
                      </span>
                      <span className="text-slate-400 text-sm">{new Date(selectedProject.created_at).toLocaleDateString()}</span>
                   </div>
                   <h2 className="text-3xl md:text-5xl font-bold text-white">{selectedProject.title}</h2>
                </div>
              </div>

              <div className="p-8 space-y-8">
                 <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded border border-slate-700">
                        {tag}
                      </span>
                    ))}
                 </div>

                 <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                    <p>{selectedProject.description}</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                 </div>

                 <div className="pt-8 border-t border-slate-800 flex justify-end">
                    <Button onClick={() => window.open('#', '_blank')}>
                      Visit Live Project <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicPortfolio;