<!-- src/routes/projects/[slug]/+page.svelte -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { get, writable } from 'svelte/store'; // MODIFIED: Import writable
  import { page } from '$app/stores';
  import { gsap } from 'gsap';
  import { siteConfig } from '$lib/data/siteConfig';
  // NEW: Import the preloading store and helpers
  import { preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';

  export let data;
  const { project } = data;

  // NEW: Create a unique task ID for this project's assets
  const PROJECT_ASSETS_TASK_ID = `project-assets-${project.slug}`;

  // NEW: A writable store to track when content for this specific page is ready.
  const isContentLoaded = writable(false);

  const allSubSections = [
    { 
      id: 'overview', 
      title: project.headline,
      content: project.summary,
      background: project.background
    },
    ...project.subPageSections
  ];

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  let currentSectionIndex = 0;
  let isAnimating = false;
  let lastScrollTime = 0;
  const scrollDebounce = 200;
  const transitionDuration = 1.1;

  // NEW: A helper function to preload an array of images.
  async function preloadProjectImages(imageUrls: string[]): Promise<void> {
    // Register the task with the global preloading store
    startLoadingTask(PROJECT_ASSETS_TASK_ID, 2); // Give it a higher priority

    const imagePromises = imageUrls.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    });

    try {
      await Promise.all(imagePromises);
      // Once all images are loaded, update the task status to 'loaded'
      preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'loaded');
      console.log(`All assets for project '${project.slug}' preloaded successfully.`);
    } catch (error) {
      console.error(error);
      preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'error', (error as Error).message);
    }
  }

  onMount(() => {
    // NEW: Trigger the asset preloading process as soon as the component mounts.
    const assetUrls = allSubSections
      .filter(s => s.background.type === 'image')
      .map(s => s.background.value);
      
    preloadProjectImages(assetUrls).then(() => {
      // Once preloading is complete (success or fail), mark content as ready to be shown.
      isContentLoaded.set(true);
    });

    return () => {
      // Cleanup logic remains the same
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => { timeline?.kill(); });
      sectionBackgroundZooms.forEach(tween => { tween?.kill(); });
    };
  });

  // NEW: We wrap the entire animation setup in a reactive block.
  // This ensures it only runs *after* `isContentLoaded` becomes true.
  $: if ($isContentLoaded) {
    setupAnimations();
  }

  async function setupAnimations() {
      await tick();

      sectionElements = allSubSections.map(section => document.getElementById(section.id) as HTMLElement);
      
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

      sectionElements.forEach((sectionEl, index) => {
        // MODIFIED: Enhanced animation timeline for a smoother reveal.
        const contentTl = gsap.timeline({ paused: true });
        const contentOverlay = sectionEl.querySelector('.subpage-content-overlay');
        const h2El = sectionEl.querySelector('h2');
        const pEl = sectionEl.querySelector('p');

        if (contentOverlay) {
          // 1. Animate the container card first
          contentTl.fromTo(contentOverlay, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, "start");
        }
        if (h2El) {
          // 2. Fade in the heading shortly after
          contentTl.fromTo(h2El, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start+=0.2");
        }
        if (pEl) {
          // 3. Fade in the paragraph last
          contentTl.fromTo(pEl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.35");
        }
        sectionContentTimelines[index] = contentTl;
        
        const bgTarget = sectionEl.querySelector('.subpage-background-image') as HTMLElement;
        if (bgTarget) {
          sectionBackgroundZooms[index] = gsap.to(bgTarget, { scale: 1.05, duration: 3, ease: 'power1.out', paused: true });
        }
      });

      sectionElements.forEach((el, index) => {
        if (index === initialIndex) {
          gsap.set(el, { yPercent: 0, autoAlpha: 1 });
          sectionContentTimelines[index]?.restart();
          sectionBackgroundZooms[index]?.restart();
        } else {
          gsap.set(el, { yPercent: 100, autoAlpha: 0 });
        }
      });

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
    if (isAnimating) return;
    let newIndex = currentSectionIndex;
    if (event.key === 'ArrowDown' || event.key === ' ') newIndex++;
    if (event.key === 'ArrowUp') newIndex--;
    navigateToSection(newIndex);
  }

</script>

<svelte:head>
  <title>{project.headline} | {siteConfig.author}</title>
  <meta name="description" content={project.summary} />
</svelte:head>

<!-- MODIFIED: Add a class binding to fade the container in when content is ready -->
<div class="subpage-container" class:loaded={$isContentLoaded}>
  {#each allSubSections as section, i (section.id)}
    <section id={section.id} class="subpage-fullscreen-section">
      <div 
        class="subpage-background-image"
        style="background-image: url({section.background.value});"
      ></div>
      
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
    /* NEW: Start transparent and fade in */
    opacity: 0;
    transition: opacity 0.6s ease-in-out;
  }
  
  /* NEW: Fade in the container when the `loaded` class is applied */
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
    padding: 2rem;
    background-color: rgba(9, 9, 11, 0.75);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    /* NEW: Start with opacity 0, GSAP will control it */
    opacity: 0;
  }

  .subpage-content-overlay h2 {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    margin-bottom: 1.5rem;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
    /* NEW: Start with opacity 0, GSAP will control it */
    opacity: 0;
  }

  .subpage-content-overlay p {
    font-size: clamp(1rem, 2.5vw, 1.15rem);
    line-height: 1.8;
    max-width: 700px;
    margin: 0 auto;
    color: #e2e8f0;
    /* NEW: Start with opacity 0, GSAP will control it */
    opacity: 0;
  }
</style>