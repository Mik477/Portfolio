<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let locale: 'en' | 'de';
  export let groupLabel: string = 'Language';
  // Labels stay for a11y/screen readers; visually we render flags
  export let labelEn: string = 'EN';
  export let labelDe: string = 'DE';
  export let switchToEnLabel: string = 'Switch to English';
  export let switchToDeLabel: string = 'Switch to German';

  function setCookie(name: string, value: string, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  function switchLocale(target: 'en' | 'de') {
    if (target === locale) return;
    setCookie('locale', target);
    const current = $page.url;
    const pathname = current.pathname;
    let newPath = '';
    if (pathname === '/' || pathname === '') {
      // When on root, direct to target locale root
      newPath = `/${target}`;
    } else if (/^\/(en|de)(\/|$)/.test(pathname)) {
      newPath = pathname.replace(/^\/(en|de)/, `/${target}`);
    } else {
      newPath = `/${target}${pathname}`;
    }
  goto(newPath + current.search + current.hash, { keepFocus: true });
  }
</script>

<div class="lang-switch" role="group" aria-label={groupLabel}>
  <button
    type="button"
    class="lang-btn flag-btn flag-us"
    class:active={locale === 'en'}
    aria-pressed={locale === 'en'}
    aria-label={switchToEnLabel}
    title={switchToEnLabel}
    on:click={() => switchLocale('en')}
  >
    <span class="sr-only">{labelEn}</span>
  </button>
  <button
    type="button"
    class="lang-btn flag-btn flag-de"
    class:active={locale === 'de'}
    aria-pressed={locale === 'de'}
    aria-label={switchToDeLabel}
    title={switchToDeLabel}
    on:click={() => switchLocale('de')}
  >
    <span class="sr-only">{labelDe}</span>
  </button>
</div>

<style>
  .lang-switch { display: inline-flex; gap: 0.3rem; margin-left: 0.5rem; /* default scalable size */ --flag-h: 1rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .lang-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--flag-h);
    width: calc(var(--flag-h) * 1.5); /* 3:2 aspect ratio */
    border-radius: calc(var(--flag-h) * 0.25);
    border: none;
    box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.35);
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 200ms ease, border-color 160ms ease, filter 160ms ease;
    overflow: hidden;
  }
  .lang-btn:hover { transform: translateY(-1px) scale(1.03); box-shadow: 0 0.375rem 1rem rgba(0,0,0,0.5); filter: saturate(1.2) contrast(1.05); }
  .lang-btn:focus-visible { outline: 0.125rem solid rgba(255,255,255,0.6); outline-offset: 0.125rem; }
  .lang-btn.active { transform: translateY(-1px) scale(1.02); box-shadow: 0 0.375rem 1rem rgba(0,0,0,0.5); filter: saturate(1.25) contrast(1.05); }

  /* Flag fill variants */
  .flag-btn { background-size: cover; background-position: center; }

  /* Germany: black-red-gold stripes */
  .flag-de {
    background-image:
      linear-gradient(to bottom, #000 0 33.333%, #dd0000 33.333% 66.666%, #ffce00 66.666% 100%);
  }

  /* USA: 13 stripes with blue canton (stars simplified) */
  .flag-us {
    background-image:
      /* canton */
      linear-gradient(#3c3b6e, #3c3b6e),
      /* stripes */
      repeating-linear-gradient(to bottom, #b22234 0 7.692%, #fff 7.692% 15.384%);
    background-size:
      42% 53.8%, /* approx width:height for canton (7 stripes tall) */
      100% 100%;
    background-position:
      left top,
      left top;
    background-repeat: no-repeat;
  }
</style>
