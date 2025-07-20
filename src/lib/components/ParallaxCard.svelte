<!-- src/lib/components/ParallaxCard.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProjectCard } from '$lib/data/projectsData';

  export let cardData: ProjectCard;
  export let width: string = '240px';
  export let height: string = '320px';

  let cardWrapElement: HTMLDivElement;
  let elementWidth: number = 0;
  let elementHeight: number = 0;
  let mouseX: number = 0;
  let mouseY: number = 0;
  let mouseLeaveDelay: number | null = null;

  onMount(() => {
    if (cardWrapElement) {
      elementWidth = cardWrapElement.offsetWidth;
      elementHeight = cardWrapElement.offsetHeight;
    }
  });

  onDestroy(() => {
    if (mouseLeaveDelay) clearTimeout(mouseLeaveDelay);
  });

  $: mousePX = mouseX / elementWidth;
  $: mousePY = mouseY / elementHeight;
  $: rX = !isNaN(mousePX) ? mousePX * 30 : 0;
  $: rY = !isNaN(mousePY) ? mousePY * -30 : 0;
  $: tX = !isNaN(mousePX) ? mousePX * -40 : 0;
  $: tY = !isNaN(mousePY) ? mousePY * -40 : 0;
  $: cardStyle = `transform: rotateY(${rX}deg) rotateX(${rY}deg);`;
  $: cardBgTransform = `transform: translateX(${tX}px) translateY(${tY}px);`;
  $: cardBgImage = `background-image: url(${cardData.cardImage || cardData.image});`;

  function handleMouseMove(e: MouseEvent) {
    if (!cardWrapElement) return;
    const rect = cardWrapElement.getBoundingClientRect();
    mouseX = e.clientX - rect.left - elementWidth / 2;
    mouseY = e.clientY - rect.top - elementHeight / 2;
  }

  function handleMouseEnter() {
    if (mouseLeaveDelay) clearTimeout(mouseLeaveDelay);
  }

  function handleMouseLeave() {
    mouseLeaveDelay = window.setTimeout(() => {
      mouseX = 0;
      mouseY = 0;
    }, 1000);
  }
</script>

<div
  class="card-wrap"
  style:width
  style:height
  on:mousemove={handleMouseMove}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  bind:this={cardWrapElement}
  role="group"
  aria-label="Interactive project card for {cardData.title}"
>
  <div class="card" style={cardStyle}>
    <div class="card-bg" style="{cardBgTransform} {cardBgImage}" id="card-bg-{cardData.id}"></div>
    <div class="card-info">
      <h1 class="card-title">{cardData.title}</h1>
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
    /* FIX: New parameters to control font weight */
    --card-title-initial-weight: 500; /* Starting weight (e.g., 400=normal) */
    --card-title-hover-weight: 800;   /* Ending weight (e.g., 900=extra-bold) */

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
  }

  .card-wrap:hover .card-title {
    font-weight: var(--card-title-hover-weight);
    letter-spacing: 0.03em;
    transform: translateY(var(--card-title-hover-lift));
  }
  
  .card-wrap:hover .card-description {
    opacity: 1;
    transform: translateY(0);
  }
  
  .card-wrap:hover .card-bg {
    transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 5s cubic-bezier(0.23, 1, 0.32, 1);
    opacity: 0.8;
  }
  .card-wrap:hover .card {
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
    font-family: 'Playfair Display', serif;
    text-shadow: rgba(0, 0, 0, 0.5) 0 10px 10px;
    letter-spacing: 0.01em;
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
  }
</style>