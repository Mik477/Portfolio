<!-- src/routes/projects/[slug]/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { gsap } from 'gsap';
  import { siteConfig } from '$lib/data/siteConfig';
  import { preloadingStore, startLoadingTask, preloadAssets } from '$lib/stores/preloadingStore';

  export let data;
  const { project } = data;

  // A unique task ID for this specific project's assets.
  const PROJECT_ASSETS_TASK_ID = `project-assets-${project.slug}`;

  // A local store to track when this page's content is ready to be shown.
  const isContentLoaded = writable(false);

  // Combine the project overview and detailed sections into one scrollable list.
  const allSubSections = [
    { 
      id: 'overview', 
      title: project.headline,
      content: project.summary,
      background: project.backgrounds[0]
    },
    ...project.subPageSections
  ];

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  // State for the subpage's internal scrolling logic.
  let currentSectionIndex = 0;
  let isAnimating = false;
  let lastScrollTime = 0;
  const scrollDebounce = 200;
  const transitionDuration = 1.1;

  onMount(() => {
    // This function runs once when the component is created.
    const runPreloadAndSetup = async () => {
      // 1. Register a task with the global preloading store.
      startLoadingTask(PROJECT_ASSETS_TASK_ID, 2);

      // 2. Gather all image URLs needed for this subpage.
      const assetUrls = allSubSections
        .filter(s => s.background && s.background.type === 'image')
        .map(s => s.background.value);
      
      try {
        // 3. Use the global preloader to fetch assets. This is cache-aware.
        await preloadAssets(assetUrls);
        preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'loaded');
        console.log(`All assets for project '${project.slug}' preloaded successfully.`);
      } catch (error) {
        console.error(error);
        preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'error', (error as Error).message);
      } finally {
        // 4. Mark content as ready to be shown, which will trigger the animation setup.
        isContentLoaded.set(true);
      }
    };
    
    runPreloadAndSetup();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => { timeline?.kill(); });
      sectionBackgroundZooms.forEach(tween => { tween?.kill(); });
    };
  });

  // This reactive block runs automatically when `isContentLoaded` becomes true.
  $: if ($isContentLoaded) {
    setupAnimations();
  }

  async function setupAnimations() {
      await tick();

      sectionElements = allSubSections.map(section => document.getElementById(section.id) as HTMLElement);
      
      // Check the URL hash to determine the starting section.
      const urlHash = get(page).url.hash;
      const cleanHash = urlHash.startsWith('#') ? urlHash.substring(1) : null;
      
      let initialIndex = 0;
      if (cleanHash) {
        const foundIndex = allSubSections.findIndex(s => s.id === cleanHash);
        if (foundIndex !== -1) {
          initialIndex = foundIndex;
        }
      }
      currentSectionIndex = initialIndex;

      // Create animations for each section but keep them paused.
      sectionElements.forEach((sectionEl, index) => {
        const contentTl = gsap.timeline({ paused: true });
        const contentOverlay = sectionEl.querySelector('.subpage-content-overlay');
        const h2El = sectionEl.querySelector('h2');
        const pEl = sectionEl.querySelector('p');

        if (contentOverlay) {
          contentTl.fromTo(contentOverlay, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, "start");
        }
        if (h2El) {
          contentTl.fromTo(h2El, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start+=0.2");
        }
        if (pEl) {
          contentTl.fromTo(pEl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.35");
        }
        sectionContentTimelines[index] = contentTl;
        
        const bgTarget = sectionEl.querySelector('.subpage-background-image') as HTMLElement;
        if (bgTarget) {
          sectionBackgroundZooms[index] = gsap.to(bgTarget, { scale: 1.05, duration: 3, ease: 'power1.out', paused: true });
        }
      });

      // Set initial visibility and positions.
      sectionElements.forEach((el, index) => {
        if (index === initialIndex) {
          gsap.set(el, { yPercent: 0, autoAlpha: 1 });
          sectionContentTimelines[index]?.restart();
          sectionBackgroundZooms[index]?.restart();
        } else {
          gsap.set(el, { yPercent: 100, autoAlpha: 0 });
        }
      });

      // Add event listeners for navigation.
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
  }

  function navigateToSection(newIndex: number) {
    const oldIndex = currentSectionIndex;
    if (isAnimating || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return;
    
    isAnimating = true;

    const currentSectionEl = sectionElements[oldIndex];
    const targetSectionEl = sectionElements[newIndex];
    const direction = newIndex > oldIndex ? 1 : -1;

    // Reset and pause animations for the outgoing section.
    sectionContentTimelines[oldIndex]?.progress(0).pause();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause();

    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 });

    const masterTl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
        currentSectionIndex = newIndex;
      }
    });

    masterTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, "slide");
    masterTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, "slide");
    
    // Play animations for the incoming section partway through the transition.
    masterTl.call(() => { sectionContentTimelines[newIndex]?.restart(); }, [], `slide+=${transitionDuration * 0.3}`);
    masterTl.call(() => { sectionBackgroundZooms[newIndex]?.restart(); }, [], `slide+=${transitionDuration * 0.1}`);
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce || isAnimating) return;
    lastScrollTime = currentTime;
    navigateToSection(currentSectionIndex + (event.deltaY > 0 ? 1 : -1));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isAnimating) {
        event.preventDefault();
        return;
    }
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce) {
        event.preventDefault();
        return;
    }
    let newIndex = currentSectionIndex;
    let shouldScroll = false;
    switch (event.key) {
        case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break;
        case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break;
        case 'Home': newIndex = 0; shouldScroll = true; break;
        case 'End': newIndex = allSubSections.length - 1; shouldScroll = true; break;
    }
    if (shouldScroll && newIndex !== currentSectionIndex) {
        event.preventDefault();
        lastScrollTime = currentTime;
        navigateToSection(newIndex);
    }
  }
</script>

<svelte:head>
  <title>{project.headline} | {siteConfig.author}</title>
  <meta name="description" content={project.summary} />
</svelte:head>

<div class="subpage-container" class:loaded={$isContentLoaded}>
  {#each allSubSections as section, i (section.id)}
    <section id={section.id} class="subpage-fullscreen-section">
      <!-- --- START OF FIX --- -->
      <!-- Add a conditional wrapper to prevent rendering this div if a section has no background. -->
      <!-- This makes the component robust and prevents the SSR crash. -->
      {#if section.background}
        <div 
          class="subpage-background-image"
          style="background-image: url({section.background.value});"
        ></div>
      {/if}
      <!-- --- END OF FIX --- -->
      
      <div class="subpage-content-overlay">
        <h2>{section.title}</h2>
        <p>{section.content}</p>
      </div>
    </section>
  {/each}
</div>

<style>
  .subpage-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.6s ease-in-out;
  }
  
  .subpage-container.loaded {
    opacity: 1;
  }

  .subpage-fullscreen-section {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    padding: 2rem;
    box-sizing: border-box;
  }

  .subpage-background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    transform: scale(1);
  }

  .subpage-content-overlay {
    position: relative;
    z-index: 1;
    max-width: 800px;
    text-align: center;
    padding: 2rem 3rem;
    background-color: rgba(9, 9, 11, 0.75);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0;
    visibility: hidden; /* Start hidden for GSAP */
  }

  .subpage-content-overlay h2 {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    margin-bottom: 1.5rem;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
    opacity: 0;
    visibility: hidden;
  }

  .subpage-content-overlay p {
    font-size: clamp(1rem, 2.5vw, 1.15rem);
    line-height: 1.8;
    max-width: 700px;
    margin: 0 auto;
    color: #e2e8f0;
    opacity: 0;
    visibility: hidden;
  }
</style>