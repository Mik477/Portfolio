<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';

  /**
   * Root page redirect logic with IP-based geolocation for first-time visitors.
   * Shows LoadingScreen while detecting locale and redirecting.
   * 
   * Priority order:
   * 1. Existing cookie (returning user) → immediate redirect
   * 2. IP geolocation (new user) → detect country, set cookie, redirect
   * 3. Browser language (fallback if geolocation fails)
   * 
   * For STATIC hosting compatibility - uses client-side API calls.
   */

  type Locale = 'en' | 'de';

  async function detectLocaleFromIP(): Promise<Locale> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      // Using ipapi.co free tier (1000 requests/day, no auth needed)
      // Alternative free APIs: ip-api.com, geojs.io/v1/ip/country
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Geolocation API error');

      const data = await response.json();
      const countryCode = data.country_code as string | undefined;

      // German-speaking countries: Germany, Austria, Switzerland, Liechtenstein, Luxembourg
      const germanCountries = ['DE', 'AT', 'CH', 'LI', 'LU'];

      if (countryCode && germanCountries.includes(countryCode)) {
        return 'de';
      }

      return 'en';
    } catch (error) {
      // Fallback to browser language if IP geolocation fails
      console.warn('IP geolocation failed, using browser language:', error);
      const nav = (navigator.language || '').toLowerCase();
      return nav.startsWith('de') ? 'de' : 'en';
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  function setLocaleCookie(locale: Locale): void {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `locale=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  onMount(async () => {
    if (!browser) return;

    // Check if user already has a locale preference
    const cookieMatch = document.cookie.match(/(?:^|; )locale=(en|de)/);
    const existingLocale = cookieMatch?.[1] as Locale | undefined;

    let targetLocale: Locale;

    if (existingLocale) {
      // Returning user - use their saved preference (instant)
      targetLocale = existingLocale;
    } else {
      // First-time visitor - detect from IP
      targetLocale = await detectLocaleFromIP();
      // Save preference for future visits
      setLocaleCookie(targetLocale);
    }

    // Redirect immediately to appropriate language version
    location.replace(`/${targetLocale}`);
  });
</script>

<!-- Use existing LoadingScreen component -->
<LoadingScreen />

<noscript>
  <main style="padding:2rem;font-family:system-ui,sans-serif;">
    <h1>Choose Language / Sprache wählen</h1>
    <p><a href="/en">English Version</a></p>
    <p><a href="/de">Deutsche Version</a></p>
  </main>
</noscript>