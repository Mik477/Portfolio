<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { siteConfig } from '$lib/data/siteConfig';
  import { projects, type Project } from '$lib/data/projectsData';
  import HeroParticleEffect from '$lib/components/HeroParticleEffect.svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import { overallLoadingState, initialSiteLoadComplete } from '$lib/stores/preloadingStore';

  import gsap from 'gsap';

  const isAnimating = writable(false);
  const currentSectionIndex = writable(0);
  const isTransitioning = writable(false);

  let sectionElements: HTMLElement[] = [];
  let sectionContentTimelines: (gsap.core.Timeline | null)[] = [];
  let sectionBackgroundZooms: (gsap.core.Tween | null)[] = [];

  const allSectionsData = [
    { id: 'hero', type: 'hero', data: siteConfig.heroSection },
    { id: 'about', type: 'about', data: siteConfig.aboutSection },
    ...projects.map(p => ({ id: `project-${p.id}`, type: 'project', data: p })),
    { id: 'contact', type: 'contact', data: siteConfig.contactSection }
  ];

  const transitionDuration = 1.1;
  const projectBgZoomDuration = 3;
  const minSectionDisplayDuration = 1.2;
  const contentAnimationStartOffset = -0.3;
  const projectBgZoomStartOffset = 0.1;

  let unsubOverallLoadingState: (() => void) | undefined;
  let contactSectionIndex: number = -1;

  onMount((): (() => void) | void => {
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
          if (headlineEl) contentTl.fromTo(headlineEl, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
        
        } else if (currentSectionType === 'about') {
          const h2El = sectionEl.querySelector('.about-text-block h2');
          const pEl = sectionEl.querySelector('.about-text-block p');
          const imageEl = sectionEl.querySelector('.about-background-image'); 
          // KeyboardButtons have their own CSS animation (animation-delay: 0.6s).

          if (h2El) contentTl.fromTo(h2El, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start");
          if (pEl) contentTl.fromTo(pEl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.15");
          if (imageEl) { // Animate the background image itself
            contentTl.fromTo(imageEl, 
              { autoAlpha: 0, scale: 1.1 }, 
              { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 
              "start+=0.1" // Start slightly after text begins for layering effect
            );
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

      if (get(currentSectionIndex) === 0) {
          sectionContentTimelines[0]?.restart();
      }

      if (allSectionsData[0].type === 'project' && sectionBackgroundZooms[0]) {
        isAnimating.set(true);
        const firstBgZoom = sectionBackgroundZooms[0];
        if (firstBgZoom) {
          firstBgZoom.vars.onComplete = () => {
            if (get(currentSectionIndex) === 0) {
                isAnimating.set(false);
            }
          };
          firstBgZoom.restart();
        }
      }

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    };
    
    unsubOverallLoadingState = overallLoadingState.subscribe(status => {
      if (status === 'loaded' && !get(initialSiteLoadComplete)) {
        initialSiteLoadComplete.set(true);
      }
    });
    
    setupPromise();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      sectionContentTimelines.forEach(timeline => timeline?.kill());
      sectionBackgroundZooms.forEach(tween => tween?.kill());
      gsap.killTweensOf(sectionElements);
      if (unsubOverallLoadingState) {
        unsubOverallLoadingState();
      }
    };
  });

  function navigateToSection(newIndex: number) {
    const oldIndex = get(currentSectionIndex);

    if (get(isAnimating) || newIndex === oldIndex || newIndex < 0 || newIndex >= sectionElements.length) {
      return;
    }
    isAnimating.set(true);
    isTransitioning.set(true);

    const currentSectionEl = sectionElements[oldIndex];
    const targetSectionEl = sectionElements[newIndex];
    const direction = newIndex > oldIndex ? 1 : -1;

    sectionContentTimelines[oldIndex]?.progress(0).pause();
    sectionBackgroundZooms[oldIndex]?.progress(0).pause();

    const masterTransitionTl = gsap.timeline({
      onComplete: () => {
        currentSectionIndex.set(newIndex);
        isTransitioning.set(false);
      }
    });

    gsap.set(targetSectionEl, { yPercent: direction * 100, autoAlpha: 1 });

    masterTransitionTl.to(currentSectionEl, {
      yPercent: -direction * 100,
      autoAlpha: 0,
      duration: transitionDuration,
      ease: 'expo.out'
    }, "slide");

    masterTransitionTl.to(targetSectionEl, {
      yPercent: 0,
      duration: transitionDuration,
      ease: 'expo.out'
    }, "slide");

    masterTransitionTl.call(() => {
      sectionContentTimelines[newIndex]?.restart();
    }, [], `slide+=${transitionDuration + contentAnimationStartOffset}`);

    const targetBgZoom = sectionBackgroundZooms[newIndex];
    if (allSectionsData[newIndex].type === 'project' && targetBgZoom) {
      masterTransitionTl.call(() => {
        targetBgZoom.restart();
      }, [], `slide+=${projectBgZoomStartOffset}`);
    }

    const scrollLockReleaseTime = Math.max(transitionDuration, minSectionDisplayDuration);
    gsap.delayedCall(scrollLockReleaseTime, () => {
      isAnimating.set(false);
    });
  }

  let lastScrollTime = 0;
  const scrollDebounce = 200;

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce) return; 
    if (get(isAnimating)) return;
    
    lastScrollTime = currentTime;
    navigateToSection(get(currentSectionIndex) + (event.deltaY > 0 ? 1 : -1));
  }

  function handleKeyDown(event: KeyboardEvent) {
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollDebounce) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) event.preventDefault();
        return;
    }
    if (get(isAnimating)) {
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
        lastScrollTime = currentTime;
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

<LoadingScreen /> 

<div class="particle-effect-layer">
  <HeroParticleEffect 
    activeSectionIndex={$currentSectionIndex} 
    isTransitioning={$isTransitioning}
    transitionDuration={transitionDuration}
  />
</div>

<main class="portfolio-container">
  <section id="hero" class="full-screen-section hero-section">
    <!-- Hero section is empty - only shows particle effect -->
  </section>

  <!-- Section 2: About Me (REFINED STRUCTURE FOR OVERLAP) -->
  <section id="about" class="full-screen-section about-section">
    <!-- Background Layer (for image or future effect) -->
    <div class="about-background-layer">
      {#if siteConfig.aboutSection.imageUrl}
        <img
          src={siteConfig.aboutSection.imageUrl}
          alt="Visual backdrop for the About Me section"
          class="about-background-image"
        />
      {/if}
      <!-- Future: A Svelte component for a particle effect could go here, e.g., <AboutParticleEffect /> -->
    </div>

    <!-- Content Layer -->
    <div class="about-content-wrapper">
      <div class="about-text-block">
        <h2>{siteConfig.aboutSection.title}</h2>
        <p>{siteConfig.aboutSection.introduction}</p>
        {#if contactSectionIndex !== -1}
          <KeyboardButtons
            socialLinks={siteConfig.aboutSection.socialLinks}
            {contactSectionIndex}
            {navigateToSection}
          />
        {:else}
          <!-- Fallback or silent error handled by console.error -->
        {/if}
      </div>
    </div>
  </section>

  <!-- Project Sections (structure remains the same) -->
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

  <!-- Contact Section (structure remains the same) -->
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
  :global(body) {
    background-color: rgb(9 9 11);
    color: rgb(245 245 247);
  }

  .particle-effect-layer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
    background-color: rgb(9 9 11);
  }
  
  .particle-effect-layer :global(.hero-particle-container) {
    pointer-events: auto;
  }

  .portfolio-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    z-index: 1;
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
    box-sizing: border-box;
    background-color: rgb(9 9 11); /* Default, can be overridden */
  }
  
  .hero-section {
    background-color: transparent;
    z-index: 2;
  }
  
  /* --- REFINED ABOUT SECTION STYLING --- */
  .about-section {
    /* display: flex; is inherited */
    /* justify-content: center; & align-items: center; for mobile centering of content-wrapper */
    padding: 0; /* Override .full-screen-section default */
    text-align: left; /* Default for content, can be overridden locally */
    background-color: transparent; /* To see particle layer or page bg if no image/effect */
    z-index: 2;
    position: relative; /* For absolute positioning of its children layers */
    overflow: hidden; /* Ensure no overflow from scaled images etc. */
  }

  .about-background-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0; /* Behind the content layer */
    /* background-color: #050506; /* Optional dark fallback if image is transparent/slow */
    /* pointer-events: none; /* If you want clicks to pass through the entire background layer */
  }

  .about-background-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* This positions the image so its right part is more visible if the image is wider than the screen.
       Adjust 80% (horizontal) and 50% (vertical) as needed.
       'right center' or '100% 50%' would pin it hard to the right.
    */
    object-position: 80% center; 
    opacity: 0; /* GSAP controlled */
    /* filter: grayscale(20%) contrast(1.05) brightness(0.9); Optional subtle image treatment */
  }

  .about-content-wrapper {
    position: relative; /* Stacks above background layer */
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start; /* Aligns .about-text-block to the left on desktop */
    align-items: center; /* Vertically centers .about-text-block */
    padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem); /* Accommodate safe areas + dynamic padding */
    padding-right: max(calc(env(safe-area-inset-right, 0px) + 3vw), 2rem);
    box-sizing: border-box;
  }

  .about-text-block {
    max-width: 580px; /* Adjust as needed for your content */
    /* Optional: For better readability if image is busy and content overlaps a lot */
    /* background: rgba(9, 9, 11, 0.15); */
    /* backdrop-filter: blur(5px); */
    /* padding: 1.5rem; */
    /* border-radius: 8px; */
  }

  .about-text-block h2 {
    font-size: clamp(2.2rem, 4.5vw, 3rem); /* Responsive font size */
    margin-bottom: 1.5rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: rgb(245 245 247);
    opacity: 0; /* GSAP controlled */
  }

  .about-text-block p {
    font-size: clamp(1rem, 2.2vw, 1.15rem); /* Responsive font size */
    line-height: 1.8;
    margin-bottom: 2.5rem; /* Space before KeyboardButtons */
    color: rgb(212 212 216);
    opacity: 0; /* GSAP controlled */
  }
  /* END REFINED ABOUT SECTION STYLING */

  /* Project section styling (existing, ensure no conflicts) */
  .project-section { 
    color: rgb(245 245 247);
    z-index: 2;
    background-color: transparent;
  }
  
  .project-section .content-overlay { 
    background-color: rgba(9 9 11 / 0.85);
    backdrop-filter: blur(8px);
    padding: 3rem; 
    border-radius: 16px; 
    width: 90%; 
    max-width: 1000px; 
    z-index: 1; 
    position: relative;
    border: 1px solid rgba(255 255 255 / 0.1);
  }
  
  .project-section h2 { 
    opacity: 0;
    font-size: 2.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  
  .project-section > .content-overlay > .project-content > p {
    font-size: 1.15rem;
    color: rgb(212 212 216);
    line-height: 1.7;
    margin-bottom: 2rem;
  }
  
  .project-cards-container { 
    display: flex; 
    justify-content: center; 
    gap: 1.5rem; 
    margin-top: 2rem; 
    margin-bottom: 2rem; 
    flex-wrap: wrap; 
  }
  
  .project-card { 
    background-color: rgba(255 255 255 / 0.05);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255 255 255 / 0.1);
    padding: 1.25rem; 
    border-radius: 12px; 
    width: 280px; 
    text-align: left; 
    transition: all 0.3s ease;
  }
  
  .project-card:hover { 
    transform: translateY(-5px);
    background-color: rgba(255 255 255 / 0.08);
    border-color: rgba(255 255 255 / 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  
  .project-card img { 
    width: 100%; 
    height: 160px; 
    object-fit: cover; 
    border-radius: 8px; 
    margin-bottom: 1rem;
  }
  
  .project-card h3 { 
    font-size: 1.3rem; 
    margin-bottom: 0.5rem;
    font-weight: 400;
    color: rgb(245 245 247);
  }
  
  .project-card p { 
    font-size: 0.95rem; 
    color: rgb(163 163 170);
    line-height: 1.6;
  }
  
  .project-section button { 
    padding: 0.875rem 2rem; 
    background-color: rgb(99 102 241);
    color: white; 
    border: none; 
    border-radius: 8px; 
    cursor: pointer; 
    font-size: 1.05rem; 
    font-weight: 500;
    transition: all 0.3s ease;
    margin-top: 1rem;
  }
  
  .project-section button:hover { 
    background-color: rgb(79 70 229);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(99 102 241 / 0.4);
  }

  /* Contact section styling */
  .contact-section { 
    background-color: rgb(24 24 27);
    color: rgb(245 245 247);
    z-index: 2;
  }
  .content-center { /* Used by Contact section */
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  .contact-section h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    opacity: 0; /* GSAP controlled */
  }
  
  .contact-section p {
    font-size: 1.15rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    color: rgb(212 212 216);
    opacity: 0; /* GSAP controlled */
  }
  
  .contact-section a { 
    color: rgb(99 102 241);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  
  .contact-section a:hover {
    color: rgb(129 140 248);
    text-decoration: underline;
  }
  
  .additional-links {
    margin-top: 2rem;
    display: flex;
    gap: 2rem;
    justify-content: center;
    opacity: 0; /* GSAP controlled */
  }
  
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) { /* General mobile breakpoint */
    .project-cards-container {
      flex-direction: column;
      align-items: center;
    }
    .project-card {
      width: 100%;
      max-width: 320px;
    }

    /* ABOUT SECTION - Mobile */
    .about-section {
      /* justify-content and align-items already center children for flex */
      padding: 2rem; /* Add some padding back for mobile */
    }

    .about-content-wrapper {
      justify-content: center; /* Center the .about-text-block */
      text-align: center; /* Center text within .about-text-block */
      padding: 1rem; /* Adjust padding */
    }
    
    .about-text-block {
      max-width: 100%; /* Take full available width */
      /* background: none; backdrop-filter: none; Remove any desktop bg effects */
    }
    .about-text-block h2, .about-text-block p {
      text-align: center; /* Ensure text alignment is center for mobile */
    }
    /* KeyboardButtons are intrinsically responsive and will be centered by .about-text-block or its parent */

    .about-background-layer {
      display: none; /* Hide image background on mobile as per original requirement */
      /* Or, for a different effect:
      opacity: 0.3;
      filter: blur(5px);
      */
    }
  }
</style>