<!-- src/lib/components/sections/HeroSection.svelte -->
<script context="module" lang="ts">
  import type { SvelteComponent } from 'svelte';

  // The instance type must now be a superset, including our standard API
  // and the specific Hero API for the orchestrator to use.
  export interface HeroSectionInstance {
    onEnterSection: () => void;
    onLeaveSection: () => void;
    // We still expose the underlying component's methods for fine-grained control
    // during the initial site reveal sequence in +page.svelte.
    onTransitionToHeroStart: () => Promise<void>;
    onTransitionToHeroComplete: () => void;
    onTransitionFromHeroStart: () => void;
  }

  // A more specific type for the internal HeroParticleEffect component instance.
  interface HeroParticleEffectComponent extends SvelteComponent {
    onTransitionToHeroStart: () => Promise<void>;
    onTransitionToHeroComplete: () => void;
    onTransitionFromHeroStart: () => void;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import HeroParticleEffect from '$lib/components/HeroParticleEffect.svelte';

  const dispatch = createEventDispatcher();

  // Props that will be passed down from the orchestrator (+page.svelte)
  export let activeSectionIndex: number;
  export let isTransitioning: boolean;
  export let transitionDuration: number;
  export let isInitialLoad: boolean;

  // Binding for the child particle effect component
  let heroParticleEffectInstance: HeroParticleEffectComponent | null = null;
  
  // --- Standard Animation API Implementation ---

  /**
   * This is the "enter" function for standard section-to-section navigation.
   * It proxies the generic call to the specific method on the particle effect component.
   */
  export function onEnterSection(): void {
    heroParticleEffectInstance?.onTransitionToHeroStart();
  }

  /**
   * This is the "leave" function for standard section-to-section navigation.
   * It proxies the generic call to the specific method on the particle effect component.
   */
  export function onLeaveSection(): void {
    heroParticleEffectInstance?.onTransitionFromHeroStart();
  }


  // --- Exposing the underlying API for fine-grained control ---
  // These are needed for the initial site load/reveal sequence in +page.svelte,
  // which has slightly different logic than a standard section transition.

  export function onTransitionToHeroStart(): Promise<void> {
    return heroParticleEffectInstance?.onTransitionToHeroStart() ?? Promise.resolve();
  }

  export function onTransitionToHeroComplete(): void {
    heroParticleEffectInstance?.onTransitionToHeroComplete();
  }

  export function onTransitionFromHeroStart(): void {
    heroParticleEffectInstance?.onTransitionFromHeroStart();
  }

</script>

<!-- 
  This wrapper contains the HeroParticleEffect. It ensures the effect is
  always present in the DOM, ready to be animated. The `div` itself
  doesn't need styling as the particle effect creates its own full-screen canvas.
-->
<div class="hero-section-wrapper">
  <HeroParticleEffect
    bind:this={heroParticleEffectInstance}
    {activeSectionIndex}
    {isTransitioning}
    {transitionDuration}
    {isInitialLoad}
    on:ready={() => dispatch('ready')}
  />
</div>

<style>
  .hero-section-wrapper {
    /* 
      This wrapper needs to occupy the full space of its parent <section>
      to ensure the particle effect's container (which is appended inside it)
      can correctly calculate its dimensions.
    */
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>