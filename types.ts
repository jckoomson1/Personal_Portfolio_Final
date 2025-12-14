export interface Profile {
  id: string;
  full_name: string;
  initials: string;
  resume_url: string;
  bio: string;
  hero_title_1: string;
  hero_title_2: string;
  subtitle: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string;
  category: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown
  published: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalPosts: number;
  categories: number;
  lastUpdated: string;
}

export type ViewState = 'PUBLIC' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
export type AdminTab = 'OVERVIEW' | 'PROJECTS' | 'BLOG' | 'SETTINGS';