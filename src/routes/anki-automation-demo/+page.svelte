<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { ArrowLeft } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  let iframeEl: HTMLIFrameElement;
  let isPortrait = false;
  let showBackButton = false;
  let isLoading = true;

  // Determine referrer locale for back navigation
  $: referrerLang = (() => {
    if (!browser) return 'en';
    const ref = document.referrer;
    if (ref.includes('/de/') || ref.includes('/de#')) return 'de';
    return 'en';
  })();

  function checkOrientation() {
    if (browser) {
      isPortrait = window.innerHeight > window.innerWidth;
    }
  }

  function handleBack() {
    transitionStore.fadeToBlackAndNavigate(`/${referrerLang}#project-project-three`);
  }

  function handleLoad() {
    isLoading = false;
  }

  onMount(() => {
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    const t = setTimeout(() => { showBackButton = true; }, 300);
    return () => {
      clearTimeout(t);
    };
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('resize', checkOrientation);
    }
  });
</script>

<svelte:head>
  <title>Anki Automation - Interactive Demo</title>
  <meta name="description" content="Try the Anki Automation demo - an AI-powered flashcard creator with YAML editor. Experience the full UI without installation." />
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="demo-container">
  <!-- Back button -->
  <button
    class="back-button"
    class:visible={showBackButton}
    aria-label="Back to portfolio"
    on:click={handleBack}
  >
    <ArrowLeft size={24} />
  </button>

  {#if isPortrait}
    <!-- Portrait orientation overlay -->
    <div class="orientation-overlay">
      <div class="orientation-content">
        <div class="rotate-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          <div class="arrow-container">
            <svg class="rotate-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
        </div>
        <h2>Please Rotate Your Device</h2>
        <p>This demo is optimized for landscape orientation.<br/>Rotate your device for the best experience.</p>
      </div>
    </div>
  {:else}
    <!-- Loading Spinner -->
    {#if isLoading}
      <div class="loading-overlay" transition:fade={{ duration: 400 }}>
        <div class="spinner"></div>
        <p>Loading Demo...</p>
      </div>
    {/if}

    <!-- Full-screen iframe for the demo -->
    <iframe
      bind:this={iframeEl}
      src="/anki-demo/index.html"
      title="Anki Automation Demo"
      class="demo-iframe"
      allow="fullscreen"
      loading="lazy"
      on:load={handleLoad}
    ></iframe>
  {/if}
</div>

<style>
  .demo-container {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: #0A0E14;
    z-index: 10;
  }

  .demo-iframe {
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

  /* Portrait orientation overlay */
  .orientation-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0A0E14 0%, #111720 100%);
    color: #E8EAED;
    text-align: center;
    padding: 2rem;
  }

  .orientation-content {
    max-width: 20rem;
  }

  .rotate-icon {
    position: relative;
    display: inline-block;
    margin-bottom: 1.5rem;
    color: #00E5FF;
    animation: pulse 2s ease-in-out infinite;
  }

  .arrow-container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    transform: translate(-50%, -50%);
  }

  .rotate-arrow {
    width: 100%;
    height: 100%;
    animation: rotate-hint 2s ease-in-out infinite;
    transform-origin: center center;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  @keyframes rotate-hint {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(90deg); }
  }

  .orientation-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #E8EAED;
  }

  .orientation-content p {
    font-size: 1rem;
    color: #9BA1A6;
    line-height: 1.6;
  }

  /* Loading Spinner Styles */
  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0A0E14;
    z-index: 20;
    color: rgba(255, 255, 255, 0.7);
    gap: 1.5rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #00E5FF;
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
  }

  .loading-overlay p {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.05em;
    animation: pulse-text 2s ease-in-out infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse-text {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
</style>
