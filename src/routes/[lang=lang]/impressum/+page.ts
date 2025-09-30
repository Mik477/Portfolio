import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  if (params.lang === 'en') {
    throw redirect(308, '/en/imprint');
  }
  return {};
};
