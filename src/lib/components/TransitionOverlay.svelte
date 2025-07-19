<!-- src/lib/components/TransitionOverlay.svelte -->
<script lang="ts">
  import { transitionStore } from '$lib/stores/transitionStore';
  import { fade } from 'svelte/transition';

  // --- MODIFICATION: Define the duration here to keep it in sync with the store ---
  const TRANSITION_DURATION = 90; // ms
</script>

{#if $transitionStore.visible}
  <div 
    class="transition-overlay"
    style="background-color: {$transitionStore.color};"
    transition:fade={{ duration: TRANSITION_DURATION }}
  ></div>
{/if}

<style>
  .transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999; /* Must be on top of everything */
    pointer-events: all; /* Block interactions during transition */
  }
</style>