// src/lib/stores/renderProfile.ts
import { readable, writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';

type RenderProfile = {
  isMobile: boolean;
  hasCoarsePointer: boolean;
  prefersReducedMotion: boolean;
  layoutProfile: 'tall' | 'balanced' | 'wide';
  // Internal: debug/override flags
  forceMobile?: boolean | null;
};

const initial: RenderProfile = {
  isMobile: false,
  hasCoarsePointer: false,
  prefersReducedMotion: false,
  layoutProfile: 'balanced',
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
  const mqPrimaryCoarse = mql('(pointer: coarse)');
  const mqAnyCoarse = mql('(any-pointer: coarse)');
  const mqReduced = mql('(prefers-reduced-motion: reduce)');
  const mqTall = mql('(max-aspect-ratio: 4/5)');
  const mqWide = mql('(min-aspect-ratio: 5/4)');

  const compute = (override: boolean | null = (get(state).forceMobile ?? null)) => {
    const isMobileWidth = mqMobile ? mqMobile.matches : false;
    const primaryCoarse = mqPrimaryCoarse ? mqPrimaryCoarse.matches : false;
    const anyCoarse = mqAnyCoarse ? mqAnyCoarse.matches : false;
    const reduced = mqReduced ? mqReduced.matches : false;
    const isTall = mqTall ? mqTall.matches : false;
    const isWide = mqWide ? mqWide.matches : false;
    const layoutProfile: RenderProfile['layoutProfile'] = isTall ? 'tall' : (isWide ? 'wide' : 'balanced');
    // Default detection: width, primary coarse pointer, or tall aspect ratio implies mobile layout
    const detectedMobile = isMobileWidth || primaryCoarse || isTall;
    state.update((s) => ({
      ...s,
      isMobile: override === null ? detectedMobile : !!override,
      hasCoarsePointer: anyCoarse, // Use any-pointer to enable touch features on hybrid devices
      prefersReducedMotion: reduced,
      layoutProfile
    }));
  };

  // Initial compute
  compute();

  // Listeners
  const onChange = () => compute();
  mqMobile?.addEventListener('change', onChange);
  mqPrimaryCoarse?.addEventListener('change', onChange);
  mqAnyCoarse?.addEventListener('change', onChange);
  mqReduced?.addEventListener('change', onChange);
  mqTall?.addEventListener('change', onChange);
  mqWide?.addEventListener('change', onChange);

  // Resize fallback for UAs not updating MQLs reliably
  const onResize = () => compute();
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('resize', onResize);

  // Clean-up in HMR scenarios
  if (import.meta && (import.meta as any).hot) {
    (import.meta as any).hot.dispose(() => {
      mqMobile?.removeEventListener('change', onChange);
      mqPrimaryCoarse?.removeEventListener('change', onChange);
      mqAnyCoarse?.removeEventListener('change', onChange);
      mqReduced?.removeEventListener('change', onChange);
      mqTall?.removeEventListener('change', onChange);
      mqWide?.removeEventListener('change', onChange);
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
      const mqPrimaryCoarse = mql('(pointer: coarse)');
      const mqAnyCoarse = mql('(any-pointer: coarse)');
      const mqReduced = mql('(prefers-reduced-motion: reduce)');
      const mqTall = mql('(max-aspect-ratio: 4/5)');
      const mqWide = mql('(min-aspect-ratio: 5/4)');
      const isMobileWidth = mqMobile ? mqMobile.matches : false;
      const primaryCoarse = mqPrimaryCoarse ? mqPrimaryCoarse.matches : false;
      const anyCoarse = mqAnyCoarse ? mqAnyCoarse.matches : false;
      const reduced = mqReduced ? mqReduced.matches : false;
      const isTall = mqTall ? mqTall.matches : false;
      const isWide = mqWide ? mqWide.matches : false;
      const layoutProfile: RenderProfile['layoutProfile'] = isTall ? 'tall' : (isWide ? 'wide' : 'balanced');
      const detectedMobile = isMobileWidth || primaryCoarse || isTall;
      state.set({
        isMobile: forceMobile === null ? detectedMobile : !!forceMobile,
        hasCoarsePointer: anyCoarse,
        prefersReducedMotion: reduced,
        layoutProfile,
        forceMobile
      });
    }
  }
  return get(state);
});

export const isMobile = derived(renderProfile, ($p) => $p.isMobile);
export const prefersReducedMotion = derived(renderProfile, ($p) => $p.prefersReducedMotion);
