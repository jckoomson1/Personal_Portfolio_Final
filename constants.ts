import { Profile, Project, BlogPost } from './types';

// Fallback mock data to ensure the UI works without a live Supabase connection for the demo
export const MOCK_PROFILE: Profile = {
  id: '1',
  full_name: 'James Cantamantu-Koomson Jnr',
  initials: 'JC',
  resume_url: '#',
  bio: "Passionate about human-centred design and enjoy blending strategy, creativity, and execution to bring ideas to life. I also have a strong interest in creative direction, especially making products feel and look cool.",
  hero_title_1: 'Where Strategy Meets',
  hero_title_2: 'Creative Direction',
  subtitle: 'Product Management & Creative Strategy'
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Starfall CMS Platform',
    description: 'This web application. A comprehensive portfolio solution blending administrative power with high-end aesthetics. Managed the product lifecycle from ideation to deployment.',
    tags: ['Product Management', 'React', 'UX Strategy', 'Web App'],
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    category: 'Product',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Neon Nights Series',
    description: 'A collection of typographic posters exploring the intersection of retro-futurism and modern minimalism. Focused on visual hierarchy and color theory.',
    tags: ['Creative Direction', 'Graphic Design', 'Typography'],
    image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2370&auto=format&fit=crop',
    category: 'Creative Work',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    title: 'Urban Rhythm Campaign',
    description: 'Visual storytelling campaign for a streetwear brand, blending photography with bold layout design to capture the city\'s pulse.',
    tags: ['Art Direction', 'Branding', 'Visual Strategy'],
    image_url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2464&auto=format&fit=crop',
    category: 'Campaign',
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const MOCK_BLOGS: BlogPost[] = [
  {
    id: '1',
    title: 'The Art of Human-Centred Design',
    slug: 'human-centred-design',
    content: '# Design Thinking\n\nHow empathy drives better product decisions...',
    published: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Why Aesthetics Matter in Product',
    slug: 'aesthetics-in-product',
    content: '# Visual Strategy\n\nFirst impressions are everything in software adoption.',
    published: true,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];