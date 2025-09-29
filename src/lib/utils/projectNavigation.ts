// src/lib/utils/projectNavigation.ts
// Utility helpers for deriving main-page section hashes from project slugs.
import { getProjects, type Locale } from '$lib/data/projectsData';

/** Returns the internal project.id for a given slug+locale or null if none found */
export function projectIdFromSlug(slug: string, locale: Locale): string | null {
  if (!slug) return null;
  try {
    const projects = getProjects(locale);
    const match = projects.find(p => p.slug === slug);
    return match ? match.id : null;
  } catch {
    return null;
  }
}

/** Builds the section hash (#project-{id}) for a given slug+locale or empty string */
export function projectHashFromSlug(slug: string, locale: Locale): string {
  const id = projectIdFromSlug(slug, locale);
  return id ? `#project-${id}` : '';
}
