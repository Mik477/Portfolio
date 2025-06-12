<!-- src/routes/projects/[slug]/+page.svelte -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store'; // Import get for one-time store access
  import { page } from '$app/stores'; // FIX: Import the page store
  import { gsap } from 'gsap';
  import { siteConfig } from '$lib/data/siteConfig';

  export let data;
  // FIX: The `hash` is no longer in `data`. We will get it from the `$page` store.
  const { project } = data;

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

  onMount(() => {
    const init = async () => {
      await tick();

      sectionElements = allSubSections.map(section => document.getElementById(section.id) as HTMLElement);
      
      // FIX: Read the hash from the `$page` store on the client side.
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
        const contentTl = gsap.timeline({ paused: true });
        const h2El = sectionEl.querySelector('h2');
        const pEl = sectionEl.querySelector('p');
        if (h2El) contentTl.fromTo(h2El, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
        if (pEl) contentTl.fromTo(pEl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.15");
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
    };

    init();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => { timeline?.kill(); });
      sectionBackgroundZooms.forEach(tween => { tween?.kill(); });
    };
  });

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

<div class="subpage-container">
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
  /* Styles remain the same */
  .subpage-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000;
    overflow: hidden;
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
    transform: scale(1); /* Initial scale for zoom animation */
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
  }

  .subpage-content-overlay h2 {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    margin-bottom: 1.5rem;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
    opacity: 0; /* Animated by GSAP */
  }

  .subpage-content-overlay p {
    font-size: clamp(1rem, 2.5vw, 1.15rem);
    line-height: 1.8;
    max-width: 700px;
    margin: 0 auto;
    color: #e2e8f0;
    opacity: 0; /* Animated by GSAP */
  }
</style>