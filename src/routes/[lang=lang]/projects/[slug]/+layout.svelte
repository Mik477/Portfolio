<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';

  let showButton = false;
  $: backAria = (($page.data as any)?.messages?.common?.a11y?.backHome) ?? (($page.params.lang === 'en') ? 'Back to home' : 'Zurück zur Startseite');

  onMount(() => {
    const timer = setTimeout(() => {
      showButton = true;
    }, 300);

    return () => clearTimeout(timer);
  });

  function handleBackClick() {
    const lang = $page.params.lang ?? 'de';
    // Map slug back to project id used on main page section IDs (project-{id})
    // We can derive id by inspecting slug param vs known patterns. For now assume slug exactly matches Project.slug.
    // Need to load project list for current locale to find matching project object.
    try {
      // Dynamic import to avoid adding heavy data eagerly
      const locale: 'en' | 'de' = lang === 'de' ? 'de' : 'en';
      // @ts-ignore - dynamic require via import.meta.glob could be used; simple synchronous assumption here
    } catch {}
    // Minimal inline mapping approach: replicate logic cheaply
    // We only need id for hash; slug is unique so we can hardcode mapping for existing projects.
    const slug = ($page.params as any).slug;
    let projectId: string | null = null;
    if (slug === 'BURA') projectId = 'project-one';
    else if (slug === 'Project2') projectId = 'project-two';
    const hash = projectId ? `#project-${projectId}` : '';
    transitionStore.fadeToBlackAndNavigate(`/${lang}${hash}`);
  }
</script>
<div class="project-subpage-layout">
  <button 
    class="back-button"
    class:visible={showButton}
    on:click={handleBackClick}
  aria-label={backAria}
  >
    <ArrowLeft size={24} />
  </button>

  <slot />
  
</div>

<style>
  .project-subpage-layout { width: 100%; height: 100%; position: relative; }
  .back-button {
    position: fixed; top: 2rem; left: 2rem; z-index: 1000;
    background-color: rgba(30,30,32,0.7);
    border: 1px solid rgba(255,255,255,0.1);
    color: white; backdrop-filter: blur(8px);
    width: 3rem; height: 3rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s ease-in-out;
    opacity: 0; transform: scale(0.8); pointer-events: none;
  }
  .back-button.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
  .back-button:hover { background-color: rgba(50,50,52,0.9); transform: scale(1.05); }
</style>
