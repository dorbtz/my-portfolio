export type ProjectStatus = "shipped" | "wip" | "concept";

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  problem: string;
  role: string;
  writeup: string;
  stack: string[];
  tags: string[];
  coverUrl: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  status: ProjectStatus;
  featured: boolean;
  priority: number;
  sortOrder: number;
};
