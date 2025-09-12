<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  const lang = $page.params.lang === 'en' ? 'en' : 'de';
  function backHome() { transitionStore.fadeToBlackAndNavigate(`/${lang}`); }
  const title = lang === 'en' ? 'Privacy' : 'Datenschutz';
  const blurb = lang === 'en' ? 'Placeholder content. Details on data processing and your rights will be added here.' : 'Platzhalter-Inhalt. Hier stehen Informationen zur Datenverarbeitung und Ihren Rechten.';
  const backLabel = lang === 'en' ? 'Back to homepage' : 'Zurück zur Startseite';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="legal-page">
  <h1>{title}</h1>
  <p>{blurb}</p>
  <button class="back" on:click={backHome}>{backLabel}</button>
</main>

<style>
  .legal-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: white; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { max-width: 60ch; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
  .back { background: rgba(30,30,32,0.7); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }
  .back:hover { background: rgba(50,50,52,0.9); }
</style>
