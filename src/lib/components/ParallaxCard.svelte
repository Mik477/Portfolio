<!-- src/lib/components/ParallaxCard.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProjectCard } from '$lib/data/projectsData';
  import { page } from '$app/stores';

  export let cardData: ProjectCard;
  export let width: string = '240px';
  export let height: string = '320px';
  export let active: boolean = false;
  export let disableTilt: boolean = false;

  let cardWrapElement: HTMLDivElement;
  let elementWidth: number = 0;
  let elementHeight: number = 0;
  let rectLeft: number = 0;
  let rectTop: number = 0;
  let mouseX: number = 0; // relative to center
  let mouseY: number = 0; // relative to center
  let mouseLeaveDelay: number | null = null;
  let hasPointer = false;
  let rafId: number | null = null;
  let needsFrame = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isDestroyed = false;
  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  // Adaptive fidelity (lightweight moving average)
  let frameTimes: number[] = [];
  const FRAME_WINDOW = 50;
  const HIGH_MS = 19.5;
  const LOW_MS = 14.0;
  let quality = 1.0; // 1.0 high, 0.7 low
  let scaleCooldown = 0;
  const SCALE_COOLDOWN_FRAMES = 45;

  onMount(() => {
    if (!cardWrapElement) return;
    // Initial rect
    const rect = cardWrapElement.getBoundingClientRect();
    elementWidth = rect.width;
    elementHeight = rect.height;
    rectLeft = rect.left;
    rectTop = rect.top;

    // Observe size changes
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === cardWrapElement) {
          if (isDestroyed) return;
          const cr = entry.contentRect;
          elementWidth = cr.width;
          elementHeight = cr.height;
          // Left/top may change with layout; recalc bounding rect
          const r = cardWrapElement.getBoundingClientRect();
          rectLeft = r.left; rectTop = r.top;
        }
      }
    });
    resizeObserver.observe(cardWrapElement);

    // IntersectionObserver to gate work when offscreen
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.target === cardWrapElement) {
          if (!e.isIntersecting) {
            detachPointer();
            cancelRaf();
            mouseX = 0; mouseY = 0;
          }
        }
      });
    }, { root: null, threshold: 0 });
    intersectionObserver.observe(cardWrapElement);
  });

  onDestroy(() => {
    isDestroyed = true;
    needsFrame = false;
    cancelRaf();
    detachPointer();
    if (mouseLeaveDelay !== null) {
      window.clearTimeout(mouseLeaveDelay);
      mouseLeaveDelay = null;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    intersectionObserver?.disconnect();
    intersectionObserver = null;
  });

  $: mousePX = mouseX / elementWidth;
  $: mousePY = mouseY / elementHeight;
  // Parallax amplitude scaled by quality for adaptive fidelity
  $: rX = !isNaN(mousePX) ? mousePX * (30 * quality) : 0;
  $: rY = !isNaN(mousePY) ? mousePY * (-30 * quality) : 0;
  $: tX = !isNaN(mousePX) ? mousePX * (-40 * quality) : 0;
  $: tY = !isNaN(mousePY) ? mousePY * (-40 * quality) : 0;
  $: cardStyle = `transform: rotateY(${rX}deg) rotateX(${rY}deg) translateZ(0);`;
  $: cardBgTransform = `transform: translate3d(${tX}px, ${tY}px, 0);`;
  $: cardBgImage = cardData.cardImage ? `background-image: url(${cardData.cardImage});` : '';

  function scheduleFrame() {
    if (isDestroyed) return;
    if (rafId !== null) return; // already scheduled
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (isDestroyed) return;
      // Update frame-time window
      const now = performance.now();
      const prev = (scheduleFrame as any)._prev || now;
      (scheduleFrame as any)._prev = now;
      const dtMs = Math.max(0.016, now - prev);
      frameTimes.push(dtMs);
      if (frameTimes.length > FRAME_WINDOW) frameTimes.shift();
      if (frameTimes.length === FRAME_WINDOW) {
        const avg = frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length;
        if (scaleCooldown > 0) scaleCooldown--;
        let changed = false;
        if (scaleCooldown === 0) {
          if (avg > HIGH_MS && quality > 0.7) { quality = +(Math.max(0.7, quality - 0.1)).toFixed(2); changed = true; }
          else if (avg < LOW_MS && quality < 1.0) { quality = +(Math.min(1.0, quality + 0.1)).toFixed(2); changed = true; }
          if (changed) scaleCooldown = SCALE_COOLDOWN_FRAMES;
        }
      }
      if (!needsFrame) return;
      needsFrame = false;
      // Compute relative to cached rect and element size
      const cx = lastPointerX - rectLeft - elementWidth / 2;
      const cy = lastPointerY - rectTop - elementHeight / 2;
      mouseX = cx; mouseY = cy;
    });
  }

  function cancelRaf() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  function handlePointerMove(e: PointerEvent) {
    if (disableTilt || isDestroyed || !cardWrapElement) return;
    lastPointerX = e.clientX; lastPointerY = e.clientY;
    needsFrame = true;
    scheduleFrame();
  }

  function attachPointer() {
    if (!cardWrapElement || isDestroyed || hasPointer || disableTilt) return;
    hasPointer = true;
    cardWrapElement.addEventListener('pointermove', handlePointerMove);
    // Update cached rect on enter for accuracy
    const r = cardWrapElement.getBoundingClientRect();
    rectLeft = r.left; rectTop = r.top; elementWidth = r.width; elementHeight = r.height;
  }
  function detachPointer() {
    if (!cardWrapElement || !hasPointer) return;
    hasPointer = false;
    cardWrapElement.removeEventListener('pointermove', handlePointerMove);
  }

  function handleMouseEnter() {
    if (disableTilt || isDestroyed) return;
    if (mouseLeaveDelay !== null) {
      window.clearTimeout(mouseLeaveDelay);
      mouseLeaveDelay = null;
    }
    attachPointer();
  }

  function handleMouseLeave() {
    if (isDestroyed) return;
    mouseLeaveDelay = window.setTimeout(() => {
      if (isDestroyed) return;
      mouseX = 0;
      mouseY = 0;
    }, 1000);
    detachPointer();
  }

  $: if (disableTilt) {
    if (hasPointer) detachPointer();
    cancelRaf();
    mouseX = 0;
    mouseY = 0;
  }
</script>

<div
  class="card-wrap"
  style:width
  style:height
  class:is-active={active}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  bind:this={cardWrapElement}
  role="group"
  aria-label={(($page.data as any)?.messages?.common?.projects?.cardAriaPrefix ?? 'Interactive project card for') + ' ' + cardData.title}
>
  <div class="card" style={cardStyle}>
    <div class="card-bg" style="{cardBgTransform} {cardBgImage}" id="card-bg-{cardData.id}"></div>
    <div class="card-info">
      <h3 class="card-title">{cardData.title}</h3>
      {#if cardData.description}
        <p class="card-description">{cardData.description}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  :root {
    /* === TUNING PARAMETERS START === */
    /* Positioning */
    --card-info-padding: 20px;
    --card-title-bottom-anchor: 15%;
    --card-description-bottom-anchor: 5%;
    
    /* Animation */
    --card-title-transition-duration: 0.8s;
    --card-title-hover-lift: -40px;
    /* Typography */
    --card-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --card-title-initial-weight: 400;
    --card-title-hover-weight: 620;
    --card-title-letter-spacing-base: 0.0125em;
    --card-title-letter-spacing-hover: 0.04em;

    --card-description-fade-duration: 1.5s;
    --card-description-slide-duration: 1.3s;
    --card-description-initial-offset: 100px;
    /* === TUNING PARAMETERS END === */
  }

  .card-wrap {
    margin: 10px;
    transform: perspective(800px);
    transform-style: preserve-3d;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  will-change: transform;
  }

  .card-wrap:hover .card-title,
  .card-wrap.is-active .card-title {
    font-weight: var(--card-title-hover-weight);
    letter-spacing: var(--card-title-letter-spacing-hover);
    transform: translateY(var(--card-title-hover-lift));
  }
  
  .card-wrap:hover .card-description,
  .card-wrap.is-active .card-description {
    opacity: 1;
    transform: translateY(0);
  }
  
  .card-wrap:hover .card-bg,
  .card-wrap.is-active .card-bg {
    transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 5s cubic-bezier(0.23, 1, 0.32, 1);
    opacity: 0.8;
  }
  .card-wrap:hover .card,
  .card-wrap.is-active .card {
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 2s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: rgba(255, 255, 255, 0.2) 0 0 40px 5px, white 0 0 0 1px, rgba(0, 0, 0, 0.66) 0 30px 60px 0, inset #333 0 0 0 5px, inset white 0 0 0 6px;
  }

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #333;
    overflow: hidden;
    border-radius: 10px;
    transition: transform 1s cubic-bezier(0.445, 0.05, 0.55, 0.95), box-shadow 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
  will-change: transform;
  contain: paint;
  }

  .card-bg {
    opacity: 0.5;
    position: absolute;
    top: -20px;
    left: -20px;
    width: calc(100% + 40px);
    height: calc(100% + 40px);
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    transition: 1s cubic-bezier(0.445, 0.05, 0.55, 0.95), opacity 5s 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
    pointer-events: none;
  will-change: transform, opacity;
  }

  .card-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    color: #fff;
    padding: var(--card-info-padding);
    text-align: center;
  }
  
  .card-title {
    position: absolute;
    left: var(--card-info-padding);
    right: var(--card-info-padding);
    bottom: var(--card-title-bottom-anchor);
    
    font-size: clamp(1.4rem, 10vw, 2rem);
    font-family: var(--card-font-family);
    text-shadow: rgba(0, 0, 0, 0.5) 0 10px 10px;
    letter-spacing: var(--card-title-letter-spacing-base);
    transform: translateY(0);
    
    /* FIX: Use the new variable for the initial weight */
    font-weight: var(--card-title-initial-weight);
    
    transition: 
      font-weight var(--card-title-transition-duration) ease, 
      letter-spacing var(--card-title-transition-duration) ease,
      transform var(--card-title-transition-duration) cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .card-description {
    position: absolute;
    left: var(--card-info-padding);
    right: var(--card-info-padding);
    bottom: var(--card-description-bottom-anchor);

    opacity: 0;
    transform: translateY(var(--card-description-initial-offset));
    
    transition: 
      opacity var(--card-description-fade-duration) cubic-bezier(0.16, 1, 0.3, 1),
      transform var(--card-description-slide-duration) cubic-bezier(0.16, 1, 0.3, 1);
    
    text-shadow: black 0 2px 3px;
    font-size: 0.9rem;
    line-height: 1.5;
    font-family: var(--card-font-family);
  }
</style>