<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project } from '$lib/data/projectsData';
  import HeroParticleEffect from '$lib/components/HeroParticleEffect.svelte';
  import type { SvelteComponent } from 'svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import type { KeyboardButtonsInstance } from '$lib/components/KeyboardButtons.svelte';
  import AboutImageEffect from '$lib/components/AboutImageEffect.svelte';
  import type { AboutImageEffectInstance } from '$lib/components/AboutImageEffect.svelte';
  import ProjectSection from '$lib/components/ProjectSection.svelte';
  import { overallLoadingState, initialSiteLoadComplete, preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';
  import { gsap } from 'gsap';

  const allSectionsData = [
    { id: 'hero', type: 'hero', data: siteConfig.heroSection },
    { id: 'about', type: 'about', data: siteConfig.aboutSection },
    ...projects.map(p => ({ id: `project-${p.id}`, type: 'project', data: p })),
    { id: 'contact', type: 'contact', data: siteConfig.contactSection }
  ];
  
  const aboutSectionIndex = allSectionsData.findIndex(s => s.id === 'about');
  const contactSectionIndex = allSectionsData.findIndex(s => s.id === 'contact');

  interface IAnimatedComponent {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  }
  
  interface HeroParticleEffectInstance extends SvelteComponent {
    onTransitionToHeroStart: () => Promise<void>;
    onTransitionToHeroComplete: () => void;
    onTransitionFromHeroStart: () => void;
  }
  
  // Component Instances
  let heroParticleEffectInstance: HeroParticleEffectInstance | null = null;
  let keyboardButtonsInstance: KeyboardButtonsInstance | null = null;
  let aboutImageEffectInstance: AboutImageEffectInstance | null = null;
  let animatedComponentInstances: (IAnimatedComponent | null)[] = new Array(allSectionsData.length).fill(null);
  
  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);
  const isTransitioning = writable(false);
  const isInitialReveal = writable(true);
  const particleEffectReady = writable(false);

  // --- NEW: Page Visibility State ---
  let visibilityHideTimeoutId: number | undefined;
  let isTabHiddenAndPaused = false;
  const HIDE_BUFFER_DURATION = 15000; // 15 seconds

  let cardsHaveBeenPreRendered = false;
  let cardKeepAliveInterval: number | undefined;

  let particleLayerPointerEvents = 'none';
  $: particleLayerPointerEvents = ($currentSectionIndex === 0 && !$isInitialReveal) ? 'auto' : 'none';

  let mainContainerPointerEvents = 'auto';
  $: mainContainerPointerEvents = ($currentSectionIndex === 0 || $isInitialReveal) ? 'none' : 'auto';

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

  // --- NEW: Page Visibility Handler ---
  /**
   * Handles browser tab visibility changes to prevent animation artifacts.
   * When the tab is hidden for a set duration, it pauses the current section's
   * animations. When the tab becomes visible again, it resets and restarts them.
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      // The user has switched away from the tab.
      // Set a timeout to pause animations after a buffer period.
      visibilityHideTimeoutId = window.setTimeout(() => {
        if (document.hidden && !isTabHiddenAndPaused) {
          console.log('Tab hidden for >15s. Pausing current section animations.');
          const index = get(currentSectionIndex);
          
          // Use our existing API to "leave" the section
          if (index === 0) heroParticleEffectInstance?.onTransitionFromHeroStart();
          else if (index === aboutSectionIndex) {
            keyboardButtonsInstance?.onLeaveSection();
            aboutImageEffectInstance?.onLeaveSection();
          } else {
            animatedComponentInstances[index]?.onLeaveSection();
          }

          isTabHiddenAndPaused = true;
        }
      }, HIDE_BUFFER_DURATION);

    } else {
      // The user has returned to the tab.
      // Immediately cancel any pending "hide" timeout.
      clearTimeout(visibilityHideTimeoutId);

      if (isTabHiddenAndPaused) {
        console.log('Tab re-focused. Resetting and restarting current section animations.');
        const index = get(currentSectionIndex);
        
        // Use our existing API to "re-enter" the section for a clean reset.
        if (index === 0) {
           heroParticleEffectInstance?.onTransitionToHeroStart().then(() => {
             heroParticleEffectInstance?.onTransitionToHeroComplete();
           });
        } else if (index === aboutSectionIndex) {
            keyboardButtonsInstance?.onEnterSection();
            aboutImageEffectInstance?.onEnterSection();
        } else {
            animatedComponentInstances[index]?.onEnterSection();
        }
        
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
        { 
            autoAlpha: 0.001,
            duration: 0.05,
            stagger: 0.1,
            onComplete: function() {
                gsap.set(this.targets(), { autoAlpha: 0 });
            }
        }
    );
  }

  async function preloadMainProjectAssets() {
    startLoadingTask('main-project-assets', 2);
    const imageUrls = projects.flatMap(p => p.cards.map(c => c.image));
    if (imageUrls.length === 0) {
      preloadingStore.updateTaskStatus('main-project-assets', 'loaded');
      return;
    }
    const imagePromises = imageUrls.map(src => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.decode().then(resolve).catch(() => reject(new Error(`Failed to load/decode: ${src}`)));
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      })
    );
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
      if (sectionElements.some(el => !el)) { return; }
      
      sectionElements.forEach((sectionEl, index) => {
        const currentSectionType = allSectionsData[index].type;
        
        sectionBackgroundZooms[index] = null;
        if (currentSectionType === 'project') {
          const bgTarget = sectionEl.querySelector('.background-image-container') as HTMLElement;
          if (bgTarget) {
            sectionBackgroundZooms[index] = gsap.to(bgTarget, { scale: 1.05, duration: projectBgZoomDuration, ease: 'power1.out', paused: true });
          }
        }

        if (index === 0) gsap.set(sectionEl, { yPercent: 0, autoAlpha: 1 });
        else gsap.set(sectionEl, { yPercent: 100, autoAlpha: 0 });
      });
      
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      // NEW: Add the visibility change listener
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };
    
    particleEffectReady.subscribe(ready => { if (ready && get(initialSiteLoadComplete) && !hasStartedInitialReveal) startInitialReveal(); });
    unsubOverallLoadingState = overallLoadingState.subscribe(status => { if (status === 'loaded' && !get(initialSiteLoadComplete)) { setTimeout(() => { initialSiteLoadComplete.set(true); if (get(particleEffectReady) && !hasStartedInitialReveal) startInitialReveal(); }, 100); }});
    unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => { if (complete && get(particleEffectReady) && !hasStartedInitialReveal) startInitialReveal(); });
    
    setupPromise();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      // NEW: Clean up the visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(visibilityHideTimeoutId); // Clear any pending timeout on unmount

      sectionBackgroundZooms.forEach(tween => tween?.kill());
      gsap.killTweensOf(sectionElements);
      clearInterval(cardKeepAliveInterval);
      if (unsubOverallLoadingState) unsubOverallLoadingState();
      if (unsubInitialLoadComplete) unsubInitialLoadComplete();
    };
  });

  function startInitialReveal() { if (hasStartedInitialReveal) return; hasStartedInitialReveal = true; setTimeout(() => { if (heroParticleEffectInstance) heroParticleEffectInstance.onTransitionToHeroComplete(); setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000); }, initialRevealDelay); }
  
  function navigateToSection(newIndex: number) { 
    if (get(isInitialReveal)) return; 
    const oldIndex = get(currentSectionIndex); 
    if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; 
    
    isAnimating.set(true); 
    isTransitioning.set(true); 

    // --- On Leave Logic ---
    if (heroParticleEffectInstance && oldIndex === 0) {
      heroParticleEffectInstance.onTransitionFromHeroStart();
    }
    
    if (oldIndex === aboutSectionIndex) {
        clearInterval(cardKeepAliveInterval);
        keyboardButtonsInstance?.onLeaveSection();
        aboutImageEffectInstance?.onLeaveSection();
    } else {
        animatedComponentInstances[oldIndex]?.onLeaveSection();
    }
    sectionBackgroundZooms[oldIndex]?.progress(0).pause(); 

    // --- On Enter Logic ---
    if (heroParticleEffectInstance && newIndex === 0) {
      heroParticleEffectInstance.onTransitionToHeroStart();
    }

    const currentSectionEl = sectionElements[oldIndex]; 
    const targetSectionEl = sectionElements[newIndex]; 
    const direction = newIndex > oldIndex ? 1 : -1; 
    
    const masterTransitionTl = gsap.timeline({ 
      onComplete: () => { 
        currentSectionIndex.set(newIndex); 
        isTransitioning.set(false);
        
        if (heroParticleEffectInstance && newIndex === 0) { 
          heroParticleEffectInstance.onTransitionToHeroComplete(); 
        }
        
        if (newIndex === aboutSectionIndex) {
            cardKeepAliveInterval = setInterval(pingRenderedCards, 4000);
            keyboardButtonsInstance?.onEnterSection();
            aboutImageEffectInstance?.onEnterSection();
        } else {
            animatedComponentInstances[newIndex]?.onEnterSection();
        }
        
        sectionBackgroundZooms[newIndex]?.restart();
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
  <HeroParticleEffect bind:this={heroParticleEffectInstance} activeSectionIndex={$currentSectionIndex} isTransitioning={$isTransitioning} {transitionDuration} isInitialLoad={$isInitialReveal} on:ready={onParticleEffectReady} />
</div>

<main class="portfolio-container" style="pointer-events: {mainContainerPointerEvents};">
  <section id="hero" class="full-screen-section hero-section"></section>

  <section id="about" class="full-screen-section about-section">
    <!-- This wrapper is the "left pane" for the text content -->
    <div class="about-content-wrapper">
      <KeyboardButtons 
        bind:this={keyboardButtonsInstance}
        title={siteConfig.aboutSection.title}
        introduction={siteConfig.aboutSection.introduction}
        socialLinks={siteConfig.aboutSection.socialLinks} 
        {contactSectionIndex} 
        {navigateToSection}
        on:animationComplete={triggerStaggeredCardPreRender}
      />
    </div>
    <!-- The new effect component acts as the "right pane" -->
    <AboutImageEffect
      bind:this={aboutImageEffectInstance}
      imageUrl={siteConfig.aboutSection.imageUrl}
    />
  </section>

  {#each allSectionsData as section, index (section.id)}
    {#if section.type === 'project'}
      <section id={section.id} class="full-screen-section project-section">
        <ProjectSection 
            bind:this={animatedComponentInstances[index]} 
            project={section.data as Project} 
        />
      </section>
    {/if}
  {/each}

  <section id="contact" class="full-screen-section contact-section">
     <div class="content-center">
      <h2>{siteConfig.contactSection.title}</h2>
      <p>{siteConfig.contactSection.outroMessage}</p>
      <p>Email: <a href="mailto:{siteConfig.contactSection.email}">{siteConfig.contactSection.email}</a></p>
      {#if siteConfig.contactSection.additionalLinks}
        <div class="additional-links">
          {#each siteConfig.contactSection.additionalLinks as link}
            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
          {/each}
        </div>
      {/if}
    </div>
  </section>
</main>

<style>
  :global(body) { background-color: rgb(9 9 11); color: rgb(245 245 247); }
  .particle-effect-layer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; background-color: rgb(9 9 11); transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
  .particle-effect-layer.initial-state { background-color: rgb(5 8 5); }
  .portfolio-container { position: relative; width: 100%; height: 100vh; overflow: hidden; z-index: 1; }
  .full-screen-section { height: 100%; width: 100%; position: absolute; top: 0; left: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem; box-sizing: border-box; background-color: rgb(9 9 11); }
  .hero-section { background-color: transparent; z-index: 2; pointer-events: none; }
  
  .about-section {
    padding: 0;
    text-align: left;
    background-color: transparent;
    z-index: 2;
    position: relative;
    overflow: hidden;
    flex-direction: row;
    justify-content: space-between;
  }
  .about-content-wrapper {
    position: relative;
    z-index: 3;
    flex-grow: 1;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem);
    padding-right: 2rem;
    box-sizing: border-box;
  }
  
  .project-section { color: rgb(245 245 247); z-index: 2; background-color: transparent; padding: 0; }
  .contact-section { background-color: rgb(24 24 27); color: rgb(245 245 247); z-index: 2; }
  .content-center { max-width: 800px; margin: 0 auto; padding: 2rem; }
  .contact-section h2 { font-size: 2.5rem; margin-bottom: 2rem; font-weight: 300; letter-spacing: -0.02em; }
  .contact-section p { font-size: 1.15rem; line-height: 1.8; margin-bottom: 1.5rem; color: rgb(212 212 216); }
  .contact-section a { color: rgb(99 102 241); text-decoration: none; font-weight: 500; transition: color 0.3s ease; }
  .contact-section a:hover { color: rgb(129 140 248); text-decoration: underline; }
  .additional-links { margin-top: 2rem; display: flex; gap: 2rem; justify-content: center; }
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  
  @media (max-width: 768px) {
    .about-section { 
      flex-direction: column;
      justify-content: center;
      padding: 2rem; 
    }
    .about-content-wrapper { 
      justify-content: center; 
      text-align: center; 
      padding: 1rem;
      width: 100%;
      flex-grow: 0;
      z-index: 2;
    }
    .about-section :global(.main-container) {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.15 !important;
      z-index: 1;
    }
    .about-section :global(.image-pane) {
      justify-content: center;
    }
    .about-section :global(.image-pane img) {
      width: 100vw;
      height: 100vh;
      object-fit: cover;
    }
  }
</style>