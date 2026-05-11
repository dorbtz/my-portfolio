import type { ReactElement } from "react";
import type { ProjectActionIcon } from "./projectActionHelpers";

type ProjectActionButtonProps = {
  href: string;
  label: string;
  icon: ProjectActionIcon;
  className?: string;
  size?: "sm" | "md";
};

const ICONS: Record<ProjectActionIcon, ReactElement> = {
  external: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
      <path
        fill="currentColor"
        d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
      <path
        fill="currentColor"
        d="M12 2C6.47 2 2 6.58 2 12.26c0 4.51 2.87 8.33 6.84 9.69c.5.09.68-.23.68-.5c0-.25-.01-.86-.01-1.68c-2.78.61-3.37-1.36-3.37-1.36c-.45-1.19-1.11-1.51-1.11-1.51c-.91-.64.07-.63.07-.63c1 .07 1.53 1.06 1.53 1.06c.89 1.58 2.35 1.12 2.93.86c.09-.68.35-1.12.63-1.38c-2.22-.26-4.56-1.13-4.56-5.09c0-1.12.39-2.03 1.02-2.75c-.1-.27-.45-1.32.1-2.75c0 0 .85-.28 2.79 1.05c.8-.23 1.67-.35 2.54-.35c.86 0 1.74.12 2.54.35c1.94-1.33 2.79-1.05 2.79-1.05c.56 1.43.21 2.48.11 2.75c.63.72 1.02 1.63 1.02 2.75c0 3.96-2.34 4.82-4.57 5.08c.36.32.68.95.68 1.92c0 1.39-.01 2.51-.01 2.85c0 .27.18.59.69.49a10.07 10.07 0 0 0 6.85-9.69C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
      <path
        fill="currentColor"
        d="m13.06 7.53l2.41-2.41a2 2 0 0 1 2.83 0l.59.59a2 2 0 0 1 0 2.83l-2.41 2.41a2 2 0 0 1-2.83 0l-.59-.59l-1.41 1.41l.59.59a4 4 0 0 0 5.66 0l2.41-2.41a4 4 0 0 0 0-5.66l-.59-.59a4 4 0 0 0-5.66 0l-2.41 2.41zm-2.12 8.94l-2.41 2.41a2 2 0 0 1-2.83 0l-.59-.59a2 2 0 0 1 0-2.83l2.41-2.41a2 2 0 0 1 2.83 0l.59.59l1.41-1.41l-.59-.59a4 4 0 0 0-5.66 0l-2.41 2.41a4 4 0 0 0 0 5.66l.59.59a4 4 0 0 0 5.66 0l2.41-2.41z"
      />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-80">
      <path fill="currentColor" d="m8.5 6.5l9 5.5l-9 5.5z" />
    </svg>
  ),
};

export function ProjectActionButton({
  href,
  label,
  icon,
  className = "",
  size = "md",
}: ProjectActionButtonProps) {
  const dimension = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={`project-action-btn inline-flex ${dimension} items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--color-highlight)/0.45)] focus-visible:outline-offset-2 ${className}`}
    >
      {ICONS[icon]}
    </a>
  );
}
