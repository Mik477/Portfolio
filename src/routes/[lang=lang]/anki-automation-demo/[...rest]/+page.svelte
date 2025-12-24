<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Redirect to the singular (root) version of the Anki pages
  onMount(() => {
    const rest = $page.params.rest || '';
    // Remove trailing slash if present to avoid double slashes
    const path = rest ? `/anki-automation-demo/${rest}` : '/anki-automation-demo';
    goto(path, { replaceState: true });
  });
</script>

<p>Redirecting...</p>
