<script lang="ts">
  import { browser } from '$app/environment';
  import BackButton from '$lib/components/BackButton.svelte';
  if (browser) {
    // Canonical German page /de/barrierefreiheit; English -> /en/accessibility
    const nav = (navigator.language || '').toLowerCase();
    const locale: 'de' | 'en' = nav.startsWith('de') ? 'de' : 'en';
    location.replace(locale === 'de' ? '/de/barrierefreiheit' : '/en/accessibility');
  }
</script>
<noscript>
  <p>Redirecting... <a href="/de/barrierefreiheit">/de/barrierefreiheit</a> | <a href="/en/accessibility">/en/accessibility</a></p>
</noscript>

<svelte:head>
  <title>Barrierefreiheit</title>
</svelte:head>

<main class="legal-page">
  <BackButton />
  <h1>Barrierefreiheit</h1>
  <p>Platzhalter-Inhalt. Hier folgt die Erklärung zur Barrierefreiheit dieser Website.</p>
</main>

<style>
  .legal-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: white; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { max-width: 60ch; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
  /* Back button provided by shared component */
</style>
