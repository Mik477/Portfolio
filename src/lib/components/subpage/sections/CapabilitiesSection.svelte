<!-- src/lib/components/subpage/sections/CapabilitiesSection.svelte -->
<!-- Section 3: Capabilities - Sensors, GPS autonomy, antenna design -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { renderProfile } from '$lib/stores/renderProfile';
  import SectionTitle from '../SectionTitle.svelte';
  import FeatureCard from '../FeatureCard.svelte';

  export let title: string;
  
  // Sensor feature
  export let sensorTitle: string;
  export let sensorDescription: string;
  export let sensorImage: string | undefined = undefined;
  
  // Antenna feature
  export let antennaTitle: string;
  export let antennaDescription: string;
  export let antennaImage: string | undefined = undefined;
  
  // GPS Autonomy feature (full width)
  export let gpsTitle: string;
  export let gpsFeatures: string[];
  export let isActive: boolean = false;

  $: isMobile = $renderProfile.isMobile;

  let gridElement: HTMLElement;
  let gpsAreaElement: HTMLElement;
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
    if (gpsAreaElement) gsap.set(gpsAreaElement, { autoAlpha: 0, y: 30 });
  }

  function playAnimation() {
    if (tl) tl.kill();
    
    // Initial states
    if (gridElement && gridElement.children.length > 0) gsap.set(gridElement.children, { autoAlpha: 0, y: 30 });
    if (gpsAreaElement) gsap.set(gpsAreaElement, { autoAlpha: 0, y: 30 });

    tl = gsap.timeline({ delay: 0.5 });

    // 1. Feature Cards (staggered)
    if (gridElement && gridElement.children.length > 0) {
      tl.to(gridElement.children, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15
      }, 0.2);
    }

    // 2. GPS Area (bottom)
    if (gpsAreaElement) {
      tl.to(gpsAreaElement, {
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
  <div class="capabilities-mobile">
    <div class="mobile-header">
      <h2 class="main-title">{title}</h2>
    </div>

    <div class="mobile-content" bind:this={gridElement}>
      <!-- Top Feature -->
      <div class="mobile-feature">
        <FeatureCard title={sensorTitle}>
          <p>{sensorDescription}</p>
          {#if sensorImage}
            <div class="feature-image-container">
              <img src={sensorImage} alt={sensorTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>

      <!-- Bottom Feature -->
      <div class="mobile-feature">
        <FeatureCard title={antennaTitle}>
          <p>{antennaDescription}</p>
          {#if antennaImage}
            <div class="feature-image-container">
              <img src={antennaImage} alt={antennaTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>
    </div>
  </div>
{:else}
  <!-- Desktop: Side features with center space, GPS at bottom -->
  <div class="capabilities-desktop">
    <SectionTitle {title} {isActive} delay={0.5} />

    <div class="features-layout" bind:this={gridElement}>
      <!-- Left: Sensor Array -->
      <div class="feature-left">
        <FeatureCard title={sensorTitle}>
          <div bind:clientHeight={leftTextH}>
            <p>{sensorDescription}</p>
          </div>
          {#if sensorImage}
            <div class="feature-image-container">
              <img src={sensorImage} alt={sensorTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>

      <!-- Center: Empty space to show background -->
      <div class="center-space"></div>

      <!-- Right: Dual RX Antenna -->
      <div class="feature-right">
        <FeatureCard title={antennaTitle}>
          <div bind:clientHeight={rightTextH}>
            <p>{antennaDescription}</p>
          </div>
          {#if antennaImage}
            <div class="feature-image-container"
                 bind:clientWidth={rightImgWidth}
                 style={rightImgWidth > 0 ? `height: ${rightImgHeight}px; aspect-ratio: auto;` : ''}>
              <img src={antennaImage} alt={antennaTitle} loading="lazy" />
            </div>
          {/if}
        </FeatureCard>
      </div>
    </div>

    <!-- Bottom: GPS Autonomy (full width) -->
    <div class="gps-area" bind:this={gpsAreaElement}>
      <FeatureCard title={gpsTitle}>
        <div class="gps-features">
          {#each gpsFeatures as feature, i}
            <span class="gps-feature-tag">{feature}</span>
            {#if i < gpsFeatures.length - 1}
              <span class="gps-separator">│</span>
            {/if}
          {/each}
        </div>
      </FeatureCard>
    </div>
  </div>
{/if}

<style>
  /* ========== MOBILE LAYOUT ========== */
  .capabilities-mobile {
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
    overflow-y: auto;
  }

  .mobile-header {
    width: 100%;
    margin-bottom: 2vh;
    text-align: center;
  }

  .capabilities-mobile .main-title {
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
    background: rgba(9, 9, 11, 0.6) !important;
  }

  .mobile-feature :global(.feature-headline) {
    font-size: 0.9rem !important;
    margin-bottom: 1vh !important;
  }

  .mobile-feature p {
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.5;
    color: rgba(220, 220, 225, 0.9);
  }

  .capabilities-mobile .feature-image-container {
    margin-top: 1.5vh;
    aspect-ratio: 21/9;
  }

  .gps-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
  }

  .gps-separator {
    color: rgba(255, 255, 255, 0.2);
    font-weight: 300;
    font-size: 0.8rem;
  }

  @media (max-height: 700px) {
    .capabilities-mobile {
      padding-top: 4rem;
      padding-bottom: 2rem;
    }
    .mobile-content {
      gap: 0.5rem;
    }
    .capabilities-mobile .main-title {
      font-size: 1.5rem;
    }
    .mobile-feature :global(.feature-card) {
      padding: 0.75rem !important;
    }
  }

  /* ========== DESKTOP LAYOUT ========== */
  .capabilities-desktop {
    position: relative;
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
    grid-template-columns: 1fr 1fr 1fr; /* Three equal columns */
    gap: 2rem;
    width: 100%;
    margin-top: 1vh;
    flex-grow: 1;
    /* Removed max-width to allow full spread */
  }

  .feature-left,
  .feature-right {
    /* Allow them to take available space but maybe cap it */
    width: 100%;
    max-width: clamp(20rem, 30vw, 25rem);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .feature-left {
    justify-self: start; /* Push to left edge */
    grid-column: 1;
  }

  .feature-right {
    justify-self: end; /* Push to right edge */
    grid-column: 3;
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

  .center-space {
    /* Empty - allows background to show through */
    display: block;
  }

  .gps-area {
    /* Completely untangled from content flow */
    position: absolute;
    bottom: clamp(2rem, 4vh, 4rem);
    
    /* Robust centering using flexbox */
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    
    will-change: transform, opacity;
    backface-visibility: hidden;
    z-index: 10;
  }

  /* Override FeatureCard styles for GPS area to make it more compact */
  .gps-area :global(.feature-card) {
    /* Match MaterialsStrip style */
    padding: clamp(0.5rem, 1vw, 0.75rem) clamp(1rem, 2vw, 1.5rem) !important;
    background: rgba(9, 9, 11, 0.85) !important;
    max-width: 90%; /* Prevent overflow */
  }

  /* Reduce headline spacing in GPS card */
  .gps-area :global(.feature-headline) {
    text-align: center;
    margin-bottom: 0.3rem !important;
    padding-bottom: 0.2rem !important;
  }

  .gps-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
  }

  .gps-feature-tag {
    font-family: 'Space Grotesk', monospace;
    font-size: clamp(0.65rem, 1vw, 0.8rem);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgb(245, 245, 247);
    white-space: nowrap;
  }
</style>
