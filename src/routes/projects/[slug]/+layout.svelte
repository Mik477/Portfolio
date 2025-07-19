<!-- src/routes/projects/[slug]/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  // --- MODIFICATION: Import the new transition store ---
  import { transitionStore } from '$lib/stores/transitionStore';

  let showButton = false;

  onMount(() => {
    const timer = setTimeout(() => {
      showButton = true;
    }, 300);

    return () => clearTimeout(timer);
  });

  function handleBackClick() {
    // --- MODIFICATION: Use the transition store for navigation ---
    transitionStore.fadeToBlackAndNavigate('/');
  }
</script>

<div class="project-subpage-layout">
  <button 
    class="back-button"
    class:visible={showButton}
    on:click={handleBackClick}
    aria-label="Back to home"
  >
    <ArrowLeft size={24} />
  </button>

  <!-- The content of +page.svelte will be rendered here -->
  <slot />
</div>

<style>
  .project-subpage-layout {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .back-button {
    position: fixed;
    top: 2rem;
    left: 2rem;
    z-index: 1000; /* Ensure it's on top of all page content */
    
    background-color: rgba(30, 30, 32, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
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

  .back-button:hover {
    background-color: rgba(50, 50, 52, 0.9);
    transform: scale(1.05);
  }
</style>