<!-- src/lib/components/layouts/ProjectOneLayout.svelte -->
<script lang="ts">
  import type { Project, ProjectCard, ProjectSubPageSection, ProjectHeadlineSegment, ProjectCardDisplayConfig } from '$lib/data/projectsData';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { page } from '$app/stores';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  import ImageFrameCard from '$lib/components/ImageFrameCard.svelte';
  import ImageFrameWideCard from '$lib/components/ImageFrameWideCard.svelte';
  import MobileCardsCarousel from '$lib/components/MobileCardsCarousel.svelte';
  import DesktopImageFrameCarousel from '$lib/components/DesktopImageFrameCarousel.svelte';
  import DesktopVerticalImageFrameCarousel from '$lib/components/DesktopVerticalImageFrameCarousel.svelte';
  import { renderProfile } from '$lib/stores/renderProfile';

  export let headline: string;
  export let summary: string;
  export let headlineSegments: ProjectHeadlineSegment[] | undefined = undefined;
  export let cards: ProjectCard[];
  export let slug: string;
  export let readMoreLinkText: string | undefined = undefined;
  export let readMoreFallbackLabel: string | undefined = undefined;
  export let backgrounds: Project['backgrounds'];
  export let backgroundsMobile: Project['backgrounds'] | undefined;
  export let subPageSections: ProjectSubPageSection[] | undefined = undefined;
  export let paperUrl: string | undefined = undefined;
  export let cardDisplay: ProjectCardDisplayConfig | undefined = undefined;

  const DEFAULT_IMAGE_FRAME_TILT = 2.2;

  const PARALLAX_CARD_DIMENSIONS = {
    widthClamp: 'clamp(12vw, 13vw, 15vw)',
    aspectRatio: 4 / 3
  } as const;

  const IMAGE_FRAME_CARD_DIMENSIONS = {
    widthClamp: 'clamp(16vw, 16vw, 17vw)',
    aspectRatio: 340 / 260
  } as const;

  const IMAGE_FRAME_WIDE_CARD_DIMENSIONS = {
    widthClamp: 'clamp(32vw, 55vw, 70vw)',
    aspectRatio: 6 / 16
  } as const;

  const MOBILE_IMAGE_FRAME_WIDE_CARD_DIMENSIONS_SECTION_TWO = {
    widthClamp: 'clamp(68vw, 80vw, 88vw)',
    aspectRatio: 1
  } as const;

  $: isImageFrameVariant = cardDisplay?.variant === 'image-frame';
  $: isImageFrameWideVariant = cardDisplay?.variant === 'image-frame-vertical';
  $: desktopTilt = Math.max(0, cardDisplay?.tiltIntensity ?? DEFAULT_IMAGE_FRAME_TILT);
  $: mobileTilt = Math.max(0, cardDisplay?.mobileTiltIntensity ?? 0);
  $: desktopDisableTilt = (isImageFrameVariant || isImageFrameWideVariant) && desktopTilt === 0;
  // Desktop card sizing: responsive clamps using vw/vh to balance on 1080p vs 1440p/4K
  // Image-frame variants receive dedicated aspect ratios.
  $: desktopSizing = isImageFrameVariant
    ? IMAGE_FRAME_CARD_DIMENSIONS
    : isImageFrameWideVariant
      ? IMAGE_FRAME_WIDE_CARD_DIMENSIONS
      : PARALLAX_CARD_DIMENSIONS;
  $: desktopCardWidth = desktopSizing.widthClamp;
  $: desktopCardHeight = `calc(${desktopSizing.widthClamp} * ${desktopSizing.aspectRatio.toFixed(5)})`;
  $: normalizedSlug = (slug ?? '').toLowerCase();
  $: isSecondProjectSection = normalizedSlug === 'project2' || normalizedSlug === 'project-two';
  $: mobileWideCardDimensions = isImageFrameWideVariant && isSecondProjectSection
    ? MOBILE_IMAGE_FRAME_WIDE_CARD_DIMENSIONS_SECTION_TWO
    : null;
  $: mobileCardProps = isImageFrameVariant
    ? { disableTilt: mobileTilt === 0, maxTilt: mobileTilt }
    : isImageFrameWideVariant
      ? { disableTilt: mobileTilt === 0, maxTilt: mobileTilt, useMobileImage: true }
      : { disableTilt: true };
  $: mobileCardComponent = isImageFrameVariant
    ? ImageFrameCard
    : isImageFrameWideVariant
      ? ImageFrameWideCard
      : ParallaxCard;
  $: cardAriaPrefix = (($page.data as any)?.messages?.common?.projects?.viewDetailsPrefix ?? 'View details for');
  $: hasSubPages = subPageSections && subPageSections.length > 0;
  $: hasPaperUrl = paperUrl && paperUrl.length > 0;

  function handleCardClick(card: ProjectCard) {
    // Only navigate if project has subpages and card has aspectLink
    if (!hasSubPages || !card.aspectLink) return;
    
    const lang = $page.params?.lang ?? 'de';
    let hash = '';
    if (card.aspectLink) {
      const targetId = card.aspectLink.replace(/^#/, '');
      const target = subPageSections!.find(s => s.id === targetId);
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
    // If project has paperUrl, download it instead of navigating
    if (hasPaperUrl) {
      window.open(paperUrl, '_blank');
      return;
    }

    // Otherwise, navigate to project subpage (original behavior)
    if (!hasSubPages) return;
    
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

<div class="layout-container" class:mobile-layout={$renderProfile.isMobile}>
  <div class="text-block" class:project-two={isSecondProjectSection}>
    <h2 class="anim-headline">
      {#if headlineSegments && headlineSegments.length > 0}
        {#each headlineSegments as segment, idx (idx)}
          {#if segment.breakBefore}
            <br>
          {/if}
          <span
            class="headline-segment"
            class:bold={segment.bold}
            class:secondary={idx === 1}
            style:font-weight={segment.weight ?? (segment.bold ? 'var(--project-title-bold-weight)' : undefined)}
            style:font-size={segment.fontScale ? `calc(1em * ${segment.fontScale})` : undefined}
          >{segment.text}</span>
        {/each}
      {:else}
        {headline}
      {/if}
    </h2>
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
      <div
        class="mobile-carousel-wrapper"
        style:--mobile-card-flex-basis={mobileWideCardDimensions ? mobileWideCardDimensions.widthClamp : null}
        style:--mobile-card-max-width={mobileWideCardDimensions ? mobileWideCardDimensions.widthClamp : null}
        style:--mobile-card-aspect={mobileWideCardDimensions ? mobileWideCardDimensions.aspectRatio : null}
      >
        <MobileCardsCarousel
          cards={cards}
          cardComponent={mobileCardComponent}
          cardProps={mobileCardProps}
          on:select={({ detail }) => handleCarouselSelect(detail.index)}
        />
      </div>
    {:else}
      {#if isImageFrameVariant}
        <DesktopImageFrameCarousel
          cards={cards}
          width={desktopCardWidth}
          height={desktopCardHeight}
          cardProps={{ disableTilt: desktopDisableTilt, maxTilt: desktopTilt }}
          ariaLabelPrefix={cardAriaPrefix}
          on:select={({ detail }) => handleCarouselSelect(detail.index)}
        />
      {:else if isImageFrameWideVariant}
        <DesktopVerticalImageFrameCarousel
          cards={cards}
          width={desktopCardWidth}
          height={desktopCardHeight}
          cardProps={{ disableTilt: desktopDisableTilt, maxTilt: desktopTilt }}
          ariaLabelPrefix={cardAriaPrefix}
          on:select={({ detail }) => handleCarouselSelect(detail.index)}
        />
      {:else}
        {#each cards as card, i (card.id)}
          <div class="card-wrapper anim-card" style="--card-index: {i};">
            <button
              type="button"
              class="card-click-target"
              on:click={() => handleCardClick(card)}
              aria-label={`${cardAriaPrefix} ${card.title}`}
            >
              <ParallaxCard
                cardData={card}
                width={desktopCardWidth}
                height={desktopCardHeight}
              />
            </button>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>

<style>
  :root {
    /* === READ-MORE BUTTON TYPOGRAPHY TUNABLES === */
    --read-more-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --read-more-font-weight-initial: 300;
    --read-more-font-weight-hover: 520;
    --read-more-letter-spacing-base: 0.015em;
    --read-more-letter-spacing-hover: 0.05em;
    --read-more-transition-duration: 0.8s;
    --read-more-transition-timing: ease;
    --read-more-shadow-transition-duration: 0.6s;
    --read-more-shadow-transition-timing: cubic-bezier(0.19, 1, 0.22, 1);

    /* === PROJECT SECTION TYPOGRAPHY TUNABLES === */
    --project-title-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --project-title-font-weight: 300;
    --project-title-bold-weight: 600;
    --project-title-secondary-scale: 1;
    --project-summary-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --project-summary-font-weight: 400;
  --project-summary-letter-spacing: 0;
  }

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
    font-family: var(--project-title-font-family);
    font-weight: var(--project-title-font-weight);
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
    line-height: 1.1;
    text-shadow: 0 3px 15px rgba(0,0,0,0.3);
  }

  h2 .headline-segment.bold {
    font-weight: var(--project-title-bold-weight);
  }

  h2 .headline-segment.secondary {
    font-size: calc(1em * var(--project-title-secondary-scale));
  }

  p {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    font-family: var(--project-summary-font-family);
    font-weight: var(--project-summary-font-weight);
    letter-spacing: var(--project-summary-letter-spacing);
    color: rgb(212 212 216);
    line-height: 1.8;
    margin-bottom: 2.5rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  .text-block.project-two {
    width: 35%;
  }

  .read-more-btn {
    position: relative;
    padding: 0.875rem 2rem;
    min-width: 220px;
    
    background-color: transparent;
    
    font-family: var(--read-more-font-family);
    font-weight: var(--read-more-font-weight-initial);
    font-size: 1rem;
    color: white;
    text-transform: uppercase;
    letter-spacing: var(--read-more-letter-spacing-base);

    border: none;
    cursor: pointer;
    
    transition:
      font-weight var(--read-more-transition-duration) var(--read-more-transition-timing),
      letter-spacing var(--read-more-transition-duration) var(--read-more-transition-timing),
      box-shadow var(--read-more-shadow-transition-duration) var(--read-more-shadow-transition-timing);
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

  .read-more-btn:hover,
  .read-more-btn:focus-visible {
    box-shadow: 0 0 25px -5px rgba(255, 255, 255, 0.6);
    font-weight: var(--read-more-font-weight-hover);
    letter-spacing: var(--read-more-letter-spacing-hover);
  }

  .read-more-btn:hover rect,
  .read-more-btn:focus-visible rect {
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
    .text-block.project-two p {
      font-size: 0.8rem;
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

  /* Force mobile layout when isMobile is true */
  .layout-container.mobile-layout {
    height: auto;
    min-height: 100vh;
  }
  .layout-container.mobile-layout .text-block {
    position: static;
    left: auto;
    bottom: auto;
    width: auto;
    max-width: none;
    padding: 2rem 4vw 1rem;
  }
  .layout-container.mobile-layout .text-block h2 {
    margin-bottom: 1rem;
  }
  .layout-container.mobile-layout .text-block p {
    margin-bottom: 1.5rem;
  }
  .layout-container.mobile-layout .cards-block {
    position: static;
    top: auto;
    right: auto;
    transform: none;
    width: 100%;
    padding: 0;
    display: block;
    overflow: visible;
  }
  .layout-container.mobile-layout .cards-block :global(.carousel-viewport) {
    padding-top: 1rem;
    padding-bottom: 2.5rem;
  }

  .layout-container.mobile-layout .text-block.project-two p {
    font-size: 0.8rem;
  }
</style>