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
        // Fetch from selected_work table (same as public portfolio)
        const { data, error: fetchError } = await supabase
          .from('selected_work')
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

      {/* Project Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Project Header */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <div className="flex items-center gap-4 flex-wrap">
                {project.category && (
                  <>
                    <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">
                      {project.category}
                    </span>
                    <span className="text-slate-600">•</span>
                  </>
                )}
                <span className="text-slate-400 text-sm font-mono">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {project.title}
              </h1>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Project Hero Image */}
      {project.image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden -mt-8"
        >
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        </motion.div>
      )}

      {/* Project Content */}
      <section className="max-w-3xl mx-auto px-6 pb-12 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-8"
        >
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-800">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-800/50 text-slate-300 text-sm rounded-full border border-slate-700 hover:border-indigo-500/50 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-slate-300 leading-relaxed">
              <p className="text-lg md:text-xl mb-6">{project.description}</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ProjectDetail;

