// src/routes/debug/locale/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { decideLocale, extractCountryCodeFromHeaders, setVaryHeaders } from '$lib/server/locale';

export const GET: RequestHandler = async ({ cookies, request, setHeaders, url }) => {
  const acceptLanguage = request.headers.get('accept-language');
  const countryCode = extractCountryCodeFromHeaders((name) => request.headers.get(name));
  const cookieLocale = cookies.get('locale');
  const resolved = decideLocale({ urlLocale: null, cookieLocale, acceptLanguage, countryCode });

  setVaryHeaders(setHeaders);
  setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });

  return json({
    resolvedLocale: resolved,
    inputs: {
      url: url.pathname,
  urlLocale: null,
      cookieLocale,
      acceptLanguage,
      countryCode
    },
    headers: {
      'accept-language': acceptLanguage,
      'cf-ipcountry': request.headers.get('cf-ipcountry'),
      'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
      'fastly-geoip-country-code': request.headers.get('fastly-geoip-country-code'),
      'x-fastly-country-code': request.headers.get('x-fastly-country-code'),
      'x-country-code': request.headers.get('x-country-code'),
      'x-geo-country': request.headers.get('x-geo-country'),
      'x-nf-geo': request.headers.get('x-nf-geo')
    }
  });
};
