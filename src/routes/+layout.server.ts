// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

const SUPPORTED = ['en', 'de'] as const;
type Locale = typeof SUPPORTED[number];
const DEFAULT_LOCALE: Locale = 'de';

function pickFromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;
  const lowered = header.toLowerCase();
  if (lowered.includes('de')) return 'de';
  if (lowered.includes('en')) return 'en';
  return undefined;
}

export const load: LayoutServerLoad = async ({ cookies, request, params }) => {
  // 1) Prefer explicit URL locale when present (/en or /de)
  const urlLocale = (params?.lang as Locale | undefined);
  if (urlLocale && SUPPORTED.includes(urlLocale)) {
    // Keep cookie in sync with URL locale
    if (cookies.get('locale') !== urlLocale) {
      cookies.set('locale', urlLocale, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    }
    return { locale: urlLocale };
  }

  // 2) Otherwise fall back to cookie, then Accept-Language, then default
  let locale = cookies.get('locale') as Locale | undefined;
  if (!locale || !SUPPORTED.includes(locale)) {
    const accept = request.headers.get('accept-language');
    locale = pickFromAcceptLanguage(accept) || DEFAULT_LOCALE;
    cookies.set('locale', locale, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  }
  return { locale };
};
