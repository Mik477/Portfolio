<!-- src/lib/components/layouts/ProjectOneLayout.svelte -->
<script lang="ts">
  import type { Project, ProjectCard } from '$lib/data/projectsData';
  import { transitionStore } from '$lib/stores/transitionStore';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';

  export let headline: string;
  export let summary: string;
  export let cards: ProjectCard[];
  export let slug: string;
  export let readMoreLinkText: string | undefined = undefined;

  function handleCardClick(card: ProjectCard) {
    const aspectLink = card.aspectLink || '';
    transitionStore.fadeToBlackAndNavigate(`/projects/${slug}${aspectLink}`);
  }

  function handleReadMoreClick() {
    transitionStore.fadeToBlackAndNavigate(`/projects/${slug}`);
  }
</script>

<div class="layout-container">
  <div class="text-block">
    <h2 class="anim-headline">{headline}</h2>
    <p class="anim-summary">{summary}</p>
    {#if readMoreLinkText}
      <button class="read-more-btn anim-button" on:click={handleReadMoreClick}>
        <span>{readMoreLinkText}</span>
      </button>
    {/if}
  </div>

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
  }

  p {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    color: rgb(212 212 216);
    line-height: 1.8;
    margin-bottom: 2.5rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
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
  }
  .read-more-btn:hover {
    background-color: rgb(79 70 229);
    transform: translateY(-3px);
    box-shadow: 0 4px 25px rgba(99 102 241 / 0.4);
  }

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
  
  .card-click-target {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .card-click-target :global(.card) {
    box-shadow: inset #333 0 0 0 5px, inset rgba(255, 255, 255, 0.5) 0 0 0 6px;
  }

  .card-click-target:hover {
    transform: translateY(-8px) scale(1.02);
  }

  /* --- FIX: New, 3D-aware focus and hover styles --- */
  .card-click-target:hover :global(.card),
  .card-click-target:focus-visible :global(.card) {
    box-shadow: 
      /* Outer glow for hover/focus */
      rgba(255, 255, 255, 0.2) 0 0 40px 5px, 
      rgba(0, 0, 0, 0.66) 0 30px 60px 0, 
      
      /* Inner border */
      inset #333 0 0 0 5px,
      
      /* Sharp white line inside border */
      inset white 0 0 0 6px;
  }

  /* Add a distinct blue ring ONLY for focus, not hover */
  .card-click-target:focus-visible :global(.card) {
    box-shadow: 
      /* Re-apply the hover glow so it persists during focus */
      rgba(255, 255, 255, 0.2) 0 0 40px 5px, 
      rgba(0, 0, 0, 0.66) 0 30px 60px 0, 

      /* Re-apply the inner border */
      inset #333 0 0 0 5px,

      /* The NEW blue focus ring, replacing the white line */
      inset rgb(99 102 241) 0 0 0 7px;
  }
</style>