<!-- src/lib/components/layouts/ProjectOneLayout.svelte -->
<script lang="ts">
  import type { Project, ProjectCard, ProjectSubPageSection } from '$lib/data/projectsData';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { page } from '$app/stores';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  import MobileCardsCarousel from '$lib/components/MobileCardsCarousel.svelte';
  import { renderProfile } from '$lib/stores/renderProfile';

  export let headline: string;
  export let summary: string;
  export let cards: ProjectCard[];
  export let slug: string;
  export let readMoreLinkText: string | undefined = undefined;
  export let readMoreFallbackLabel: string | undefined = undefined;
  export let backgrounds: Project['backgrounds'];
  export let backgroundsMobile: Project['backgrounds'] | undefined;
  // --- MODIFICATION: Added prop for subPageSections to enable intelligent preloading ---
  export let subPageSections: ProjectSubPageSection[];

  function handleCardClick(card: ProjectCard) {
    const lang = $page.params?.lang ?? 'de';
    let hash = '';
    if (card.aspectLink) {
      const targetId = card.aspectLink.replace(/^#/, '');
      const target = subPageSections.find(s => s.id === targetId);
      const resolvedBackground = target
        ? ($renderProfile.isMobile && target.backgroundMobile ? target.backgroundMobile : target.background)
        : undefined;
      if (resolvedBackground && resolvedBackground.type === 'image') {
        const img = new Image();
        img.src = resolvedBackground.value;
        console.log(`[Preloader] Preloading background for '${targetId}': ${resolvedBackground.value}`);
      }
      // Keep hash for deep-linking the subsection
      hash = `#${targetId}`;
    }
    transitionStore.fadeToBlackAndNavigate(`/${lang}/projects/${slug}${hash}`);
  }

  function handleReadMoreClick() {
    // --- MODIFICATION: Preload the background for the FIRST sub-section (the overview). ---
    // The overview's background is the first image in the main `backgrounds` array.
    const activeBackgrounds = ($renderProfile.isMobile && backgroundsMobile && backgroundsMobile.length > 0)
      ? backgroundsMobile
      : backgrounds;
    const firstBackground = activeBackgrounds?.[0];
    if (firstBackground && firstBackground.type === 'image') {
      const imageToPreload = new Image();
      imageToPreload.src = firstBackground.value;
      console.log(`[Preloader] Proactively loading background for project overview: ${firstBackground.value}`);
    }

  const lang = $page.params?.lang ?? 'de';
  transitionStore.fadeToBlackAndNavigate(`/${lang}/projects/${slug}`);
  }

  function handleCarouselSelect(index: number) {
    const selected = cards[index];
    if (selected) {
      handleCardClick(selected);
    }
  }

</script>

<div class="layout-container">
  <div class="text-block">
    <h2 class="anim-headline">{headline}</h2>
    <p class="anim-summary">{summary}</p>
    {#if readMoreLinkText || readMoreFallbackLabel}
      <button class="read-more-btn anim-button" on:click={handleReadMoreClick}>
        <svg>
          <rect x="0" y="0" fill="none" width="100%" height="100%"/>
        </svg>
        <span>{readMoreLinkText ?? readMoreFallbackLabel}</span>
      </button>
    {/if}
  </div>

  <div class="cards-block">
    {#if $renderProfile.isMobile}
      <MobileCardsCarousel
        cards={cards}
        on:select={({ detail }) => handleCarouselSelect(detail.index)}
      />
    {:else}
      {#each cards as card, i (card.id)}
        <div class="card-wrapper anim-card" style="--card-index: {i};">
          <button
            type="button"
            class="card-click-target"
            on:click={() => handleCardClick(card)}
            aria-label={(($page.data as any)?.messages?.common?.projects?.viewDetailsPrefix ?? 'View details for') + ' ' + card.title}
          >
            <ParallaxCard
              cardData={card}
              width="240px"
              height="320px"
            />
          </button>
        </div>
      {/each}
    {/if}
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
    position: relative;
    padding: 0.875rem 2rem;
    min-width: 220px;
    
    background-color: transparent;
    
    font-family: 'Source Code Pro', monospace;
    font-weight: 300;
    font-size: 1rem;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    border: none;
    cursor: pointer;
    
    transition: box-shadow 0.6s ease, font-weight 0.6s ease, letter-spacing 0.6s ease;
  }

  .read-more-btn span {
    position: relative;
    z-index: 1;
  }

  .read-more-btn svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .read-more-btn rect {
    fill: none;
    stroke: rgba(255, 255, 255, 0.7);
    stroke-width: 1px;
    stroke-dasharray: 400;
    stroke-dashoffset: 400;
    transition: stroke-dashoffset 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
                stroke-width 0.4s ease,
                stroke 0.4s ease;
  }

  .read-more-btn:hover {
    box-shadow: 0 0 25px -5px rgba(255, 255, 255, 0.6);
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .read-more-btn:hover rect {
    stroke-width: 2px;
    stroke-dashoffset: 0;
    stroke: rgba(255, 255, 255, 1);
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

  .card-click-target:hover :global(.card),
  .card-click-target:focus-visible :global(.card) {
    box-shadow: 
      rgba(255, 255, 255, 0.2) 0 0 40px 5px, 
      rgba(0, 0, 0, 0.66) 0 30px 60px 0, 
      inset #333 0 0 0 5px,
      inset white 0 0 0 6px;
  }

  .card-click-target:focus-visible :global(.card) {
    box-shadow: 
      rgba(255, 255, 255, 0.2) 0 0 40px 5px, 
      rgba(0, 0, 0, 0.66) 0 30px 60px 0, 
      inset #333 0 0 0 5px,
      inset rgb(99 102 241) 0 0 0 7px;
  }

  /* Mobile-only reflow: keep desktop unchanged */
  @media (max-width: 768px) {
    .layout-container {
      height: auto;
      min-height: 100vh;
    }
    .text-block {
      position: static;
      left: auto;
      bottom: auto;
      width: auto;
      max-width: none;
      padding: 2rem 4vw 1rem;
    }
    .text-block h2 {
      margin-bottom: 1rem;
    }
    .text-block p {
      margin-bottom: 1.5rem;
    }
    .cards-block {
      position: static;
      top: auto;
      right: auto;
      transform: none;
      width: 100%;
      padding: 0;
      display: block;
      overflow: visible;
    }
    .cards-block :global(.carousel-viewport) {
      padding-top: 1rem;
      padding-bottom: 2.5rem;
    }
  }
</style>