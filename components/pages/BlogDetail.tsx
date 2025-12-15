import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BlogPost } from '../../types';
import { Button } from '../ui/Components';
import { supabase } from '../../src/lib/supabaseClient';

interface BlogDetailProps {
  blogId: string;
  onBack: () => void;
}

/**
 * BlogDetail Component
 * 
 * Displays a detailed view of a single Thoughts & Insights article.
 * Shows article title, published date, and full content.
 */
const BlogDetail: React.FC<BlogDetailProps> = ({ blogId, onBack }) => {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', blogId)
          .single();

        if (fetchError) {
          console.error('Error fetching blog post:', fetchError);
          setError('Article not found');
        } else if (!data.published) {
          setError('Article not published');
        } else {
          setBlog(data);
        }
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      loadBlog();
    }
  }, [blogId]);

  // Helper function to render markdown content as plain text with basic formatting
  const renderContent = (content: string) => {
    // Split by lines to preserve paragraph breaks
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Remove markdown heading markers
      const cleanLine = line.replace(/^#+\s*/, '').trim();
      
      // Skip empty lines
      if (!cleanLine) {
        return <br key={idx} />;
      }
      
      // Check if it was a heading (starts with #)
      if (line.trim().startsWith('#')) {
        const headingLevel = line.match(/^#+/)?.[0].length || 1;
        const HeadingTag = `h${Math.min(headingLevel, 3)}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            key={idx} 
            className={`font-bold text-white mt-6 mb-4 ${
              headingLevel === 1 ? 'text-3xl' : headingLevel === 2 ? 'text-2xl' : 'text-xl'
            }`}
          >
            {cleanLine}
          </HeadingTag>
        );
      }
      
      // Regular paragraph
      return (
        <p key={idx} className="mb-4 text-slate-300 leading-relaxed">
          {cleanLine}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-slate-500 font-mono text-sm">Loading article...</span>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-white">Article Not Found</h2>
          <p className="text-slate-400">{error || 'The article you\'re looking for doesn\'t exist.'}</p>
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

      {/* Article Content */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Article Header */}
          <div className="space-y-4 border-b border-slate-800 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {blog.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-sm font-mono">
                {new Date(blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-invert prose-lg max-w-none">
            <div className="text-slate-300 leading-relaxed">
              {renderContent(blog.content)}
            </div>
          </article>
        </motion.div>
      </section>
    </div>
  );
};

export default BlogDetail;

