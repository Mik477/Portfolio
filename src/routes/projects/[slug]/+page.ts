// src/routes/projects/[slug]/+page.ts

import { error } from '@sveltejs/kit';
import { projects } from '$lib/data/projectsData';
import type { PageLoad } from './$types';

// FIX: Removed `url` from the function parameters. We only need `params`.
export const load: PageLoad = ({ params }) => {
  const project = projects.find(p => p.slug === params.slug);

  if (!project) {
    throw error(404, 'Project not found');
  }

  // FIX: Only return the project data. The hash will be read on the client.
  return {
    project
  };
};