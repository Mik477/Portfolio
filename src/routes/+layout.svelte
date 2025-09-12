<!-- src/routes/+layout.svelte -->
<script lang="ts">
  // Import the global stylesheet. This is the new line.
  import '../app.css';
  import TransitionOverlay from '$lib/components/TransitionOverlay.svelte';
  import LegalFooter from '$lib/components/LegalFooter.svelte';
  import { siteConfig } from '$lib/data/siteConfig';
  import { initialSiteLoadComplete } from '$lib/stores/preloadingStore';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';

  let isHome: boolean;
  let showFooter: boolean;
  $: isHome = $page.url.pathname === '/';
  $: showFooter = isHome ? $initialSiteLoadComplete : true;
  const fadeIn = { duration: 250 };
</script>

<TransitionOverlay />

<slot />

{#if showFooter}
  <div in:fade={fadeIn}>
    <LegalFooter legalLinks={siteConfig.legalLinks} />
  </div>
{/if}

<!-- 
  The <style> block has been removed from here and its contents
  have been moved to src/app.css, as per SvelteKit best practices.
-->