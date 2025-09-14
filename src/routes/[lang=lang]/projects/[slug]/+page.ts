import { error } from '@sveltejs/kit';
import { getProjects } from '$lib/data/projectsData';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const locale = (params.lang === 'de' ? 'de' : 'en');
  const project = getProjects(locale).find(p => p.slug === params.slug);
  if (!project) {
    throw error(404, 'Project not found');
  }
  return { project };
};
