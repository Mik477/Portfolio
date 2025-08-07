<!-- src/routes/+layout.svelte -->
<script lang="ts">
  // Import the global stylesheet. This is the new line.
  import '../app.css';
  import TransitionOverlay from '$lib/components/TransitionOverlay.svelte';
</script>

<TransitionOverlay />

<slot />

<!-- 
  The <style> block has been removed from here and its contents
  have been moved to src/app.css, as per SvelteKit best practices.
-->