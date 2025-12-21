<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { ArrowLeft } from 'lucide-svelte';

  let showBackButton = false;

  // Determine referrer locale for back navigation
  $: referrerLang = (() => {
    if (!browser) return 'en';
    const ref = document.referrer;
    if (ref.includes('/de/') || ref.includes('/de#')) return 'de';
    return 'en';
  })();

  function handleBack() {
    transitionStore.fadeToBlackAndNavigate(`/${referrerLang}#project-project-three`);
  }

  onMount(() => {
    const t = setTimeout(() => { showBackButton = true; }, 300);
    return () => clearTimeout(t);
  });
</script>

<svelte:head>
  <title>Getting Started - Anki Automation</title>
  <meta name="description" content="Learn how to set up and start using Anki Automation - installation guide, first steps, and troubleshooting." />
</svelte:head>

<div class="guide-container">
  <!-- Back button -->
  <button
    class="back-button"
    class:visible={showBackButton}
    aria-label="Back to portfolio"
    on:click={handleBack}
  >
    <ArrowLeft size={24} />
  </button>

  <iframe
    src="/anki-demo/getting-started.html"
    title="Anki Automation - Getting Started Guide"
    class="guide-iframe"
    loading="lazy"
  ></iframe>
</div>

<style>
  .guide-container {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: #0A0E14;
    z-index: 10;
  }

  .guide-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #0A0E14;
  }

  .back-button {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1000;
    background-color: rgba(30, 30, 32, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    backdrop-filter: blur(8px);
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
  }

  .back-button.visible {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .back-button:hover,
  .back-button:focus-visible {
    background-color: rgba(50, 50, 52, 0.95);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .back-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.45), 0 0 0 6px rgba(0, 229, 255, 0.15);
  }
</style>
