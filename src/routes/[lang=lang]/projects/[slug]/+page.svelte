<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { gsap } from 'gsap';
  import { siteConfig } from '$lib/data/siteConfig';
  import { preloadingStore, startLoadingTask, preloadAssets } from '$lib/stores/preloadingStore';
  import { renderProfile } from '$lib/stores/renderProfile';
  import MobileNavDots from '$lib/components/MobileNavDots.svelte';

  export let data;
  // Make project reactive so when locale switches and data changes, text updates without reload
  let project = data.project;
  $: project = data.project;

  const PROJECT_ASSETS_TASK_ID = `project-assets-${project.slug}`;
  const isContentLoaded = writable(false);

  // Reactive recomputation of subsections when project changes
  let allSubSections: any[] = [];
  let navSections: { id: string; label?: string }[] = [];
  $: {
    if (project) {
      const useMobileBackgrounds = $renderProfile.isMobile && Array.isArray(project.backgroundsMobile) && project.backgroundsMobile.length > 0;
      const overviewSource = useMobileBackgrounds ? project.backgroundsMobile! : project.backgrounds;
      const overviewBackground = overviewSource?.[0] ?? project.backgrounds[0];
      const mappedSubSections = project.subPageSections?.map((section) => ({
        ...section,
        background: ($renderProfile.isMobile && section.backgroundMobile) ? section.backgroundMobile : section.background
      })) ?? [];
      allSubSections = [
        { id: 'overview', title: project.headline, content: project.summary, background: overviewBackground },
        ...mappedSubSections
      ];
      navSections = allSubSections.map((section) => ({ id: section.id, label: section.title }));
    } else {
      allSubSections = [];
      navSections = [];
    }
  }

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  let currentSectionIndex = 0;
  let navActiveIndex = 0;
  let isAnimating = false;
  let lastScrollTime = 0;
  const scrollDebounce = 200;
  const transitionDuration = 1.1;
  let suppressHashUpdate = false; // prevent feedback loop when programmatically updating hash

  // --- Natural Mobile Scroll Navigation with Progressive Drag ---
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;
  let touchIntent: 'vertical' | 'horizontal' | null = null;
  let isDragging = false;
  let currentDragOffset = 0;
  let dragVelocity = 0;
  let lastTouchY = 0;
  let lastTouchTime = 0;

  // Natural scrolling thresholds
  const DRAG_THRESHOLD = 8; // px before starting drag
  const SNAP_THRESHOLD = 0.25; // 25% of screen height to trigger section change
  const VELOCITY_THRESHOLD = 0.15; // px/ms for momentum-based navigation
  const HORIZ_TOLERANCE = 100; // px before canceling vertical gesture
  const RUBBER_BAND_FACTOR = 0.4; // Resistance at boundaries
  const MOMENTUM_MULTIPLIER = 180; // Convert velocity to distance
  const MIN_MOMENTUM_DISTANCE = 30; // Minimum px for momentum navigation
  const MAX_VISUAL_FEEDBACK = 0.20; // Cap visual feedback at 20% of screen (just a nudge)

  onMount(() => {
    const runPreloadAndSetup = async () => {
      startLoadingTask(PROJECT_ASSETS_TASK_ID, 2);
      const assetUrls = new Set<string>();
      const enqueueAsset = (asset: { type: string; value: string } | undefined) => {
        if (asset && asset.type === 'image' && asset.value) {
          assetUrls.add(asset.value);
        }
      };

      project.backgrounds.forEach(enqueueAsset);
      project.backgroundsMobile?.forEach(enqueueAsset);
      project.subPageSections?.forEach((section) => {
        enqueueAsset(section.background);
        enqueueAsset(section.backgroundMobile);
      });

      const resolvedAssets = allSubSections
        .filter(s => s.background && s.background.type === 'image')
        .map(s => s.background.value);
      resolvedAssets.forEach((value) => assetUrls.add(value));

      try {
        await preloadAssets(Array.from(assetUrls));
        preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'loaded');
      } catch (error) {
        console.error(error);
        preloadingStore.updateTaskStatus(PROJECT_ASSETS_TASK_ID, 'error', (error as Error).message);
      } finally {
        isContentLoaded.set(true);
      }
    };
    runPreloadAndSetup();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
      sectionContentTimelines.forEach(t => t?.kill());
      sectionBackgroundZooms.forEach(t => t?.kill());
    };
  });

  $: if ($isContentLoaded) setupAnimations();

  async function setupAnimations() {
    await tick();
    sectionElements = allSubSections.map(section => document.getElementById(section.id) as HTMLElement);
    const urlHash = get(page).url.hash;
    const cleanHash = urlHash.startsWith('#') ? urlHash.substring(1) : null;
    let initialIndex = 0;
    if (cleanHash) {
      const foundIndex = allSubSections.findIndex(s => s.id === cleanHash);
      if (foundIndex !== -1) initialIndex = foundIndex;
    }
    currentSectionIndex = initialIndex;
    navActiveIndex = initialIndex;

    sectionElements.forEach((sectionEl, index) => {
      const contentTl = gsap.timeline({ paused: true });
      const contentOverlay = sectionEl.querySelector('.subpage-content-overlay');
      const h2El = sectionEl.querySelector('h2');
      const pEl = sectionEl.querySelector('p');

      if (contentOverlay) contentTl.fromTo(contentOverlay, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 'start');
      if (h2El) contentTl.fromTo(h2El, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 'start+=0.2');
      if (pEl) contentTl.fromTo(pEl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 'start+=0.35');
      sectionContentTimelines[index] = contentTl;

      const bgTarget = sectionEl.querySelector('.subpage-background-image') as HTMLElement;
      if (bgTarget) sectionBackgroundZooms[index] = gsap.to(bgTarget, { scale: 1.05, duration: 3, ease: 'power1.out', paused: true });
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
    window.addEventListener('hashchange', handleHashChange);
  }

  /**
   * Apply rubber-band effect at boundaries
   */
  function applyRubberBand(offset: number, atBoundary: boolean): number {
    if (!atBoundary) return offset;
    return offset * RUBBER_BAND_FACTOR * (1 - Math.abs(offset) / (window.innerHeight * 2));
  }

  /**
   * Update visual position during drag (progressive feedback)
   */
  function updateDragPosition(offset: number) {
    if (!get(renderProfile).isMobile || sectionElements.length === 0) return;
    
    const currentIdx = currentSectionIndex;
    const currentSection = sectionElements[currentIdx];
    const viewportHeight = window.innerHeight;
    
    // Determine if at boundary
    const atTopBoundary = currentIdx === 0 && offset > 0;
    const atBottomBoundary = currentIdx === sectionElements.length - 1 && offset < 0;
    const atBoundary = atTopBoundary || atBottomBoundary;
    
    // Scale the visual feedback:
    // Dragging 100vh (full screen) should only show MAX_VISUAL_FEEDBACK (20%)
    // This means the feedback is dampened/scaled down
    const scaledOffset = offset * MAX_VISUAL_FEEDBACK;
    
    // Apply rubber-band at boundaries
    const effectiveOffset = applyRubberBand(scaledOffset, atBoundary);
    const progress = effectiveOffset / viewportHeight;
    
    if (currentSection) {
      gsap.set(currentSection, { 
        yPercent: progress * 100,
        force3D: true
      });
    }
    
    // Show subtle preview of next/prev section
    if (!atBoundary) {
      const nextIdx = offset < 0 ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx >= 0 && nextIdx < sectionElements.length) {
        const nextSection = sectionElements[nextIdx];
        const direction = offset < 0 ? 1 : -1;
        gsap.set(nextSection, { 
          yPercent: direction * 100 + progress * 100,
          autoAlpha: 1,
          force3D: true
        });
      }
    }
  }

  /**
   * Reset drag state and snap to nearest section
   */
  function finishDragAndSnap(finalVelocity: number) {
    if (!get(renderProfile).isMobile) return;
    
    isDragging = false;
    const viewportHeight = window.innerHeight;
    const currentIdx = currentSectionIndex;
    const dragPercent = Math.abs(currentDragOffset) / viewportHeight;
    
    // Calculate momentum distance
    const momentumDistance = Math.abs(finalVelocity) * MOMENTUM_MULTIPLIER;
    
    // Determine if should navigate
    let shouldNavigate = false;
    let direction = 0;
    
    // Check velocity-based momentum
    if (momentumDistance > MIN_MOMENTUM_DISTANCE && Math.abs(finalVelocity) > VELOCITY_THRESHOLD) {
      shouldNavigate = true;
      direction = currentDragOffset < 0 ? 1 : -1;
    }
    // Check distance-based threshold
    else if (dragPercent > SNAP_THRESHOLD) {
      shouldNavigate = true;
      direction = currentDragOffset < 0 ? 1 : -1;
    }
    
    // Navigate or snap back
    if (shouldNavigate) {
      const targetIdx = currentIdx + direction;
      if (targetIdx >= 0 && targetIdx < sectionElements.length) {
        // Reset sections to default positions before navigation to avoid conflicts
        sectionElements.forEach((section, idx) => {
          if (idx === currentIdx) {
            gsap.set(section, { yPercent: 0, autoAlpha: 1 });
          } else {
            gsap.set(section, { yPercent: 100, autoAlpha: 0 });
          }
        });
        // Now trigger the normal navigation animation
        navigateToSection(targetIdx);
      } else {
        snapBackToCurrentSection();
      }
    } else {
      snapBackToCurrentSection();
    }
    
    currentDragOffset = 0;
  }

  /**
   * Animate back to current section (cancel gesture)
   */
  function snapBackToCurrentSection() {
    if (sectionElements.length === 0) return;
    
    const currentIdx = currentSectionIndex;
    const currentSection = sectionElements[currentIdx];
    
    gsap.to(currentSection, {
      yPercent: 0,
      duration: 0.4,
      ease: 'power2.out',
      force3D: true
    });
    
    // Hide any visible adjacent sections
    [currentIdx - 1, currentIdx + 1].forEach(idx => {
      if (idx >= 0 && idx < sectionElements.length) {
        const section = sectionElements[idx];
        const direction = idx < currentIdx ? -1 : 1;
        gsap.to(section, {
          yPercent: direction * 100,
          duration: 0.4,
          ease: 'power2.out',
          force3D: true,
          onComplete: () => {
            gsap.set(section, { autoAlpha: 0 });
          }
        });
      }
    });
  }

  function onTouchStart(e: TouchEvent) {
    if (!get(renderProfile).isMobile || !get(isContentLoaded) || isAnimating) return;
    const t = e.changedTouches[0];
    if (!t) return;

    touchStartY = t.clientY;
    touchStartX = t.clientX;
    lastTouchY = t.clientY;
    touchStartTime = performance.now();
    lastTouchTime = touchStartTime;
    touchIntent = null;
    isDragging = false;
    currentDragOffset = 0;
    dragVelocity = 0;
  }

  function onTouchMove(e: TouchEvent) {
    if (!get(renderProfile).isMobile || !get(isContentLoaded) || isAnimating) return;
    const t = e.changedTouches[0];
    if (!t) return;

    const currentY = t.clientY;
    const currentX = t.clientX;
    const currentTime = performance.now();
    const dy = currentY - touchStartY;
    const dx = currentX - touchStartX;
    const absDy = Math.abs(dy);
    const absDx = Math.abs(dx);

    // Calculate instantaneous velocity
    const timeDelta = Math.max(1, currentTime - lastTouchTime);
    const moveDelta = currentY - lastTouchY;
    dragVelocity = moveDelta / timeDelta;
    lastTouchY = currentY;
    lastTouchTime = currentTime;

    // Determine intent if not yet set
    if (!touchIntent && (absDy > DRAG_THRESHOLD || absDx > DRAG_THRESHOLD)) {
      // Check if horizontal gesture
      if (absDx > absDy * 1.5 && absDx > HORIZ_TOLERANCE * 0.5) {
        touchIntent = 'horizontal';
        return;
      }
      // Otherwise, vertical navigation
      else if (absDy > absDx * 0.7) {
        touchIntent = 'vertical';
        isDragging = true;
      }
    }

    // Handle based on intent
    if (touchIntent === 'horizontal') {
      return;
    }

    // Handle vertical dragging with progressive feedback
    if (touchIntent === 'vertical' && isDragging) {
      // Cancel if too much horizontal movement
      if (absDx > HORIZ_TOLERANCE) {
        touchIntent = 'horizontal';
        isDragging = false;
        snapBackToCurrentSection();
        return;
      }

      // Update drag offset and visual feedback
      currentDragOffset = dy;
      updateDragPosition(dy);

      // Prevent pull-to-refresh at top
      const scroller = (document.scrollingElement as HTMLElement | null) ?? document.body;
      const atTop = scroller ? scroller.scrollTop <= 0 : window.scrollY <= 0;
      if (dy > 0 && atTop && absDy > DRAG_THRESHOLD) {
        e.preventDefault();
      }
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (!get(renderProfile).isMobile || !get(isContentLoaded) || isAnimating) return;

    // If was dragging, finish with momentum
    if (isDragging && touchIntent === 'vertical') {
      finishDragAndSnap(dragVelocity);
    }

    // Reset state
    touchIntent = null;
    isDragging = false;
    currentDragOffset = 0;
    dragVelocity = 0;
  }

  function navigateToSection(newIndex: number) {
    const oldIndex = currentSectionIndex;
    if (isAnimating || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) return;
    isAnimating = true;
    navActiveIndex = newIndex;

    const currentSectionEl = sectionElements[oldIndex];
    const targetSectionEl = sectionElements[newIndex];
    const direction = newIndex > oldIndex ? 1 : -1;

    sectionContentTimelines[oldIndex]?.progress(0).pause();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause();
    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 });

    const masterTl = gsap.timeline({ onComplete: () => { 
      isAnimating = false; 
      currentSectionIndex = newIndex; 
      updateHashForSection(newIndex);
    } });
    masterTl.to(currentSectionEl, { yPercent: -direction * 100, autoAlpha: 0, duration: transitionDuration, ease: 'expo.out' }, 'slide');
    masterTl.to(targetSectionEl, { yPercent: 0, duration: transitionDuration, ease: 'expo.out' }, 'slide');
    masterTl.call(() => { sectionContentTimelines[newIndex]?.restart(); }, [], `slide+=${transitionDuration * 0.3}`);
    masterTl.call(() => { sectionBackgroundZooms[newIndex]?.restart(); }, [], `slide+=${transitionDuration * 0.1}`);
  }

  function updateHashForSection(index: number) {
    if (index < 0 || index >= allSubSections.length) return;
    const targetId = allSubSections[index].id;
    const currentHash = get(page).url.hash;
    if (currentHash === `#${targetId}`) return;
    suppressHashUpdate = true;
    history.replaceState(null, '', `#${targetId}`);
    setTimeout(() => (suppressHashUpdate = false), 60);
  }

  function handleHashChange() {
    if (suppressHashUpdate) return; // ignore internal updates
    const urlHash = get(page).url.hash;
    const clean = urlHash.startsWith('#') ? urlHash.substring(1) : '';
    if (!clean) return;
    const idx = allSubSections.findIndex(s => s.id === clean);
    if (idx !== -1 && idx !== currentSectionIndex) {
      navigateToSection(idx);
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce || isAnimating) return;
    lastScrollTime = currentTime;
    navigateToSection(currentSectionIndex + (event.deltaY > 0 ? 1 : -1));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isAnimating) { event.preventDefault(); return; }
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce) { event.preventDefault(); return; }
    let newIndex = currentSectionIndex; let shouldScroll = false;
    switch (event.key) {
      case 'ArrowDown': case 'PageDown': case ' ': newIndex++; shouldScroll = true; break;
      case 'ArrowUp': case 'PageUp': newIndex--; shouldScroll = true; break;
      case 'Home': newIndex = 0; shouldScroll = true; break;
      case 'End': newIndex = allSubSections.length - 1; shouldScroll = true; break;
    }
    if (shouldScroll && newIndex !== currentSectionIndex) { event.preventDefault(); lastScrollTime = currentTime; navigateToSection(newIndex); }
  }
</script>

<svelte:head>
  <title>{project.headline} | {siteConfig.author}</title>
  <meta name="description" content={project.summary} />
</svelte:head>

<div 
  class="subpage-container" 
  class:loaded={$isContentLoaded}
  on:touchstart|passive={onTouchStart}
  on:touchmove={onTouchMove}
  on:touchend|passive={onTouchEnd}
>
  {#each allSubSections as section, i (section.id)}
    <section id={section.id} class="subpage-fullscreen-section">
      {#if section.background}
        <div class="subpage-background-image" style="background-image: url({section.background.value});"></div>
      {/if}
      <div class="subpage-content-overlay">
        <h2>{section.title}</h2>
        <p>{section.content}</p>
      </div>
    </section>
  {/each}
  
</div>

{#if navSections.length > 1}
  <MobileNavDots
    sections={navSections}
    activeIndex={navActiveIndex}
    on:select={({ detail }) => navigateToSection(detail.index)}
  />
{/if}

<style>
  .subpage-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #000; overflow: hidden; opacity: 0; transition: opacity 0.6s ease-in-out; }
  .subpage-container.loaded { opacity: 1; }
  .subpage-fullscreen-section { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; padding: 2rem; box-sizing: border-box; }
  .subpage-background-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: 0; transform: scale(1); }
  .subpage-content-overlay { position: relative; z-index: 1; max-width: 800px; text-align: center; padding: 2rem 3rem; background-color: rgba(9,9,11,0.75); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); opacity: 0; visibility: hidden; }
  .subpage-content-overlay h2 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 700; font-family: 'Playfair Display', serif; margin-bottom: 1.5rem; text-shadow: 0 2px 20px rgba(0,0,0,0.5); opacity: 0; visibility: hidden; }
  .subpage-content-overlay p { font-size: clamp(1rem, 2.5vw, 1.15rem); line-height: 1.8; max-width: 700px; margin: 0 auto; color: #e2e8f0; opacity: 0; visibility: hidden; }
</style>
