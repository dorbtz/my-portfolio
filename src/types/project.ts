export interface Project {
  id?: string;
  title: string;
  summary: string;
  tech: string[];
  repo_url: string;
  live_url?: string;
  cover_url?: string;
  highlight?: boolean;
}
