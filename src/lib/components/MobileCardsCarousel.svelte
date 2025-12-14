<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import ParallaxCard from '$lib/components/ParallaxCard.svelte';
  import type { ProjectCard } from '$lib/data/projectsData';

  export let cards: ProjectCard[] = [];
  export let initialIndex: number | null = null;
  export let cardComponent: typeof ParallaxCard = ParallaxCard;
  export let cardProps: Record<string, unknown> = { disableTilt: true };

  const dispatch = createEventDispatcher<{
    activate: { index: number };
    select: { index: number };
  }>();

  let viewport: HTMLDivElement;
  let itemNodes: Array<HTMLDivElement | null> = [];
  let currentIndex = 0; // real index within cards array
  let currentDisplayIndex = 0; // index within displayCards
  let resizeObserver: ResizeObserver | null = null;
  let scrollFrame: number | null = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let horizontalLocked = false;
  let sequenceOffset = 0; // start index of the middle band
  let cycleWidth = 0;
  const REPEAT = 1; // number of repeated sequences

  $: total = cards.length;
  $: hasLoop = total > 1;
  $: displayCards = hasLoop && total > 0
    ? Array.from({ length: REPEAT }).flatMap(() => cards)
    : cards;
  $: displayCount = displayCards.length;
  $: if (displayCount !== itemNodes.length) {
    itemNodes = new Array(displayCount).fill(null);
  }
  $: sequenceOffset = hasLoop ? total * Math.floor(REPEAT / 2) : 0;

  let mounted = false;
  let isDestroyed = false;
  let resolvedInitialIndex = 0;

  $: resolvedInitialIndex = initialIndex ?? (total > 0 ? Math.floor(total / 2) : 0);

  $: if (total === 0) {
    currentIndex = 0;
    currentDisplayIndex = 0;
  } else {
    resetIndices(resolvedInitialIndex, true);
  }

  $: updateCycleMetrics();

  function normalizeIndex(idx: number) {
    if (total === 0) return 0;
    const n = ((idx % total) + total) % total;
    return n;
  }

  function queueSnap(options: { immediate?: boolean; behavior?: ScrollBehavior } = {}) {
    if (!viewport || !mounted || isDestroyed) return;
    const { immediate = false, behavior = 'smooth' } = options;
    const node = itemNodes[currentDisplayIndex];
    if (!node) return;
    const offset = node.offsetLeft - (viewport.clientWidth - node.clientWidth) / 2;
    if (immediate) {
      viewport.scrollLeft = offset;
    } else {
      viewport.scrollTo({ left: offset, behavior });
    }
  }

  function resetIndices(sourceIndex: number, immediate: boolean) {
    if (total === 0) {
      currentIndex = 0;
      currentDisplayIndex = 0;
      return;
    }
    const normalized = normalizeIndex(sourceIndex);
    const newDisplayIndex = hasLoop ? sequenceOffset + normalized : normalized;
    currentIndex = normalized;
    currentDisplayIndex = newDisplayIndex;
    if (mounted) {
      void tick().then(() => queueSnap({ immediate }));
    }
  }

  function updateCycleMetrics() {
    if (!hasLoop) {
      cycleWidth = 0;
      return;
    }
    const startIndex = sequenceOffset;
    const nextIndex = sequenceOffset + total;
    const startNode = itemNodes[startIndex];
    const nextNode = itemNodes[nextIndex];
    if (startNode && nextNode) {
      cycleWidth = nextNode.offsetLeft - startNode.offsetLeft;
    }
  }

  async function initialize() {
    await tick();
    if (!mounted || isDestroyed) return;
    if (total === 0) return;
    resetIndices(resolvedInitialIndex, true);
    dispatch('activate', { index: currentIndex });
  }

  onMount(() => {
    mounted = true;
    isDestroyed = false;
    initialize();
    if (typeof ResizeObserver !== 'undefined' && viewport) {
      resizeObserver = new ResizeObserver(() => {
        queueSnap({ immediate: true });
      });
      resizeObserver.observe(viewport);
    }
  });

  onDestroy(() => {
    mounted = false;
    isDestroyed = true;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (scrollFrame !== null) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }
  });

  function handleScroll() {
    if (!mounted || isDestroyed) return;
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      if (!mounted || isDestroyed) return;
      updateActiveFromScroll();
    });
  }

  function updateActiveFromScroll() {
    if (!viewport) return;
    let closestIdx = currentDisplayIndex;
    let minDistance = Number.POSITIVE_INFINITY;
    const viewportMid = viewport.scrollLeft + viewport.clientWidth / 2;

    for (let i = 0; i < displayCount; i += 1) {
      const node = itemNodes[i];
      if (!node) continue;
      const nodeMid = node.offsetLeft + node.clientWidth / 2;
      const distance = Math.abs(nodeMid - viewportMid);
      if (distance < minDistance - 0.5) {
        minDistance = distance;
        closestIdx = i;
      }
    }

    if (closestIdx !== currentDisplayIndex) {
      currentDisplayIndex = closestIdx;
      const newIndex = hasLoop ? normalizeIndex(closestIdx - sequenceOffset) : closestIdx;
      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        dispatch('activate', { index: currentIndex });
      }
    }

    enforceLoop();
  }

  function enforceLoop() {
    if (!hasLoop || displayCount === 0 || !viewport || cycleWidth === 0) return;
    const minIndex = sequenceOffset;
    const maxIndex = sequenceOffset + total - 1;

    if (currentDisplayIndex < minIndex) {
      // Determine how many sequences we underflowed by
      const seqs = Math.ceil((minIndex - currentDisplayIndex) / total);
      currentDisplayIndex += total * seqs;
      viewport.scrollLeft += cycleWidth * seqs;
    } else if (currentDisplayIndex > maxIndex) {
      // Determine how many sequences we overflowed by
      const seqs = Math.ceil((currentDisplayIndex - maxIndex) / total);
      currentDisplayIndex -= total * seqs;
      viewport.scrollLeft -= cycleWidth * seqs;
    }
  }

  function handleCardTap(displayIdx: number) {
    const realIndex = hasLoop ? normalizeIndex(displayIdx - sequenceOffset) : displayIdx;
    const targetDisplayIndex = hasLoop ? sequenceOffset + realIndex : realIndex;

    if (displayIdx === currentDisplayIndex) {
      dispatch('select', { index: realIndex });
      return;
    }

    currentIndex = realIndex;
    currentDisplayIndex = targetDisplayIndex;
    dispatch('activate', { index: currentIndex });
    queueSnap();
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    horizontalLocked = false;
  }

  function handleTouchMove(event: TouchEvent) {
    // Don't stop propagation - let parent handlers decide what to do
    // The parent's touch handlers will detect horizontal intent and ignore
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);
    if (dx > dy && dx > 6) {
      horizontalLocked = true;
      // Removed stopPropagation() - parent needs to detect horizontal gestures too
    }
  }

  function handleTouchEnd() {
    horizontalLocked = false;
  }
</script>

{#if total === 0}
  <div class="carousel-empty" aria-hidden="true"></div>
{:else}
  <div
    class="carousel-viewport"
    bind:this={viewport}
    role="listbox"
    aria-roledescription="carousel"
    aria-label="Project previews"
    on:scroll={handleScroll}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
  >
    {#each displayCards as card, idx}
      {@const realIndex = hasLoop ? normalizeIndex(idx - sequenceOffset) : idx}
      {@const isMiddleSequence = !hasLoop || (idx >= sequenceOffset && idx < sequenceOffset + total)}
      {@const isActive = idx === currentDisplayIndex}
      <div
        class="carousel-item"
        class:active={isActive}
        bind:this={itemNodes[idx]}
        on:click={() => handleCardTap(idx)}
        role="option"
        aria-hidden={!isMiddleSequence}
        aria-selected={isActive}
        tabindex={isActive ? 0 : -1}
        data-index={realIndex}
        data-clone={isMiddleSequence ? 'false' : 'true'}
      >
        <svelte:component
          this={cardComponent}
          cardData={card}
          width="100%"
          height="auto"
          active={isActive}
          {...cardProps}
        />
      </div>
    {/each}
  </div>
{/if}

<style>
  .carousel-viewport {
    --carousel-gap: clamp(16px, 6vw, 32px);
    --carousel-peek: clamp(24px, 10vw, 56px);
    display: flex;
    flex-direction: row;
    gap: var(--carousel-gap);
    overflow-x: auto;
    overflow-y: visible;
    padding: 1.5rem var(--carousel-peek) 2.5rem;
    margin: 0 -var(--carousel-peek);
    scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--carousel-peek);
  -webkit-overflow-scrolling: touch;
  }

  .carousel-viewport::-webkit-scrollbar {
    display: none;
  }

  .carousel-item {
    flex: 0 0 var(--mobile-card-flex-basis, calc(100% - 2 * var(--carousel-peek)));
    max-width: var(--mobile-card-max-width, 480px);
    scroll-snap-align: center;
    scroll-snap-stop: always;
    display: flex;
    justify-content: center;
    align-items: stretch;
    transition: transform 0.4s ease, opacity 0.4s ease;
    opacity: 0.55;
  }

  .carousel-item :global(.card-wrap),
  .carousel-item :global(.frame-wrap) {
    margin: 0;
    width: 100%;
    height: auto;
    aspect-ratio: var(--mobile-card-aspect, 2 / 3);
  }

  .carousel-item :global(.frame-wrap[data-dynamic-aspect='true']) {
    aspect-ratio: auto;
  }

  .carousel-item :global(.card),
  .carousel-item :global(.frame) {
    height: 100%;
    box-shadow: inset #333 0 0 0 5px, inset rgba(255, 255, 255, 0.5) 0 0 0 6px;
  }

  .carousel-item.active {
    opacity: 1;
    transform: translateY(-14px);
  }

  .carousel-item.active :global(.card),
  .carousel-item.active :global(.frame) {
    box-shadow: inset #333 0 0 0 5px, inset rgba(255, 255, 255, 0.5) 0 0 0 6px;
  }

  .carousel-item.active :global(.card-wrap),
  .carousel-item.active :global(.frame-wrap) {
    pointer-events: auto;
  }

  .carousel-item:not(.active) :global(.card-wrap),
  .carousel-item:not(.active) :global(.frame-wrap) {
    pointer-events: none;
  }

  .carousel-empty {
    height: 1px;
    width: 100%;
  }
</style>
