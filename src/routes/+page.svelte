<script lang="ts">
  import { browser } from '$app/environment';
  // Client-only locale redirect (replaces former +page.server.ts)
  if (browser) {
    const nav = (navigator.language || '').toLowerCase();
    const cookieMatch = document.cookie.match(/(?:^|; )locale=(en|de)/);
    let target: 'en' | 'de' = cookieMatch?.[1] as any || (nav.startsWith('de') ? 'de' : 'en');
    if (!document.cookie.includes(`locale=${target}`)) {
      document.cookie = `locale=${target}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    location.replace('/' + target);
  }
</script>

<noscript>
  <main style="padding:2rem;font-family:system-ui,sans-serif;">
    <h1>Choose Language / Sprache wählen</h1>
    <p><a href="/en">English Version</a></p>
    <p><a href="/de">Deutsche Version</a></p>
  </main>
</noscript>