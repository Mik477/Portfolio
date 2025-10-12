<!-- src/lib/components/ImageFrameWideCard.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProjectCard } from '$lib/data/projectsData';

  export let cardData: ProjectCard;
  export let width: string = '320px';
  export let height: string = '180px';
  export let active: boolean = false;
  export let maxTilt: number = 4; // degrees
  export let disableTilt: boolean = false;
  export let useMobileImage: boolean = false;

  const imageAspectCache = new Map<string, number>();
  const isBrowser = typeof window !== 'undefined';

  let frameWrapElement: HTMLDivElement;
  let resizeObserver: ResizeObserver | null = null;
  let pointerAttached = false;

  let rectWidth = 0;
  let rectHeight = 0;
  let rectLeft = 0;
  let rectTop = 0;

  let imageToken = 0;
  let hasMeasuredAspect = false;
  let imageAspect = 16 / 9;

  // Target transforms (degrees / px)
  let targetRotX = 0;
  let targetRotY = 0;
  let targetTranslateX = 0;
  let targetTranslateY = 0;

  // Rendered transforms with smoothing
  let rotX = 0;
  let rotY = 0;
  let translateX = 0;
  let translateY = 0;

  let rafId: number | null = null;

  const SMOOTHING = 0.18;
  const MIN_DELTA = 0.015;

  $: effectiveTilt = disableTilt ? 0 : Math.max(0, maxTilt);
  $: tiltDisabled = effectiveTilt === 0;

  function updateRect() {
    if (!frameWrapElement) return;
    const rect = frameWrapElement.getBoundingClientRect();
    rectWidth = rect.width;
    rectHeight = rect.height;
    rectLeft = rect.left;
    rectTop = rect.top;
  }

  function attachPointer() {
    if (!frameWrapElement || pointerAttached || tiltDisabled) return;
    frameWrapElement.addEventListener('pointermove', handlePointerMove);
    frameWrapElement.addEventListener('pointerenter', handlePointerEnter);
    frameWrapElement.addEventListener('pointerleave', handlePointerLeave);
    frameWrapElement.addEventListener('pointerdown', handlePointerEnter);
    pointerAttached = true;
  }

  function detachPointer() {
    if (!frameWrapElement || !pointerAttached) return;
    frameWrapElement.removeEventListener('pointermove', handlePointerMove);
    frameWrapElement.removeEventListener('pointerenter', handlePointerEnter);
    frameWrapElement.removeEventListener('pointerleave', handlePointerLeave);
    frameWrapElement.removeEventListener('pointerdown', handlePointerEnter);
    pointerAttached = false;
  }

  function cancelAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function animateFrame() {
    rafId = null;
    const nextRotX = rotX + (targetRotX - rotX) * SMOOTHING;
    const nextRotY = rotY + (targetRotY - rotY) * SMOOTHING;
    const nextTranslateX = translateX + (targetTranslateX - translateX) * SMOOTHING;
    const nextTranslateY = translateY + (targetTranslateY - translateY) * SMOOTHING;

    rotX = nextRotX;
    rotY = nextRotY;
    translateX = nextTranslateX;
    translateY = nextTranslateY;

    const stillMoving =
      Math.abs(rotX - targetRotX) > MIN_DELTA ||
      Math.abs(rotY - targetRotY) > MIN_DELTA ||
      Math.abs(translateX - targetTranslateX) > MIN_DELTA ||
      Math.abs(translateY - targetTranslateY) > MIN_DELTA;

    if (stillMoving) {
      rafId = requestAnimationFrame(animateFrame);
    }
  }

  function scheduleAnimation() {
    if (rafId === null) {
      rafId = requestAnimationFrame(animateFrame);
    }
  }

  function handlePointerEnter() {
    if (tiltDisabled) return;
    updateRect();
  }

  function handlePointerLeave() {
    targetRotX = 0;
    targetRotY = 0;
    targetTranslateX = 0;
    targetTranslateY = 0;
    scheduleAnimation();
  }

  function handlePointerMove(event: PointerEvent) {
    if (tiltDisabled || !rectWidth || !rectHeight) return;
    const { clientX, clientY } = event;
    const relativeX = (clientX - rectLeft) / rectWidth;
    const relativeY = (clientY - rectTop) / rectHeight;

    const centeredX = Math.max(-0.5, Math.min(0.5, relativeX - 0.5)) * 2; // [-1, 1]
    const centeredY = Math.max(-0.5, Math.min(0.5, relativeY - 0.5)) * 2;

    targetRotY = centeredX * effectiveTilt;
    targetRotX = -centeredY * effectiveTilt;

    targetTranslateX = 0;
    targetTranslateY = 0;

    scheduleAnimation();
  }

  async function fetchImageAspect(src: string): Promise<number> {
    const cached = imageAspectCache.get(src);
    if (cached) return cached;

    if (!isBrowser || typeof Image === 'undefined') {
      return 0;
    }

    const aspect = await new Promise<number>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';

      const finalize = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          reject(new Error(`Image has no dimensions: ${src}`));
          return;
        }
        resolve(img.naturalWidth / img.naturalHeight);
      };

      img.onload = finalize;
      img.onerror = () => reject(new Error(`Failed to load card image: ${src}`));
      img.src = src;

      if (img.complete && img.naturalWidth && img.naturalHeight) {
        finalize();
      } else if (typeof img.decode === 'function') {
        img
          .decode()
          .then(finalize)
          .catch(() => {
            if (img.complete && img.naturalWidth && img.naturalHeight) {
              finalize();
            }
          });
      }
    });

    imageAspectCache.set(src, aspect);
    return aspect;
  }

  async function updateImageFit(src: string | undefined) {
    imageToken += 1;
    const token = imageToken;

    if (!src) {
      hasMeasuredAspect = false;
      imageAspect = 16 / 9;
      return;
    }

    try {
      const aspect = await fetchImageAspect(src);
      if (token !== imageToken) return;
      if (aspect > 0) {
        imageAspect = aspect;
        hasMeasuredAspect = true;
        if (isBrowser) {
          requestAnimationFrame(() => updateRect());
        }
      } else {
        hasMeasuredAspect = false;
      }
    } catch (error) {
      console.warn(error);
      if (token === imageToken) {
        hasMeasuredAspect = false;
      }
    }
  }

  $: preferredImage = (useMobileImage && cardData?.cardImageMobile) ? cardData.cardImageMobile : cardData?.cardImage;

  $: if (isBrowser) {
    void updateImageFit(preferredImage);
  }

  $: useAspectRatio = hasMeasuredAspect && imageAspect > 0;
  $: aspectRatioValue = useAspectRatio ? `${imageAspect.toFixed(6)} / 1` : undefined;
  $: inlineHeight = useAspectRatio ? undefined : height;
  $: imageAlt = cardData.title ? `${cardData.title} preview` : 'Project image';

  onMount(() => {
    updateRect();
    if (typeof ResizeObserver !== 'undefined' && frameWrapElement) {
      resizeObserver = new ResizeObserver(() => updateRect());
      resizeObserver.observe(frameWrapElement);
    }
    if (!tiltDisabled) {
      attachPointer();
    }
  });

  onDestroy(() => {
    cancelAnimation();
    detachPointer();
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  $: if (tiltDisabled) {
    detachPointer();
    targetRotX = 0;
    targetRotY = 0;
    targetTranslateX = 0;
    targetTranslateY = 0;
    rotX = 0;
    rotY = 0;
    translateX = 0;
    translateY = 0;
    cancelAnimation();
  } else {
    attachPointer();
  }

  $: frameTransform = `transform: rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg);`;
  $: imageTransform = `transform: translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0)`;
</script>

<div
  class="frame-wrap"
  class:is-active={active}
  style:width
  style:height={inlineHeight}
  style:aspect-ratio={aspectRatioValue}
  data-dynamic-aspect={useAspectRatio}
  bind:this={frameWrapElement}
  role="group"
  aria-label={(cardData.title ?? 'Project preview') + ' frame'}
>
  <div class="frame" style={frameTransform}>
    <div class="image-layer" style={imageTransform} aria-hidden="true">
      {#if preferredImage}
        <img
          class="image"
          src={preferredImage}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
        >
      {/if}
    </div>
    <div class="mask"></div>
    <div class="caption">
      <div class="card-info">
        <h3 class="card-title">{cardData.title}</h3>
        {#if cardData.description}
          <p class="card-description">{cardData.description}</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :root {
    --frame-border-color: rgba(255, 255, 255, 0.55);
    --frame-border-inner: rgba(255, 255, 255, 0.15);
    --frame-caption-bg: transparent;
    --frame-caption-color: rgba(243, 244, 246, 0.94);
    --frame-shadow: 0 18px 50px -20px rgba(10, 13, 20, 0.75);
    --frame-active-shadow: 0 25px 60px -25px rgba(10, 13, 20, 0.9);

    /* Text logic matching parallax card */
    --card-info-padding: 18px;
    --card-title-bottom-anchor: 20%;
    --card-description-bottom-anchor: 8%;
    --card-title-transition-duration: 0.8s;
    --card-title-hover-lift: -32px;
    --card-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --card-title-initial-weight: 400;
    --card-title-hover-weight: 620;
    --card-title-letter-spacing-base: 0.0125em;
    --card-title-letter-spacing-hover: 0.04em;
    --card-description-fade-duration: 1.5s;
    --card-description-slide-duration: 1.3s;
    --card-description-initial-offset: 80px;
  }

  .frame-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .frame {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: radial-gradient(circle at top, rgba(255, 255, 255, 0.04), rgba(12, 16, 24, 0.95));
    box-shadow: var(--frame-shadow);
    transition: box-shadow 0.45s ease, transform 0.45s ease;
    will-change: transform, box-shadow;
  }

  .frame-wrap:hover .frame,
  .frame-wrap.is-active .frame {
    box-shadow: var(--frame-active-shadow);
  }

  .image-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 16px;
    transition: transform 0.35s ease;
    will-change: transform;
  }

  .image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    filter: saturate(1.05) contrast(1.02);
    transition: transform 0.4s ease, filter 0.4s ease;
    z-index: 0;
  }

  .mask {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 1px var(--frame-border-color),
      inset 0 0 0 4px rgba(255, 255, 255, 0.06),
      inset 0 0 30px 0 rgba(8, 11, 17, 0.35);
  }

  .frame::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    border: 1px solid var(--frame-border-inner);
    opacity: 0.4;
    pointer-events: none;
  }

  .caption {
    position: absolute;
    inset: 0;
    padding: var(--card-info-padding);
    background: var(--frame-caption-bg);
    color: #fff;
    display: block;
  }

  .card-info {
    position: absolute;
    inset: 0;
    display: block;
  }

  .card-title {
    position: absolute;
    left: var(--card-info-padding);
    right: var(--card-info-padding);
    bottom: var(--card-title-bottom-anchor);
    margin: 0;
    font-size: clamp(1.3rem, 4.2vw, 1.9rem);
    font-family: var(--card-font-family);
    text-shadow: rgba(0, 0, 0, 0.5) 0 10px 10px;
    letter-spacing: var(--card-title-letter-spacing-base);
    transform: translateY(0);
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
    margin: 0;
    opacity: 0;
    transform: translateY(var(--card-description-initial-offset));
    transition:
      opacity var(--card-description-fade-duration) cubic-bezier(0.16, 1, 0.3, 1),
      transform var(--card-description-slide-duration) cubic-bezier(0.16, 1, 0.3, 1);
    text-shadow: black 0 2px 3px;
    font-size: clamp(0.85rem, 2.5vw, 1.05rem);
    line-height: 1.5;
    font-family: var(--card-font-family);
  }

  .frame-wrap:hover .card-title,
  .frame-wrap.is-active .card-title {
    font-weight: var(--card-title-hover-weight);
    letter-spacing: var(--card-title-letter-spacing-hover);
    transform: translateY(var(--card-title-hover-lift));
  }

  .frame-wrap:hover .card-description,
  .frame-wrap.is-active .card-description {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    .frame-wrap {
      width: 100%;
      height: auto;
      min-height: 200px;
    }

    .frame {
      border-radius: 18px;
    }

    .card-title {
      font-size: clamp(1.25rem, 6vw, 1.6rem);
    }

    .card-description {
      font-size: clamp(0.85rem, 3vw, 0.95rem);
    }
  }
</style>
