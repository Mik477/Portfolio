import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, request }) => {
  const cookieLocale = cookies.get('locale');
  let locale = cookieLocale === 'en' ? 'en' : 'de';
  if (!cookieLocale) {
    const accept = request.headers.get('accept-language') || '';
    if (/^en\b/i.test(accept)) locale = 'en';
  }
  throw redirect(307, `/${locale}/datenschutz`);
};
