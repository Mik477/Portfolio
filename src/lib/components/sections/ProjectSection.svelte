<!-- src/lib/components/sections/ProjectSection.svelte -->
<script context="module" lang="ts">
  export type ProjectSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import type { Project } from '$lib/data/projectsData';

  const dispatch = createEventDispatcher();

  export let project: Project;

  let sectionWrapperEl: HTMLElement;
  let bgLayerA: HTMLDivElement;
  let bgLayerB: HTMLDivElement;

  // --- State for Image Cycling ---
  let currentImageIndex = 0;
  let activeLayer: 'A' | 'B' = 'A';
  let cycleTimer: number | undefined;
  let isCycling = false;

  function preloadNextImage() {
    if (project.backgrounds.length < 2) return;
    const nextIndex = (currentImageIndex + 1) % project.backgrounds.length;
    const nextImageSrc = project.backgrounds[nextIndex].value;
    const img = new Image();
    img.src = nextImageSrc;
  }

  /**
   * REWRITTEN & CORRECTED: Handles the core cross-fade and continuous zoom logic.
   * This version ensures the outgoing layer continues its zoom during the fade.
   */
  function transitionToNextImage() {
    if (project.backgrounds.length < 2 || !isCycling) return;

    // 1. Identify layers and get the next image in the sequence.
    const layers = { A: bgLayerA, B: bgLayerB };
    const visibleLayer = layers[activeLayer];
    const hiddenLayer = activeLayer === 'A' ? layers.B : layers.A;
    
    currentImageIndex = (currentImageIndex + 1) % project.backgrounds.length;
    const nextImageSrc = project.backgrounds[currentImageIndex].value;
    
    // --- PRELOADING FIX ---
    // Start preloading the *next* image immediately, so it's ready for the subsequent transition.
    // This prevents a loading-induced stutter on the next cycle.
    preloadNextImage();

    // 2. Get animation timing parameters from CSS.
    const totalLifetime = parseFloat(getComputedStyle(sectionWrapperEl).getPropertyValue('--image-total-lifetime'));
    const crossfadeDuration = parseFloat(getComputedStyle(sectionWrapperEl).getPropertyValue('--image-crossfade-duration'));
    
    // 3. The zoom must last for the image's entire visible lifetime PLUS its fade-out duration.
    const totalZoomDuration = totalLifetime + crossfadeDuration;
    
    // 4. Calculate the delay until the *next* transition is triggered.
    const nextTransitionDelay = (totalLifetime - crossfadeDuration) * 1000;

    // 5. Set up the INCOMING (hidden) layer.
    gsap.set(hiddenLayer, { 
      backgroundImage: `url(${nextImageSrc})`, 
      scale: 1, 
      opacity: 0 
    });

    // 6. Animate the INCOMING layer.
    gsap.to(hiddenLayer, {
      scale: 'var(--image-zoom-amount)',
      ease: 'none',
      duration: totalZoomDuration
    });
    gsap.to(hiddenLayer, {
      opacity: 1,
      ease: 'power2.inOut',
      duration: crossfadeDuration
    });

    // 7. Animate the OUTGOING layer.
    gsap.to(visibleLayer, {
      opacity: 0,
      ease: 'power2.inOut',
      duration: crossfadeDuration,
      onComplete: () => {
        gsap.killTweensOf(visibleLayer);
        gsap.set(visibleLayer, { opacity: 0 });
        activeLayer = activeLayer === 'A' ? 'B' : 'A';
        cycleTimer = window.setTimeout(transitionToNextImage, nextTransitionDelay);
      }
    });
  }

  export function onEnterSection() {
    const initialImageSrc = project.backgrounds[currentImageIndex].value;
    const layers = { A: bgLayerA, B: bgLayerB };
    const visibleLayer = layers[activeLayer];
    const hiddenLayer = activeLayer === 'A' ? layers.B : layers.A;
    gsap.set(visibleLayer, { backgroundImage: `url(${initialImageSrc})`, opacity: 1, scale: 1 });
    gsap.set(hiddenLayer, { opacity: 0 });

    if (project.backgrounds.length > 1 && !isCycling) {
      isCycling = true;
      preloadNextImage();
      
      const entryZoomDuration = parseFloat(getComputedStyle(sectionWrapperEl).getPropertyValue('--entry-zoom-duration'));
      cycleTimer = window.setTimeout(transitionToNextImage, entryZoomDuration * 1000);
    }
    
    const headline = sectionWrapperEl.querySelector('.anim-headline');
    const summary = sectionWrapperEl.querySelector('.anim-summary');
    const cards = gsap.utils.toArray(sectionWrapperEl.querySelectorAll('.anim-card'));
    const button = sectionWrapperEl.querySelector('.anim-button');
    
    if (headline) gsap.set(headline, { autoAlpha: 0, y: 50 });
    if (summary) gsap.set(summary, { autoAlpha: 0, y: 40 });
    if (cards.length > 0) gsap.set(cards, { autoAlpha: 0, scale: 0.95, y: 20 });
    if (button) gsap.set(button, { autoAlpha: 0, y: 10, scale: 0.95 });
    
    const tl = gsap.timeline({
      delay: 0.2,
      onComplete: () => { dispatch('animationComplete'); }
    });

    if (headline) tl.to(headline, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 'start');
    if (summary) tl.to(summary, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 'start+=0.15');
    if (cards.length > 0) tl.to(cards, { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 'start+=0.25');
    if (button) tl.to(button, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: 'expo.out' }, 'start+=0.4');
  }

  export function onLeaveSection() {
    isCycling = false;
    clearTimeout(cycleTimer);
    
    gsap.killTweensOf([bgLayerA, bgLayerB]);

    const animatableElements = gsap.utils.toArray(sectionWrapperEl.querySelectorAll('.anim-headline, .anim-summary, .anim-card, .anim-button'));
    if (animatableElements.length > 0) {
      gsap.killTweensOf(animatableElements);
      gsap.set(animatableElements, { autoAlpha: 0 });
    }
  }
  
  onDestroy(() => {
    clearTimeout(cycleTimer);
    gsap.killTweensOf([bgLayerA, bgLayerB]);
  });
</script>

<div class="project-section-wrapper" bind:this={sectionWrapperEl}>
  <div class="background-zoom-target">
    <div class="bg-layer bg-layer-a" bind:this={bgLayerA}></div>
    <div class="bg-layer bg-layer-b" bind:this={bgLayerB}></div>
  </div>

  <div class="content-host">
    <slot></slot>
  </div>
</div>

<style>
  :root {
    /* The duration of the dramatic zoom when the section first scrolls into view */
    --entry-zoom-duration: 5s;
    
    /* The total time an image is on screen (visible time + fade time) */
    --image-total-lifetime: 8s;
    
    /* How long the cross-fade between images takes */
    --image-crossfade-duration: 2.5s;
    
    /* How much each image zooms in during its continuous linear cycle */
    --image-zoom-amount: 1.15;
  }

  .project-section-wrapper {
    width: 100%;
    height: 100%;
    color: rgb(245 245 247);
    z-index: 2;
    background-color: transparent;
    position: relative;
    overflow: hidden;
  }

  .background-zoom-target {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    transform: scale(1); /* Target for the orchestrator's initial dramatic zoom */
  }

  .bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transform: scale(1); /* Target for the component's internal linear zoom */
  }

  .background-zoom-target::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(9, 9, 11, 0.6), rgba(9, 9, 11, 0.2) 60%, transparent 100%);
    z-index: 1;
  }
  
  .content-host {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }
</style>