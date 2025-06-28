<!-- src/lib/components/sections/ContactSection.svelte -->
<script context="module" lang="ts">
  // The instance type that the orchestrator (`+page.svelte`) will use.
  export type ContactSectionInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { siteConfig } from '$lib/data/siteConfig';

  // Define the type for the expected data prop from the siteConfig object.
  type ContactSectionData = typeof siteConfig.contactSection;
  export let data: ContactSectionData;

  // Element bindings for animation
  let sectionWrapper: HTMLElement;
  let animatableElements: Element[] = [];

  onMount(() => {
    // Collect all elements that need to be animated.
    // This runs once when the component is first mounted (and hidden).
    if (sectionWrapper) {
        animatableElements = gsap.utils.toArray(sectionWrapper.querySelectorAll('h2, p, .additional-links a'));
    }
  });

  /**
   * Plays the entrance animation for this section.
   * Called by the orchestrator when this section slides into view.
   */
  export function onEnterSection(): void {
    if (animatableElements.length === 0) return;

    // Set the initial (hidden) state before animating.
    gsap.set(animatableElements, { autoAlpha: 0, y: 30 });

    // Create the staggered entrance timeline.
    gsap.to(animatableElements, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out'
    });
  }

  /**
   * Forcefully stops any running animations and resets the section to its hidden state.
   * Called by the orchestrator when this section slides out of view.
   */
  export function onLeaveSection(): void {
    if (animatableElements.length === 0) return;
    
    // Immediately kill any in-progress animations on these elements.
    gsap.killTweensOf(animatableElements);
    
    // Reset to the initial hidden state, ready for the next time onEnterSection is called.
    gsap.set(animatableElements, { autoAlpha: 0 });
  }
</script>

<div class="contact-content-wrapper" bind:this={sectionWrapper}>
  <div class="content-center">
    <h2>{data.title}</h2>
    <p>{data.outroMessage}</p>
    <p>Email: <a href="mailto:{data.email}">{data.email}</a></p>
    {#if data.additionalLinks}
      <div class="additional-links">
        {#each data.additionalLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .contact-content-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: rgb(24 24 27);
    color: rgb(245 245 247);
  }

  .content-center {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h2, p, .additional-links a {
    /* All animatable elements start invisible, controlled by GSAP */
    opacity: 0;
    visibility: hidden;
  }

  h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    font-weight: 300;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 1.15rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    color: rgb(212 212 216);
  }

  a {
    color: rgb(99 102 241);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  a:hover {
    color: rgb(129 140 248);
    text-decoration: underline;
  }

  .additional-links {
    margin-top: 2rem;
    display: flex;
    gap: 2rem;
    justify-content: center;
  }
</style>