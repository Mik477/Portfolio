<!-- src/lib/components/subpage/sections/TestingSection.svelte -->
<!-- Section 4: Testing & Optimization - Material journey, version evolution -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { renderProfile } from '$lib/stores/renderProfile';
  import SectionTitle from '../SectionTitle.svelte';
  import ImageGalleryItem from '../ImageGalleryItem.svelte';
  import StatsBar from '../StatsBar.svelte';
  import type { StatItem } from '../StatsBar.svelte';

  export let title: string;
  export let introText: string;
  
  // Gallery images (displayed vertically per design doc edit)
  export let materialImage: string | undefined = undefined;
  export let materialCaption: string;
  export let versionImage: string | undefined = undefined;
  export let versionCaption: string;
  
  // Bottom stats
  export let stats: StatItem[] = [];
  export let isActive: boolean = false;

  $: isMobile = $renderProfile.isMobile;

  let introTextElement: HTMLElement;
  let galleryElement: HTMLElement;
  let statsAreaElement: HTMLElement;
  let tl: gsap.core.Timeline | null = null;

  $: if (isActive) {
    playAnimation();
  } else {
    if (tl) tl.kill();
    if (introTextElement) gsap.set(introTextElement, { autoAlpha: 0, y: 30 });
    if (galleryElement && galleryElement.children.length > 0) gsap.set(galleryElement.children, { autoAlpha: 0, y: 30 });
    if (statsAreaElement) gsap.set(statsAreaElement, { autoAlpha: 0, y: 30 });
  }

  function playAnimation() {
    if (tl) tl.kill();
    
    // Initial states
    if (introTextElement) gsap.set(introTextElement, { autoAlpha: 0, y: 30 });
    if (galleryElement && galleryElement.children.length > 0) gsap.set(galleryElement.children, { autoAlpha: 0, y: 30 });
    if (statsAreaElement) gsap.set(statsAreaElement, { autoAlpha: 0, y: 30 });

    tl = gsap.timeline({ delay: 0.5 });

    // 1. Intro Text
    if (introTextElement) {
      tl.to(introTextElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.1);
    }

    // 2. Gallery Items (staggered)
    if (galleryElement && galleryElement.children.length > 0) {
      tl.to(galleryElement.children, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.2
      }, 0.2);
    }

    // 3. Stats Bar
    if (statsAreaElement) {
      tl.to(statsAreaElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.6);
    }
  }
</script>

{#if isMobile}
  <!-- Mobile: Stacked layout with centered header -->
  <div class="testing-mobile">
    <div class="mobile-header">
      <h2 class="main-title">{title}</h2>
    </div>

    <div class="mobile-content">
      <p class="intro-text" bind:this={introTextElement}>{introText}</p>

      <div class="mobile-gallery" bind:this={galleryElement}>
        {#if materialImage}
          <div class="gallery-item-wrapper">
            <ImageGalleryItem 
              src={materialImage} 
              alt="Material comparison"
              caption={materialCaption}
              aspectRatio="16/10"
            />
          </div>
        {/if}

        {#if versionImage}
          <div class="gallery-item-wrapper">
            <ImageGalleryItem 
              src={versionImage} 
              alt="Version evolution"
              caption={versionCaption}
              aspectRatio="16/10"
            />
          </div>
        {/if}
      </div>
    </div>

    {#if stats.length > 0}
      <div class="stats-area-mobile" bind:this={statsAreaElement}>
        <StatsBar {stats} />
      </div>
    {/if}
  </div>
{:else}
  <!-- Desktop: Intro, vertical image gallery (left), space for background (right), stats -->
  <div class="testing-desktop">
    <SectionTitle {title} {isActive} delay={0.5} />

    <div class="content-layout">
      <!-- Left side: Intro + vertical gallery -->
      <div class="left-content">
        <p class="intro-text" bind:this={introTextElement}>{introText}</p>

        <div class="vertical-gallery" bind:this={galleryElement}>
          {#if materialImage}
            <div class="gallery-item-wrapper">
              <ImageGalleryItem 
                src={materialImage} 
                alt="Material comparison"
                caption={materialCaption}
                aspectRatio="16/10"
              />
            </div>
          {:else}
            <div class="image-placeholder">
              <span>Material Comparison</span>
              <span class="placeholder-note">(Image pending)</span>
            </div>
          {/if}

          {#if versionImage}
            <div class="gallery-item-wrapper">
              <ImageGalleryItem 
                src={versionImage} 
                alt="Version evolution"
                caption={versionCaption}
                aspectRatio="16/10"
              />
            </div>
          {:else}
            <div class="image-placeholder">
              <span>Version Evolution</span>
              <span class="placeholder-note">(Image pending)</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Right side: Empty to show background image -->
      <div class="right-space"></div>
    </div>

    {#if stats.length > 0}
      <div class="stats-area" bind:this={statsAreaElement}>
        <StatsBar {stats} />
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ========== MOBILE LAYOUT ========== */
  .testing-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: clamp(1rem, 4vw, 1.5rem);
    padding-top: clamp(5rem, 10vh, 6rem);
    padding-bottom: clamp(3rem, 8vh, 5rem);
    box-sizing: border-box;
    overflow-y: auto;
  }

  .mobile-header {
    width: 100%;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .testing-mobile .main-title {
    font-size: clamp(1.1rem, 5vw, 2rem);
    font-weight: 700;
    font-family: var(--project-title-font-family, 'Playfair Display', serif);
    color: rgb(245, 245, 247);
    margin: 0;
    text-shadow: 0 2px 30px rgba(0, 0, 0, 0.5);
  }

  .mobile-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .testing-mobile .intro-text {
    font-size: clamp(0.9rem, 4vw, 1.2rem);
    line-height: 1.6;
    color: rgba(220, 220, 225, 0.95);
    margin: 0;
    text-align: center;
    max-width: 90%;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .mobile-gallery {
    width: 82%;
    max-width: 28rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gallery-item-wrapper {
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .stats-area-mobile {
    width: 100%;
    margin-top: auto;
    display: flex;
    justify-content: center;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }



  @media (max-height: 700px) {
    .testing-mobile {
      padding-top: 3.5rem;
      padding-bottom: 2rem;
    }
    .mobile-content {
      gap: 0.5rem;
    }
    .testing-mobile .main-title {
      font-size: 1.2rem;
    }
  }

  /* ========== DESKTOP LAYOUT ========== */
  .testing-desktop {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    /* Top and Right padding. Reduced to move headline up. */
    padding: clamp(1rem, 2vw, 2rem);
    /* Increased left padding to avoid back button interference. Adjust the first value (6rem) to fine-tune. */
    padding-left: clamp(3rem, 7vw, 6rem);
    padding-bottom: clamp(5rem, 10vh, 7rem);
    box-sizing: border-box;
  }

  .content-layout {
    display: grid;
    grid-template-columns: minmax(20rem, 40%) 1fr;
    gap: clamp(2rem, 4vw, 4rem);
    flex: 1;
    align-items: start;
    /* Negative margin to pull text closer to headline. Adjust this value to fine-tune vertical spacing. */
    margin-top: -1.5rem;
  }

  .left-content {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 1.5vw, 1.5rem);
  }

  .intro-text {
    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
    line-height: 1.75;
    color: rgba(230, 230, 235, 0.95);
    margin: 0;
    max-width: 55ch;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .vertical-gallery {
    display: flex;
    flex-direction: column;
    /* Reduced gap between images. Adjust clamp values to fine-tune. */
    gap: clamp(0.5rem, 1vw, 1rem);
    max-width: clamp(16rem, 25vw, 25vw);
  }

  .gallery-item-wrapper {
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .right-space {
    /* Empty - allows background image to show through */
    display: block;
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16/10;
    background: rgba(9, 9, 11, 0.5);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    color: rgba(160, 160, 165, 0.8);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .placeholder-note {
    font-size: 0.7rem;
    margin-top: 0.25rem;
    opacity: 0.6;
  }

  .stats-area {
    position: absolute;
    bottom: clamp(2rem, 4vh, 3rem);
    left: 50%;
    transform: translateX(-50%);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
</style>
