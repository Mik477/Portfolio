import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { decideLocale, extractCountryCodeFromHeaders, setVaryHeaders } from '$lib/server/locale';

export const load: PageServerLoad = async ({ cookies, request, setHeaders }) => {
  const locale = decideLocale({
    cookieLocale: cookies.get('locale') ?? null,
    acceptLanguage: request.headers.get('accept-language'),
    countryCode: extractCountryCodeFromHeaders((name) => request.headers.get(name)) ?? null
  });
  setVaryHeaders(setHeaders);
  throw redirect(307, `/${locale}/impressum`);
};
