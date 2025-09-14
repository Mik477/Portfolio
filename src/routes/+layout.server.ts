// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { decideLocale, extractCountryCodeFromHeaders, setVaryHeaders, syncLocaleCookie } from '$lib/server/locale';

export const load: LayoutServerLoad = async ({ cookies, request, params, setHeaders }) => {
  const urlLocale = params?.lang ?? null;
  const cookieLocale = cookies.get('locale');
  const accept = request.headers.get('accept-language');
  const countryCode = extractCountryCodeFromHeaders((name) => request.headers.get(name));

  const locale = decideLocale({ urlLocale, cookieLocale, acceptLanguage: accept, countryCode });
  syncLocaleCookie(cookies, locale);
  setVaryHeaders(setHeaders);

  return { locale };
};
