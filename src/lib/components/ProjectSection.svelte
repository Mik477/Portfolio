<!-- src/lib/components/ProjectSection.svelte -->
<script context="module" lang="ts">
  export type ProjectSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gsap } from 'gsap';
  import type { Project, ProjectCard } from '$lib/data/projectsData';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  
  export let project: Project;

  let sectionEl: HTMLElement;
  let headlineEl: HTMLHeadingElement;
  let summaryEl: HTMLParagraphElement;
  let readMoreBtn: HTMLButtonElement | null = null;
  
  // --- FIXED: We will now target the .card-wrap elements directly for animation ---
  let cardWrapsToAnimate: HTMLElement[] = [];
  
  onMount(() => {
    // Find the .card-wrap elements which are the visual root of the ParallaxCard component.
    cardWrapsToAnimate = Array.from(sectionEl.querySelectorAll('.card-wrap'));
  });
  
  export function onEnterSection() {
    if (!headlineEl || !summaryEl || !cardWrapsToAnimate) return;

    // Set initial state for text elements
    gsap.set(headlineEl, { autoAlpha: 0, y: 50 });
    gsap.set(summaryEl, { autoAlpha: 0, y: 40 });
    if(readMoreBtn) gsap.set(readMoreBtn, { autoAlpha: 0 });

    // The cards (.card-wrap) are already at autoAlpha: 0 due to our pre-renderer.
    // We just need to set their starting scale for the animation.
    gsap.set(cardWrapsToAnimate, { scale: 0.97 });


    const tl = gsap.timeline();
    tl.to(headlineEl, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start")
      .to(summaryEl, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.1");
      
    if (cardWrapsToAnimate.length > 0) {
        // --- FIXED: Animate the .card-wrap elements directly ---
        tl.to(cardWrapsToAnimate, { 
            autoAlpha: 1, // This is the crucial change that makes them visible
            scale: 1, 
            duration: 2.8, 
            stagger: 0.15, 
            ease: 'expo.out' 
        }, "start+=0.2");
    }

    if (readMoreBtn) {
      tl.to(readMoreBtn, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, "start+=0.4");
    }
  }

  export function onLeaveSection() {
    if (!headlineEl || !summaryEl || !cardWrapsToAnimate) return;
    
    // --- FIXED: Ensure we are targeting the correct elements for cleanup ---
    const allElements = [headlineEl, summaryEl, ...cardWrapsToAnimate];
    if (readMoreBtn) allElements.push(readMoreBtn);
    
    gsap.killTweensOf(allElements);
    gsap.set(allElements, { autoAlpha: 0 });
  }
  
  function handleCardClick(card: ProjectCard) {
    const aspectLink = card.aspectLink || '';
    goto(`/projects/${project.slug}${aspectLink}`);
  }
</script>

<div class="project-section-wrapper" bind:this={sectionEl}>
  <div class="background-image-container" style="background-image: url({project.background.value});"></div>
  <div class="content-overlay">
    <div class="project-content">
      <h2 bind:this={headlineEl}>{project.headline}</h2>
      <p class="project-summary" bind:this={summaryEl}>{project.summary}</p>
      
      <div class="project-cards-container">
        {#each project.cards as card (card.id)}
          <!-- The wrapper is now just a layout element, not an animation target -->
          <button type="button" class="card-click-wrapper" on:click={() => handleCardClick(card)}>
            <ParallaxCard cardData={card} width="220px" height="290px" />
          </button>
        {/each}
      </div>
      
      {#if project.readMoreLinkText}
        <button class="read-more-btn" on:click={() => goto(`/projects/${project.slug}`)} bind:this={readMoreBtn}>
            {project.readMoreLinkText}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
    .project-section-wrapper { 
        width: 100%; 
        height: 100%; 
        color: rgb(245 245 247); 
        z-index: 2; 
        background-color: transparent; 
        display: flex; 
        flex-direction: column; 
        justify-content: center; 
        align-items: center; 
    }
    .background-image-container { 
        position: absolute; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background-size: cover; 
        background-position: center; 
        z-index: -1; 
        transform: scale(1); 
    }
    .content-overlay { 
        background-color: rgba(9 9 11 / 0.85); 
        backdrop-filter: blur(8px); 
        padding: 2rem 3rem; 
        border-radius: 16px; 
        width: 90%; 
        max-width: 1100px; 
        z-index: 1; 
        position: relative; 
        border: 1px solid rgba(255 255 255 / 0.1); 
    }
    .project-content { 
        text-align: center; 
    }
    h2 { 
        opacity: 0; 
        font-size: 2.5rem; 
        font-weight: 300; 
        margin-bottom: 1rem; 
        letter-spacing: -0.02em; 
    }
    p.project-summary { 
        font-size: 1.15rem; 
        color: rgb(212 212 216); 
        line-height: 1.7; 
        margin-bottom: 2rem; 
        max-width: 800px; 
        margin-left: auto; 
        margin-right: auto; 
        opacity: 0; 
    }
    .project-cards-container { 
        display: flex; 
        justify-content: center; 
        gap: 1rem; 
        margin-top: 1rem; 
        margin-bottom: 2rem; 
        flex-wrap: wrap; 
    }
    /* --- FIXED: The wrapper no longer needs to be hidden by default --- */
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
    button.read-more-btn { 
        opacity: 0; 
        padding: 0.875rem 2rem; 
        background-color: rgb(99 102 241); 
        color: white; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 1rem; 
        font-weight: 500; 
        transition: all 0.3s ease; 
        margin-top: 1rem; 
    }
    button.read-more-btn:hover { 
        background-color: rgb(79 70 229); 
        transform: translateY(-2px); 
        box-shadow: 0 4px 20px rgba(99 102 241 / 0.4); 
    }
</style>