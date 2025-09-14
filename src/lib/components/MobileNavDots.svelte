<!-- src/lib/components/MobileNavDots.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';

  export let sections: { id: string; label?: string }[] = [];
  export let activeIndex = 0;

  const dispatch = createEventDispatcher<{ select: { index: number } }>();

  function onSelect(i: number) {
    dispatch('select', { index: i });
  }
</script>

<nav class="mobile-dots" aria-label="Section navigation">
  <ul>
    {#each sections as s, i}
      <li>
        <button
          class:active={i === activeIndex}
          aria-label={s.label ?? s.id}
          aria-current={i === activeIndex ? 'true' : undefined}
          on:click={() => onSelect(i)}
        ></button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .mobile-dots { position: fixed; right: max(8px, env(safe-area-inset-right)); top: 50%; transform: translateY(-50%); z-index: 5; }
  .mobile-dots ul { list-style: none; margin: 0; padding: 8px; display: flex; flex-direction: column; gap: 12px; }
  .mobile-dots li { margin: 0; padding: 0; }
  .mobile-dots button { 
    width: 8px; height: 8px; border-radius: 50%; border: none; 
    background: rgba(255,255,255,0.8); display: block; padding: 0; cursor: pointer; 
    transform-origin: center; transition: transform 220ms cubic-bezier(.2,.8,.2,1), background-color 180ms ease; 
  }
  .mobile-dots button.active { 
    transform: scale(1.7); 
    background: rgba(255,255,255,1);
  }
  @media (min-width: 769px) { .mobile-dots { display: none; } }
</style>
