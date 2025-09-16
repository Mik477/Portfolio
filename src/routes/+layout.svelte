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

  // Scroll control: lock body only on the immersive home route; all other pages (legal etc.) should scroll normally.
  $: if (browser) {
    if (isHome) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
</script>

<svelte:head>
  {#if $page}
    {@const pathname = $page.url.pathname}
    {@const origin = $page.url.origin}
    {@const hrefEn = (() => {
      if (pathname === '/') return `/en`;
      if (/^\/(en|de)(\/|$)/.test(pathname)) return pathname.replace(/^\/(en|de)/, `/en`);
      return `/en${pathname}`;
    })()}
    {@const hrefDe = (() => {
      if (pathname === '/') return `/de`;
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
      legalLinks={siteConfig.legalLinks.map((l) => {
        // Map base German slugs to English variants when locale is EN
        const locale = data.locale;
        let localizedUrl = l.url;
        if (locale === 'en') {
          if (l.url === '/datenschutz') localizedUrl = '/privacy';
          else if (l.url === '/impressum') localizedUrl = '/imprint';
          else if (l.url === '/barrierefreiheit') localizedUrl = '/accessibility';
        }
        const nameOverride = (() => {
          if (l.url === '/impressum') return data.messages?.common?.legal?.impressum ?? l.name;
          if (l.url === '/datenschutz') return data.messages?.common?.legal?.datenschutz ?? l.name;
          if (l.url === '/barrierefreiheit') return data.messages?.common?.legal?.barrierefreiheit ?? l.name;
          return l.name;
        })();
        // If locale is EN and we swapped slug, optionally override label to English if translations exist
        const englishLabelMap: Record<string, string | undefined> = {
          '/privacy': data.messages?.common?.legal?.privacy,
          '/imprint': data.messages?.common?.legal?.imprint,
          // Reuse the same translation key used for the DE base name; EN locale maps it to "Accessibility"
          '/accessibility': data.messages?.common?.legal?.barrierefreiheit
        };
        const finalName = locale === 'en' && englishLabelMap[localizedUrl]
          ? englishLabelMap[localizedUrl]!
          : nameOverride;
        return { ...l, url: localizedUrl, name: finalName };
      })}
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