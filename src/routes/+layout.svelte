<!-- src/routes/+layout.svelte -->
<script lang="ts">
  // Import the global stylesheet. This is the new line.
  import '../app.css';
  import TransitionOverlay from '$lib/components/TransitionOverlay.svelte';
  import LegalFooter from '$lib/components/LegalFooter.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { siteConfig } from '$lib/data/siteConfig';
  import { initialSiteLoadComplete } from '$lib/stores/preloadingStore';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';

  export let data: { locale: 'en' | 'de'; messages?: { common?: any; layout?: any } };
  let isHome: boolean;
  let showFooter: boolean;
  // Fallback: force-show footer on home after short delay if initial load signal is slow
  let footerForcedVisible = false;
  let footerForceTimer: number | undefined;
  // Treat /, /en and /de as home (with or without trailing slash)
  $: isHome = /^\/(|en\/|de\/?|en|de)$/.test($page.url.pathname);
  $: showFooter = isHome ? ($initialSiteLoadComplete || footerForcedVisible) : true;
  const fadeIn = { duration: 250 };

  // Keep document language in sync with the active locale
  $: if (browser && data?.locale) {
    document.documentElement.lang = data.locale;
  }

  onMount(() => {
    // Safety: ensure footer becomes visible even if initial load never flips (e.g., dev anomalies)
    footerForceTimer = window.setTimeout(() => {
      footerForcedVisible = true;
    }, 2500);
  });

  onDestroy(() => {
    if (footerForceTimer) clearTimeout(footerForceTimer);
  });
</script>

<svelte:head>
  {#if $page}
    {@const pathname = $page.url.pathname}
    {@const origin = $page.url.origin}
    {@const hrefEn = (() => {
      if (pathname === '/' || pathname === '') return `/en`;
      if (/^\/(en|de)(\/|$)/.test(pathname)) return pathname.replace(/^\/(en|de)/, `/en`);
      return `/en${pathname}`;
    })()}
    {@const hrefDe = (() => {
      if (pathname === '/' || pathname === '') return `/de`;
      if (/^\/(en|de)(\/|$)/.test(pathname)) return pathname.replace(/^\/(en|de)/, `/de`);
      return `/de${pathname}`;
    })()}
    <link rel="alternate" hreflang="en" href={`${origin}${hrefEn}`} />
    <link rel="alternate" hreflang="de" href={`${origin}${hrefDe}`} />
    <link rel="alternate" hreflang="x-default" href={`${origin}${hrefDe}`} />
  {/if}
  {#if data?.messages?.layout?.meta?.siteTitle}
    <title>{data.messages.layout.meta.siteTitle}</title>
    <meta name="description" content={data.messages.layout.meta.siteDescription} />
  {/if}
</svelte:head>

<TransitionOverlay />

<slot />

{#if showFooter}
  <div in:fade={fadeIn}>
    <LegalFooter
      legalLinks={siteConfig.legalLinks.map((l) => ({
        ...l,
        name:
          l.url === '/impressum'
            ? data.messages?.common?.legal?.impressum ?? l.name
            : l.url === '/datenschutz'
            ? data.messages?.common?.legal?.datenschutz ?? l.name
            : l.url === '/barrierefreiheit'
            ? data.messages?.common?.legal?.barrierefreiheit ?? l.name
            : l.name
      }))}
    >
      <LanguageSwitcher
        locale={data.locale}
        groupLabel={data.messages?.common?.language?.groupLabel ?? 'Language'}
        labelEn={data.messages?.common?.language?.en ?? 'EN'}
        labelDe={data.messages?.common?.language?.de ?? 'DE'}
        switchToEnLabel={data.messages?.common?.language?.switchToEn ?? 'Switch to English'}
        switchToDeLabel={data.messages?.common?.language?.switchToDe ?? 'Switch to German'}
      />
    </LegalFooter>
  </div>
{/if}

<!-- 
  The <style> block has been removed from here and its contents
  have been moved to src/app.css, as per SvelteKit best practices.
-->