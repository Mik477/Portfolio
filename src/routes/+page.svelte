<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project } from '$lib/data/projectsData';

  import gsap from 'gsap';

  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  const allSectionsData = [
    { id: 'hero', type: 'hero', data: siteConfig.heroSection },
    { id: 'about', type: 'about', data: siteConfig.aboutSection },
    ...projects.map(p => ({ id: `project-${p.id}`, type: 'project', data: p })),
    { id: 'contact', type: 'contact', data: siteConfig.contactSection }
  ];

  // --- TIMING CONFIGURATION ---
  const transitionDuration = 1.1; // Duration of the main slide transition
  const projectBgZoomDuration = 3;  // Duration of the project background image zoom
  const minSectionDisplayDuration = 1.2; // Minimum time a section is displayed before user can scroll again
                                         // This is the total time from scroll *initiation* to scroll *enablement*
                                         // Must be >= transitionDuration for a good UX.
  const contentAnimationStartOffset = -0.3; // Start content animation 0.3s before slide ends (transitionDuration + this value)
  const projectBgZoomStartOffset = 0.1; // Start project background zoom 0.1s after slide animation begins

  onMount((): (() => void) | void => {
    const setupPromise = async () => {
      await tick();

      sectionElements = allSectionsData.map(section => document.getElementById(section.id) as HTMLElement);
      if (sectionElements.some(el => !el)) {
          console.error("One or more sections not found in DOM!");
          return;
      }

      sectionElements.forEach((sectionEl, index) => {
        const contentTl = gsap.timeline({ paused: true });
        if (allSectionsData[index].type === 'project') {
          const headlineEl = sectionEl.querySelector('h2');
          if (headlineEl) contentTl.fromTo(headlineEl, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
        } else if (allSectionsData[index].type === 'hero') {
          const h1El = sectionEl.querySelector('h1');
          const pEl = sectionEl.querySelector('p');
          if (h1El) contentTl.fromTo(h1El, { autoAlpha: 0, y:30 }, {autoAlpha:1, y:0, duration:0.7, ease:'power2.out'}, "start");
          if (pEl) contentTl.fromTo(pEl, { autoAlpha: 0, y:30 }, {autoAlpha:1, y:0, duration:0.7, ease:'power2.out'}, "start+=0.2");
        }
        sectionContentTimelines[index] = contentTl;

        sectionBackgroundZooms[index] = null;
        if (allSectionsData[index].type === 'project') {
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

      // Initial state for the first section
      sectionContentTimelines[0]?.restart();

      if (allSectionsData[0].type === 'project' && sectionBackgroundZooms[0]) {
        isAnimating.set(true); // Initial lock if first section is a project with zoom
        const firstBgZoom = sectionBackgroundZooms[0];
        if (firstBgZoom) {
          firstBgZoom.vars.onComplete = () => {
            if (get(currentSectionIndex) === 0) { // Ensure we are still on the first section
                isAnimating.set(false);
                console.log("Initial project background zoom complete, scroll lock released.");
            }
          };
          firstBgZoom.restart();
        }
      } else {
        console.log("First section not a project with zoom, or no zoom. Scroll lock not engaged by initial BG zoom.");
      }

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    };
    setupPromise();
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => timeline?.kill());
      sectionBackgroundZooms.forEach(tween => tween?.kill());
      gsap.killTweensOf(sectionElements);
    };
  });

  function navigateToSection(newIndex: number) {
    const oldIndex = get(currentSectionIndex);

    if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) {
      return;
    }
    isAnimating.set(true); // Master lock engaged

    console.log(`Navigating from ${oldIndex} to ${newIndex}`);

    const currentSectionEl = sectionElements[oldIndex];
    const targetSectionEl = sectionElements[newIndex];
    const direction = newIndex > oldIndex ? 1 : -1;

    // Reset animations for the outgoing section
    sectionContentTimelines[oldIndex]?.progress(0).pause();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause(); // Pause and reset old background zoom

    const masterTransitionTl = gsap.timeline({
      onComplete: () => {
        currentSectionIndex.set(newIndex);
        // isAnimating.set(false) is now handled by a separate delayedCall below
      }
    });

    // Prepare target section (set initial position and make it visible for the transition)
    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 });

    // Slide transitions
    masterTransitionTl.to(currentSectionEl, {
      yPercent: -direction * 100,
      autoAlpha: 0,
      duration: transitionDuration,
      ease: 'expo.out'
    }, "slide");

    masterTransitionTl.to(targetSectionEl, {
      yPercent: 0,
      // autoAlpha: 1, // autoAlpha is already set by gsap.set() above
      duration: transitionDuration,
      ease: 'expo.out'
    }, "slide");

    // Content animations for the target section
    masterTransitionTl.call(() => {
      sectionContentTimelines[newIndex]?.restart();
    }, [], `slide+=${transitionDuration + contentAnimationStartOffset}`); // e.g., slide+=0.8 if offset is -0.3

    // Background zoom for the target project section
    const targetBgZoom = sectionBackgroundZooms[newIndex];
    if (allSectionsData[newIndex].type === 'project' && targetBgZoom) {
      targetBgZoom.vars.onStart = () => console.log(`Project BG Zoom started for section ${newIndex}. Duration: ${projectBgZoomDuration}s`);
      targetBgZoom.vars.onComplete = () => console.log(`Project BG Zoom complete for section ${newIndex}.`);
      // Start background zoom slightly after the slide animation begins
      masterTransitionTl.call(() => {
        targetBgZoom.restart();
      }, [], `slide+=${projectBgZoomStartOffset}`);
    }

    // Master lock release: based on the slide transition or minSectionDisplayDuration, whichever is longer.
    // Background zoom duration no longer dictates this lock.
    const scrollLockReleaseTime = Math.max(transitionDuration, minSectionDisplayDuration);
    gsap.delayedCall(scrollLockReleaseTime, () => {
      isAnimating.set(false);
      console.log(`Master scroll lock released. Section: ${newIndex}. Lock duration: ${scrollLockReleaseTime}s`);
    });
  }

  let lastScrollTime = 0;
  const scrollDebounce = 200; // Debounce for rapid scroll/key events

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const currentTime = Date.now();
    // Debounce to prevent multiple triggers from a single scroll action
    if (currentTime - lastScrollTime < scrollDebounce) return; 
    
    if (get(isAnimating)) return; // Check master lock *after* debounce check
    
    lastScrollTime = currentTime;
    navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1));
  }

  function handleKeyDown(event: KeyboardEvent) {
    const currentTime = Date.now();
    // Debounce for keydown
    if (currentTime - lastScrollTime < scrollDebounce) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault();
        return;
    }

    if (get(isAnimating)) { // Check master lock *after* debounce check
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault();
      return;
    }
    
    let newIndex = get(currentSectionIndex);
    let shouldScroll = false;
    switch (event.key) {
        case 'ArrowDown': case 'PageDown': case ' ':
            newIndex = get(currentSectionIndex) + 1; shouldScroll = true; break;
        case 'ArrowUp': case 'PageUp':
            newIndex = get(currentSectionIndex) - 1; shouldScroll = true; break;
        case 'Home': newIndex = 0; shouldScroll = true; break;
        case 'End': newIndex = sectionElements.length - 1; shouldScroll = true; break;
    }

    if (shouldScroll && newIndex !== get(currentSectionIndex)) {
        event.preventDefault();
        lastScrollTime = currentTime; // Update lastScrollTime only when a scroll is initiated
        navigateToSection(newIndex);
    }
  }

  function getSectionData(id: string) {
    return allSectionsData.find(s => s.id === id)?.data;
  }
</script>

<svelte:head>
  <title>{siteConfig.title}</title>
  <meta name="description" content={siteConfig.description} />
</svelte:head>

<main class="portfolio-container">
  <!-- Section 1: Hero / Greeting -->
  <section id="hero" class="full-screen-section hero-section">
    <div class="content-center">
      <h1>{siteConfig.heroSection.greeting} <span class="highlight">{siteConfig.heroSection.name}</span></h1>
      <p>{siteConfig.heroSection.introduction}</p>
    </div>
  </section>

  <!-- Section 2: About Me -->
  <section id="about" class="full-screen-section about-section">
    <div class="content-center">
      <h2>{siteConfig.aboutSection.title}</h2>
      {#each siteConfig.aboutSection.introduction as paragraph}
        <p>{paragraph}</p>
      {/each}
      {#if siteConfig.aboutSection.imageUrl}
        <img src={siteConfig.aboutSection.imageUrl} alt="A photo of {siteConfig.author}" class="profile-image"/>
      {/if}
      <div class="social-links">
        {#each siteConfig.aboutSection.socialLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Project Sections -->
  {#each projects as project (project.id)}
    {@const projectSectionData = getSectionData(`project-${project.id}`) as Project | undefined}
    <section id="project-{project.id}" class="full-screen-section project-section">
      <div class="background-image-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url({projectSectionData?.background.type === 'image' ? projectSectionData.background.value : ''}); background-size: cover; background-position: center; z-index: -1; transform: scale(1);"></div>
      <div class="content-overlay">
        <div class="project-content">
          <h2>{project.headline}</h2>
          <p>{project.summary}</p>
          <div class="project-cards-container">
            {#each project.cards as card (card.id)}
              <div class="project-card">
                <img src={card.image} alt={card.title} />
                <h3>{card.title}</h3>
                <p>{card.description || ''}</p>
              </div>
            {/each}
          </div>
          {#if project.readMoreLinkText}
            <button on:click={() => console.log('Navigate to project:', project.slug)}>
                {project.readMoreLinkText}
            </button>
          {/if}
        </div>
      </div>
    </section>
  {/each}

  <!-- End Section: Contact -->
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
  .portfolio-container {
    position: relative;
    width: 100%;
    height: 100vh; /* Use vh for viewport height */
    overflow: hidden;
  }

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
    text-align: center;
    padding: 2rem;
    box-sizing: border-box; /* Padding is included within width/height */
    /* background-color: transparent; */ /* Base background, can be overridden */
  }

  .background-image-container {
    min-width: 100%;
    min-height: 100%;
  }

  /* Hero section styling */
  .hero-section { background-color: #2c3e50; color: white; }
  .hero-section .highlight { color: #1abc9c; }
  .hero-section h1, .hero-section p { opacity: 0; /* GSAP controlled */ }

  /* About section styling */
  .about-section { background-color: #ecf0f1; color: #333; }
  .profile-image { max-width: 200px; height: auto; border-radius: 50%; margin: 1rem 0; border: 5px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
  .social-links a { margin: 0 0.5rem; text-decoration: none; color: #3498db; }
  .social-links a:hover { text-decoration: underline; }

  /* Project section styling */
  .project-section { color: white; }
  .project-section .content-overlay { background-color: rgba(0, 0, 0, 0.6); padding: 2rem; border-radius: 8px; width: 90%; max-width: 1000px; z-index: 1; position: relative; }
  .project-section h2 { opacity: 0; /* GSAP controlled */ }
  .project-cards-container { display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .project-card { background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem; border-radius: 8px; width: 250px; text-align: left; transition: transform 0.3s ease; }
  .project-card:hover { transform: translateY(-5px); }
  .project-card img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem; }
  .project-card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
  .project-card p { font-size: 0.9rem; color: #eee; }
  .project-section button { padding: 0.75rem 1.5rem; background-color: #1abc9c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.3s ease; }
  .project-section button:hover { background-color: #16a085; }

  /* Contact section styling */
  .contact-section { background-color: #34495e; color: white; }
  .contact-section a { color: #1abc9c; }
</style>