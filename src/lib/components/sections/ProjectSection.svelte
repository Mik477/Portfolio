<!-- src/lib/components/sections/ProjectSection.svelte -->
<script context="module" lang="ts">
  export type ProjectSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
	initializeEffect?: (signal?: AbortSignal) => Promise<void>;
	getPreloadAssets?: () => string[];
	primeFirstFrame?: (signal?: AbortSignal) => Promise<void>;
	onUnload?: () => void;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  import { gsap } from 'gsap';
  import { renderProfile } from '$lib/stores/renderProfile';
  import type { Project } from '$lib/data/projectsData';

  const dispatch = createEventDispatcher();

  export let project: Project;

  let activeBackgrounds: Project['backgrounds'] = project.backgrounds;
  let backgroundListVersion = 0;
  let appliedBackgroundVersion = 0;

  let sectionWrapperEl: HTMLElement;
  let bgLayerA: HTMLDivElement;
  let bgLayerB: HTMLDivElement;

  // --- State for Image Cycling ---
  let currentImageIndex = 0;
  let activeLayer: 'A' | 'B' = 'A';
  let cycleTimer: number | undefined;
  let isCycling = false;
  let isInitialized = false;
  let initializationPromise: Promise<void> | null = null;
  let enterTimeline: gsap.core.Timeline | null = null;
  let isUnmounted = false;

  function createAbortError(message: string) {
    try {
      return new DOMException(message, 'AbortError');
    } catch {
      const err = new Error(message);
      (err as any).name = 'AbortError';
      return err;
    }
  }

  function assertNotAborted(signal?: AbortSignal) {
    if (signal?.aborted) throw createAbortError('Warmup cancelled');
  }

  $: {
    const fallback = project.backgrounds;
    const useMobile = $renderProfile?.isMobile && Array.isArray(project.backgroundsMobile) && project.backgroundsMobile.length > 0;
    const selected = (useMobile ? project.backgroundsMobile : fallback) as Project['backgrounds'];
    if (selected && selected !== activeBackgrounds) {
      activeBackgrounds = selected;
      backgroundListVersion += 1;
    }
  }

  $: if (backgroundListVersion !== appliedBackgroundVersion) {
    appliedBackgroundVersion = backgroundListVersion;
    resetBackgroundCycle();
  }

  function resetBackgroundCycle() {
    stopCycleAndAnimations();
    currentImageIndex = 0;
    activeLayer = 'A';
    isInitialized = false;
    initializationPromise = null;
    if (bgLayerA) {
      gsap.set(bgLayerA, { opacity: 0, transformOrigin: '50% 50%' });
    }
    if (bgLayerB) {
      gsap.set(bgLayerB, { opacity: 0, transformOrigin: '50% 50%' });
    }
    if (sectionWrapperEl && activeBackgrounds.length > 0) {
      void ensureInitialized();
    }
  }

  function stopCycleAndAnimations(): void {
    isCycling = false;
    if (cycleTimer !== undefined) {
      clearTimeout(cycleTimer);
      cycleTimer = undefined;
    }

    enterTimeline?.kill();
    enterTimeline = null;

    gsap.killTweensOf([bgLayerA, bgLayerB]);

    if (sectionWrapperEl) {
      const animatableElements = gsap.utils.toArray(
        sectionWrapperEl.querySelectorAll('.anim-headline, .anim-summary, .anim-card, .anim-button')
      );
      if (animatableElements.length > 0) {
        gsap.killTweensOf(animatableElements);
        gsap.set(animatableElements, { autoAlpha: 0 });
      }
    }
  }

  const decodedImagePromises = new Map<string, Promise<void>>();

  function loadAndDecodeImage(src: string | undefined): Promise<void> {
    if (!src) return Promise.resolve();
    const existing = decodedImagePromises.get(src);
    if (existing) return existing;

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      let settled = false;

      const markLoaded = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const markError = () => {
        if (settled) return;
        settled = true;
        reject(new Error(`Failed to load project background: ${src}`));
      };

      img.onload = markLoaded;
      img.onerror = markError;
      img.src = src;

      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(markLoaded)
          .catch(() => {
            if (img.complete && img.naturalWidth > 0) {
              markLoaded();
            }
          });
      }
    })
      .catch(error => {
        decodedImagePromises.delete(src);
        throw error;
      });

    decodedImagePromises.set(src, promise);
    return promise;
  }

  function preloadNextImage() {
    if (activeBackgrounds.length < 2) return;
    const nextIndex = (currentImageIndex + 1) % activeBackgrounds.length;
    const nextImageSrc = activeBackgrounds[nextIndex]?.value;
    void loadAndDecodeImage(nextImageSrc);
  }

  /**
   * REWRITTEN & CORRECTED: Handles the core cross-fade and continuous zoom logic.
   * This version ensures the outgoing layer continues its zoom during the fade.
   */
  async function transitionToNextImage() {
    if (activeBackgrounds.length < 2 || !isCycling) return;

    // 1. Identify layers and get the next image in the sequence.
    const layers = { A: bgLayerA, B: bgLayerB };
    const visibleLayer = layers[activeLayer];
    const hiddenLayer = activeLayer === 'A' ? layers.B : layers.A;

    currentImageIndex = (currentImageIndex + 1) % activeBackgrounds.length;
    const nextImageSrc = activeBackgrounds[currentImageIndex]?.value;

    try {
      await loadAndDecodeImage(nextImageSrc);
    } catch (error) {
      console.warn(error);
    }
    
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
    if (!hiddenLayer || !visibleLayer) return;

    gsap.set(hiddenLayer, {
      backgroundImage: `url(${nextImageSrc})`,
      scale: 1,
      opacity: 0,
      transformOrigin: '50% 50%'
    });

    requestAnimationFrame(() => {
      if (isUnmounted || !isCycling) return;
      gsap.to(hiddenLayer, {
        scale: 'var(--image-zoom-amount)',
        ease: 'none',
        duration: totalZoomDuration,
        transformOrigin: '50% 50%'
      });
      gsap.to(hiddenLayer, {
        opacity: 1,
        ease: 'power2.inOut',
        duration: crossfadeDuration
      });

      gsap.to(visibleLayer, {
        opacity: 0,
        ease: 'power2.inOut',
        duration: crossfadeDuration,
        onComplete: () => {
          if (isUnmounted || !isCycling) return;
          gsap.killTweensOf(visibleLayer);
          gsap.set(visibleLayer, { opacity: 0 });
          activeLayer = activeLayer === 'A' ? 'B' : 'A';
          cycleTimer = window.setTimeout(() => { void transitionToNextImage(); }, nextTransitionDelay);
        }
      });
    });
  }

  async function ensureInitialized(signal?: AbortSignal) {
    if (isInitialized || initializationPromise) {
      return initializationPromise ?? Promise.resolve();
    }

    initializationPromise = (async () => {
		assertNotAborted(signal);
      await tick();
		assertNotAborted(signal);
		const initialImageSrc = activeBackgrounds[currentImageIndex]?.value;
      if (!initialImageSrc) return;

      try {
        await loadAndDecodeImage(initialImageSrc);
      } catch (error) {
        console.warn(error);
      }
		assertNotAborted(signal);

		const layers = { A: bgLayerA, B: bgLayerB };
		activeLayer = 'A';
		const visibleLayer = layers[activeLayer];
		const hiddenLayer = activeLayer === 'A' ? layers.B : layers.A;

      if (visibleLayer) {
        gsap.set(visibleLayer, { backgroundImage: `url(${initialImageSrc})`, opacity: 1, scale: 1, transformOrigin: '50% 50%' });
      }
      if (hiddenLayer) {
        gsap.set(hiddenLayer, { backgroundImage: `url(${initialImageSrc})`, opacity: 0, scale: 1, transformOrigin: '50% 50%' });
      }

      if (activeBackgrounds.length > 1) {
        const secondImageSrc = activeBackgrounds[1]?.value;
        void loadAndDecodeImage(secondImageSrc);
      }

		assertNotAborted(signal);
      isInitialized = true;
    })().finally(() => {
      initializationPromise = null;
    });

    return initializationPromise;
  }

  export function initializeEffect(signal?: AbortSignal) {
    return ensureInitialized(signal);
  }

	export function getPreloadAssets(): string[] {
		const urls: string[] = [];
		// Respect the currently selected background list (mobile vs desktop).
		if (activeBackgrounds?.length) {
			urls.push(activeBackgrounds[0]?.value);
			if (activeBackgrounds.length > 1) urls.push(activeBackgrounds[1]?.value);
		}
		project?.cards?.forEach(card => {
			if (card?.cardImage) urls.push(card.cardImage);
		});
		return urls.filter(Boolean);
	}

	// Phase 3: cheap first-frame prime without making the section visible.
	export async function primeFirstFrame(signal?: AbortSignal): Promise<void> {
		await ensureInitialized(signal);
		assertNotAborted(signal);
		await tick();
		assertNotAborted(signal);
		await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
	}

  export function onEnterSection() {
	void ensureInitialized().catch(() => {});
  const initialImageSrc = activeBackgrounds[currentImageIndex]?.value;
  if (!initialImageSrc) return;
    const layers = { A: bgLayerA, B: bgLayerB };
    const visibleLayer = layers[activeLayer];
    const hiddenLayer = activeLayer === 'A' ? layers.B : layers.A;
  gsap.set(visibleLayer, { backgroundImage: `url(${initialImageSrc})`, opacity: 1, scale: 1, transformOrigin: '50% 50%' });
  gsap.set(hiddenLayer, { opacity: 0, transformOrigin: '50% 50%' });

  if (activeBackgrounds.length > 1 && !isCycling) {
      isCycling = true;
      preloadNextImage();
      
      const entryZoomDuration = parseFloat(getComputedStyle(sectionWrapperEl).getPropertyValue('--entry-zoom-duration'));
      cycleTimer = window.setTimeout(() => { void transitionToNextImage(); }, entryZoomDuration * 1000);
    }
    
    const headline = sectionWrapperEl.querySelector('.anim-headline');
    const summary = sectionWrapperEl.querySelector('.anim-summary');
    const cards = gsap.utils.toArray(sectionWrapperEl.querySelectorAll('.anim-card'));
    const button = sectionWrapperEl.querySelector('.anim-button');
    
    if (headline) gsap.set(headline, { autoAlpha: 0, y: 50 });
    if (summary) gsap.set(summary, { autoAlpha: 0, y: 40 });
    if (cards.length > 0) gsap.set(cards, { autoAlpha: 0, scale: 0.95, y: 20 });
    if (button) gsap.set(button, { autoAlpha: 0, y: 10, scale: 0.95 });
    
    enterTimeline?.kill();
    enterTimeline = gsap.timeline({
      delay: 0.2,
      onComplete: () => { dispatch('animationComplete'); }
    });

    if (headline) enterTimeline.to(headline, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 'start');
    if (summary) enterTimeline.to(summary, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 'start+=0.15');
    if (cards.length > 0) enterTimeline.to(cards, { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 'start+=0.25');
    if (button) enterTimeline.to(button, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: 'expo.out' }, 'start+=0.4');
  }

  export function onLeaveSection() {
    stopCycleAndAnimations();
  }

  export function onUnload(): void {
    stopCycleAndAnimations();
  }
  
  onDestroy(() => {
    isUnmounted = true;
    stopCycleAndAnimations();
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
    transform-origin: center center;
    will-change: transform;
  }

  .bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    transform: scale(1); /* Target for the component's internal linear zoom */
    transform-origin: center center;
    will-change: transform, opacity;
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