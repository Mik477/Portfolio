<script lang="ts">
  import { browser } from '$app/environment';
  import BackButton from '$lib/components/BackButton.svelte';
  if (browser) {
    // German canonical route lives at /de/datenschutz now; fallback to /en/privacy for non-German
    const nav = (navigator.language || '').toLowerCase();
    const locale: 'de' | 'en' = nav.startsWith('de') ? 'de' : 'en';
    location.replace(locale === 'de' ? '/de/datenschutz' : '/en/privacy');
  }
</script>
<noscript>
  <p>Redirecting... <a href="/de/datenschutz">/de/datenschutz</a> | <a href="/en/privacy">/en/privacy</a></p>
</noscript>

<svelte:head>
  <title>Datenschutz</title>
</svelte:head>

<main class="legal-page">
  <BackButton />
  <h1>Datenschutz</h1>
  <p>Platzhalter-Inhalt. Hier stehen Informationen zur Datenverarbeitung und Ihren Rechten.</p>
</main>

<style>
  .legal-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: white; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { max-width: 60ch; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
  /* Back button provided by shared component */
</style>
