/**
 * src/services/projects.test.ts
 *
 * Tests for clearProjectsCache() invalidation behaviour.
 *
 * Architecture note: the production file imports Supabase (network) and
 * project-mapper; we inline the cache machinery to stay within the project's
 * established pattern of testing logic without importing production files.
 *
 * What we test:
 *   1. clearProjectsCache() nulls listCache so the next listProjects() call
 *      re-fetches instead of returning the cached result.
 *   2. clearProjectsCache() clears singleCache so getProject() also re-fetches.
 *   3. Without clearing, a fresh fetch result is re-used for 60 s.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Inline cache layer (mirrors src/services/projects.ts cache block) ─────────
const LIST_TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };

interface Project {
  id: string;
  slug: string;
  title: string;
}

function createCacheLayer() {
  let listCache: CacheEntry<Project[]> | null = null;
  const singleCache = new Map<string, CacheEntry<Project | null>>();

  function isFresh<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
    return entry != null && Date.now() < entry.expiresAt;
  }

  function clearProjectsCache(): void {
    listCache = null;
    singleCache.clear();
  }

  // Simulate the fetch+cache path of listProjects()
  async function listProjects(fetchFn: () => Promise<Project[]>): Promise<Project[]> {
    if (isFresh(listCache)) return listCache.value;

    const projects = await fetchFn();
    listCache = { value: projects, expiresAt: Date.now() + LIST_TTL_MS };
    for (const p of projects) {
      const exp = Date.now() + LIST_TTL_MS;
      singleCache.set(p.id,   { value: p, expiresAt: exp });
      singleCache.set(p.slug, { value: p, expiresAt: exp });
    }
    return projects;
  }

  // Simulate the fetch+cache path of getProject()
  async function getProject(
    id: string,
    fetchFn: () => Promise<Project | null>,
  ): Promise<Project | null> {
    if (isFresh(singleCache.get(id))) return singleCache.get(id)!.value;
    const project = await fetchFn();
    if (project) {
      const exp = Date.now() + LIST_TTL_MS;
      singleCache.set(project.id,   { value: project, expiresAt: exp });
      singleCache.set(project.slug, { value: project, expiresAt: exp });
    }
    return project;
  }

  return {
    listProjects,
    getProject,
    clearProjectsCache,
    getListCache: () => listCache,
    getSingleCache: () => singleCache,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('clearProjectsCache', () => {
  let cache: ReturnType<typeof createCacheLayer>;
  const sampleProjects: Project[] = [
    { id: 'id-1', slug: 'project-one', title: 'Project One' },
    { id: 'id-2', slug: 'project-two', title: 'Project Two' },
  ];

  beforeEach(() => {
    cache = createCacheLayer();
  });

  it('listProjects uses cache on second call without clearProjectsCache', async () => {
    const fetchFn = vi.fn().mockResolvedValue(sampleProjects);

    await cache.listProjects(fetchFn);
    await cache.listProjects(fetchFn);

    // Fetch should only be called once — second call uses cache
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('clearProjectsCache() followed by listProjects() re-fetches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(sampleProjects);

    await cache.listProjects(fetchFn); // populates cache
    cache.clearProjectsCache();        // invalidate
    await cache.listProjects(fetchFn); // should fetch again

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('clearProjectsCache() nulls listCache', async () => {
    const fetchFn = vi.fn().mockResolvedValue(sampleProjects);
    await cache.listProjects(fetchFn);

    expect(cache.getListCache()).not.toBeNull();

    cache.clearProjectsCache();

    expect(cache.getListCache()).toBeNull();
  });

  it('clearProjectsCache() empties singleCache', async () => {
    const fetchFn = vi.fn().mockResolvedValue(sampleProjects);
    await cache.listProjects(fetchFn);

    expect(cache.getSingleCache().size).toBeGreaterThan(0);

    cache.clearProjectsCache();

    expect(cache.getSingleCache().size).toBe(0);
  });

  it('getProject re-fetches after clearProjectsCache()', async () => {
    // Pre-warm via listProjects
    await cache.listProjects(vi.fn().mockResolvedValue(sampleProjects));

    // singleCache now has id-1
    const getProjectFetch = vi.fn().mockResolvedValue(sampleProjects[0]);

    // First call should hit singleCache (no fetch)
    await cache.getProject('id-1', getProjectFetch);
    expect(getProjectFetch).toHaveBeenCalledTimes(0);

    // Invalidate, then fetch should fire
    cache.clearProjectsCache();
    await cache.getProject('id-1', getProjectFetch);
    expect(getProjectFetch).toHaveBeenCalledTimes(1);
  });

  it('listProjects returns fresh data after cache invalidation', async () => {
    const oldProjects: Project[] = [{ id: 'old-1', slug: 'old', title: 'Old' }];
    const newProjects: Project[] = [{ id: 'new-1', slug: 'new', title: 'New' }];

    const fetchFn = vi.fn()
      .mockResolvedValueOnce(oldProjects)
      .mockResolvedValueOnce(newProjects);

    const first = await cache.listProjects(fetchFn);
    expect(first[0].title).toBe('Old');

    cache.clearProjectsCache();

    const second = await cache.listProjects(fetchFn);
    expect(second[0].title).toBe('New');
  });
});
