<!-- src/lib/components/sections/AboutSection.svelte -->
<script context="module" lang="ts">
  export type AboutSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
    initializeEffect?: () => Promise<void>;
    // Add the new optional method to its type definition
    onTransitionComplete?: () => void;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { siteConfig } from '$lib/data/siteConfig';

  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import AboutImageEffect from '$lib/components/AboutImageEffect.svelte';
  import type { KeyboardButtonsInstance } from '$lib/components/KeyboardButtons.svelte';
  import type { AboutImageEffectInstance } from '$lib/components/AboutImageEffect.svelte';

  const dispatch = createEventDispatcher();

  type AboutSectionData = typeof siteConfig.aboutSection;
  export let data: AboutSectionData;
  export let contactSectionIndex: number;
  export let navigateToSection: (index: number) => void;

  let keyboardButtonsInstance: KeyboardButtonsInstance | null = null;
  let aboutImageEffectInstance: AboutImageEffectInstance | null = null;

  // This is called by the preload manager while the section is off-screen.
  export async function initializeEffect() {
    if (aboutImageEffectInstance?.initializeEffect) {
      await aboutImageEffectInstance.initializeEffect();
    }
  }

  // This is called at the START of the page transition.
  // It should only contain lightweight animations.
  export function onEnterSection(): void {
    if (keyboardButtonsInstance) {
      keyboardButtonsInstance.onEnterSection();
    }
    if (aboutImageEffectInstance) {
      // The image effect's onEnterSection just starts a simple fade-in.
      aboutImageEffectInstance.onEnterSection();
    }
  }
  
  // FIX: This is called at the END of the page transition.
  // It's for heavy, layout-dependent animations.
  export function onTransitionComplete() {
    if (aboutImageEffectInstance?.onTransitionComplete) {
      // This starts the particle rendering, which depends on the final layout.
      aboutImageEffectInstance.onTransitionComplete();
    }
  }

  // This is called when navigating away from the section.
  export function onLeaveSection(): void {
    if (keyboardButtonsInstance) {
      keyboardButtonsInstance.onLeaveSection();
    }
    if (aboutImageEffectInstance) {
      aboutImageEffectInstance.onLeaveSection();
    }
  }

  function handleAnimationComplete() {
    dispatch('animationComplete');
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
      on:animationComplete={handleAnimationComplete}
    />
  </div>

  <AboutImageEffect
    bind:this={aboutImageEffectInstance}
    imageUrl={data.imageUrl}
  />
</div>

<style>
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