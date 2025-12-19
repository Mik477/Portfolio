<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft } from 'lucide-svelte';
	import { transitionStore } from '$lib/stores/transitionStore';
	import { renderProfile } from '$lib/stores/renderProfile';
	import { navigationHistoryStore } from '$lib/stores/navigationHistoryStore';
	
	export let to: string | undefined = undefined; // optional override
	export let label: string | undefined = undefined; // optional override label
	
	let showButton = false;
	$: locale = ($page.params?.lang === 'en' ? 'en' : ($page.params?.lang === 'de' ? 'de' : 'de')) as 'en' | 'de';
	
	// Get target from navigation history store, with fallbacks
	$: targetHref = to ?? navigationHistoryStore.getBackUrl(locale);
	$: ariaLabel = label ?? (locale === 'en' ? 'Back to home' : 'Zurück zur Startseite');
	$: isTallLayout = $renderProfile.layoutProfile === 'tall';

	onMount(() => {
		const t = setTimeout(() => { showButton = true; }, 300);
		return () => clearTimeout(t);
	});

	function handleClick() { transitionStore.fadeToBlackAndNavigate(targetHref); }
</script>

<button class="back-button" class:visible={showButton} class:tall={isTallLayout} aria-label={ariaLabel} on:click={handleClick}>
	<ArrowLeft size={24} />
</button>

<style>
	.back-button { position: fixed; top: 2rem; left: 2rem; z-index: 1000; background-color: rgba(30,30,32,0.7); border: 1px solid rgba(255,255,255,0.1); color: white; backdrop-filter: blur(8px); width: 3rem; height: 3rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease-in-out; opacity: 0; transform: scale(0.8); pointer-events: none; }
	.back-button.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
	.back-button:hover, .back-button:focus-visible { background-color: rgba(50,50,52,0.9); }
	.back-button:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(130,214,255,0.45), 0 0 0 6px rgba(130,214,255,0.15); }
	.back-button.tall { top: 1rem; left: 1rem; width: 2.75rem; height: 2.75rem; }
</style>
