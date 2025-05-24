<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { overallLoadingState, initialSiteLoadComplete } from '$lib/stores/preloadingStore'; 
  import { get } from 'svelte/store';

  let showScreen = !get(initialSiteLoadComplete); // Initialize based on initialSiteLoadComplete
  let isFadingOut = false;
  let currentLoadingText = "Initialising";
  let dotAnimationInterval: number | undefined;
  let dots = "";

  const fadeOutDuration = 500; // ms
  const fadeOutDelay = 100; // ms

  function updateDots() {
    if (dots.length < 3) {
      dots += ".";
    } else {
      dots = "";
    }
    currentLoadingText = "Initialising" + dots;
  }

  function startDotAnimation() {
    if (!dotAnimationInterval) {
      dots = ""; // Reset dots
      updateDots(); // Show first dot immediately
      dotAnimationInterval = setInterval(updateDots, 400);
    }
  }

  function stopDotAnimation() {
    if (dotAnimationInterval) {
      clearInterval(dotAnimationInterval);
      dotAnimationInterval = undefined;
    }
  }

  const unsubInitialLoad = initialSiteLoadComplete.subscribe(completed => {
    if (completed) {
      // If initial load is marked complete, ensure screen starts fading out or is hidden.
      // This overrides overallLoadingState for visibility.
      if (showScreen && !isFadingOut) {
        stopDotAnimation();
        currentLoadingText = "Initialisation Complete"; // Final message
        isFadingOut = true;
        setTimeout(() => {
          setTimeout(() => {
            showScreen = false;
          }, fadeOutDuration);
        }, fadeOutDelay);
      } else if (!showScreen) {
        // Already hidden, do nothing
      }
    } else {
      // Initial load not yet complete, screen should be visible and react to overallLoadingState
      showScreen = true;
      isFadingOut = false;
      // Restart animation if overallLoadingState is 'loading' or 'idle'
      const currentOverallStatus = get(overallLoadingState);
      if (currentOverallStatus === 'loading' || currentOverallStatus === 'idle') {
        startDotAnimation();
      }
    }
  });

  const unsubOverallState = overallLoadingState.subscribe(status => {
    if (get(initialSiteLoadComplete)) {
      // If initial load is done, this subscription primarily ensures dots stop if an error occurs
      // but the screen itself won't reshow due to unsubInitialLoad's effect.
      if (status === 'error') {
        stopDotAnimation();
        // Text might update but screen remains hidden if already faded.
        // If an error occurs *during* the initial load's fade-out, this could be an edge case.
        // For simplicity, we assume error state is handled before initialSiteLoadComplete is true.
      }
      return; // Do not manage visibility or animations if initial load is complete
    }
    
    // Logic for when initialSiteLoadComplete is false:
    if (status === 'loaded') {
      // This will be followed by initialSiteLoadComplete becoming true,
      // which then handles the fade-out via its own subscriber.
      // So, just stop dots and set text here.
      stopDotAnimation();
      currentLoadingText = "Initialisation Complete";
    } else if (status === 'error') {
      stopDotAnimation();
      currentLoadingText = "Error during initialisation";
      showScreen = true; 
      isFadingOut = false; 
    } else if (status === 'loading' || status === 'idle') {
      currentLoadingText = "Initialising"; 
      showScreen = true;
      isFadingOut = false;
      startDotAnimation();
    }
  });

  onMount(() => {
    // Initial state is set by store value directly.
    // If not initially complete and overall state is loading/idle, start dots.
    if (!get(initialSiteLoadComplete)) {
        const currentOverallStatus = get(overallLoadingState);
        if (currentOverallStatus === 'loading' || currentOverallStatus === 'idle') {
            startDotAnimation();
        } else if (currentOverallStatus === 'error') {
            currentLoadingText = "Error during initialisation";
        }
    }
  });

  onDestroy(() => {
    stopDotAnimation();
    if (unsubOverallState) unsubOverallState();
    if (unsubInitialLoad) unsubInitialLoad();
  });
</script>

{#if showScreen}
  <div class="loading-overlay" class:fade-out={isFadingOut} style="--fade-duration: {fadeOutDuration}ms;">
    <p>{currentLoadingText}</p>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000000;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.5rem;
    z-index: 10000; /* Ensure it's on top */
    opacity: 1;
    transition: opacity var(--fade-duration) ease-out;
  }

  .loading-overlay.fade-out {
    opacity: 0;
    pointer-events: none; /* Allow interaction with content below after fade */
  }

  .loading-overlay p {
    padding: 20px;
    border-radius: 5px;
  }
</style>
