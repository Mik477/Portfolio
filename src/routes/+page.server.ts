// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const locale = cookies.get('locale') || 'de';
  throw redirect(307, `/${locale}`);
};
