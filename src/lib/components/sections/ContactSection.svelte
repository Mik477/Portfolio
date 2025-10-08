<!-- src/lib/components/sections/ContactSection.svelte -->
<script context="module" lang="ts">
  // Public API for lifecycle
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
  import type { SocialLink } from '$lib/data/siteConfig';
  import ContactEffect from './ContactEffect.svelte';
  import type { ContactEffectInstance } from './ContactEffect.svelte';

  const dispatch = createEventDispatcher();

  export let data: ContactContent;
  // Social links passed from the About section (GitHub, LinkedIn, Email)
  export let socialLinks: SocialLink[] = [];

  // Precomputed segments for the outro message supporting [[br]] (with optional spaces) or literal newlines
  let outroSegments: string[] = [];
  $: {
    const raw = data?.outroMessage ?? '';
    // Normalize: if contains our break token variant
    const tokenRegex = /\s*\[\[br\]\]\s*/i; // remove surrounding spaces when splitting
    if (tokenRegex.test(raw)) {
      outroSegments = raw.split(tokenRegex).map(s => s.trim()).filter(Boolean);
    } else if (raw.includes('\n')) {
      outroSegments = raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
    } else {
      outroSegments = [raw];
    }
  }

  let contactEffectInstance: ContactEffectInstance | null = null;
  let wrapperEl: HTMLDivElement;
  let h2El: HTMLHeadingElement;
  let pEl: HTMLParagraphElement;
  let keyPositionElements: Element[] = [];

  onMount(() => {
    if (wrapperEl) {
      keyPositionElements = gsap.utils.toArray(wrapperEl.querySelectorAll('.key-position'));
    }
  });

  /* ---------------- Lifecycle & Animation ---------------- */
  export async function initializeEffect() {
    if (contactEffectInstance?.initializeEffect) {
      await contactEffectInstance.initializeEffect();
    }
  }

  export function onEnterSection() {
    // Force initialization attempt immediately when entering (covers direct jumps where preload didn't run)
    if (contactEffectInstance) {
      try { initializeEffect(); } catch {}
      contactEffectInstance.onEnterSection();
    }

    if (!h2El || !pEl || keyPositionElements.length === 0) return;

    gsap.set(h2El, { autoAlpha: 0, y: 30 });
    gsap.set(pEl, { autoAlpha: 0, y: 20 });
    gsap.set(keyPositionElements, { autoAlpha: 0, y: 15 });

    gsap.timeline({
      delay: 0.5,
      onComplete: () => { dispatch('animationComplete'); }
    })
      .to(h2El, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0)
      .to(pEl, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.1)
      .to(keyPositionElements, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.25);
  }

  export async function onTransitionComplete() {
    // Ensure effect is fully initialized before we trigger its transition-complete fade
    if (contactEffectInstance) {
      if (contactEffectInstance.initializeEffect) {
        try { await contactEffectInstance.initializeEffect(); } catch {}
      }
      contactEffectInstance.onTransitionComplete?.();
    }
  }

  export function onLeaveSection() {
    contactEffectInstance?.onLeaveSection();
    const all = [h2El, pEl, ...keyPositionElements];
    gsap.killTweensOf(all);
    gsap.set(all, { autoAlpha: 0 });
  }

  export function onUnload() {
    contactEffectInstance?.onUnload();
  }

  /* ---------------- Helpers ---------------- */
  const getLink = (name: string): string => {
    const link = socialLinks.find(l => l.name.toLowerCase() === name.toLowerCase());
    return link ? link.url : '#';
  };

  // Determine resume link (first additional link containing resume/lebenslauf or fallback)
  const resumeLink: string = (() => {
    const match = data.additionalLinks?.find(l => /resume|lebenslauf/i.test(l.name));
    return match?.url || '/resume.pdf';
  })();
</script>

<div class="contact-section-wrapper" bind:this={wrapperEl}>
  <ContactEffect bind:this={contactEffectInstance} />
  <div class="contact-content">
    <div class="contact-text-block">
      <h2 bind:this={h2El}>{data.title}</h2>
      <p bind:this={pEl}>
        {#each outroSegments as seg, i (i)}
          {seg}{#if i < outroSegments.length - 1}<br>{/if}
        {/each}
      </p>
      <div class="keyboard-buttons-wrapper">
        {#if socialLinks.find(l => l.name.toLowerCase() === 'github')}
          <div class="key-position gpu-prewarm-target">
            <a aria-label="GitHub" class="key" target="_blank" rel="noopener noreferrer" href={getLink('GitHub')}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M10 20.568c-3.429 1.157-6.286 0-8-3.568"/><path d="M10 22v-3.242c0-.598.184-1.118.48-1.588c.204-.322.064-.78-.303-.88C7.134 15.452 5 14.107 5 9.645c0-1.16.38-2.25 1.048-3.2c.166-.236.25-.354.27-.46c.02-.108-.015-.247-.085-.527c-.283-1.136-.264-2.343.16-3.43c0 0 .877-.287 2.874.96c.456.285.684.428.885.46s.469-.035 1.005-.169A9.5 9.5 0 0 1 13.5 3a9.6 9.6 0 0 1 2.343.28c.536.134.805.2 1.006.169c.2-.032.428-.175.884-.46c1.997-1.247 2.874-.96 2.874-.96c.424 1.087.443 2.294.16 3.43c-.07.28-.104.42-.084.526s.103.225.269.461c.668.95 1.048 2.04 1.048 3.2c0 4.462-2.364 5.807-5.177 6.643c-.367.101-.507.559-.303.88c.296.47.48.99.48 1.589V22"/></g></svg>
            </a>
          </div>
        {/if}
        {#if socialLinks.find(l => l.name.toLowerCase() === 'linkedin')}
          <div class="key-position gpu-prewarm-target">
            <a aria-label="LinkedIn" class="key" target="_blank" rel="noopener noreferrer" href={getLink('LinkedIn')}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 9.5H4c-.943 0-1.414 0-1.707.293S2 10.557 2 11.5V20c0 .943 0 1.414.293 1.707S3.057 22 4 22h.5c.943 0 1.414 0 1.707-.293S6.5 20.943 6.5 20v-8.5c0-.943 0-1.414-.293-1.707S5.443 9.5 4.5 9.5m2-5.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0m5.826 5.25H11.5c-.943 0-1.414 0-1.707.293S9.5 10.557 9.5 11.5V20c0 .943 0 1.414.293 1.707S10.557 22 11.5 22h.5c.943 0 1.414 0 1.707-.293S14 20.943 14 20v-3.5c0-1.657.528-3 2.088-3c.78 0 1.412.672 1.412 1.5v4.5c0 .943 0 1.414.293 1.707s.764.293 1.707.293h.499c.942 0 1.414 0 1.707-.293c.292-.293.293-.764.293-1.706L22 14c0-2.486-2.364-4.5-4.703-4.5c-1.332 0-2.52.652-3.297 1.673c0-.63 0-.945-.137-1.179a1 1 0 0 0-.358-.358c-.234-.137-.549-.137-1.179-.137" color="currentColor"/></svg>
            </a>
          </div>
        {/if}
        {#if socialLinks.find(l => l.name.toLowerCase() === 'instagram')}
          <div class="key-position gpu-prewarm-target">
            <a aria-label="Instagram" class="key" target="_blank" rel="noopener noreferrer" href={getLink('Instagram')}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="4"/><circle cx="12" cy="12" r="5"/><path d="M16 7h.01"/></g></svg>
            </a>
          </div>
        {/if}
        {#if socialLinks.find(l => l.name.toLowerCase() === 'email')}
          <div class="key-position gpu-prewarm-target">
            <a aria-label="Email" class="key" href={getLink('Email')}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="m2 6l6.913 3.917c2.549 1.444 3.625 1.444 6.174 0L22 6"/><path d="M2.016 13.476c.065 3.065.098 4.598 1.229 5.733c1.131 1.136 2.705 1.175 5.854 1.254c1.94.05 3.862.05 5.802 0c3.149-.079 4.723-.118 5.854-1.254c1.131-1.135 1.164-2.668 1.23-5.733c.02-.986.02-1.966 0-2.952c-.066-3.065-.099-4.598-1.23-5.733c-1.131-1.136-2.705-1.175-5.854-1.254a115 115 0 0 0-5.802 0c-3.149.079-4.723.118-5.854 1.254c-1.131 1.135-1.164 2.668-1.23 5.733a69 69 0 0 0 0 2.952"/></g></svg>
            </a>
          </div>
        {/if}
        <div class="key-position key-position-cta gpu-prewarm-target">
          <a aria-label="Download Resume" class="key call-to-action" href={resumeLink} download>
            <span class="call-to-action-content">{(data.additionalLinks?.[0]?.name) ?? 'Resume'}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .contact-section-wrapper { width: 100%; height: 100%; position: relative; overflow: hidden; background: transparent; }
  .contact-content { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; display: flex; align-items: center; padding: 3rem max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem) calc(3rem + env(safe-area-inset-bottom, 0px)); box-sizing: border-box; }
  .contact-text-block { max-width: 860px; text-align: left; }
  .contact-text-block h2 { font-size: clamp(2.2rem, 4.5vw, 3rem); margin-bottom: 1.5rem; font-weight: 300; letter-spacing: -0.02em; color: rgb(245 245 247); opacity: 0; visibility: hidden; }
  .contact-text-block p { font-size: clamp(1rem, 2.2vw, 1.15rem); line-height: 1.8; margin-bottom: 2.5rem; color: rgb(212 212 216); opacity: 0; visibility: hidden; }

  /* Keyboard style buttons (duplicated minimal styles from About for isolation) */
  .keyboard-buttons-wrapper { display: flex; align-items: flex-start; gap: calc(var(--keyboard-key-base-size) * 0.01); flex-wrap: nowrap; }
  .keyboard-buttons-wrapper svg { width: 1.75rem; height: 1.75rem; color: var(--keyboard-contrast); }
  .key-position { perspective: 800px; transform: rotateY(0.05turn) rotateX(-0.1turn); }
  .key { position: relative; width: var(--keyboard-key-base-size); height: var(--keyboard-key-base-size); font-size: calc(var(--keyboard-key-base-size) / 2.2); border: 0.1rem solid var(--keyboard-background-3); border-radius: calc(var(--keyboard-key-base-size) * 0.2); background: var(--keyboard-background-2); color: var(--keyboard-contrast); box-shadow: 0.15rem 0.15rem 0 0 var(--keyboard-background-3), 0.3rem 0.3rem 0 0 var(--keyboard-background-3), 0.45rem 0.45rem 0 0 var(--keyboard-background-3), 0.6rem 0.6rem 0 0 var(--keyboard-background-3); transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; transform-style: preserve-3d; }
  .key:hover { cursor: pointer; transform: translate(0.3rem, 0.3rem); }
  .key:active { transform: translate(0.8rem, 0.8rem); box-shadow: 0.1rem 0.1rem 0 0 var(--keyboard-background-3), 0.1rem 0.1rem 0 0 var(--keyboard-background-3), 0.2rem 0.2rem 0 0 var(--keyboard-background-3), 0.2rem 0.2rem 0 0 var(--keyboard-background-3); filter: blur(0.02rem); }
  .key.call-to-action { width: 160px; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  .call-to-action-content { position: relative; }
  .call-to-action-content:after { position: absolute; content: ""; width: 0; left: 0; bottom: -4px; background: var(--keyboard-contrast); height: 1.5px; transition: 0.3s ease-out; }
  .key.call-to-action:hover .call-to-action-content:after { width: 100%; }

  @media (max-width: 640px) {
    .contact-content {
      padding: 2.25rem 1.25rem calc(2.5rem + env(safe-area-inset-bottom, 0px) + 1.25rem);
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      min-height: 100%;
    }

    .contact-text-block {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
    }

    .keyboard-buttons-wrapper {
      flex-wrap: wrap;
      gap: 0.6rem;
      row-gap: 0.75rem;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
      margin-top: auto;
      margin-bottom: 4rem; /* add slight bottom spacing on mobile */
    }

    .key-position-cta {
      flex-basis: 100%;
      display: flex;
      justify-content: flex-start;
      margin-top: 0;
    }
  }
</style>