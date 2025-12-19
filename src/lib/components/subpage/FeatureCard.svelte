<!-- src/lib/components/subpage/FeatureCard.svelte -->
<!-- Individual feature card with optional icon, headline, and content -->
<script lang="ts">
  export let title: string;
  export let icon: string | undefined = undefined;
  export let className: string = '';
  export let fullWidth: boolean = false;

  // Content passed via slot
</script>

<div class="feature-card {className}" class:full-width={fullWidth}>
  {#if icon}
    <div class="feature-icon">{icon}</div>
  {/if}
  
  <h3 class="feature-headline">{title}</h3>
  
  <div class="feature-content">
    <slot />
  </div>
</div>

<style>
  .feature-card {
    background: rgba(9, 9, 11, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: clamp(1rem, 2vw, 1.5rem);
    display: flex;
    flex-direction: column;
  }

  .feature-card.full-width {
    width: 100%;
  }

  .feature-icon {
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    margin-bottom: 0.75rem;
    opacity: 0.9;
  }

  .feature-headline {
    font-size: clamp(1rem, 1.8vw, 1.3rem);
    font-weight: 600;
    font-family: 'Space Grotesk', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(245, 245, 247);
    padding-bottom: 0.4rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    margin: 0 0 0.75rem 0;
  }

  .feature-content {
    font-size: clamp(0.85rem, 1.3vw, 1rem);
    line-height: 1.6;
    color: rgba(220, 220, 225, 0.95);
  }

  .feature-content :global(ul) {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .feature-content :global(li) {
    padding-left: 1.2em;
    position: relative;
    margin-bottom: 0.4rem;
  }

  .feature-content :global(li::before) {
    content: '•';
    position: absolute;
    left: 0;
    color: rgba(255, 255, 255, 0.5);
  }

  .feature-content :global(p) {
    margin: 0;
  }
</style>
