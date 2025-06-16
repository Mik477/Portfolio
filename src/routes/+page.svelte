<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project, type ProjectCard } from '$lib/data/projectsData';
  import HeroParticleEffect from '$lib/components/HeroParticleEffect.svelte';
  import type { SvelteComponent } from 'svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  import { overallLoadingState, initialSiteLoadComplete, preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';
  import { transitionStore } from '$lib/stores/transitionStore';

  import { gsap } from 'gsap';
  import { Flip } from 'gsap/Flip';

  gsap.registerPlugin(Flip);

  interface HeroParticleEffectInstance extends SvelteComponent {
    onTransitionToHeroStart: () => Promise<void>;
    onTransitionToHeroComplete: () => void;
    onTransitionFromHeroStart: () => void;
  }
  let heroParticleEffectInstance: HeroParticleEffectInstance | null = null;

  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);
  const isTransitioning = writable(false);

  const isInitialReveal = writable(true);
  const particleEffectReady = writable(false);

  let particleLayerPointerEvents = 'none';
  $: particleLayerPointerEvents = ($currentSectionIndex === 0 && !$isInitialReveal) ? 'auto' : 'none';

  let mainContainerPointerEvents = 'auto';
  $: mainContainerPointerEvents = ($currentSectionIndex === 0 || $isInitialReveal) ? 'none' : 'auto';

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  const allSectionsData = [
    { id: 'hero', type: 'hero', data: siteConfig.heroSection },
    { id: 'about', type: 'about', data: siteConfig.aboutSection },
    ...projects.map(p => ({ id: `project-${p.id}`, type: 'project', data: p })),
    { id: 'contact', type: 'contact', data: siteConfig.contactSection }
  ];

  const HERO_LOGICAL_INDEX = 0;
  const MAIN_PROJECT_ASSETS_TASK_ID = 'main-project-assets';

  const transitionDuration = 1.1;
  const projectBgZoomDuration = 3;
  const minSectionDisplayDuration = 1.2;
  const contentAnimationStartOffset = -0.3;
  const projectBgZoomStartOffset = 0.1;

  const initialRevealDelay = 300;
  const particleFadeInDuration = 1.5;

  let unsubOverallLoadingState: (() => void) | undefined;
  let unsubInitialLoadComplete: (() => void) | undefined;
  let contactSectionIndex: number = -1;

  let hasStartedInitialReveal = false;

  function handleCardClick(project: Project, card: ProjectCard) {
    if (get(isAnimating)) return;

    const cardBgElement = document.getElementById(`card-bg-${card.id}`);
    if (!cardBgElement) {
      console.error(`Flip target 'card-bg-${card.id}' not found!`);
      goto(`/projects/${project.slug}${card.aspectLink}`);
      return;
    }

    const state = Flip.getState(cardBgElement);
    transitionStore.set({ fromState: state, cardId: card.id });
    goto(`/projects/${project.slug}${card.aspectLink}`);
  }

  async function preloadMainProjectAssets() {
    startLoadingTask(MAIN_PROJECT_ASSETS_TASK_ID, 2);

    const imageUrls = projects.flatMap(p => p.cards.map(c => c.image));

    if (imageUrls.length === 0) {
      preloadingStore.updateTaskStatus(MAIN_PROJECT_ASSETS_TASK_ID, 'loaded');
      return;
    }

    // --- MODIFICATION START: Use Image.decode() for asynchronous decoding ---
    const imagePromises = imageUrls.map(src => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        // img.decode() returns a promise that resolves when the image is decoded and ready to be used.
        img.decode()
          .then(resolve)
          .catch(() => reject(new Error(`Failed to load or decode card image: ${src}`)));
        // Set up onload/onerror as fallbacks for browsers that might not fully support .decode()
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load card image: ${src}`));
      })
    );
    // --- MODIFICATION END ---

    try {
      await Promise.all(imagePromises);
      preloadingStore.updateTaskStatus(MAIN_PROJECT_ASSETS_TASK_ID, 'loaded');
      console.log('All main project card images decoded and ready.');
    } catch (error) {
      console.error(error);
      preloadingStore.updateTaskStatus(MAIN_PROJECT_ASSETS_TASK_ID, 'error', (error as Error).message);
    }
  }


  onMount((): (() => void) | void => {
    preloadMainProjectAssets();

    const setupPromise = async () => {
      await tick();

      sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);
      if (sectionElements.some(el => !el)) {
          console.error("One or more sections not found in DOM!");
          return;
      }

      contactSectionIndex = allSectionsData.findIndex(section => section.id === 'contact');
      if (contactSectionIndex === -1) {
          console.error("Contact section ID ('contact') not found!");
      }

      sectionElements.forEach((sectionEl, index) => {
        const contentTl = gsap.timeline({ paused: true });
        const currentSectionType = allSectionsData[index].type;

        if (currentSectionType === 'project') {
          const headlineEl = sectionEl.querySelector('h2');
          const summaryEl = sectionEl.querySelector('.project-summary');
          const cards = sectionEl.querySelectorAll('.card-wrap');
          const cardTitles = sectionEl.querySelectorAll('.card-title');
          const cardDescriptions = sectionEl.querySelectorAll('.card-description');
          const readMoreBtn = sectionEl.querySelector('.read-more-btn');

          const cardsContainer = sectionEl.querySelector('.project-cards-container');
          if (cardsContainer) {
             contentTl.set(cardsContainer, { autoAlpha: 1 });
          }
          
          if (headlineEl) contentTl.fromTo(headlineEl, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
          if (summaryEl) contentTl.fromTo(summaryEl, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.1");
          
          if (cards.length > 0) {
            // This animation brings the cards themselves into view. It takes about 0.6s + stagger.
            contentTl.fromTo(cards, 
              { y: 30, scale: 0.95, autoAlpha: 0 }, 
              { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
              "start+=0.2"
            );
          }

          // We wait until the cards are mostly animated in before animating their content.
          const textAnimationDelay = "start+=0.8";

          if (cardTitles.length > 0) {
            contentTl.fromTo(cardTitles, 
              { autoAlpha: 0, y: 15 },
              { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power1.out' }, 
              textAnimationDelay 
            );
          }

          if (cardDescriptions.length > 0) {
            contentTl.fromTo(cardDescriptions,
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power1.out' },
              textAnimationDelay + "+=0.1" // Start descriptions just after titles start.
            );
          }
          
          if (readMoreBtn) contentTl.fromTo(readMoreBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, "start+=0.4");
        
        } else if (currentSectionType === 'about') {
          const h2El = sectionEl.querySelector('.about-text-block h2');
          const pEl = sectionEl.querySelector('.about-text-block p');
          const imageEl = sectionEl.querySelector('.about-background-image'); 

          if (h2El) contentTl.fromTo(h2El, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
          if (pEl) contentTl.fromTo(pEl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.15");
          if (imageEl) { 
            contentTl.fromTo(imageEl, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, "start+=0.1");
          }
        
        } else if (currentSectionType === 'contact') {
          const h2El = sectionEl.querySelector('h2');
          const paragraphs = sectionEl.querySelectorAll('p');
          const links = sectionEl.querySelector('.additional-links');
          
          if (h2El) contentTl.fromTo(h2El, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
          paragraphs.forEach((p, i) => {
            contentTl.fromTo(p, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, `start+=${0.1 * (i + 1)}`);
          });
          if (links) contentTl.fromTo(links, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.3");
        }
        sectionContentTimelines[index] = contentTl;

        sectionBackgroundZooms[index] = null;
        if (currentSectionType === 'project') {
          const bgTarget = sectionEl.querySelector('.background-image-container') as HTMLElement;
          if (bgTarget) {
            sectionBackgroundZooms[index] = gsap.to(bgTarget, {
              scale: 1.05,
              duration: projectBgZoomDuration,
              ease: 'power1.out',
              paused: true,
            });
          }
        }

        if (index === 0) {
          gsap.set(sectionEl, { yPercent: 0, autoAlpha: 1 });
        } else {
          gsap.set(sectionEl, { yPercent: 100, autoAlpha: 0 });
        }
      });

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    };
    
    particleEffectReady.subscribe(ready => {
      if (ready && get(initialSiteLoadComplete) && !hasStartedInitialReveal) {
        startInitialReveal();
      }
    });
    
    unsubOverallLoadingState = overallLoadingState.subscribe(status => {
      if (status === 'loaded' && !get(initialSiteLoadComplete)) {
        setTimeout(() => {
          initialSiteLoadComplete.set(true);
          if (get(particleEffectReady) && !hasStartedInitialReveal) {
            startInitialReveal();
          }
        }, 100);
      }
    });
    
    unsubInitialLoadComplete = initialSiteLoadComplete.subscribe(complete => {
      if (complete && get(particleEffectReady) && !hasStartedInitialReveal) {
        startInitialReveal();
      }
    });
    
    setupPromise();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => timeline?.kill());
      sectionBackgroundZooms.forEach(tween => tween?.kill());
      gsap.killTweensOf(sectionElements);
      if (unsubOverallLoadingState) unsubOverallLoadingState();
      if (unsubInitialLoadComplete) unsubInitialLoadComplete();
    };
  });

  function startInitialReveal() { if (hasStartedInitialReveal) return; hasStartedInitialReveal = true; setTimeout(() => { if (heroParticleEffectInstance && get(currentSectionIndex) === HERO_LOGICAL_INDEX) { heroParticleEffectInstance.onTransitionToHeroComplete(); } setTimeout(() => { isInitialReveal.set(false); }, particleFadeInDuration * 1000); }, initialRevealDelay); }
  function navigateToSection(newIndex: number) { if (get(isInitialReveal)) return; const oldIndex = get(currentSectionIndex); if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return; isAnimating.set(true); isTransitioning.set(true); if (heroParticleEffectInstance) { if (newIndex === HERO_LOGICAL_INDEX && oldIndex !== HERO_LOGICAL_INDEX) { heroParticleEffectInstance.onTransitionToHeroStart(); } else if (oldIndex === HERO_LOGICAL_INDEX && newIndex !== HERO_LOGICAL_INDEX) { heroParticleEffectInstance.onTransitionFromHeroStart(); } } const currentSectionEl = sectionElements[oldIndex]; const targetSectionEl = sectionElements[newIndex]; const direction = newIndex > oldIndex ? 1 : -1; sectionContentTimelines[oldIndex]?.progress(0).pause(); sectionBackgroundZooms[oldIndex]?.progress(0).pause(); const masterTransitionTl = gsap.timeline({ onComplete: () => { currentSectionIndex.set(newIndex); isTransitioning.set(false); if (heroParticleEffectInstance && newIndex === HERO_LOGICAL_INDEX) { heroParticleEffectInstance.onTransitionToHeroComplete(); } } }); gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 }); masterTransitionTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); masterTransitionTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide"); if (newIndex !== HERO_LOGICAL_INDEX) { masterTransitionTl.call(() => { sectionContentTimelines[newIndex]?.restart(); }, [], `slide+=${transitionDuration + contentAnimationStartOffset}`); } const targetBgZoom = sectionBackgroundZooms[newIndex]; if (allSectionsData[newIndex].type === 'project' && targetBgZoom) { masterTransitionTl.call(() => { targetBgZoom.restart(); }, [], `slide+=${projectBgZoomStartOffset}`); } gsap.delayedCall(Math.max(transitionDuration, minSectionDisplayDuration), () => { isAnimating.set(false); }); }
  let lastScrollTime = 0;
  const scrollDebounce = 200;
  function handleWheel(event: WheelEvent) { event.preventDefault(); if (get(isInitialReveal)) return; const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce || get(isAnimating)) return; lastScrollTime = currentTime; navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1)); }
  function handleKeyDown(event: KeyboardEvent) { if (get(isInitialReveal) || get(isAnimating)) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } const currentTime = Date.now(); if (currentTime - lastScrollTime < scrollDebounce) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault(); return; } let newIndex = get(currentSectionIndex); let shouldScroll = false; switch (event.key) { case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break; case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break; case 'Home': newIndex = 0; shouldScroll = true; break; case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break; } if (shouldScroll && newIndex !== get(currentSectionIndex)) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); } }
  function getSectionData(id: string) { return allSectionsData.find(s => s.id === id)?.data; }
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
    <div class="about-background-layer">
      {#if siteConfig.aboutSection.imageUrl}
        <img src={siteConfig.aboutSection.imageUrl} alt="Visual backdrop for the About Me section" class="about-background-image" />
      {/if}
    </div>
    <div class="about-content-wrapper">
      <div class="about-text-block">
        <h2>{siteConfig.aboutSection.title}</h2>
        <p>{siteConfig.aboutSection.introduction}</p>
        {#if contactSectionIndex !== -1}
          <KeyboardButtons socialLinks={siteConfig.aboutSection.socialLinks} {contactSectionIndex} {navigateToSection} />
        {/if}
      </div>
    </div>
  </section>

  {#each projects as project (project.id)}
    {@const projectSectionData = getSectionData(`project-${project.id}`) as Project | undefined}
    <section id="project-{project.id}" class="full-screen-section project-section">
      <div class="background-image-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url({projectSectionData?.background.type === 'image' ? projectSectionData.background.value : ''}); background-size: cover; background-position: center; z-index: -1; transform: scale(1);"></div>
      <div class="content-overlay">
        <div class="project-content">
          <h2>{project.headline}</h2>
          <p class="project-summary">{project.summary}</p>
          
          <div class="project-cards-container">
            {#each project.cards as card (card.id)}
              <button type="button" class="card-click-wrapper" on:click={() => handleCardClick(project, card)}>
                <ParallaxCard cardData={card} width="220px" height="290px" />
              </button>
            {/each}
          </div>
          
          {#if project.readMoreLinkText}
            <button class="read-more-btn" on:click={() => goto(`/projects/${project.slug}`)}>
                {project.readMoreLinkText}
            </button>
          {/if}

        </div>
      </div>
    </section>
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
  
  .about-section { padding: 0; text-align: left; background-color: transparent; z-index: 2; position: relative; overflow: hidden; }
  .about-background-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
  .about-background-image { width: 100%; height: 100%; object-fit: cover; object-position: 80% center; opacity: 0; }
  .about-content-wrapper { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; justify-content: flex-start; align-items: center; padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem); padding-right: max(calc(env(safe-area-inset-right, 0px) + 3vw), 2rem); box-sizing: border-box; }
  .about-text-block { max-width: 580px; }
  .about-text-block h2 { font-size: clamp(2.2rem, 4.5vw, 3rem); margin-bottom: 1.5rem; font-weight: 300; letter-spacing: -0.02em; color: rgb(245 245 247); opacity: 0; }
  .about-text-block p { font-size: clamp(1rem, 2.2vw, 1.15rem); line-height: 1.8; margin-bottom: 2.5rem; color: rgb(212 212 216); opacity: 0; }
  
  .project-section { color: rgb(245 245 247); z-index: 2; background-color: transparent; }
  .project-section .content-overlay { background-color: rgba(9 9 11 / 0.85); backdrop-filter: blur(8px); padding: 2rem 3rem; border-radius: 16px; width: 90%; max-width: 1100px; z-index: 1; position: relative; border: 1px solid rgba(255 255 255 / 0.1); }
  .project-section h2 { opacity: 0; font-size: 2.5rem; font-weight: 300; margin-bottom: 1rem; letter-spacing: -0.02em; }
  .project-section p.project-summary { font-size: 1.15rem; color: rgb(212 212 216); line-height: 1.7; margin-bottom: 2rem; max-width: 800px; margin-left: auto; margin-right: auto; opacity: 0; }
  
  .project-cards-container { 
    display: flex; 
    justify-content: center; 
    gap: 1rem; 
    margin-top: 1rem; 
    margin-bottom: 2rem; 
    flex-wrap: wrap; 
    opacity: 0;
    visibility: hidden;
  }
  
  .card-click-wrapper {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card-click-wrapper:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  .card-click-wrapper:focus-visible {
    outline: 2px solid rgb(99 102 241);
    outline-offset: 4px;
  }

  .project-section button.read-more-btn { 
    opacity: 0;
    padding: 0.875rem 2rem; background-color: rgb(99 102 241); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500; transition: all 0.3s ease; margin-top: 1rem;
  }
  .project-section button.read-more-btn:hover { background-color: rgb(79 70 229); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(99 102 241 / 0.4); }

  .contact-section { background-color: rgb(24 24 27); color: rgb(245 245 247); z-index: 2; }
  .content-center { max-width: 800px; margin: 0 auto; padding: 2rem; }
  .contact-section h2 { font-size: 2.5rem; margin-bottom: 2rem; font-weight: 300; letter-spacing: -0.02em; opacity: 0; }
  .contact-section p { font-size: 1.15rem; line-height: 1.8; margin-bottom: 1.5rem; color: rgb(212 212 216); opacity: 0; }
  .contact-section a { color: rgb(99 102 241); text-decoration: none; font-weight: 500; transition: color 0.3s ease; }
  .contact-section a:hover { color: rgb(129 140 248); text-decoration: underline; }
  .additional-links { margin-top: 2rem; display: flex; gap: 2rem; justify-content: center; opacity: 0; }
  
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  
  @media (max-width: 1024px) {
    .project-cards-container {
        gap: 0.5rem;
    }
  }
  @media (max-width: 768px) { 
    .project-cards-container {
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .about-section { padding: 2rem; }
    .about-content-wrapper { justify-content: center; text-align: center; padding: 1rem; }
    .about-text-block { max-width: 100%; }
    .about-text-block h2, .about-text-block p { text-align: center; }
    .about-background-layer { display: none; }
  }
</style>