<!-- src/lib/components/sections/ProjectSection.svelte -->
<script context="module" lang="ts">
  export type ProjectSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';
  import type { Project } from '$lib/data/projectsData';

  const dispatch = createEventDispatcher();

  export let project: Project;

  let sectionWrapperEl: HTMLElement;

  export function onEnterSection() {
    const headline = sectionWrapperEl.querySelector('.anim-headline');
    const summary = sectionWrapperEl.querySelector('.anim-summary');
    const cards = gsap.utils.toArray(sectionWrapperEl.querySelectorAll('.anim-card'));
    const button = sectionWrapperEl.querySelector('.anim-button');
    
    if (headline) gsap.set(headline, { autoAlpha: 0, y: 50 });
    if (summary) gsap.set(summary, { autoAlpha: 0, y: 40 });
    if (cards.length > 0) gsap.set(cards, { autoAlpha: 0, scale: 0.95, y: 20 });
    
    // --- FIX START: Modify the button's initial state ---
    if (button) gsap.set(button, { autoAlpha: 0, y: 6, scale: 0.97 });
    // --- FIX END ---
    
    const tl = gsap.timeline({
      delay: 0.2,
      onComplete: () => {
        dispatch('animationComplete');
      }
    });

    if (headline) {
      tl.to(headline, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 'start');
    }
    if (summary) {
      tl.to(summary, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 'start+=0.15');
    }
    if (cards.length > 0) {
      tl.to(cards, { 
        autoAlpha: 1, 
        scale: 1,
        y: 0,
        duration: 1.2, 
        stagger: 0.1, 
        ease: 'expo.out' 
      }, 'start+=0.25');
    }
    
    // --- FIX START: Modify the button's final animation ---
    if (button) {
      tl.to(button, { 
        autoAlpha: 1, 
        y: 0, 
        scale: 1, 
        duration: 1.2, // Longer duration for a more dramatic feel
        ease: 'expo.out' // A more pronounced ease
      }, 'start+=0.4');
    }
    // --- FIX END ---
  }

  export function onLeaveSection() {
    const animatableElements = gsap.utils.toArray(
      sectionWrapperEl.querySelectorAll('.anim-headline, .anim-summary, .anim-card, .anim-button')
    );
    if (animatableElements.length === 0) return;
    
    gsap.killTweensOf(animatableElements);
    gsap.set(animatableElements, { autoAlpha: 0 });
  }
</script>

<div class="project-section-wrapper" bind:this={sectionWrapperEl}>
  <div 
    class="background-image-container" 
    style="background-image: url({project.background.value});"
    aria-hidden="true"
    role="presentation"
  ></div>
  <div class="content-host">
    <slot></slot>
  </div>
</div>

<style>
  .project-section-wrapper {
    width: 100%;
    height: 100%;
    color: rgb(245 245 247);
    z-index: 2;
    background-color: transparent;
    position: relative;
    overflow: hidden;
  }

  .background-image-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    transform: scale(1);
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(9, 9, 11, 0.6), rgba(9, 9, 11, 0.2) 60%, transparent 100%);
    }
  }
  
  .content-host {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
  }
</style>