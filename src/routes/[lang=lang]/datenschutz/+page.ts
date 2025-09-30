import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, url }) => {
  // If user accesses /en/datenschutz, redirect permanently to /en/privacy
  if (params.lang === 'en') {
    throw redirect(308, '/en/privacy');
  }
  return {};
};
