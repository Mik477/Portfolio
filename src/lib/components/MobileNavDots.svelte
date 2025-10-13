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
        >
          <span class="dot-visual"></span>
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .mobile-dots { 
    position: fixed; 
    right: max(8px, env(safe-area-inset-right)); 
    top: 50%; 
    transform: translateY(-50%); 
    z-index: 5; 
    pointer-events: auto; 
  }
  .mobile-dots ul { 
    list-style: none; 
    margin: 0; 
    padding: 8px; 
    display: flex; 
    flex-direction: column; 
    gap: 8px; /* Tighter spacing for compact look */
  }
  .mobile-dots li { 
    margin: 0; 
    padding: 0; 
  }
  .mobile-dots button { 
    /* Button becomes the full touch target */
    width: 20px; 
    height: 20px; 
    border-radius: 50%; 
    border: none; 
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0; 
    cursor: pointer; 
    pointer-events: auto;
    position: relative;
  }
  .dot-visual {
    /* The actual visible dot */
    display: block;
    width: 8px; 
    height: 8px; 
    border-radius: 50%;
    background: rgba(255,255,255,0.8);
    transform-origin: center;
    transition: transform 220ms cubic-bezier(.2,.8,.2,1), background-color 180ms ease;
  }
  .mobile-dots button.active .dot-visual { 
    transform: scale(1.7); 
    background: rgba(255,255,255,1);
  }
  @media (min-width: 769px) { .mobile-dots { display: none; } }
</style>
