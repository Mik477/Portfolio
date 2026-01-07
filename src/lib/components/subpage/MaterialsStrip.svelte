<!-- src/lib/components/subpage/MaterialsStrip.svelte -->
<!-- Bottom tag line with pipe-separated materials/components list -->
<script lang="ts">
  export let items: string[] = [];
  export let className: string = '';
</script>

<div class="materials-strip {className}">
  {#each items as item, i}
    <span class="material-item">{item}</span>
    {#if i < items.length - 1}
      <span class="separator">│</span>
    {/if}
  {/each}
</div>

<style>
  .materials-strip {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: clamp(0.5rem, 1vw, 1rem);
    /* Increased padding for larger screens */
    padding: clamp(0.6rem, 1vw + 0.3rem, 1.25rem) clamp(1.25rem, 2vw + 0.5rem, 2.5rem);
    background: rgba(9, 9, 11, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .material-item {
    font-family: 'Space Grotesk', monospace;
    /* Increased scaling for larger screens */
    font-size: clamp(0.7rem, 0.6vw + 0.4rem, 1rem);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgb(245, 245, 247);
  }

  .separator {
    color: rgba(255, 255, 255, 0.2);
    font-weight: 300;
  }
</style>
