<script lang="ts">
  import { browser } from '$app/environment';
  import BackButton from '$lib/components/BackButton.svelte';
  if (browser) {
    // Canonical German page /de/impressum; English users go to /en/imprint
    const nav = (navigator.language || '').toLowerCase();
    const locale: 'de' | 'en' = nav.startsWith('de') ? 'de' : 'en';
    location.replace(locale === 'de' ? '/de/impressum' : '/en/imprint');
  }
</script>
<noscript>
  <p>Redirecting... <a href="/de/impressum">/de/impressum</a> | <a href="/en/imprint">/en/imprint</a></p>
</noscript>

<svelte:head>
  <title>Impressum</title>
</svelte:head>

<main class="legal-page">
  <BackButton />
  <h1>Impressum</h1>
  <p>Platzhalter-Inhalt. Hier folgen rechtliche Angaben gemäß § 5 TMG.</p>
</main>

<style>
  .legal-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: white; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { max-width: 60ch; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
  /* Back button provided by shared component */
</style>
