<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { ArrowLeft } from 'lucide-svelte';

  let iframeEl: HTMLIFrameElement;
  let isPortrait = false;
  let showBackButton = false;

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
          <div class="rotate-arrow">↻</div>
        </div>
        <h2>Please Rotate Your Device</h2>
        <p>This demo is optimized for landscape orientation.<br/>Rotate your device for the best experience.</p>
      </div>
    </div>
  {:else}
    <!-- Full-screen iframe for the demo -->
    <iframe
      bind:this={iframeEl}
      src="/anki-demo/index.html"
      title="Anki Automation Demo"
      class="demo-iframe"
      allow="fullscreen"
      loading="lazy"
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

  .rotate-arrow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    animation: rotate-hint 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  @keyframes rotate-hint {
    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
    50% { transform: translate(-50%, -50%) rotate(90deg); }
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
</style>
