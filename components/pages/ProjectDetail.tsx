import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Project } from '../../types';
import { Button } from '../ui/Components';
import { supabase } from '../../src/lib/supabaseClient';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

/**
 * ProjectDetail Component
 * 
 * Displays a detailed view of a single Selected Work project.
 * Shows project title, image, description, tags, category, and link.
 */
const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (fetchError) {
          console.error('Error fetching project:', fetchError);
          setError('Project not found');
        } else {
          setProject(data);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-slate-500 font-mono text-sm">Loading project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-white">Project Not Found</h2>
          <p className="text-slate-400">{error || 'The project you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 pb-20">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-40">
        <Button
          onClick={onBack}
          variant="secondary"
          className="bg-slate-900/70 backdrop-blur-md border-slate-800 hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Button>
      </div>

      {/* Project Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden"
      >
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-800 text-slate-600">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        
        {/* Project Header Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">
                {project.category}
              </span>
              <span className="text-slate-400 text-sm">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {project.title}
            </h1>
          </motion.div>
        </div>
      </motion.div>

      {/* Project Content */}
      <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-8"
        >
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded border border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed">
            <p className="text-lg md:text-xl">{project.description}</p>
          </div>

          {/* Link Button (if project has a link) */}
          <div className="pt-8 border-t border-slate-800">
            <Button
              onClick={() => {
                // If project has a link field, use it; otherwise use placeholder
                const linkUrl = (project as any).link || '#';
                if (linkUrl && linkUrl !== '#') {
                  window.open(linkUrl, '_blank');
                }
              }}
              className="h-12 px-8 text-base"
            >
              Visit Live Project
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ProjectDetail;

