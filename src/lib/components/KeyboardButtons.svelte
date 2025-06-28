<!-- src/lib/components/KeyboardButtons.svelte -->

<script context="module" lang="ts">
  export type KeyboardButtonsInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gsap } from 'gsap';
  import type { SocialLink } from '$lib/data/siteConfig';

  const dispatch = createEventDispatcher();

  export let title: string;
  export let introduction: string;
  export let socialLinks: SocialLink[] = [];
  export let contactSectionIndex: number;
  export let navigateToSection: (index: number) => void;

  let wrapperElement: HTMLDivElement;
  let h2El: HTMLHeadingElement;
  let pEl: HTMLParagraphElement;
  let keyElements: Element[] = [];

  onMount(() => {
    if (wrapperElement) {
        keyElements = gsap.utils.toArray(wrapperElement.querySelectorAll('.key'));
    }
  });

  export function onEnterSection() {
    // FIX: Check for all elements, not just the keys.
    if (!h2El || !pEl || keyElements.length === 0) return;

    // Set initial hidden states for all animatable elements
    gsap.set(h2El, { autoAlpha: 0, y: 40 });
    gsap.set(pEl, { autoAlpha: 0, y: 30 });
    gsap.set(keyElements, { autoAlpha: 0 });

    // FIX: Re-create the full timeline to animate all elements in sequence.
    gsap.timeline({
      // The delay here gives the section slide-in time to complete.
      delay: 0.2,
      onComplete: () => {
        dispatch('animationComplete');
      }
    })
      .to(h2El, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0)
      .to(pEl, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.15)
      .to(keyElements, {
          autoAlpha: 1,
          duration: 0.5,
          ease: 'power1.inOut',
          stagger: 0.1,
        }, 
        0.3
      );
  }

  export function onLeaveSection() {
    // FIX: Ensure all elements are targeted for cleanup.
    const allElements = [h2El, pEl, ...keyElements];
    if (allElements.some(el => !el)) return;
    
    gsap.killTweensOf(allElements);
    gsap.set(allElements, { autoAlpha: 0 });
  }

  const getLink = (name: string): string => {
    const link = socialLinks.find(l => l.name.toLowerCase() === name.toLowerCase());
    return link ? link.url : '#';
  };

  const handleContactClick = () => {
    if (typeof navigateToSection === 'function' && contactSectionIndex !== -1) {
      navigateToSection(contactSectionIndex);
    }
  };
</script>

<div class="about-text-block" bind:this={wrapperElement}>
  <h2 bind:this={h2El}>{title}</h2>
  <p bind:this={pEl}>{introduction}</p>

  <div class="keyboard-buttons-wrapper">
    {#if socialLinks.find(l => l.name.toLowerCase() === 'github')}
    <div class="key-position">
      <a aria-label="Github" class="key" target="_blank" rel="noopener noreferrer" href={getLink('GitHub')}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M10 20.568c-3.429 1.157-6.286 0-8-3.568"></path><path d="M10 22v-3.242c0-.598.184-1.118.48-1.588c.204-.322.064-.78-.303-.88C7.134 15.452 5 14.107 5 9.645c0-1.16.38-2.25 1.048-3.2c.166-.236.25-.354.27-.46c.02-.108-.015-.247-.085-.527c-.283-1.136-.264-2.343.16-3.43c0 0 .877-.287 2.874.96c.456.285.684.428.885.46s.469-.035 1.005-.169A9.5 9.5 0 0 1 13.5 3a9.6 9.6 0 0 1 2.343.28c.536.134.805.2 1.006.169c.2-.032.428-.175.884-.46c1.997-1.247 2.874-.96 2.874-.96c.424 1.087.443 2.294.16 3.43c-.07.28-.104.42-.084.526s.103.225.269.461c.668.95 1.048 2.04 1.048 3.2c0 4.462-2.364 5.807-5.177 6.643c-.367.101-.507.559-.303.88c.296.47.48.99.48 1.589V22"></path></g></svg>
      </a>
    </div>
    {/if}
    {#if socialLinks.find(l => l.name.toLowerCase() === 'linkedin')}
    <div class="key-position">
      <a aria-label="LinkedIn" class="key" target="_blank" rel="noopener noreferrer" href={getLink('LinkedIn')}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 9.5H4c-.943 0-1.414 0-1.707.293S2 10.557 2 11.5V20c0 .943 0 1.414.293 1.707S3.057 22 4 22h.5c.943 0 1.414 0 1.707-.293S6.5 20.943 6.5 20v-8.5c0-.943 0-1.414-.293-1.707S5.443 9.5 4.5 9.5m2-5.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0m5.826 5.25H11.5c-.943 0-1.414 0-1.707.293S9.5 10.557 9.5 11.5V20c0 .943 0 1.414.293 1.707S10.557 22 11.5 22h.5c.943 0 1.414 0 1.707-.293S14 20.943 14 20v-3.5c0-1.657.528-3 2.088-3c.78 0 1.412.672 1.412 1.5v4.5c0 .943 0 1.414.293 1.707s.764.293 1.707.293h.499c.942 0 1.414 0 1.707-.293c.292-.293.293-.764.293-1.706L22 14c0-2.486-2.364-4.5-4.703-4.5c-1.332 0-2.52.652-3.297 1.673c0-.63 0-.945-.137-1.179a1 1 0 0 0-.358-.358c-.234-.137-.549-.137-1.179-.137" color="currentColor"></path></svg>
      </a>
    </div>
    {/if}
    {#if socialLinks.find(l => l.name.toLowerCase() === 'email')}
    <div class="key-position">
      <a aria-label="Email" class="key" target="_blank" rel="noopener noreferrer" href={getLink('Email')}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="m2 6l6.913 3.917c2.549 1.444 3.625 1.444 6.174 0L22 6"></path><path d="M2.016 13.476c.065 3.065.098 4.598 1.229 5.733c1.131 1.136 2.705 1.175 5.854 1.254c1.94.05 3.862.05 5.802 0c3.149-.079 4.723-.118 5.854-1.254c1.131-1.135 1.164-2.668 1.23-5.733c.02-.986.02-1.966 0-2.952c-.066-3.065-.099-4.598-1.23-5.733c-1.131-1.136-2.705-1.175-5.854-1.254a115 115 0 0 0-5.802 0c-3.149.079-4.723.118-5.854 1.254c-1.131 1.135-1.164 2.668-1.23 5.733a69 69 0 0 0 0 2.952"></path></g></svg>
      </a>
    </div>
    {/if}
    <div class="key-position">
      <button type="button" id="about-contact-me-btn" class="key call-to-action peer" on:click={handleContactClick}>
        <span class="call-to-action-content">Contact Me</span>
      </button>
    </div>
  </div>
</div>

<style>
  .about-text-block { max-width: 580px; }
  .about-text-block > p { 
    font-size: clamp(1rem, 2.2vw, 1.15rem); 
    line-height: 1.8; 
    margin-bottom: 2.5rem; 
    color: rgb(212 212 216); 
    opacity: 0;
    visibility: hidden;
  }
  .about-text-block h2 {
    font-size: clamp(2.2rem, 4.5vw, 3rem);
    margin-bottom: 1.5rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: rgb(245 245 247);
    opacity: 0;
    visibility: hidden;
  }
  .keyboard-buttons-wrapper svg { width: 1.75rem; height: 1.75rem; color: var(--keyboard-contrast); }
  .keyboard-buttons-wrapper { display: flex; align-items: flex-start; text-align: center; gap: calc(var(--keyboard-key-base-size) * 0.01); }
  .key-position { perspective: 800px; transform: rotateY(0.05turn) rotateX(-0.1turn); }
  .key.call-to-action { width: 140px; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
  .call-to-action-content { position: relative; }
  .call-to-action-content:after { position: absolute; content: ""; width: 0; left: 0; bottom: -4px; background: var(--keyboard-contrast); height: 1.5px; transition: 0.3s ease-out; }
  .key.call-to-action:hover .call-to-action-content:after { width: 100%;}
  .key { position: relative; width: var(--keyboard-key-base-size); height: var(--keyboard-key-base-size); font-size: calc(var(--keyboard-key-base-size) / 2.2); border: 0.1rem solid var(--keyboard-background-3); border-radius: calc(var(--keyboard-key-base-size) * 0.2); background: var(--keyboard-background-2); color: var(--keyboard-contrast); box-shadow: 0.15rem 0.15rem 0 0 var(--keyboard-background-3), 0.3rem 0.3rem 0 0 var(--keyboard-background-3), 0.45rem 0.45rem 0 0 var(--keyboard-background-3), 0.6rem 0.6rem 0 0 var(--keyboard-background-3); transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; transform-style: preserve-3d; opacity: 0; visibility: hidden; }
  .key span { color: inherit; margin: 0; padding: 0; }
  .key:hover { cursor: pointer; transform: translate(0.3rem, 0.3rem); }
  .key:active { cursor: grabbing; transform: translate(0.8rem, 0.8rem); box-shadow: 0.1rem 0.1rem 0 0 var(--keyboard-background-3), 0.1rem 0.1rem 0 0 var(--keyboard-background-3), 0.2rem 0.2rem 0 0 var(--keyboard-background-3), 0.2rem 0.2rem 0 0 var(--keyboard-background-3); filter: blur(0.02rem); }
  @media (max-width: 640px) { .keyboard-buttons-wrapper { flex-direction: column; align-items: center; gap: 1rem; } }
</style>