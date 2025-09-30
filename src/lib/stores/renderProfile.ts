// src/lib/stores/renderProfile.ts
import { readable, writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';

type RenderProfile = {
  isMobile: boolean;
  hasCoarsePointer: boolean;
  prefersReducedMotion: boolean;
  // Internal: debug/override flags
  forceMobile?: boolean | null;
};

const initial: RenderProfile = {
  isMobile: false,
  hasCoarsePointer: false,
  prefersReducedMotion: false,
  forceMobile: null
};

const state = writable<RenderProfile>(initial);

// Media query helpers
function mql(query: string): MediaQueryList | null {
  if (!browser || typeof window.matchMedia !== 'function') return null;
  try { return window.matchMedia(query); } catch { return null; }
}

// Set up listeners only in browser
if (browser) {
  const mqMobile = mql('(max-width: 768px)');
  const mqCoarse = mql('(pointer: coarse)');
  const mqReduced = mql('(prefers-reduced-motion: reduce)');

  const compute = (override: boolean | null = (get(state).forceMobile ?? null)) => {
    const isMobileWidth = mqMobile ? mqMobile.matches : false;
    const coarse = mqCoarse ? mqCoarse.matches : false;
    const reduced = mqReduced ? mqReduced.matches : false;
    // Default detection: width or coarse pointer implies mobile
    const detectedMobile = isMobileWidth || coarse;
    state.update((s) => ({
      ...s,
      isMobile: override === null ? detectedMobile : !!override,
      hasCoarsePointer: coarse,
      prefersReducedMotion: reduced
    }));
  };

  // Initial compute
  compute();

  // Listeners
  const onChange = () => compute();
  mqMobile?.addEventListener('change', onChange);
  mqCoarse?.addEventListener('change', onChange);
  mqReduced?.addEventListener('change', onChange);

  // Resize fallback for UAs not updating MQLs reliably
  const onResize = () => compute();
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('resize', onResize);

  // Clean-up in HMR scenarios
  if (import.meta && (import.meta as any).hot) {
    (import.meta as any).hot.dispose(() => {
      mqMobile?.removeEventListener('change', onChange);
      mqCoarse?.removeEventListener('change', onChange);
      mqReduced?.removeEventListener('change', onChange);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('resize', onResize);
    });
  }
}

// Expose derived store synced with ?mobile=1/0 override
export const renderProfile = derived([state, page], ([$state, $page]) => {
  if (!browser) return $state; // SSR safe
  const sp = $page?.url?.searchParams;
  const mobileParam = sp?.get('mobile');
  let forceMobile: boolean | null = null;
  if (mobileParam === '1' || mobileParam === 'true') forceMobile = true;
  if (mobileParam === '0' || mobileParam === 'false') forceMobile = false;
  if (forceMobile !== $state.forceMobile) {
    // Update override and recompute
    state.update((s) => ({ ...s, forceMobile }));
    // Computation will run on next tick for browser listeners; also do a direct apply
    if (browser) {
      const mqMobile = mql('(max-width: 768px)');
      const mqCoarse = mql('(pointer: coarse)');
      const mqReduced = mql('(prefers-reduced-motion: reduce)');
      const isMobileWidth = mqMobile ? mqMobile.matches : false;
      const coarse = mqCoarse ? mqCoarse.matches : false;
      const reduced = mqReduced ? mqReduced.matches : false;
      const detectedMobile = isMobileWidth || coarse;
      state.set({
        isMobile: forceMobile === null ? detectedMobile : !!forceMobile,
        hasCoarsePointer: coarse,
        prefersReducedMotion: reduced,
        forceMobile
      });
    }
  }
  return get(state);
});

export const isMobile = derived(renderProfile, ($p) => $p.isMobile);
export const prefersReducedMotion = derived(renderProfile, ($p) => $p.prefersReducedMotion);
