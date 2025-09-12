import { error } from '@sveltejs/kit';
import { projects } from '$lib/data/projectsData';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const project = projects.find(p => p.slug === params.slug);
  if (!project) {
    throw error(404, 'Project not found');
  }
  return { project };
};
