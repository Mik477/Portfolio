<script lang="ts">
  import { page } from '$app/stores';
  
  // We don't show this on the Anki demo page because it has its own specific handler
  $: isAnkiDemo = $page.url.pathname.includes('/anki-automation-demo');
</script>

{#if !isAnkiDemo}
  <div class="mobile-orientation-lock">
    <div class="content">
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
      
      <h2>Please Rotate Device</h2>
      <p>This site is optimized for portrait mode on mobile devices.</p>
    </div>
  </div>
{/if}

<style>
  .mobile-orientation-lock {
    display: none; /* Hidden by default */
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #09090b; /* Zinc-950, matching site dark theme */
    color: #f4f4f5; /* Zinc-100 */
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
  }

  /* The Logic: Show only on Landscape Phones */
  @media (pointer: coarse) and (orientation: landscape) and (max-height: 600px) {
    .mobile-orientation-lock {
      display: flex;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    max-width: 24rem;
  }

  .rotate-icon {
    position: relative;
    display: inline-block;
    margin-bottom: 1.5rem;
    color: #e4e4e7; /* Zinc-200 */
    /* No pulse animation here to keep it clean as per request "keep colors of new screen" */
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

  /* 
    Anki Demo uses 0->90 (Portrait->Landscape).
    Here we need Landscape->Portrait (90->0).
    We use the same timing and loop structure for consistency.
  */
  @keyframes rotate-hint {
    0%, 100% { transform: rotate(90deg); }
    50% { transform: rotate(0deg); }
  }

  h2 {
    font-family: var(--font-heading, sans-serif);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: #fff;
  }

  p {
    font-family: var(--font-body, sans-serif);
    font-size: 1rem;
    line-height: 1.5;
    color: #a1a1aa; /* Zinc-400 */
    margin: 0;
  }
</style>
