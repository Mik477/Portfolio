<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';

  export let locale: 'en' | 'de';
  export let groupLabel: string = 'Language';
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
    transitionStore.fadeToBlackAndNavigate(newPath + current.search + current.hash);
  }
</script>

<div class="lang-switch" role="group" aria-label={groupLabel}>
  <button
    type="button"
    class="lang-btn"
    class:active={locale === 'en'}
    aria-pressed={locale === 'en'}
  aria-label={switchToEnLabel}
    on:click={() => switchLocale('en')}
  >
    <span class="flag" aria-hidden="true">🇺🇸</span>
  <span class="label">{labelEn}</span>
  </button>
  <button
    type="button"
    class="lang-btn"
    class:active={locale === 'de'}
    aria-pressed={locale === 'de'}
  aria-label={switchToDeLabel}
    on:click={() => switchLocale('de')}
  >
    <span class="flag" aria-hidden="true">🇩🇪</span>
  <span class="label">{labelDe}</span>
  </button>
  
</div>

<style>
  .lang-switch { display: inline-flex; gap: 0.25rem; margin-left: 0.5rem; }
  .lang-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.7);
    border-radius: 999px;
    padding: 0.25rem 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 44px; min-height: 34px;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
  }
  .lang-btn:hover, .lang-btn:focus-visible { background: rgba(255,255,255,0.08); color: #fff; outline: none; }
  .lang-btn.active { background: rgba(255,255,255,0.16); color: #fff; border-color: rgba(255,255,255,0.34); }
  .flag { font-size: 0.95rem; line-height: 1; }
  .label { font-size: 0.8rem; letter-spacing: 0.02em; }
</style>
