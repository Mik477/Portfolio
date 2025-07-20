<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project } from '$lib/data/projectsData';
  import { initialSiteLoadComplete, preloadingStore, startLoadingTask, preloadAssets } from '$lib/stores/preloadingStore';
  import { sectionStates, type SectionState } from '$lib/stores/sectionStateStore';
  import { gsap } from 'gsap';

  // Component Imports
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import HeroSection from '$lib/components/sections/HeroSection.svelte';
  import AboutSection from '$lib/components/sections/AboutSection.svelte';
  import ContactSection from '$lib/components/sections/ContactSection.svelte';
  import ProjectSection from '$lib/components/sections/ProjectSection.svelte'; 
  import ProjectOneLayout from '$lib/components/layouts/ProjectOneLayout.svelte';
  // import ProjectTwoLayout from '$lib/components/layouts/ProjectTwoLayout.svelte';

  // Type Imports
  interface IAnimatedComponent {
    onEnterSection: () => void;
    onLeaveSection: () => void;
    initializeEffect?: () => Promise<void>;
    onTransitionComplete?: () => void;
    onUnload?: () => void;
  }
  import type { HeroSectionInstance } from '$lib/components/sections/HeroSection.svelte';

  // Section Data Structure
  const allSectionsData = [
    { id: 'hero', component: HeroSection, data: siteConfig.heroSection, layout: null },
    { id: 'about', component: AboutSection, data: siteConfig.aboutSection, layout: null },
    { 
      id: `project-${projects[0].id}`, 
      component: ProjectSection, 
      layout: ProjectOneLayout,
      data: projects[0] 
    },
    { 
      id: `project-${projects[1].id}`, 
      component: ProjectSection,
      layout: ProjectOneLayout,
      data: projects[1]
    },
    { id: 'contact', component: ContactSection, data: siteConfig.contactSection, layout: null }
  ];
  const contactSectionIndex = allSectionsData.findIndex(s => s.id === 'contact');

  // Instance Management
  let heroSectionInstance: HeroSectionInstance | null = null;
  let sectionInstancesArray: (IAnimatedComponent | null)[] = new Array(allSectionsData.length).fill(null);
  let sectionInstances = new Map<string, IAnimatedComponent>();
  $: if (sectionInstancesArray.length > 0) {
    const newMap = new Map<string, IAnimatedComponent>();
    allSectionsData.forEach((section, index) => {
      const instance = index === 0 ? heroSectionInstance : sectionInstancesArray[index];
      if (instance) newMap.set(section.id, instance);
    });
    sectionInstances = newMap;
  }
  
  // Core State
  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);
  const isTransitioning = writable(false);
  const isInitialReveal = writable(true);
  const sectionStatesStore = sectionStates;

  // Page & Animation State
  let visibilityHideTimeoutId: number | undefined;
  let isTabHiddenAndPaused = false;
  const HIDE_BUFFER_DURATION = 15000;
  let sectionElements: HTMLElement[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];
  const transitionDuration = 1.1;
  const projectBgZoomDuration = 5;
  const minSectionDisplayDuration = 1.2;
  const initialRevealDelay = 300;
  const particleFadeInDuration = 1.5;
  let unsubInitialLoadComplete: (() => void) | undefined;
  let hasStartedInitialReveal = false;
  
  let particleLayerPointerEvents = 'none';
  $: particleLayerPointerEvents = ($currentSectionIndex === 0 && !$isInitialReveal) ? 'auto' : 'none';
  let mainContainerPointerEvents = 'auto';
  $: mainContainerPointerEvents = ($currentSectionIndex === 0 || $isInitialReveal) ? 'none' : 'auto';

  // Promise setup for initial load
  let heroReadyResolver: () => void;
  const heroReadyPromise = new Promise<void>(resolve => {
    heroReadyResolver = resolve;
  });

  // The HYBRID Preload Manager
  const preloadManager = {
    isPrewarming: false,
    
    async updateNeighborStates(activeIndex: number) {
      console.log(`[Preloader] Updating neighbors for ACTIVE section ${activeIndex}.`);
      const currentStates = get(sectionStatesStore);
      const desiredStates: SectionState[] = allSectionsData.map((_, i) => {
        if (i === activeIndex) return 'ACTIVE';
        if (i === activeIndex - 1 || i === activeIndex + 1) return 'READY';
        return 'COOLDOWN';
      });

      const tasks: Promise<void>[] = [];

      for (let i = 0; i < allSectionsData.length; i++) {
        const currentState = currentStates[i];
        const desiredState = desiredStates[i];

        if (currentState !== desiredState) {
          if ((currentState === 'IDLE' || currentState === 'COOLDOWN') && desiredState === 'READY') {
            tasks.push(this.prepareSection(i));
          }
          if (currentState === 'READY' && desiredState === 'COOLDOWN') {
            tasks.push(this.coolDownSection(i));
          }
        }
      }
      
      sectionStatesStore.update(states => {
        states[activeIndex] = 'ACTIVE';
        return states;
      });

      await Promise.all(tasks);
    },
    
    async prepareSection(index: number) {
      const currentState = get(sectionStatesStore)[index];
      if (currentState !== 'IDLE' && currentState !== 'COOLDOWN') return;
      
      const sectionInfo = allSectionsData[index];
      const instance = sectionInstances.get(sectionInfo.id);
      const element = sectionElements[index];

      if (!instance || !element) {
        console.error(`[Preloader] Cannot prepare Section ${index}. Instance or element not found.`);
        return;
      }

      sectionStatesStore.update(states => { states[index] = 'PRELOADING'; return states; });
      console.log(`[Preloader] PRELOADING Section ${index} (${sectionInfo.id})...`);

      const urls = this.getSectionAssetUrls(index);
      if (urls.length > 0) await preloadAssets(urls);
      
      if (instance.initializeEffect) await instance.initializeEffect();
      
      if (sectionInfo.id === 'about') {
        console.log(`[Preloader] Performing WebGL Dry Run for Section ${index} (${sectionInfo.id})...`);
        gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
        instance.onEnterSection();
        instance.onTransitionComplete?.();
        await new Promise(resolve => setTimeout(resolve, 200));
        instance.onLeaveSection();
        gsap.set(element, { yPercent: 100, autoAlpha: 0 });
      } else if (sectionInfo.id.startsWith('project-')) {
        console.log(`[Preloader] Performing GPU Dry Run for Section ${index} (${sectionInfo.id})...`);
        gsap.set(element, { yPercent: 0, autoAlpha: 0.0001 });
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        gsap.set(element, { yPercent: 100, autoAlpha: 0 });
      }
      
      sectionStatesStore.update(states => { states[index] = 'READY'; return states; });
      console.log(`[Preloader] Section ${index} (${sectionInfo.id}) is now READY.`);
    },

    async coolDownSection(index: number) {
      const sectionId = allSectionsData[index].id;
      sectionStatesStore.update(states => { states[index] = 'COOLDOWN'; return states; });
      console.log(`[Preloader] COOLING DOWN Section ${index} (${sectionId})...`);
      
      const instance = sectionInstances.get(sectionId);
      instance?.onUnload?.();
      
      sectionStatesStore.update(states => { states[index] = 'IDLE'; return states; });
      console.log(`[Preloader] Section ${index} (${sectionId}) is now IDLE.`);
    },

    getSectionAssetUrls(index: number): string[] {
      if (index < 0 || index >= allSectionsData.length) return [];
      const section = allSectionsData[index];
      let urls: string[] = [];
      if (section.id === 'about') {
        urls.push((section.data as typeof siteConfig.aboutSection).imageUrl);
      } else if (section.id.startsWith('project-')) {
        const p = section.data as Project;
        urls.push(p.background.value);
        p.cards.forEach(card => urls.push(card.image));
      }
      return urls.filter(Boolean);
    },
  };

  function handleAnimationComplete() {
    const nextNeighborIndex = get(currentSectionIndex) + 2;
    if(nextNeighborIndex < allSectionsData.length) {
      preloadManager.prepareSection(nextNeighborIndex);
    }
  }

  function handleVisibilityChange() {
    const currentIndex = get(currentSectionIndex);
    const currentInstance = sectionInstances.get(allSectionsData[currentIndex].id);
    if (document.hidden) {
      visibilityHideTimeoutId = window.setTimeout(() => {
        if (document.hidden && !isTabHiddenAndPaused) {
          console.log('[Visibility] Tab hidden, pausing current section animations.');
          currentInstance?.onLeaveSection();
          isTabHiddenAndPaused = true;
        }
      }, HIDE_BUFFER_DURATION);
    } else {
      clearTimeout(visibilityHideTimeoutId);
      if (isTabHiddenAndPaused) {
        console.log('[Visibility] Tab focused, re-engaging animations and re-validating neighbors.');
        currentInstance?.onEnterSection();
        requestAnimationFrame(() => {
          currentInstance?.onTransitionComplete?.();
        });
        isTabHiddenAndPaused = false;
        preloadManager.updateNeighborStates(currentIndex);
      }
    }
  }

  onMount(() => {
    const mountLogic = async () => {
      await tick();
      
      sectionStatesStore.set(new Array(allSectionsData.length).fill('IDLE'));

      sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);
      if (sectionElements.some(el => !el)) {
        console.error("Could not find all section elements in the DOM.");
        return;
      }
      
      sectionElements.forEach((sectionEl, index) => {
        const sectionData = allSectionsData[index];
        if (sectionData.id.startsWith('project-')) {
          const bgTarget = sectionEl.querySelector('.background-image-container') as HTMLElement;
          sectionBackgroundZooms[index] = bgTarget ? gsap.to(bgTarget, { scale: 1.08, duration: projectBgZoomDuration, ease: 'power1.out', paused: true }) : null;
        }
        gsap.set(sectionEl, { yPercent: index === 0 ? 0 : 100, autoAlpha: index === 0 ? 1 : 0 });
      });

      const setupInitialLoad = async () => {
        const heroInitializationPromise = heroReadyPromise;
        const aboutInitializationPromise = preloadManager.prepareSection(1);

        await Promise.all([heroInitializationPromise, aboutInitializationPromise]);
        
        preloadManager.updateNeighborStates(0);
        
        initialSiteLoadComplete.set(true);
      };

      setupInitialLoad();

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    mountLogic();
    
    unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => {
        if (complete && !hasStartedInitialReveal) {
            startInitialReveal();
        }
    });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (unsubInitialLoadComplete) unsubInitialLoadComplete();
      sectionBackgroundZooms.forEach(tween => tween?.kill());
      clearTimeout(visibilityHideTimeoutId);
    };
  });

  function onParticleEffectReady() {
    if (heroReadyResolver) heroReadyResolver();
  }

  function startInitialReveal() {
    if (hasStartedInitialReveal) return;
    hasStartedInitialReveal = true;

    setTimeout(() => {
      if (heroSectionInstance) {
        heroSectionInstance.onTransitionToHeroComplete();
        preloadManager.prepareSection(2);
      }
      setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000);
    }, initialRevealDelay);
  }
  
  function navigateToSection(newIndex: number) { 
    if (get(isInitialReveal)) return; 
    const oldIndex = get(currentSectionIndex); 
    if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 
    
    isAnimating.set(true); 
    isTransitioning.set(true); 

    const oldInstance = sectionInstances.get(allSectionsData[oldIndex].id);
    const newInstance = sectionInstances.get(allSectionsData[newIndex].id);
    
    oldInstance?.onLeaveSection();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause();
    newInstance?.onEnterSection();

    const currentSectionEl = sectionElements[oldIndex]; 
    const targetSectionEl = sectionElements[newIndex]; 
    const direction = newIndex > oldIndex ? 1 : -1; 
    
    const masterTransitionTl = gsap.timeline({ 
      onComplete: () => { 
        currentSectionIndex.set(newIndex); 
        isTransitioning.set(false);
        
        preloadManager.updateNeighborStates(newIndex);
        
        requestAnimationFrame(() => {
          newInstance?.onTransitionComplete?.();
        });

        if (allSectionsData[newIndex].id === 'hero' && heroSectionInstance) {
           heroSectionInstance.onTransitionToHeroComplete();
        }
      } 
    }); 
    
    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 }); 
    masterTransitionTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
    masterTransitionTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); 
    
    masterTransitionTl.call(() => {
        sectionBackgroundZooms[newIndex]?.restart();
    }, [], `slide+=${transitionDuration * 0.1}`);

    gsap.delayedCall(Math.max(transitionDuration, minSectionDisplayDuration), () => { 
      isAnimating.set(false); 
    }); 
  }

  let lastScrollTime = 0;
  const scrollDebounce = 200;
  function handleWheel(event: WheelEvent) { event.preventDefault(); if (get(isInitialReveal)) return; const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce || get(isAnimating)) return; lastScrollTime = currentTime; navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1)); }
  function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); } }
</script>

<svelte:head>
  <title>{siteConfig.title}</title>
  <meta name="description" content={siteConfig.description} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <!-- FIX: Updated font import to use the variable font version of Playfair Display -->
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet">
</svelte:head>

<div>
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
            on:animationComplete={handleAnimationComplete}
          />
        {:else if section.id.startsWith('project-')}
          <ProjectSection
            bind:this={sectionInstancesArray[i + 1]}
            project={section.data as Project}
            on:animationComplete={handleAnimationComplete}
          >
            <svelte:component 
              this={section.layout} 
              {...(section.data as Project)}
            />
          </ProjectSection>
        {:else if section.id === 'contact'}
          <ContactSection
            bind:this={sectionInstancesArray[i + 1]}
            data={section.data as typeof siteConfig.contactSection}
            on:animationComplete={handleAnimationComplete}
          />
        {/if}
      </section>
    {/each}
  </main>

  <style>
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
</div>