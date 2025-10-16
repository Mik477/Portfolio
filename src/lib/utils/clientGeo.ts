// src/lib/utils/clientGeo.ts
/**
 * Client-side geolocation utilities for static hosting
 * 
 * This provides IP-based locale detection when server-side
 * rendering is not available (static adapter).
 */

export type Locale = 'en' | 'de';

/**
 * Detect user's locale based on IP geolocation using a free API
 * Falls back to browser language if API fails
 */
export async function detectLocaleFromIP(): Promise<Locale> {
	try {
		// Use ipapi.co free tier (1000 requests/day, no auth required)
		// Alternative: ip-api.com (45 requests/minute free)
		const response = await fetch('https://ipapi.co/json/', {
			signal: AbortSignal.timeout(3000) // 3 second timeout
		});

		if (!response.ok) throw new Error('Geolocation API failed');

		const data = await response.json();
		const countryCode = data.country_code as string | undefined;

		// German-speaking countries: Germany, Austria, Switzerland, Liechtenstein, Luxembourg
		const germanCountries = ['DE', 'AT', 'CH', 'LI', 'LU'];

		if (countryCode && germanCountries.includes(countryCode)) {
			return 'de';
		}

		return 'en';
	} catch (error) {
		console.warn('IP geolocation failed, falling back to browser language:', error);
		return detectLocaleFromBrowser();
	}
}

/**
 * Fallback: detect locale from browser's language settings
 */
export function detectLocaleFromBrowser(): Locale {
	if (typeof navigator === 'undefined') return 'en';

	const browserLang = navigator.language || (navigator as any).userLanguage;
	const langCode = browserLang?.toLowerCase().split('-')[0];

	return langCode === 'de' ? 'de' : 'en';
}

/**
 * Get current locale from cookie
 */
export function getLocaleFromCookie(): Locale | null {
	if (typeof document === 'undefined') return null;

	const match = document.cookie.match(/(?:^|; )locale=(en|de)/);
	return match ? (match[1] as Locale) : null;
}

/**
 * Set locale cookie
 */
export function setLocaleCookie(locale: Locale): void {
	if (typeof document === 'undefined') return;

	const maxAge = 60 * 60 * 24 * 365; // 1 year
	document.cookie = `locale=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/**
 * Main function: determine appropriate locale and redirect if necessary
 * Call this from root page component's onMount
 */
export async function handleRootRedirect(): Promise<void> {
	// Check if user already has a preference
	const existingLocale = getLocaleFromCookie();

	if (existingLocale) {
		// User has been here before, redirect to their saved preference
		window.location.href = `/${existingLocale}`;
		return;
	}

	// First-time visitor: detect from IP
	const detectedLocale = await detectLocaleFromIP();

	// Save preference
	setLocaleCookie(detectedLocale);

	// Redirect
	window.location.href = `/${detectedLocale}`;
}
