// NOTE: This file is DISABLED for static adapter but ready for server-side rendering.
// When you switch to adapter-node/vercel/cloudflare, uncomment the code below.

/*
// Server-side redirect for root page - handles locale detection
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	decideLocale,
	extractCountryCodeFromHeaders,
	syncLocaleCookie
} from '$lib/server/locale';

// Disable prerendering for root to enable dynamic redirects
export const prerender = false;

export const load: PageServerLoad = async ({ request, cookies }) => {
	// Get user's existing locale preference from cookie
	const existingLocale = cookies.get('locale');

	// Determine appropriate locale (prioritizes cookie, falls back to IP geolocation)
	const countryCode = extractCountryCodeFromHeaders((name) => request.headers.get(name));
	const acceptLanguage = request.headers.get('accept-language');

	const locale = decideLocale({
		urlLocale: null,
		cookieLocale: existingLocale,
		acceptLanguage,
		countryCode
	});

	// Ensure cookie is set for future visits
	syncLocaleCookie(cookies, locale);

	// Redirect to appropriate language path
	throw redirect(302, `/${locale}`);
};
*/

// Currently using client-side redirect in +page.svelte for static adapter compatibility
export const prerender = true;

