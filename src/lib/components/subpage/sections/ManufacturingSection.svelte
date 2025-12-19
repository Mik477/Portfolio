<!-- src/lib/components/subpage/sections/ManufacturingSection.svelte -->
<!-- Section 2: Manufacturing - 3D printing and custom batteries -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { renderProfile } from '$lib/stores/renderProfile';
  import SectionTitle from '../SectionTitle.svelte';
  import FeatureCard from '../FeatureCard.svelte';
  import MaterialsStrip from '../MaterialsStrip.svelte';

  export let title: string;
  export let printingTitle: string;
  export let printingPoints: string[];
  export let printingImage: string | undefined = undefined;
  export let batteryTitle: string;
  export let batteryDescription: string;
  export let batteryImage: string | undefined = undefined;
  export let materials: string[] = [];
  export let isActive: boolean = false;

  $: isMobile = $renderProfile.isMobile;

  let gridElement: HTMLElement;
  let materialsElement: HTMLElement;
  let tl: gsap.core.Timeline | null = null;

  // Dynamic height adjustment variables
  let leftTextH = 0;
  let rightTextH = 0;
  let rightImgWidth = 0;
  
  $: heightDiff = Math.max(0, leftTextH - rightTextH);
  $: rightImgHeight = rightImgWidth > 0 ? (rightImgWidth * 9 / 16) + heightDiff : 0;

  $: if (isActive) {
    playAnimation();
  } else {
    if (tl) tl.kill();
    if (gridElement && gridElement.children.length > 0) gsap.set(gridElement.children, { autoAlpha: 0, y: 30 });
    if (materialsElement) gsap.set(materialsElement, { autoAlpha: 0, y: 30 });
  }

  function playAnimation() {
    if (tl) tl.kill();
    
    // Initial states
    if (gridElement && gridElement.children.length > 0) gsap.set(gridElement.children, { autoAlpha: 0, y: 30 });
    if (materialsElement) gsap.set(materialsElement, { autoAlpha: 0, y: 30 });

    tl = gsap.timeline({ delay: 0.5 });

    // Note: SectionTitle handles its own animation with the same delay.
    // We start the content animation slightly after the title starts appearing.

    // 1. Feature Cards (staggered)
    if (gridElement && gridElement.children.length > 0) {
      tl.to(gridElement.children, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15
      }, 0.2); // Start at 0.2s relative to timeline start (which has 0.5s delay)
    }

    // 2. Materials Strip
    if (materialsElement) {
      tl.to(materialsElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.4);
    }
  }
</script>

{#if isMobile}
  <!-- Mobile: Stacked layout with title top-left -->
  <div class="manufacturing-mobile">
    <div class="mobile-header">
      <h2 class="main-title">{title}</h2>
    </div>

    <div class="mobile-content" bind:this={gridElement}>
      <!-- Top Feature -->
      <div class="mobile-feature">
        <FeatureCard title={printingTitle}>
          <ul>
            {#each printingPoints as point}
              <li>{point}</li>
            {/each}
          </ul>
          {#if printingImage}
            <div class="feature-image-container">
              <img src={printingImage} alt={printingTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>

      <!-- Bottom Feature -->
      <div class="mobile-feature">
        <FeatureCard title={batteryTitle}>
          <p>{batteryDescription}</p>
          {#if batteryImage}
            <div class="feature-image-container">
              <img src={batteryImage} alt={batteryTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>
    </div>
  </div>
{:else}
  <!-- Desktop: Two-column with materials strip -->
  <div class="manufacturing-desktop">
    <SectionTitle {title} {isActive} delay={0.5} />

    <div class="features-layout" bind:this={gridElement}>
      <!-- Left: 3D Printing Card -->
      <div class="feature-left">
        <FeatureCard title={printingTitle}>
          <div bind:clientHeight={leftTextH}>
            <ul>
              {#each printingPoints as point}
                <li>{point}</li>
              {/each}
            </ul>
          </div>
          {#if printingImage}
            <div class="feature-image-container">
              <img src={printingImage} alt={printingTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>

      <!-- Center: Empty space to show background -->
      <div class="center-space"></div>

      <!-- Right: Battery Card -->
      <div class="feature-right">
        <FeatureCard title={batteryTitle}>
          <div bind:clientHeight={rightTextH}>
            <p>{batteryDescription}</p>
          </div>
          {#if batteryImage}
            <div class="feature-image-container"
                 bind:clientWidth={rightImgWidth}
                 style={rightImgWidth > 0 ? `height: ${rightImgHeight}px; aspect-ratio: auto;` : ''}>
              <img src={batteryImage} alt={batteryTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>
    </div>

    {#if materials.length > 0}
      <div class="materials-area" bind:this={materialsElement}>
        <MaterialsStrip items={materials} />
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ========== MOBILE LAYOUT ========== */
  .manufacturing-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 5vw;
    padding-top: clamp(7rem, 15vh, 10rem);
    padding-bottom: 5vh;
    box-sizing: border-box;
    overflow-y: auto; /* Allow scrolling if content overflows */
  }

  .mobile-header {
    width: 100%;
    margin-bottom: 2vh;
    text-align: center;
  }

  .manufacturing-mobile .main-title {
    font-size: 8vw;
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
    gap: 2vh;
    margin-bottom: 2vh;
  }

  .mobile-feature {
    width: 76vw;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  /* Override FeatureCard styles for mobile compactness */
  .mobile-feature :global(.feature-card) {
    padding: 4vw !important;
    background: rgba(9, 9, 11, 0.6) !important; /* Slightly more transparent */
  }

  .mobile-feature :global(.feature-headline) {
    font-size: 0.9rem !important;
    margin-bottom: 1vh !important;
  }

  .mobile-feature ul {
    margin: 0;
    padding-left: 0.9rem;
    font-size: 0.7rem;
    color: rgba(220, 220, 225, 0.9);
  }

  .mobile-feature p {
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.5;
    color: rgba(220, 220, 225, 0.9);
  }

  .manufacturing-mobile .feature-image-container {
    margin-top: 1.5vh;
    aspect-ratio: 21/9; /* Wider aspect ratio for mobile to save vertical space */
  }

  @media (max-height: 700px) {
    .manufacturing-mobile {
      padding-top: 4rem;
      padding-bottom: 2rem;
    }
    .mobile-content {
      gap: 0.5rem;
    }
    .manufacturing-mobile .main-title {
      font-size: 1.5rem;
    }
    .mobile-feature :global(.feature-card) {
      padding: 0.75rem !important;
    }
  }

  /* ========== DESKTOP LAYOUT ========== */
  .manufacturing-desktop {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(3rem, 6vw, 5rem);
    padding-bottom: clamp(2rem, 4vh, 4rem);
    box-sizing: border-box;
  }

  .features-layout {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: start;
    width: 100%;
    margin-top: 1vh;
    flex-grow: 1;
  }

  .feature-left,
  .feature-right {
    width: 100%;
    max-width: clamp(20rem, 30vw, 25rem);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .feature-left {
    justify-self: start;
    grid-column: 1;
  }

  .feature-right {
    justify-self: end;
    grid-column: 3;
  }

  .center-space {
    display: block;
  }

  .feature-image-container {
    margin-top: 1rem;
    width: 100%;
    border-radius: 0.25rem;
    overflow: hidden;
    aspect-ratio: 16/9;
    background: rgba(0, 0, 0, 0.2);
  }

  .feature-image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .materials-area {
    position: absolute;
    bottom: clamp(2rem, 4vh, 3rem);
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    display: flex;
    justify-content: center;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
</style>
