// src/routes/projects/[slug]/+layout.ts
import type { LayoutLoad } from './$types';
import { getProjects } from '$lib/data/projectsData';

// Assume default locale is 'en' for root (adjust if different in your setup)
const DEFAULT_LOCALE = 'en';

export const load: LayoutLoad = ({ params }) => {
  const slug = params.slug;
  const project = getProjects(DEFAULT_LOCALE).find(p => p.slug === slug);
  return {
    projectId: project?.id ?? null
  };
};
