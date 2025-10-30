export type ProjectStatus = "draft" | "in-progress" | "shipped" | "archived";

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectLink {
  label: string;
  url: string;
  icon?: string | null;
}

export interface Project {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  summary: string;
  description: string;
  tags: string[];
  stack: string[];
  tech: string[];
  role?: string;
  status: ProjectStatus;
  priority: number;
  sortOrder?: number;
  featured: boolean;
  liveUrl?: string;
  repoUrl?: string;
  coverUrl?: string;
  heroImageAlt?: string;
  heroVideoUrl?: string;
  gallery?: string[];
  links?: ProjectLink[];
  metrics?: ProjectMetric[];
  responsibilities?: string[];
  outcomes?: string[];
  createdAt: string;
  updatedAt?: string;
  owner?: string | null;
  ownerUsername?: string | null;
  ownerDisplayName?: string | null;
}
