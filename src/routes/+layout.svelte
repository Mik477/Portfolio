<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import TransitionOverlay from '$lib/components/TransitionOverlay.svelte';
</script>

<TransitionOverlay />

<slot />

<style>
  /*
    By placing this global style in the root layout, we guarantee
    that the body's background color is always black. This component
    is never unmounted during page transitions, so the style persists
    and prevents the browser's default white background from ever showing.
    This is the definitive fix for the "white flash".
  */
  :global(body) {
    background-color: rgb(9 9 11);
    color: rgb(245 245 247);
  }
</style>