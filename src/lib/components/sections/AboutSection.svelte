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
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { AboutContent } from '$lib/data/projectsData';

  import KeyboardButtons from '$lib/components/KeyboardButtons.svelte';
  import AboutImageEffect from '$lib/components/AboutImageEffect.svelte';
  import type { KeyboardButtonsInstance } from '$lib/components/KeyboardButtons.svelte';
  import type { AboutImageEffectInstance } from '$lib/components/AboutImageEffect.svelte';
  import { renderProfile } from '$lib/stores/renderProfile';

  const dispatch = createEventDispatcher();

  export let data: AboutContent;
  export let contactSectionIndex: number;
  export let navigateToSection: (index: number) => void;

  let keyboardButtonsInstance: KeyboardButtonsInstance | null = null;
  let aboutImageEffectInstance: AboutImageEffectInstance | null = null;
  type RenderProfileState = {
    isMobile: boolean;
    hasCoarsePointer?: boolean;
    prefersReducedMotion?: boolean;
  };

  let disableImageOnMobile = false;
  let shouldRenderImageEffect = true;
  let profileReady = false;
  let currentRenderProfile: RenderProfileState = { isMobile: false };

  if (browser) {
    onMount(() => {
      const unsubscribe = renderProfile.subscribe((profile) => {
        currentRenderProfile = profile;
        profileReady = true;
      });
      return () => unsubscribe();
    });
  }

  $: disableImageOnMobile = Boolean(data?.disableImageOnMobile);
  $: shouldRenderImageEffect = disableImageOnMobile
    ? profileReady && !currentRenderProfile.isMobile
    : true;

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
      // Lazy init safeguard: if preloading was skipped for some reason, initialize now (non-blocking)
      // @ts-ignore best-effort check
      if ((aboutImageEffectInstance as any).initializeEffect && !(aboutImageEffectInstance as any).isInitialized) {
        try { (aboutImageEffectInstance as any).initializeEffect(); } catch {}
      }
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

  {#if shouldRenderImageEffect}
    <AboutImageEffect
      bind:this={aboutImageEffectInstance}
      imageUrl={data.imageUrl}
      mobileMode={currentRenderProfile.isMobile}
    />
  {/if}
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
  align-items: stretch;
    }

    .about-content-wrapper { 
  justify-content: flex-start; 
  text-align: left; 
      padding: 1rem 1rem 2rem;
      /* Reserve a small gutter on the right so text doesn't conflict with MobileNavDots */
      padding-right: calc(1rem + clamp(32px, 8vw, 56px));
      width: 100%;
      flex-grow: 0;
      z-index: 2;
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