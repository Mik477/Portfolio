<!-- src/lib/components/subpage/StatsBar.svelte -->
<!-- Horizontal stats display with monospace numerals and uppercase labels -->
<script context="module" lang="ts">
  export interface StatItem {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  export let stats: StatItem[] = [];
  export let className: string = '';
</script>

<div class="stats-bar {className}">
  {#each stats as stat}
    <div class="stat-item">
      <span class="stat-value">{stat.value}</span>
      <span class="stat-label">{stat.label}</span>
    </div>
  {/each}
</div>

<style>
  .stats-bar {
    display: flex;
    justify-content: center;
    gap: clamp(1rem, 3vw, 2.5rem);
    padding: clamp(0.75rem, 1.5vw, 1.25rem) clamp(1.5rem, 3vw, 3rem);
    background: rgba(9, 9, 11, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: clamp(4rem, 8vw, 6rem);
  }

  .stat-value {
    font-size: clamp(1.2rem, 2vw, 1.8rem);
    font-weight: 600;
    font-family: 'Space Grotesk', monospace;
    color: rgb(245, 245, 247);
    line-height: 1.2;
  }

  .stat-label {
    font-size: clamp(0.55rem, 0.8vw, 0.7rem);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(180, 180, 185, 0.9);
    margin-top: 0.25rem;
  }
</style>
