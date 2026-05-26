import type { ProjectLink } from "../../types/project";

export type ProjectActionIcon = "external" | "github" | "link" | "play";

export function iconForProjectLink(link: ProjectLink): ProjectActionIcon {
  const key = (link.icon || link.label).toLowerCase();
  if (key.includes("git")) return "github";
  if (key.includes("video") || key.includes("demo") || key.includes("play")) return "play";
  if (key.includes("live") || key.includes("launch") || key.includes("site")) return "external";
  return "link";
}
