// src/hooks/useGithubBadge.ts
import { useEffect, useState } from "react";

/**
 * Controls:
 *  - VITE_GITHUB_BADGE_MODE: "off" | "stars" | "followers"  (default: "off")
 *  - For "stars": we parse owner/repo from repoUrl (https://github.com/<owner>/<repo>)
 *  - For "followers": we try owner from repoUrl, but you can override with VITE_GITHUB_USER
 *
 * No token needed. Light caching in localStorage (2h).
 */
type Mode = "off" | "stars" | "followers";

function parseRepo(repoUrl?: string) {
  try {
    if (!repoUrl) return null;
    const u = new URL(repoUrl);
    const [owner, repo] = u.pathname.replace(/^\/+/, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function cacheGet(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > 2 * 60 * 60 * 1000) return null; // 2h
    return value as number;
  } catch {
    return null;
  }
}

function cacheSet(key: string, value: number) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // localStorage write may throw (quota / private browsing) — caching is
    // best-effort, the badge will simply re-fetch on the next page load.
  }
}

export function useGithubBadge(repoUrl?: string) {
  const [count, setCount] = useState<number | null>(null);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const mode = (import.meta.env.VITE_GITHUB_BADGE_MODE as Mode) || "off";
    if (mode === "off") return;

    const repo = parseRepo(repoUrl || "");
    const userOverride = import.meta.env.VITE_GITHUB_USER as string | undefined;

    async function run() {
      try {
        if (mode === "stars") {
          if (!repo) return;
          const key = `gh-stars:${repo.owner}/${repo.repo}`;
          const cached = cacheGet(key);
          if (cached !== null) {
            setCount(cached);
            setLabel("Stars");
            return;
          }
          const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`);
          if (!res.ok) throw new Error("GitHub API error");
          const json = await res.json();
          const stars = Number(json?.stargazers_count ?? 0);
          cacheSet(key, stars);
          setCount(stars);
          setLabel("Stars");
        } else if (mode === "followers") {
          const owner = userOverride || repo?.owner;
          if (!owner) return;
          const key = `gh-followers:${owner}`;
          const cached = cacheGet(key);
          if (cached !== null) {
            setCount(cached);
            setLabel("Followers");
            return;
          }
          const res = await fetch(`https://api.github.com/users/${owner}`);
          if (!res.ok) throw new Error("GitHub API error");
          const json = await res.json();
          const followers = Number(json?.followers ?? 0);
          cacheSet(key, followers);
          setCount(followers);
          setLabel("Followers");
        }
      } catch {
        // Silent fail: just keep it hidden
      }
    }

    run();
  }, [repoUrl]);

  return { count, label };
}
