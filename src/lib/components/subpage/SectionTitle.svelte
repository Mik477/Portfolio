<!-- src/lib/components/subpage/SectionTitle.svelte -->
<!-- Section title with decorative underline rule -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let title: string;
  export let subtitle: string | undefined = undefined;
  export let className: string = '';
  export let isActive: boolean = false;
  export let delay: number = 0;

  let lineElement: HTMLElement;
  let titleElement: HTMLElement;
  let subtitleElement: HTMLElement;
  let tl: gsap.core.Timeline | null = null;

  // Re-run animation whenever isActive becomes true
  $: if (isActive && lineElement && titleElement) {
    playAnimation();
  } else if (!isActive && lineElement) {
    // Reset when not active
    if (tl) tl.kill();
    const elements = [titleElement, subtitleElement].filter(el => el);
    if (elements.length > 0) {
      gsap.set(elements, { autoAlpha: 0, y: 30 });
    }
    gsap.set(lineElement, { scaleX: 0, opacity: 0 });
  }

  function playAnimation() {
    // Kill existing timeline if any
    if (tl) tl.kill();

    // Calculate target width based on title width + small offset
    const titleWidth = titleElement.offsetWidth;
    const targetWidth = titleWidth + 40; // 20px extra on each side effectively

    // Initial states
    const elements = [titleElement, subtitleElement].filter(el => el);
    if (elements.length > 0) {
      gsap.set(elements, { autoAlpha: 0, y: 30 });
    }
    gsap.set(lineElement, { 
      width: targetWidth, 
      scaleX: 0, 
      opacity: 0, 
      transformOrigin: "left center" 
    });

    tl = gsap.timeline({ delay });

    // 1. Title Fade In
    tl.to(titleElement, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out'
    }, 0);

    // 2. Line Expansion (starts slightly after title)
    tl.to(lineElement, { 
      opacity: 1,
      duration: 0.1,
      ease: "none"
    }, 0.1)
    .to(lineElement, { 
      scaleX: 1, 
      duration: 2.0, // Slower duration to emphasize the decay curve
      ease: "expo.out" 
    }, 0.1);

    // 3. Subtitle Fade In (if exists)
    if (subtitleElement) {
      tl.to(subtitleElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.2);
    }
  }
</script>

<header class="section-header {className}">
  <div class="title-wrapper">
    <h2 class="section-title" bind:this={titleElement}>{title}</h2>
    <div class="title-line" bind:this={lineElement}></div>
  </div>
  {#if subtitle}
    <p class="section-subtitle" bind:this={subtitleElement}>{subtitle}</p>
  {/if}
</header>

<style>
  .section-header {
    margin-bottom: clamp(1.5rem, 2.5vw, 2.5rem);
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Ensure left alignment */
  }

  .title-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .section-title {
    /* Increased range for better scaling on 1440p+ displays */
    font-size: clamp(2rem, 2.5vw + 1rem, 3.5rem);
    font-weight: 700;
    font-family: var(--project-title-font-family, 'Playfair Display', serif);
    letter-spacing: 0.02em;
    color: rgb(245, 245, 247);
    margin: 0;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
    white-space: nowrap; /* Prevent wrapping for accurate width calculation if possible, or handle multiline */
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .title-line {
    display: block;
    height: 1px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0.1)
    );
    margin-top: 0.25rem;
    /* Width is set by JS */
  }

  .section-subtitle {
    /* Increased range for better scaling */
    font-size: clamp(1rem, 1vw + 0.5rem, 1.4rem);
    font-weight: 400;
    color: rgba(200, 200, 205, 0.9);
    margin: 0;
    max-width: 50ch;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
</style>
