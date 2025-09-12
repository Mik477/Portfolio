<script lang="ts">
  import { transitionStore } from '$lib/stores/transitionStore';
  function backHome() { transitionStore.fadeToBlackAndNavigate('/'); }
</script>

<svelte:head>
  <title>Impressum</title>
</svelte:head>

<main class="legal-page">
  <h1>Impressum</h1>
  <p>Platzhalter-Inhalt. Hier folgen rechtliche Angaben gemäß § 5 TMG.</p>
  <button class="back" on:click={backHome}>Zurück zur Startseite</button>
</main>

<style>
  .legal-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; color: white; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  p { max-width: 60ch; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
  .back { background: rgba(30,30,32,0.7); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }
  .back:hover { background: rgba(50,50,52,0.9); }
</style>
