import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  // If user accesses /de/imprint, redirect permanently to /de/impressum
  if (params.lang === 'de') {
    throw redirect(308, '/de/impressum');
  }
  return {};
};
