import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BlogPost } from '../../types';
import { Button } from '../ui/Components';
import { DataService } from '../../services/supabaseService';

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
        // Fetch all blog posts and find the one matching the ID
        const allBlogs = await DataService.getBlogPosts();
        const foundBlog = allBlogs.find(b => b.id === blogId);

        if (!foundBlog) {
          setError('Article not found');
        } else if (!foundBlog.published) {
          setError('Article not published');
        } else {
          setBlog(foundBlog);
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

  // Helper function to render markdown content with enhanced formatting
  const renderContent = (content: string) => {
    // Split by double newlines to get paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    
    return paragraphs.map((para, paraIdx) => {
      const trimmedPara = para.trim();
      if (!trimmedPara) return null;
      
      // Check for headings
      if (trimmedPara.startsWith('#')) {
        const match = trimmedPara.match(/^(#+)\s+(.+)$/);
        if (match) {
          const headingLevel = match[1].length;
          const headingText = match[2];
          const headingTag = `h${Math.min(headingLevel, 3)}` as 'h1' | 'h2' | 'h3';
          const className = `font-bold text-white mt-8 mb-4 first:mt-0 ${
            headingLevel === 1 ? 'text-3xl' : headingLevel === 2 ? 'text-2xl' : 'text-xl'
          }`;
          
          return React.createElement(
            headingTag,
            { key: paraIdx, className },
            renderInlineMarkdown(headingText)
          );
        }
      }
      
      // Check for lists
      if (trimmedPara.match(/^[-*+]\s/)) {
        const items = trimmedPara.split('\n').filter(line => line.trim().match(/^[-*+]\s/));
        return (
          <ul key={paraIdx} className="mb-6 ml-6 space-y-2 list-disc list-outside text-slate-300">
            {items.map((item, itemIdx) => {
              const itemText = item.replace(/^[-*+]\s+/, '');
              return (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineMarkdown(itemText)}
                </li>
              );
            })}
          </ul>
        );
      }
      
      // Check for numbered lists
      if (trimmedPara.match(/^\d+\.\s/)) {
        const items = trimmedPara.split('\n').filter(line => line.trim().match(/^\d+\.\s/));
        return (
          <ol key={paraIdx} className="mb-6 ml-6 space-y-2 list-decimal list-outside text-slate-300">
            {items.map((item, itemIdx) => {
              const itemText = item.replace(/^\d+\.\s+/, '');
              return (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInlineMarkdown(itemText)}
                </li>
              );
            })}
          </ol>
        );
      }
      
      // Regular paragraph
      return (
        <p key={paraIdx} className="mb-6 text-slate-300 leading-relaxed text-lg">
          {renderInlineMarkdown(trimmedPara)}
        </p>
      );
    });
  };

  // Helper function to render inline markdown (bold, italic, links, code)
  const renderInlineMarkdown = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    let currentIndex = 0;
    
    // Pattern for bold **text** or __text__
    const boldPattern = /(\*\*|__)(.+?)\1/g;
    // Pattern for italic *text* or _text_
    const italicPattern = /(\*|_)(.+?)\1/g;
    // Pattern for links [text](url)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Pattern for inline code `code`
    const codePattern = /`([^`]+)`/g;
    
    // Combine all patterns
    const allMatches: Array<{ index: number; length: number; type: string; content: string; url?: string }> = [];
    
    let match;
    while ((match = boldPattern.exec(text)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'bold', content: match[2] });
    }
    while ((match = italicPattern.exec(text)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'italic', content: match[2] });
    }
    while ((match = linkPattern.exec(text)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'link', content: match[1], url: match[2] });
    }
    while ((match = codePattern.exec(text)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'code', content: match[1] });
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build parts array
    allMatches.forEach((match) => {
      // Add text before match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      
      // Add formatted element
      switch (match.type) {
        case 'bold':
          parts.push(<strong key={`${match.index}-bold`} className="font-bold text-white">{match.content}</strong>);
          break;
        case 'italic':
          parts.push(<em key={`${match.index}-italic`} className="italic">{match.content}</em>);
          break;
        case 'link':
          parts.push(
            <a 
              key={`${match.index}-link`} 
              href={match.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {match.content}
            </a>
          );
          break;
        case 'code':
          parts.push(
            <code key={`${match.index}-code`} className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded text-sm font-mono">
              {match.content}
            </code>
          );
          break;
      }
      
      currentIndex = match.index + match.length;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
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

      {/* Article Hero Section */}
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
            {/* Article Header */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
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
                {blog.published_at && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-sm font-mono">
                      Published {new Date(blog.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </>
                )}
                <span className="text-slate-600">•</span>
                <span className="text-sm">
                  {Math.ceil(blog.content.split(/\s+/).length / 200)} min read
                </span>
              </div>
              {blog.summary && (
                <p className="text-lg text-slate-300 mt-4 italic border-l-4 border-indigo-500 pl-4">
                  {blog.summary}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Article Content */}
      <section className="max-w-3xl mx-auto px-6 pb-12 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <article className="prose prose-invert prose-lg max-w-none">
            <div className="text-slate-300">
              {renderContent(blog.content)}
            </div>
          </article>
        </motion.div>
      </section>
    </div>
  );
};

export default BlogDetail;

