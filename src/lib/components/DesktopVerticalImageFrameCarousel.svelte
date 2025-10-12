<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, afterUpdate } from 'svelte';
  import ImageFrameWideCard from '$lib/components/ImageFrameWideCard.svelte';
  import type { ProjectCard } from '$lib/data/projectsData';

  export let cards: ProjectCard[] = [];
  export let initialIndex = 0;
  export let width: string = 'clamp(20vw, 24vw, 28vw)';
  export let height: string = 'clamp(12vw, 13vw, 15vw)';
  export let cardProps: Record<string, unknown> = {};
  export let ariaLabelPrefix: string = 'View details for';

  const dispatch = createEventDispatcher<{
    activate: { index: number };
    select: { index: number };
  }>();

  let activeIndex = 0;
  let scrollAccumulator = 0;
  let wheelCooldownTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingDirection: number | null = null;
  let hasInitialised = false;
  let lastInitialIndex = initialIndex;
  const WHEEL_THRESHOLD = 80;
  const WHEEL_COOLDOWN_MS = 240;
  const LINE_HEIGHT_PX = 16;
  const PAGE_HEIGHT_PX = 640;
  const DELTA_MODE_LINE = 1;
  const DELTA_MODE_PAGE = 2;
  const CARD_HEIGHT_FALLBACK = 180;

  let carouselElement: HTMLDivElement;
  let baseCardHeight: number = CARD_HEIGHT_FALLBACK;
  let resizeObserver: ResizeObserver | null = null;
  let lastMeasuredHeight = 0;

  $: total = cards.length;
  $: cardLayout = cards.map((_, idx) => {
    const offset = idx - activeIndex;
    const distance = Math.abs(offset);
    const direction = Math.sign(offset);
    const translation = direction * computeTranslation(distance, baseCardHeight);
    const scale = 1 - Math.min(distance * 0.08, 0.35);
    const hidden = distance >= 3;
    const opacity = hidden ? 0 : 1 - Math.min(distance * 0.4, 0.82);
    const brightness = hidden ? 0.6 : 1 - Math.min(distance * 0.12, 0.4);
    return { offset, distance, translation, scale, opacity, brightness, hidden };
  });

  $: if (total > 0 && (!hasInitialised || initialIndex !== lastInitialIndex)) {
    const next = clampIndex(initialIndex);
    activeIndex = next;
    hasInitialised = true;
    lastInitialIndex = initialIndex;
    dispatch('activate', { index: activeIndex });
  }

  $: if (hasInitialised && total > 0) {
    const adjusted = clampIndex(activeIndex);
    if (adjusted !== activeIndex) {
      activeIndex = adjusted;
    }
  }

  function clampIndex(idx: number) {
    if (total <= 0) return 0;
    const wrapped = ((idx % total) + total) % total;
    return wrapped;
  }

  function computeTranslation(distance: number, cardHeight: number) {
    if (distance <= 0) return 0;
    const primaryOverlap = cardHeight * 0.62;
    const cascadingStep = cardHeight * 0.48;
    return primaryOverlap + cascadingStep * (distance - 1);
  }

  function setActive(index: number, emit = true) {
    if (total <= 0) return;
    const next = clampIndex(index);
    if (next === activeIndex) return;
    activeIndex = next;
    if (emit) {
      dispatch('activate', { index: activeIndex });
    }
  }

  function changeBy(step: number, { useCooldown = false }: { useCooldown?: boolean } = {}) {
    if (total <= 1 || step === 0) return;
    setActive(activeIndex + step);
    resetWheelAccumulator();
    if (useCooldown) startWheelCooldown();
  }

  function resetWheelAccumulator() {
    scrollAccumulator = 0;
    pendingDirection = null;
  }

  function startWheelCooldown() {
    if (wheelCooldownTimer) {
      clearTimeout(wheelCooldownTimer);
    }
    wheelCooldownTimer = setTimeout(() => {
      wheelCooldownTimer = null;
      if (pendingDirection) {
        const direction = pendingDirection;
        pendingDirection = null;
        changeBy(direction, { useCooldown: true });
      }
    }, WHEEL_COOLDOWN_MS);
  }

  function measureActiveCardHeight() {
    let measured = 0;
    if (carouselElement) {
      const frameWrap = carouselElement.querySelector('.carousel-card.active .frame-wrap') as HTMLElement | null;
      const fallbackCard = carouselElement.querySelector('.carousel-card.active') as HTMLElement | null;
      const target = frameWrap ?? fallbackCard;
      if (target) {
        const rect = target.getBoundingClientRect?.();
        if (rect && rect.height) {
          measured = rect.height;
        }
      }
    }

    if (!measured) {
      const parsed = parseFloat(height);
      measured = Number.isFinite(parsed) ? parsed : CARD_HEIGHT_FALLBACK;
    }

    if (measured && Math.abs(measured - lastMeasuredHeight) > 0.5) {
      baseCardHeight = measured;
      lastMeasuredHeight = measured;
    }
  }

  onMount(() => {
    measureActiveCardHeight();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureActiveCardHeight();
      });
      if (carouselElement) resizeObserver.observe(carouselElement);
    }
  });

  afterUpdate(() => {
    measureActiveCardHeight();
  });

  onDestroy(() => {
    if (wheelCooldownTimer) {
      clearTimeout(wheelCooldownTimer);
      wheelCooldownTimer = null;
    }
    if (resizeObserver && carouselElement) {
      resizeObserver.unobserve(carouselElement);
    }
    resizeObserver = null;
  });

  function normalizeWheelDelta(event: WheelEvent) {
    let primary = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (primary === 0) return 0;

    if (event.deltaMode === DELTA_MODE_LINE) {
      primary *= LINE_HEIGHT_PX;
    } else if (event.deltaMode === DELTA_MODE_PAGE) {
      primary *= PAGE_HEIGHT_PX;
    }
    return primary;
  }

  function handleWheel(event: WheelEvent) {
    if (total <= 1) {
      return;
    }

    if (carouselElement && !carouselElement.contains(event.target as Node)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const delta = normalizeWheelDelta(event);
    if (delta === 0) return;

    scrollAccumulator += delta;

    if (wheelCooldownTimer) {
      const direction = Math.sign(scrollAccumulator);
      pendingDirection = direction !== 0 ? direction : pendingDirection;
      return;
    }

    if (scrollAccumulator <= -WHEEL_THRESHOLD) {
      changeBy(-1, { useCooldown: true });
    } else if (scrollAccumulator >= WHEEL_THRESHOLD) {
      changeBy(1, { useCooldown: true });
    }
  }

  function handleCardPointerEnter(idx: number) {
    if (idx === activeIndex || total <= 1) return;
    setActive(idx, false);
  }

  function handleCardClick(idx: number) {
    if (idx === activeIndex) {
      dispatch('select', { index: idx });
    } else {
      setActive(idx);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (total <= 1) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      changeBy(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      changeBy(-1);
    }
  }
</script>

{#if total === 0}
  <div class="carousel-empty" aria-hidden="true"></div>
{:else}
  <div
    class="desktop-vertical-carousel"
    role="listbox"
    aria-roledescription="carousel"
    aria-label="Project preview carousel"
    tabindex="0"
    bind:this={carouselElement}
    on:mouseleave={resetWheelAccumulator}
    on:wheel|nonpassive={handleWheel}
    on:keydown={handleKeyDown}
  >
    {#each cards as card, idx}
      {@const layout = cardLayout[idx]}
      {@const isActive = idx === activeIndex}
      <div
        class="carousel-card"
        class:active={isActive}
        class:hidden={layout.hidden}
        style="--distance: {layout.distance}; --translation: {layout.translation}px; --scale-factor: {layout.scale}; --fade-opacity: {layout.opacity}; --brightness: {layout.brightness};"
        role="option"
        aria-selected={isActive}
        aria-hidden={layout.hidden}
        data-index={idx}
        tabindex={isActive ? 0 : -1}
        on:focus={() => setActive(idx, false)}
        on:mouseenter={() => handleCardPointerEnter(idx)}
      >
        <button
          type="button"
          class="card-hit-area"
          on:click={() => handleCardClick(idx)}
          aria-label={`${ariaLabelPrefix} ${card.title}`}
        >
          <ImageFrameWideCard
            cardData={card}
            width={width}
            height={height}
            active={isActive}
            {...cardProps}
          />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .desktop-vertical-carousel {
    position: relative;
    display: grid;
    place-items: center;
    width: clamp(360px, 38vw, 680px);
    max-width: 720px;
    height: clamp(420px, 70vh, 880px);
    margin-inline: auto;
    outline: none;
  }

  .desktop-vertical-carousel:focus-visible {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.45);
    border-radius: 18px;
  }

  .carousel-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-style: preserve-3d;
    transition:
      transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
      opacity 0.5s ease,
      filter 0.5s ease;
    transform:
      translate(-50%, -50%)
      translateY(var(--translation))
      scale(var(--scale-factor));
    opacity: var(--fade-opacity);
    filter: brightness(var(--brightness));
    z-index: calc(100 - var(--distance));
    pointer-events: none;
  }

  .carousel-card.hidden {
    opacity: 0;
  }

  .carousel-card.active {
    pointer-events: auto;
  }

  .card-hit-area {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .card-hit-area :global(.frame-wrap) {
    margin: 0;
  }

  .card-hit-area :global(.frame) {
    box-shadow: inset rgba(21, 26, 38, 0.55) 0 0 0 4px, inset rgba(255, 255, 255, 0.45) 0 0 0 5px;
  }

  .card-hit-area:focus-visible :global(.frame) {
    box-shadow:
      rgba(255, 255, 255, 0.25) 0 0 40px 5px,
      rgba(0, 0, 0, 0.66) 0 30px 60px 0,
      inset rgba(21, 26, 38, 0.6) 0 0 0 4px,
      inset rgba(96, 165, 250, 0.85) 0 0 0 6px;
  }

  .card-hit-area:focus-visible {
    outline: none;
  }

  .carousel-empty {
    width: 100%;
    height: 1px;
  }

  @media (max-width: 1024px) {
    .desktop-vertical-carousel {
      width: clamp(320px, 80vw, 540px);
      height: clamp(360px, 65vh, 700px);
    }
  }
</style>
