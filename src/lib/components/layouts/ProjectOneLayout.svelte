<!-- src/lib/components/layouts/ProjectOneLayout.svelte -->
<script lang="ts">
  import type { Project, ProjectCard } from '$lib/data/projectsData';
  import { transitionStore } from '$lib/stores/transitionStore';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';

  // These props are passed down from the orchestrator through the wrapper.
  export let headline: string;
  export let summary: string;
  export let cards: ProjectCard[];
  export let slug: string;
  // FIX: Make this prop optional by providing a default value.
  export let readMoreLinkText: string | undefined = undefined;

  function handleCardClick(card: ProjectCard) {
    const aspectLink = card.aspectLink || '';
    transitionStore.fadeToBlackAndNavigate(`/projects/${slug}${aspectLink}`);
  }

  function handleReadMoreClick() {
    transitionStore.fadeToBlackAndNavigate(`/projects/${slug}`);
  }
</script>

<!-- 
  This layout container is the direct child of the <slot> in ProjectSection.svelte.
  It establishes a positioning context for its children.
-->
<div class="layout-container">

  <!-- Text Block: Positioned in the bottom-left corner -->
  <div class="text-block">
    <h2 class="anim-headline">{headline}</h2>
    <p class="anim-summary">{summary}</p>
    {#if readMoreLinkText}
      <button class="read-more-btn anim-button" on:click={handleReadMoreClick}>
        <span>{readMoreLinkText}</span>
      </button>
    {/if}
  </div>

  <!-- Cards Block: Positioned in the right-center area -->
  <div class="cards-block">
    {#each cards as card, i (card.id)}
      <div class="card-wrapper anim-card" style="--card-index: {i};">
        <button type="button" class="card-click-target" on:click={() => handleCardClick(card)} aria-label="View details for {card.title}">
          <ParallaxCard cardData={card} width="240px" height="320px" />
        </button>
      </div>
    {/each}
  </div>

</div>

<style>
  .layout-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* --- Text Block Styling (Bottom-Left) --- */
  .text-block {
    position: absolute;
    bottom: 12vh;
    left: max(calc(env(safe-area-inset-left, 0px) + 8vw), 3rem);
    width: 40%;
    max-width: 550px;
    z-index: 2;
  }

  h2 {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 300;
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
    line-height: 1.1;
    text-shadow: 0 3px 15px rgba(0,0,0,0.3);
    /* GSAP will set opacity/visibility */
  }

  p {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    color: rgb(212 212 216);
    line-height: 1.8;
    margin-bottom: 2.5rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    /* GSAP will set opacity/visibility */
  }

  .read-more-btn {
    padding: 0.875rem 2rem;
    background-color: rgb(99 102 241 / 0.8);
    backdrop-filter: blur(5px);
    color: white;
    border: 1px solid rgb(129 140 248 / 0.5);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    /* GSAP will set opacity/visibility */
  }
  .read-more-btn:hover {
    background-color: rgb(79 70 229);
    transform: translateY(-3px);
    box-shadow: 0 4px 25px rgba(99 102 241 / 0.4);
  }

  /* --- Cards Block Styling (Right-Side) --- */
  .cards-block {
    position: absolute;
    top: 50%;
    right: max(6vw, 2rem);
    transform: translateY(-50%);
    width: 50%;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
  }

  .card-wrapper {
    /* GSAP will set opacity/visibility */
  }

  /*
   This wrapper ensures the button functionality is clean and separate
   from the ParallaxCard's internal hover/mouse logic.
  */
  .card-click-target {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 10px; /* Match ParallaxCard's border-radius */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card-click-target:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
  }
  .card-click-target:focus-visible {
    outline: 2px solid rgb(99 102 241);
    outline-offset: 6px;
  }
</style>