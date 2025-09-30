// src/lib/server/locale.ts
import type { Cookies } from '@sveltejs/kit';

export const SUPPORTED = ['en', 'de'] as const;
export type Locale = typeof SUPPORTED[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function pickFromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;
  const lowered = header.toLowerCase();
  if (lowered.includes('de')) return 'de';
  if (lowered.includes('en')) return 'en';
  return undefined;
}

const GERMAN_COUNTRIES = new Set(['DE', 'AT', 'CH', 'LI', 'LU']);

export function localeFromCountryCode(code: string | null | undefined): Locale | undefined {
  if (!code) return undefined;
  const upper = code.trim().slice(0, 2).toUpperCase();
  if (!upper) return undefined;
  return GERMAN_COUNTRIES.has(upper) ? 'de' : 'en';
}

export function extractCountryCodeFromHeaders(get: (name: string) => string | null): string | undefined {
  // Common CDN/host headers
  // Cloudflare: CF-IPCountry, Vercel: x-vercel-ip-country, Fastly: Fastly-GeoIP-Country-Code | X-Fastly-Country-Code
  // Generic/Custom: X-Country-Code, X-Geo-Country; Netlify: x-nf-geo (JSON string)
  const candidates = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'fastly-geoip-country-code',
    'x-fastly-country-code',
    'x-country-code',
    'x-geo-country'
  ];
  for (const name of candidates) {
    const v = get(name);
    if (v && v.trim()) return v.trim();
  }

  // Netlify specific header (JSON string)
  const nf = get('x-nf-geo');
  if (nf) {
    try {
      const data = JSON.parse(nf);
      const code = data?.country?.code || data?.country?.toString?.();
      if (code) return String(code);
    } catch {
      // ignore parsing errors
    }
  }
  return undefined;
}

export function decideLocale(opts: {
  urlLocale?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  countryCode?: string | null;
}): Locale {
  // 1) Explicit URL wins
  const url = (opts.urlLocale || '').toLowerCase();
  if (SUPPORTED.includes(url as Locale)) return url as Locale;

  // 2) Cookie next
  const cookie = (opts.cookieLocale || '').toLowerCase();
  if (SUPPORTED.includes(cookie as Locale)) return cookie as Locale;

  // 3) Accept-Language next
  const fromAL = pickFromAcceptLanguage(opts.acceptLanguage ?? null);
  if (fromAL) return fromAL;

  // 4) GeoIP country (final fallback)
  const fromGeo = localeFromCountryCode(opts.countryCode ?? undefined);
  if (fromGeo) return fromGeo;

  // 5) Default
  return DEFAULT_LOCALE;
}

export function syncLocaleCookie(cookies: Cookies, locale: Locale) {
  if (cookies.get('locale') !== locale) {
    cookies.set('locale', locale, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });
  }
}

export function setVaryHeaders(setHeaders: (headers: Record<string, string>) => void) {
  // Ensure caches consider language and geo headers
  const varyValues = [
    'Accept-Language',
    'Cookie',
    'CF-IPCountry',
    'X-Country-Code',
    'X-Geo-Country',
    'X-Vercel-IP-Country',
    'Fastly-GeoIP-Country-Code',
    'X-Fastly-Country-Code',
    'X-NF-Geo'
  ];
  setHeaders({ Vary: varyValues.join(', ') });
}
