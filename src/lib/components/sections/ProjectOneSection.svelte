<!-- src/lib/components/sections/ProjectOneSection.svelte -->
<script context="module" lang="ts">
  export type ProjectOneSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';
  import type { Project, ProjectCard } from '$lib/data/projectsData';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  // --- MODIFICATION: Import the new transition store ---
  import { transitionStore } from '$lib/stores/transitionStore';
  
  const dispatch = createEventDispatcher();

  export let project: Project;

  let sectionEl: HTMLElement;
  let headlineEl: HTMLHeadingElement;
  let summaryEl: HTMLParagraphElement;
  let readMoreBtn: HTMLButtonElement | null = null;
  let cardWrapsToAnimate: HTMLElement[] = [];
  
  onMount(() => {
    cardWrapsToAnimate = Array.from(sectionEl.querySelectorAll('.card-wrap'));
  });
  
  export function onEnterSection() {
    if (!headlineEl || !summaryEl || cardWrapsToAnimate.length === 0) return;

    gsap.set(headlineEl, { autoAlpha: 0, y: 50 });
    gsap.set(summaryEl, { autoAlpha: 0, y: 40 });
    gsap.set(cardWrapsToAnimate, { autoAlpha: 0, scale: 0.97 });
    if(readMoreBtn) gsap.set(readMoreBtn, { autoAlpha: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        dispatch('animationComplete');
      }
    });
    tl.to(headlineEl, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "start")
      .to(summaryEl, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "start+=0.1")
      .to(cardWrapsToAnimate, { 
          autoAlpha: 1,
          scale: 1, 
          duration: 2.8, 
          stagger: 0.15, 
          ease: 'expo.out' 
      }, "start+=0.2");

    if (readMoreBtn) {
      tl.to(readMoreBtn, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, "start+=0.4");
    }
  }

  export function onLeaveSection() {
    if (!headlineEl || !summaryEl || cardWrapsToAnimate.length === 0) return;
    
    const allElements = [headlineEl, summaryEl, ...cardWrapsToAnimate];
    if (readMoreBtn) allElements.push(readMoreBtn);
    
    gsap.killTweensOf(allElements);
    gsap.set(allElements, { autoAlpha: 0 });
  }
  
  function handleCardClick(card: ProjectCard) {
    const aspectLink = card.aspectLink || '';
    // --- MODIFICATION: Use the transition store for navigation ---
    transitionStore.fadeToBlackAndNavigate(`/projects/${project.slug}${aspectLink}`);
  }

  function handleReadMoreClick() {
    // --- MODIFICATION: Use the transition store for navigation ---
    transitionStore.fadeToBlackAndNavigate(`/projects/${project.slug}`);
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
          <button type="button" class="card-click-wrapper" on:click={() => handleCardClick(card)}>
            <ParallaxCard cardData={card} width="220px" height="290px" />
          </button>
        {/each}
      </div>
      
      {#if project.readMoreLinkText}
        <button class="read-more-btn" on:click={handleReadMoreClick} bind:this={readMoreBtn}>
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
        visibility: hidden;
        font-size: 2.5rem; 
        font-weight: 300; 
        margin-bottom: 1rem; 
        letter-spacing: -0.02em; 
    }
    p.project-summary { 
        opacity: 0; 
        visibility: hidden;
        font-size: 1.15rem; 
        color: rgb(212 212 216); 
        line-height: 1.7; 
        margin-bottom: 2rem; 
        max-width: 800px; 
        margin-left: auto; 
        margin-right: auto; 
    }
    .project-cards-container { 
        display: flex; 
        justify-content: center; 
        gap: 1rem; 
        margin-top: 1rem; 
        margin-bottom: 2rem; 
        flex-wrap: wrap; 
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
    button.read-more-btn { 
        opacity: 0; 
        visibility: hidden;
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