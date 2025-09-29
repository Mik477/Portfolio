// src/routes/[lang=lang]/projects/[slug]/+layout.ts
import type { LayoutLoad } from './$types';
import { getProjects, type Locale } from '$lib/data/projectsData';

export const load: LayoutLoad = ({ params }) => {
  const langParam = params.lang === 'de' ? 'de' : 'en';
  const locale = langParam as Locale;
  const slug = params.slug;
  const project = getProjects(locale).find(p => p.slug === slug);
  return {
    projectId: project?.id ?? null,
    locale
  };
};
