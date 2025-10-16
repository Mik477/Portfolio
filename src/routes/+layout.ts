import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

export const prerender = true;

/**
 * Layout load function - determines locale from URL params and loads translations.
 * 
 * The locale cookie is now managed server-side by:
 * - hooks.server.ts (for root path visits)
 * - +page.server.ts (for explicit root page loads)
 * - LanguageSwitcher component (for user-initiated language changes)
 * 
 * This function simply respects the URL params set by server redirects.
 */
export const load: LayoutLoad = async ({ params }) => {
  // Derive locale from URL segment [lang] when present; fallback 'en'
  let locale: 'en' | 'de' = params.lang === 'de' ? 'de' : 'en';
  
  // Dynamically import translation JSON bundles
  const common = (await import(`$lib/i18n/locales/${locale}/common.json`)).default;
  const layout = (await import(`$lib/i18n/locales/${locale}/layout.json`)).default;
  
  // Sync cookie on client-side to match the URL locale (backup/fallback)
  // This ensures consistency if server-side cookie setting fails
  if (browser) {
    const cookieMatch = document.cookie.match(/(?:^|; )locale=(en|de)/);
    const currentCookie = cookieMatch?.[1];
    if (currentCookie !== locale) {
      document.cookie = `locale=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }
  
  return { messages: { common, layout }, locale };
};
