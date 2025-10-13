<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let status = 404;
  export let locale: 'en' | 'de' | undefined = undefined;
  export let copy: {
    title?: string;
    description?: string;
    cta?: string;
    backLabel?: string;
  } = {};
  export let a11y: {
    backHome?: string;
  } = {};
  export let errorMessage: string | undefined = undefined;

  let mainEl: HTMLElement;
  let requestedPath = '';
  let pathLoaded = false;
  const headingId = 'error-heading';

  const parseLocaleFromPath = (pathname: string): 'en' | 'de' | undefined => {
    const segment = pathname.split('/').filter(Boolean)[0];
    return segment === 'de' ? 'de' : segment === 'en' ? 'en' : undefined;
  };

  const getCookieLocale = (): 'en' | 'de' | undefined => {
    if (!browser) return undefined;
    const match = document.cookie.match(/(?:^|; )locale=(en|de)/);
    return match ? (match[1] as 'en' | 'de') : undefined;
  };

  const ensureLocaleCookie = (value: 'en' | 'de') => {
    if (!browser) return;
    const current = getCookieLocale();
    if (current === value) return;
    document.cookie = `locale=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  };

  $: resolvedLocale = (() => {
    if (locale) return locale;
    if (browser) {
      const pathLocale = parseLocaleFromPath(location.pathname);
      if (pathLocale) return pathLocale;
      const cookieLocale = getCookieLocale();
      if (cookieLocale) return cookieLocale;
      const nav = (navigator.language || '').toLowerCase();
      if (nav.startsWith('de')) return 'de';
    }
    return 'en';
  })();

  $: ensureLocaleCookie(resolvedLocale);

  $: title = copy?.title ?? (resolvedLocale === 'de' ? 'Seite nicht gefunden' : 'Page not found');
  $: description = copy?.description ??
    (resolvedLocale === 'de'
      ? 'Die angeforderte Seite konnte nicht gefunden werden. Vielleicht hilft dir unser Startbereich weiter?'
      : "We couldn't find the page you were looking for. You can always head back to the homepage.");
  $: ctaLabel = copy?.cta ?? (resolvedLocale === 'de' ? 'Zur Startseite' : 'Back to homepage');
  $: backLabel = copy?.backLabel ?? a11y?.backHome ?? (resolvedLocale === 'de' ? 'Zurück zur Startseite' : 'Back to home');
  $: homeHref = resolvedLocale === 'de' ? '/de' : '/en';
  $: showErrorDetails = status !== 404 && Boolean(errorMessage);

  $: requestedUrlLabel = resolvedLocale === 'de' ? 'Angeforderte Adresse' : 'Requested address';

  onMount(() => {
    mainEl?.focus();
    if (browser) {
      requestedPath = decodeURI(location.pathname);
      // Use requestAnimationFrame to ensure smooth fade-in after path is set
      requestAnimationFrame(() => {
        pathLoaded = true;
      });
    }
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page" data-status={status}>
  <main aria-labelledby={headingId} tabindex="-1" bind:this={mainEl}>
    <p class="error-page__status" aria-hidden="true">{status}</p>
    <svg
      class="face"
      viewBox="0 0 320 380"
      width="320px"
      height="380px"
      aria-label="A 404 becomes a face, looks to the sides, and blinks. The 4s slide up, the 0 slides down, and then a mouth appears."
      role="img"
    >
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="25">
        <g class="face__eyes" transform="translate(0, 112.5)">
          <g transform="translate(15, 0)">
            <polyline class="face__eye-lid" points="37,0 0,120 75,120" />
            <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35" />
          </g>
          <g transform="translate(230, 0)">
            <polyline class="face__eye-lid" points="37,0 0,120 75,120" />
            <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35" />
          </g>
        </g>
        <rect class="face__nose" rx="4" ry="4" x="132.5" y="112.5" width="55" height="155" />
        <g stroke-dasharray="102 102" transform="translate(65, 334)">
          <path class="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" stroke-dashoffset="-102" />
          <path class="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" stroke-dashoffset="102" />
        </g>
      </g>
    </svg>

    <h1 id={headingId}>{title}</h1>
    <p class="error-page__message">{description}</p>
    {#if showErrorDetails}
      <p class="error-page__details">{errorMessage}</p>
    {/if}
    <!-- Always render the path container to prevent layout shift -->
    <p class="error-page__path" class:loaded={pathLoaded}>
      <span class="error-page__path-label">{requestedUrlLabel}:</span>
      <code>{requestedPath || '\u00A0'}</code>
    </p>
    <a class="error-page__cta" href={homeHref}>{ctaLabel}</a>
  </main>
</div>

<style>
  .error-page {
    --hue: 223;
    --sat: 10%;
    --light: hsl(var(--hue), var(--sat), 95%);
    --dark: hsl(var(--hue), var(--sat), 5%);
    --trans-dur: 0.3s;
    color-scheme: light dark;
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1.5em 1.5em 3em;
    background-color: light-dark(var(--light), var(--dark));
    color: light-dark(var(--dark), var(--light));
    transition: background-color var(--trans-dur), color var(--trans-dur);
    text-align: center;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  }

  main {
    display: grid;
    gap: 1.5rem;
    justify-items: center;
    max-width: min(38rem, 90vw);
    padding: 1.5em 0;
    outline: none;
  }

  .error-page__status {
    font-size: clamp(1.25rem, 1rem + 2vw, 2rem);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.6;
  }

  .error-page__message {
    font-size: clamp(1rem, 0.95rem + 0.25vw, 1.25rem);
    max-width: 30ch;
  }

  .error-page__details {
    font-size: 0.95rem;
    max-width: 40ch;
    opacity: 0.7;
  }

  .error-page__path {
    font-size: 0.9rem;
    max-width: 32ch;
    color: inherit;
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: center;
    transition: opacity 0.9s ease-out;
    /* Reserve minimum height to prevent layout shift */
    min-height: 1.5em;
  }

  .error-page__path.loaded {
    opacity: 0.8;
  }

  .error-page__path-label {
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .error-page__path code {
    font-family: 'Space Grotesk', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    background-color: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
    padding: 0.1em 0.4em;
    border-radius: 0.45em;
    /* Smooth transition for when content appears */
    transition: background-color var(--trans-dur);
  }

  h1 {
    font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
    font-weight: 600;
  }

  .error-page__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.85em 1.75em;
    border-radius: 999px;
    background: light-dark(var(--dark), var(--light));
    color: light-dark(var(--light), var(--dark));
    text-decoration: none;
    font-weight: 600;
    border: 1px solid currentColor;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .error-page__cta:hover,
  .error-page__cta:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  h1,
  p,
  .error-page__cta {
    transition: color var(--trans-dur), background-color var(--trans-dur);
  }

  .face {
    display: block;
    width: min(12em, 70vw);
    height: auto;
  }

  .face__eyes,
  .face__nose,
  .face__mouth-left,
  .face__mouth-right {
    /* Start invisible to prevent teleport flash */
    opacity: 0;
    animation: eyes 1s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  .face__nose {
    animation-name: nose;
  }

  .face__mouth-left {
    animation: eyes 1s 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards;
    animation-name: mouth-left;
  }

  .face__mouth-right {
    animation: eyes 1s 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards;
    animation-name: mouth-right;
  }

  .face__eye-lid {
    animation:
      eyes 1s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards,
      eye-lid 4s 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }

  .face__pupil {
    animation:
      eyes 1s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards,
      pupil 4s 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }

  @keyframes eye-lid {
    from,
    40%,
    45%,
    to {
      transform: translateY(0);
    }
    42.5% {
      transform: translateY(17.5px);
    }
  }

  @keyframes eyes {
    from {
      opacity: 0;
      transform: translateY(112.5px);
    }
    1% {
      opacity: 1;
    }
    to {
      opacity: 1;
      transform: translateY(15px);
    }
  }

  @keyframes pupil {
    from,
    37.5%,
    40%,
    45%,
    87.5%,
    to {
      stroke-dashoffset: 0;
      transform: translate(0, 0);
    }
    12.5%,
    25%,
    62.5%,
    75% {
      stroke-dashoffset: 0;
      transform: translate(-35px, 0);
    }
    42.5% {
      stroke-dashoffset: 35;
      transform: translate(0, 17.5px);
    }
  }

  @keyframes mouth-left {
    from,
    50% {
      opacity: 0;
      stroke-dashoffset: -102;
    }
    51% {
      opacity: 1;
    }
    to {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }

  @keyframes mouth-right {
    from,
    50% {
      opacity: 0;
      stroke-dashoffset: 102;
    }
    51% {
      opacity: 1;
    }
    to {
      opacity: 1;
      stroke-dashoffset: 0;
    }
  }

  @keyframes nose {
    from {
      opacity: 0;
      transform: translate(0, 0);
    }
    1% {
      opacity: 1;
    }
    to {
      opacity: 1;
      transform: translate(0, 22.5px);
    }
  }

  @media (max-width: 40rem) {
    .error-page {
      padding-inline: 1rem;
    }

    .error-page__message {
      max-width: 26ch;
    }

  }
</style>
