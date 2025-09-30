import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

export const prerender = true;

// Purely static locale resolution: derived from URL segment [lang] when present; fallback 'en'.
// (Previous server-side detection via headers removed for static hosting compatibility.)
export const load: LayoutLoad = async ({ params }) => {
  let locale: 'en' | 'de' = params.lang === 'de' ? 'de' : 'en';
  // Optional: read cookie on client to choose locale when visiting root '/'
  if (!params.lang && browser) {
    const cookieMatch = document.cookie.match(/(?:^|; )locale=(en|de)/);
    if (cookieMatch) locale = cookieMatch[1] as 'en' | 'de';
  }
  // Dynamically import translation JSON bundles
  const common = (await import(`$lib/i18n/locales/${locale}/common.json`)).default;
  const layout = (await import(`$lib/i18n/locales/${locale}/layout.json`)).default;
  // Set/update cookie client-side (non-httpOnly) so future root visits reuse selection
  if (browser) {
    if (!document.cookie.includes(`locale=${locale}`)) {
      document.cookie = `locale=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }
  return { messages: { common, layout }, locale };
};
