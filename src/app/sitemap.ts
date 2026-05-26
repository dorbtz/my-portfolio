import type { MetadataRoute } from "next";
import { getAllProjectSlugs } from "@/shared/data/queries";

/**
 * Sitemap — public routes only. Admin / auth / API are excluded
 * (also blocked in robots.ts). Generated dynamically from the
 * projects table so new projects automatically appear in Google.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorbtz.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/projects`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/resume`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/playground`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/case-studies`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${base}/status`, lastModified: now, priority: 0.3, changeFrequency: "daily" },
  ];

  try {
    const slugs = await getAllProjectSlugs();
    const projectRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${base}/projects/${slug}`,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "monthly",
    }));
    return [...staticRoutes, ...projectRoutes];
  } catch {
    return staticRoutes;
  }
}
