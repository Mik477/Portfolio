<!-- src/lib/components/subpage/sections/OverviewSection.svelte -->
<!-- Section 1: Overview - Platform introduction with stats bar -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { renderProfile } from '$lib/stores/renderProfile';
  import StatsBar from '../StatsBar.svelte';
  import type { StatItem } from '../StatsBar.svelte';

  export let title: string;
  export let subtitle: string;
  export let description: string;
  export let stats: StatItem[] = [];
  export let isActive: boolean = false;

  $: isMobile = $renderProfile.isMobile;

  let lineElement: HTMLElement;
  let titleElement: HTMLElement;
  let subtitleElement: HTMLElement;
  let descriptionElement: HTMLElement;
  let statsAreaElement: HTMLElement;
  let tl: gsap.core.Timeline | null = null;

  $: if (isActive && lineElement && titleElement) {
    playAnimation();
  } else if (!isActive && lineElement) {
    if (tl) tl.kill();
    const elements = [titleElement, subtitleElement, descriptionElement, statsAreaElement].filter(el => el);
    if (elements.length > 0) {
      gsap.set(elements, { autoAlpha: 0, y: 30 });
    }
    gsap.set(lineElement, { scaleX: 0, opacity: 0 });
  }

  function playAnimation() {
    if (tl) tl.kill();
    
    const titleWidth = titleElement.offsetWidth;
    const targetWidth = titleWidth + 40;

    // Initial states
    const elements = [titleElement, subtitleElement, descriptionElement, statsAreaElement].filter(el => el);
    if (elements.length > 0) {
      gsap.set(elements, { autoAlpha: 0, y: 30 });
    }
    gsap.set(lineElement, { 
      width: targetWidth, 
      scaleX: 0, 
      opacity: 0, 
      transformOrigin: "left center" 
    });

    tl = gsap.timeline({ delay: 0.5 });

    // 1. Title Fade In
    tl.to(titleElement, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out'
    }, 0);

    // 2. Line Expansion
    tl.to(lineElement, { 
      opacity: 1,
      duration: 0.1,
      ease: "none"
    }, 0.1)
    .to(lineElement, { 
      scaleX: 1, 
      duration: 2.0, 
      ease: "expo.out"
    }, 0.1);

    // 3. Subtitle Fade In
    if (subtitleElement) {
      tl.to(subtitleElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.2);
    }

    // 4. Description Fade In
    if (descriptionElement) {
      tl.to(descriptionElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.3);
    }

    // 5. Stats Bar Fade In
    if (statsAreaElement) {
      tl.to(statsAreaElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.4);
    }
  }
</script>

{#if isMobile}
  <!-- Mobile: Layout matching desktop elements -->
  <div class="overview-mobile">
    <div class="content-area">
      <div class="headline-block">
        <h2 class="main-title" bind:this={titleElement}>{title}</h2>
        <div class="title-rule" bind:this={lineElement}></div>
        <p class="subtitle" bind:this={subtitleElement}>{subtitle}</p>
      </div>
      
      <p class="description" bind:this={descriptionElement}>{description}</p>
    </div>

    {#if stats.length > 0}
      <div class="stats-area" bind:this={statsAreaElement}>
        <StatsBar {stats} />
      </div>
    {/if}
  </div>
{:else}
  <!-- Desktop: Split hero with stats bar -->
  <div class="overview-desktop">
    <div class="content-area">
      <div class="headline-block">
        <h2 class="main-title" bind:this={titleElement}>{title}</h2>
        <div class="title-rule" bind:this={lineElement}></div>
        <p class="subtitle" bind:this={subtitleElement}>{subtitle}</p>
      </div>
      
      <p class="description" bind:this={descriptionElement}>{description}</p>
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
  .overview-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: clamp(1.5rem, 5vw, 2.5rem);
    padding-top: clamp(6rem, 11vh, 10rem);
    padding-bottom: clamp(1.5rem, 5vh, 2.5rem);
    box-sizing: border-box;
    overflow-y: auto;
  }

  /* Reuse classes for consistent styling */
  
  /* ========== DESKTOP LAYOUT ========== */
  .overview-desktop {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: clamp(3rem, 5vw, 5rem);
    padding-bottom: clamp(5rem, 10vh, 8rem);
    box-sizing: border-box;
  }

  .content-area {
    max-width: clamp(32rem, 50vw, 50rem);
    padding: 0;
  }
  
  /* Mobile override for content width */
  .overview-mobile .content-area {
    max-width: 100%;
    margin-bottom: auto; /* Push stats to bottom */
  }

  .headline-block {
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .main-title {
    /* Increased to match main page project section headline style */
    font-size: clamp(2.8rem, 3.5vw + 1rem, 4.5rem);
    font-weight: 700;
    font-family: var(--project-title-font-family, 'Playfair Display', serif);
    letter-spacing: 0.04em;
    color: rgb(245, 245, 247);
    margin: 0;
    text-shadow: 0 2px 30px rgba(0, 0, 0, 0.5);
    width: fit-content;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
  
  /* Mobile override for title size */
  .overview-mobile .main-title {
    font-size: clamp(2.2rem, 8vw, 3rem);
  }

  .title-rule {
    height: 1px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0.1)
    );
    margin: 0.75rem 0;
    /* Width set by JS */
  }

  .subtitle {
    /* Increased range for better scaling */
    font-size: clamp(1.2rem, 1.5vw + 0.5rem, 1.6rem);
    font-weight: 400;
    color: rgba(200, 200, 205, 0.95);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
  
  /* Mobile override for subtitle */
  .overview-mobile .subtitle {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
  }

  .description {
    /* Increased to match main page summary text style */
    font-size: clamp(1rem, 1.2vw + 0.4rem, 1.35rem);
    line-height: 1.8;
    color: rgba(230, 230, 235, 0.95);
    margin: 0;
    max-width: 60ch;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
  
  /* Mobile override for description */
  .overview-mobile .description {
    font-size: clamp(0.9rem, 3.5vw, 1.05rem);
    max-width: 100%;
  }

  .stats-area {
    position: absolute;
    bottom: clamp(2rem, 5vh, 4rem);
    /* Use left:0 + width:100% + flexbox for reliable centering */
    left: 0;
    right: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  /* Mobile override for stats positioning */
  .overview-mobile .stats-area {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: 100%;
    margin-top: auto; /* Ensure it pushes to bottom if space allows */
    padding-top: 2rem; /* Space from content */
    padding-bottom: 0;
  }
</style>
