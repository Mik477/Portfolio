<!-- src/lib/components/sections/ContactSection.svelte -->
<script context="module" lang="ts">
  // The public API now includes all optional methods to support the full lifecycle.
  export type ContactSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
    initializeEffect?: () => Promise<void>;
    onTransitionComplete?: () => void;
    onUnload?: () => void;
  };
</script>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';
  import type { ContactContent } from '$lib/data/projectsData';
  
  // 1. Import the new effect component and its instance type.
  import ContactEffect from './ContactEffect.svelte';
  import type { ContactEffectInstance } from './ContactEffect.svelte';

  const dispatch = createEventDispatcher();

  export let data: ContactContent;
  export let emailLabel: string | undefined;

  // 2. Create a binding for the child component instance.
  let contactEffectInstance: ContactEffectInstance | null = null;
  
  let sectionWrapper: HTMLElement;
  let animatableUiElements: Element[] = [];

  onMount(() => {
    if (sectionWrapper) {
      // Select only the UI elements for the GSAP animation.
      animatableUiElements = gsap.utils.toArray(sectionWrapper.querySelectorAll('.anim-ui-element'));
    }
  });

  // --- Animation Lifecycle API Implementation (with Proxying) ---

  export async function initializeEffect() {
    // Proxy the call to the child effect component.
    if (contactEffectInstance?.initializeEffect) {
      await contactEffectInstance.initializeEffect();
    }
  }

  export function onEnterSection(): void {
    // A. Trigger the fade-in of the background effect.
    if (contactEffectInstance) {
      // If effect not yet initialized (preload may have been skipped), try initializing lazily
      // initializeEffect is async; we don't await to avoid blocking UI. It will set up and then fade.
      // @ts-ignore optional presence
      if ((contactEffectInstance as any).initializeEffect && !(contactEffectInstance as any).isInitialized) {
        try { (contactEffectInstance as any).initializeEffect(); } catch {}
      }
      contactEffectInstance.onEnterSection();
    }

    // B. Animate the surrounding UI elements in parallel.
    if (animatableUiElements.length === 0) return;
    gsap.set(animatableUiElements, { autoAlpha: 0, y: 30 });

    gsap.to(animatableUiElements, {
      autoAlpha: 1,
      y: 0,
      duration: 1.2,
      stagger: 0.2,
      delay: 0.5, // Start UI animation slightly after the section starts transitioning in.
      ease: 'power3.out',
      onComplete: () => {
        dispatch('animationComplete');
      }
    });
  }

  export function onTransitionComplete() {
    // Proxy the call to start the heavy rendering loop.
    contactEffectInstance?.onTransitionComplete();
  }

  export function onLeaveSection(): void {
    // A. Trigger the fade-out of the background effect.
    contactEffectInstance?.onLeaveSection();

    // B. Immediately reset the surrounding UI elements.
    if (animatableUiElements.length === 0) return;
    gsap.killTweensOf(animatableUiElements);
    gsap.set(animatableUiElements, { autoAlpha: 0 });
  }
  
  export function onUnload() {
    // Proxy the call to dispose of the effect's GPU resources.
    contactEffectInstance?.onUnload();
  }
</script>

<div class="contact-section-wrapper" bind:this={sectionWrapper}>
  <!-- 
    The ContactEffect component is placed here. It will create its own
    absolutely positioned canvas that sits behind the content-overlay.
  -->
  <ContactEffect bind:this={contactEffectInstance} />

  <!-- 
    This overlay holds all the UI content and arranges it around the effect.
  -->
  <div class="content-overlay">
    <div class="text-column anim-ui-element">
      <h2>{data.title}</h2>
      <p>{data.outroMessage}</p>
    </div>

    <div class="links-column">
      <a href="mailto:{data.email}" class="contact-link anim-ui-element">
        <span>{emailLabel ?? 'Email Me'}</span>
        <svg width="13px" height="10px" viewBox="0 0 13 10">
          <path d="M1,5 L11,5"></path>
          <polyline points="8 1 12 5 8 9"></polyline>
        </svg>
      </a>
      {#if data.additionalLinks}
        {#each data.additionalLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer" class="contact-link anim-ui-element">
            <span>{link.name}</span>
            <svg width="13px" height="10px" viewBox="0 0 13 10">
              <path d="M1,5 L11,5"></path>
              <polyline points="8 1 12 5 8 9"></polyline>
            </svg>
          </a>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .contact-section-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: transparent; /* The effect provides the background */
  }

  .content-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Sits on top of the effect's canvas */
    
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 8vw), 3rem);
    box-sizing: border-box;
    pointer-events: none; /* Allows mouse interaction with the background effect */
  }

  /* Columns for the layout */
  .text-column, .links-column {
    pointer-events: auto; /* Re-enable pointer events for the content itself */
    opacity: 0; /* Start hidden for GSAP */
    visibility: hidden;
  }

  .text-column {
    text-align: left;
    max-width: 450px;
  }
  
  .links-column {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1.5rem;
  }

  h2 {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    margin-bottom: 1.5rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: rgb(245 245 247);
  }

  p {
    font-size: clamp(1rem, 2.2vw, 1.15rem);
    line-height: 1.8;
    color: rgb(212 212 216);
  }
  
  /* Styling for the new contact buttons */
  .contact-link {
    font-family: 'Source Code Pro', monospace;
    font-size: 1.1rem;
    font-weight: 300;
    color: #c7c7c7;
    text-decoration: none;
    position: relative;
    display: inline-flex;
    align-items: center;
    transition: color 0.3s ease;
  }
  
  .contact-link:hover {
    color: #ffffff;
  }

  .contact-link span {
    display: block;
    transition: transform 0.3s ease;
  }

  .contact-link:hover span {
    transform: translateX(-8px);
  }

  .contact-link svg {
    margin-left: 10px;
    stroke: #ffffff;
    stroke-width: 2;
    fill: none;
    stroke-dasharray: 18;
    stroke-dashoffset: 18;
    transition: stroke-dashoffset 0.4s ease, transform 0.3s ease;
  }

  .contact-link:hover svg {
    stroke-dashoffset: 0;
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    .content-overlay {
      flex-direction: column;
      justify-content: center;
      text-align: center;
      gap: 3rem;
    }
    .text-column, .links-column {
      text-align: center;
      align-items: center;
      max-width: 90%;
    }
  }
</style>