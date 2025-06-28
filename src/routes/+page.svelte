<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project } from '$lib/data/projectsData';
  import { overallLoadingState, initialSiteLoadComplete, preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';
  import { gsap } from 'gsap';

  // --- Component Imports ---
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import HeroSection from '$lib/components/sections/HeroSection.svelte';
  import AboutSection from '$lib/components/sections/AboutSection.svelte';
  import ProjectOneSection from '$lib/components/sections/ProjectOneSection.svelte';
  import ProjectTwoSection from '$lib/components/sections/ProjectTwoSection.svelte';
  import ContactSection from '$lib/components/sections/ContactSection.svelte';

  // --- Universal Animated Component Interface ---
  // FIX: This interface should only describe the methods we intend to call.
  // It does not need to extend SvelteComponent.
  interface IAnimatedComponent {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  }
  import type { HeroSectionInstance } from '$lib/components/sections/HeroSection.svelte';

  // --- Section Data with Component References ---
  const allSectionsData = [
    { id: 'hero', component: HeroSection, data: siteConfig.heroSection },
    { id: 'about', component: AboutSection, data: siteConfig.aboutSection },
    { id: `project-${projects[0].id}`, component: ProjectOneSection, data: projects[0] },
    { id: `project-${projects[1].id}`, component: ProjectTwoSection, data: projects[1] },
    { id: 'contact', component: ContactSection, data: siteConfig.contactSection }
  ];

  const contactSectionIndex = allSectionsData.findIndex(s => s.id === 'contact');

  // --- Unified Instance Management ---
  let heroSectionInstance: HeroSectionInstance | null = null;
  let sectionInstancesArray: (IAnimatedComponent | null)[] = new Array(allSectionsData.length).fill(null);
  let sectionInstances = new Map<string, IAnimatedComponent>();

  $: if (heroSectionInstance) {
    sectionInstancesArray[0] = heroSectionInstance;
    const newMap = new Map<string, IAnimatedComponent>();
    allSectionsData.forEach((section, index) => {
      const instance = sectionInstancesArray[index];
      if (instance) newMap.set(section.id, instance);
    });
    sectionInstances = newMap;
  }
  
  // --- Core State Management ---
  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);
  const isTransitioning = writable(false);
  const isInitialReveal = writable(true);
  const particleEffectReady = writable(false);

  // Page Visibility State
  let visibilityHideTimeoutId: number | undefined;
  let isTabHiddenAndPaused = false;
  const HIDE_BUFFER_DURATION = 15000;

  // GPU Pre-rendering State
  let cardsHaveBeenPreRendered = false;
  let cardKeepAliveInterval: number | undefined;

  // Pointer Events State
  let particleLayerPointerEvents = 'none';
  $: particleLayerPointerEvents = ($currentSectionIndex === 0 && !$isInitialReveal) ? 'auto' : 'none';
  let mainContainerPointerEvents = 'auto';
  $: mainContainerPointerEvents = ($currentSectionIndex === 0 || $isInitialReveal) ? 'none' : 'auto';

  // DOM and Animation State
  let sectionElements: HTMLElement[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];
  const transitionDuration = 1.1;
  const projectBgZoomDuration = 3;
  const minSectionDisplayDuration = 1.2;
  const initialRevealDelay = 300;
  const particleFadeInDuration = 1.5;
  let unsubOverallLoadingState: (() => void) | undefined;
  let unsubInitialLoadComplete: (() => void) | undefined;
  let hasStartedInitialReveal = false;

  function handleVisibilityChange() {
    const currentIndex = get(currentSectionIndex);
    const currentId = allSectionsData[currentIndex].id;
    const currentInstance = sectionInstances.get(currentId);

    if (document.hidden) {
      visibilityHideTimeoutId = window.setTimeout(() => {
        if (document.hidden && !isTabHiddenAndPaused) {
          console.log('Tab hidden for >15s. Pausing current section animations.');
          currentInstance?.onLeaveSection();
          isTabHiddenAndPaused = true;
        }
      }, HIDE_BUFFER_DURATION);
    } else {
      clearTimeout(visibilityHideTimeoutId);
      if (isTabHiddenAndPaused) {
        console.log('Tab re-focused. Resetting and restarting current section animations.');
        currentInstance?.onEnterSection();
        isTabHiddenAndPaused = false;
      }
    }
  }

  function pingRenderedCards() {
      const allCards = document.querySelectorAll('.card-wrap');
      if (allCards.length === 0) return;
      gsap.set(allCards, { z: 0.01, overwrite: true });
  }

  function triggerStaggeredCardPreRender() {
    if (cardsHaveBeenPreRendered) return;
    cardsHaveBeenPreRendered = true;
    const allCards = document.querySelectorAll('.card-wrap');
    if (allCards.length === 0) return;
    gsap.fromTo(allCards, 
        { autoAlpha: 0 }, 
        { autoAlpha: 0.001, duration: 0.05, stagger: 0.1, onComplete: function() { gsap.set(this.targets(), { autoAlpha: 0 }); } }
    );
  }

  async function preloadMainProjectAssets() {
    startLoadingTask('main-project-assets', 2);
    const imageUrls = projects.flatMap(p => [p.background.value, ...p.cards.map(c => c.image)]);
    const imagePromises = imageUrls.map(src => new Promise((resolve, reject) => {
        const img = new Image(); img.src = src; img.decode().then(resolve).catch(() => reject(new Error(`Failed to load/decode: ${src}`))); img.onload = resolve; img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    }));
    try {
      await Promise.all(imagePromises);
      preloadingStore.updateTaskStatus('main-project-assets', 'loaded');
    } catch (error) {
      preloadingStore.updateTaskStatus('main-project-assets', 'error', (error as Error).message);
    }
  }

  onMount((): (() => void) | void => {
    preloadMainProjectAssets();
    const setupPromise = async () => {
      await tick();
      sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);
      if (sectionElements.some(el => !el)) return;
      
      sectionElements.forEach((sectionEl, index) => {
        const bgTarget = sectionEl.querySelector('.background-image-container') as HTMLElement;
        sectionBackgroundZooms[index] = bgTarget ? gsap.to(bgTarget, { scale: 1.05, duration: projectBgZoomDuration, ease: 'power1.out', paused: true }) : null;
        gsap.set(sectionEl, { yPercent: index === 0 ? 0 : 100, autoAlpha: index === 0 ? 1 : 0 });
      });
      
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };
    
    particleEffectReady.subscribe(ready => { if (ready && get(initialSiteLoadComplete) && !hasStartedInitialReveal) startInitialReveal(); });
    unsubOverallLoadingState = overallLoadingState.subscribe(status => { if (status === 'loaded' && !get(initialSiteLoadComplete)) { setTimeout(() => { initialSiteLoadComplete.set(true); if (get(particleEffectReady) && !hasStartedInitialReveal) startInitialReveal(); }, 100); }});
    unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => { if (complete && get(particleEffectReady) && !hasStartedInitialReveal) startInitialReveal(); });
    
    setupPromise();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(visibilityHideTimeoutId);
      sectionBackgroundZooms.forEach(tween => tween?.kill());
      gsap.killTweensOf(sectionElements);
      clearInterval(cardKeepAliveInterval);
      if (unsubOverallLoadingState) unsubOverallLoadingState();
      if (unsubInitialLoadComplete) unsubInitialLoadComplete();
    };
  });

  function startInitialReveal() { if (hasStartedInitialReveal) return; hasStartedInitialReveal = true; setTimeout(() => { if (heroSectionInstance) heroSectionInstance.onTransitionToHeroComplete(); setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000); }, initialRevealDelay); }
  
  function navigateToSection(newIndex: number) { 
    if (get(isInitialReveal)) return; 
    const oldIndex = get(currentSectionIndex); 
    if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 
    
    isAnimating.set(true); 
    isTransitioning.set(true); 

    const oldSectionId = allSectionsData[oldIndex].id;
    const newSectionId = allSectionsData[newIndex].id;
    const oldInstance = sectionInstances.get(oldSectionId);
    const newInstance = sectionInstances.get(newSectionId);
    
    oldInstance?.onLeaveSection();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause(); 
    if(oldSectionId === 'about') clearInterval(cardKeepAliveInterval);

    newInstance?.onEnterSection();

    const currentSectionEl = sectionElements[oldIndex]; 
    const targetSectionEl = sectionElements[newIndex]; 
    const direction = newIndex > oldIndex ? 1 : -1; 
    
    const masterTransitionTl = gsap.timeline({ 
      onComplete: () => { 
        currentSectionIndex.set(newIndex); 
        isTransitioning.set(false);
        
        sectionBackgroundZooms[newIndex]?.restart();
        if(newSectionId === 'about') cardKeepAliveInterval = setInterval(pingRenderedCards, 4000);

        if (newSectionId === 'hero' && heroSectionInstance) {
           heroSectionInstance.onTransitionToHeroComplete();
        }
      } 
    }); 
    
    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 }); 
    masterTransitionTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
    masterTransitionTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
    
    gsap.delayedCall(Math.max(transitionDuration, minSectionDisplayDuration), () => { 
      isAnimating.set(false); 
    }); 
  }

  let lastScrollTime = 0;
  const scrollDebounce = 200;
  function handleWheel(event: WheelEvent) { event.preventDefault(); if (get(isInitialReveal)) return; const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce || get(isAnimating)) return; lastScrollTime = currentTime; navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1)); }
  function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); } }
  function onParticleEffectReady() { particleEffectReady.set(true); }
</script>

<svelte:head>
  <title>{siteConfig.title}</title>
  <meta name="description" content={siteConfig.description} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
</svelte:head>

<LoadingScreen /> 

<div class="particle-effect-layer" class:initial-state={$isInitialReveal} style="pointer-events: {particleLayerPointerEvents};">
  <HeroSection
    bind:this={heroSectionInstance}
    activeSectionIndex={$currentSectionIndex}
    isTransitioning={$isTransitioning}
    {transitionDuration}
    isInitialLoad={$isInitialReveal}
    on:ready={onParticleEffectReady}
  />
</div>

<main class="portfolio-container" style="pointer-events: {mainContainerPointerEvents};">
  <section id="hero" class="full-screen-section hero-section-container"></section>

  {#each allSectionsData.slice(1) as section, i (section.id)}
    <section 
      id={section.id} 
      class="full-screen-section"
    >
      {#if section.id === 'about'}
        <AboutSection
          bind:this={sectionInstancesArray[i + 1]}
          data={section.data as typeof siteConfig.aboutSection}
          {contactSectionIndex}
          {navigateToSection}
          on:animationComplete={triggerStaggeredCardPreRender}
        />
      {:else if section.id === `project-${projects[0].id}`}
        <ProjectOneSection
          bind:this={sectionInstancesArray[i + 1]}
          project={section.data as Project}
        />
      {:else if section.id === `project-${projects[1].id}`}
        <ProjectTwoSection
          bind:this={sectionInstancesArray[i + 1]}
          project={section.data as Project}
        />
      {:else if section.id === 'contact'}
        <ContactSection
          bind:this={sectionInstancesArray[i + 1]}
          data={section.data as typeof siteConfig.contactSection}
        />
      {/if}
    </section>
  {/each}
</main>

<style>
  :global(body) { background-color: rgb(9 9 11); color: rgb(245 245 247); }
  .particle-effect-layer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; background-color: rgb(9 9 11); transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
  .particle-effect-layer.initial-state { background-color: rgb(5 8 5); }
  .portfolio-container { position: relative; width: 100%; height: 100vh; overflow: hidden; z-index: 1; }
  
  .full-screen-section {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    background-color: transparent; 
  }

  .hero-section-container {
    pointer-events: none;
  }
  
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
</style>