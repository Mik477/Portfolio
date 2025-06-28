<!-- src/lib/components/sections/AboutSection.svelte -->
<script context="module" lang="ts">
  export type AboutSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { siteConfig } from '$lib/data/siteConfig';
  import { gsap } from 'gsap';

  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import AboutImageEffect from '$lib/components/AboutImageEffect.svelte';

  import type { KeyboardButtonsInstance } from '$lib/components/KeyboardButtons.svelte';
  import type { AboutImageEffectInstance } from '$lib/components/AboutImageEffect.svelte';

  const dispatch = createEventDispatcher();

  type AboutSectionData = typeof siteConfig.aboutSection;
  export let data: AboutSectionData;
  export let contactSectionIndex: number;
  export let navigateToSection: (index: number) => void;

  // Bindings for child component instances
  let keyboardButtonsInstance: KeyboardButtonsInstance | null = null;
  let aboutImageEffectInstance: AboutImageEffectInstance | null = null;

  /**
   * Plays the entrance animation for this section by delegating to its children.
   * Called by the orchestrator when this section slides into view.
   */
  export function onEnterSection(): void {
    // This component now orchestrates its children's animations.
    // It calls their onEnterSection methods in the desired sequence.
    if (keyboardButtonsInstance) {
      keyboardButtonsInstance.onEnterSection();
    }
    if (aboutImageEffectInstance) {
      aboutImageEffectInstance.onEnterSection();
    }
  }

  /**
   * Forcefully stops animations and resets the section by delegating to its children.
   * Called by the orchestrator when this section slides out of view.
   */
  export function onLeaveSection(): void {
    if (keyboardButtonsInstance) {
      keyboardButtonsInstance.onLeaveSection();
    }
    if (aboutImageEffectInstance) {
      aboutImageEffectInstance.onLeaveSection();
    }
  }
</script>

<div class="about-section-wrapper">
  <div class="about-content-wrapper">
    <KeyboardButtons 
      bind:this={keyboardButtonsInstance}
      title={data.title}
      introduction={data.introduction}
      socialLinks={data.socialLinks}
      {contactSectionIndex}
      {navigateToSection}
      on:animationComplete={() => dispatch('animationComplete')}
    />
  </div>

  <AboutImageEffect
    bind:this={aboutImageEffectInstance}
    imageUrl={data.imageUrl}
  />
</div>

<style>
  /* Styles remain unchanged */
  .about-section-wrapper {
    width: 100%;
    height: 100%;
    padding: 0;
    text-align: left;
    background-color: transparent;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .about-content-wrapper {
    position: relative;
    z-index: 3;
    flex-grow: 1;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem);
    padding-right: 2rem;
    box-sizing: border-box;
  }
  
  @media (max-width: 768px) {
    .about-section-wrapper { 
      flex-direction: column;
      justify-content: center;
      padding: 2rem; 
      align-items: center;
    }

    .about-content-wrapper { 
      justify-content: center; 
      text-align: center; 
      padding: 1rem;
      width: 100%;
      flex-grow: 0;
      z-index: 2;
    }
    
    .about-section-wrapper :global(.main-container) {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.15 !important;
      z-index: 1;
    }

    .about-section-wrapper :global(.image-pane) {
      justify-content: center;
    }

    .about-section-wrapper :global(.image-pane img) {
      width: 100vw;
      height: 100vh;
      object-fit: cover;
    }
  }
</style>