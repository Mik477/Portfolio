<script lang="ts">
  import { page } from '$app/stores';
  import BackButton from '$lib/components/BackButton.svelte';
  $: currentLang = $page.params.lang === 'de' ? 'de' : 'en';
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = 'September 16, 2025';
</script>

<svelte:head>
  <title>Accessibility</title>
  <meta name="description" content="Accessibility statement: focus management, live announcements, reduced motion support, hidden decorative canvases, semantic structure, locale-aware routing, and ongoing improvements." />
  <link rel="alternate" hreflang="en" href="/en/accessibility" />
  <link rel="alternate" hreflang="de" href="/de/barrierefreiheit" />
</svelte:head>

<main class="legal-page">
  <BackButton />
  <article class="legal-article" lang="en" aria-labelledby="a11y-heading">
    <header class="article-header">
      <h1 id="a11y-heading">Accessibility Statement</h1>
  <p class="last-updated"><strong>Last Updated:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
      <p class="intro">I’m committed to making this site usable by as many people as possible. This is an immersive, highly visual portfolio with animated transitions and WebGL effects; I actively design and test with accessibility in mind and iterate continuously.</p>
    </header>

    <section id="conformance" class="legal-section" aria-labelledby="conformance-heading">
      <h2 id="conformance-heading">Conformance status</h2>
      <p>This is a self-assessed accessibility statement; no formal third-party evaluation has been conducted.</p>
      <p>This website is partially conformant with the Web Content Accessibility Guidelines Version 2.1 at Level AA (WCAG 2.1 AA). "Partially conformant" means that some parts of the content do not fully conform to the accessibility standard. Given the interactive and visually complex nature of this portfolio, I am prioritizing improvements that most directly impact screen reader users, keyboard-only users, and visitors with motion sensitivity.</p>
    </section>

    <section id="measures" class="legal-section" aria-labelledby="measures-heading">
      <h2 id="measures-heading">Measures in place</h2>

      <section id="focus-management" class="sub-section" aria-labelledby="focus-management-heading">
        <h3 id="focus-management-heading">Robust focus management</h3>
        <p>During section transitions, keyboard focus is programmatically moved to the most relevant element in the new section. All off-screen sections are temporarily set <code>inert</code> to avoid focus traps and ensure a single, clear reading order.</p>
      </section>

      <section id="live-announcements" class="sub-section" aria-labelledby="live-announcements-heading">
        <h3 id="live-announcements-heading">Live announcements for content changes</h3>
        <p>A visually hidden <code>aria-live</code> region announces the current section title after transitions and on initial load, so screen reader users are notified without needing to explore manually.</p>
      </section>

      <section id="reduced-motion" class="sub-section" aria-labelledby="reduced-motion-heading">
        <h3 id="reduced-motion-heading">Motion preference support</h3>
        <p>When <code>prefers-reduced-motion</code> is enabled: immersive WebGL/GSAP effects are paused or disabled (including the hero particles, the About image effect, and the Contact raymarching scene); page transitions are simplified and shortened. If you change this preference while the site is open, the effects respond immediately without reloading.</p>
      </section>

      <section id="decorative-effects" class="sub-section" aria-labelledby="decorative-effects-heading">
        <h3 id="decorative-effects-heading">Decorative effects hidden from assistive tech</h3>
        <p>WebGL canvases used for purely visual atmosphere (Three.js) are removed from the accessibility tree with <code>aria-hidden="true"</code>, <code>role="presentation"</code>, and <code>tabindex="-1"</code>.</p>
      </section>

      <section id="semantics" class="sub-section" aria-labelledby="semantics-heading">
        <h3 id="semantics-heading">Correct semantic structure</h3>
        <p>Headings form a logical outline (e.g., section titles use <code>h2</code>, subheadings use <code>h3</code>), improving navigation for assistive technologies that rely on heading shortcuts.</p>
      </section>

      <section id="i18n" class="sub-section" aria-labelledby="i18n-heading">
        <h3 id="i18n-heading">Accessible internationalization and URL mapping</h3>
        <p>The language switcher is operable with keyboard, conveys state, preserves focus on change, and maps localized slugs (e.g., <code>/en/privacy</code> ↔ <code>/de/datenschutz</code>; <code>/en/imprint</code> ↔ <code>/de/impressum</code>; <code>/en/accessibility</code> ↔ <code>/de/barrierefreiheit</code>) while preserving query and hash.</p>
      </section>

      <section id="scroll" class="sub-section" aria-labelledby="scroll-heading">
        <h3 id="scroll-heading">Predictable scroll behavior</h3>
        <p>The immersive home uses a controlled section navigator; legal and content subpages use native vertical scrolling to ensure compatibility with assistive technologies.</p>
      </section>
    </section>

    <section id="known-limitations" class="legal-section" aria-labelledby="known-limitations-heading">
      <h2 id="known-limitations-heading">Known limitations</h2>
      <ul class="rights-list">
        <li><strong>Complex visual effects:</strong> While decorative and hidden from assistive tech, WebGL effects may distract some users. Enabling reduced motion helps tone down visuals. I’m planning a site control to pause animations.</li>
        <li><strong>Reduced‑motion coverage:</strong> All major immersive WebGL effects now pause/disable under reduced motion; a few brief micro‑animations may still play. I’m continuing to audit and simplify remaining motion.</li>
        <li><strong>Alternative descriptions for media:</strong> Static images have alt text; I continue to review descriptive quality, especially for project imagery that conveys meaning.</li>
      </ul>
    </section>

    <section id="feedback" class="legal-section" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">Feedback and contact</h2>
  <p>If you encounter any accessibility barriers not listed here, please contact me:</p>
  <p>Email: <a class="link" href="mailto:mika.mueller.work@gmail.com">mika.mueller.work@gmail.com</a>. I aim to respond within 5 business days.</p>
    </section>

    <section id="technical" class="legal-section" aria-labelledby="technical-heading">
      <h2 id="technical-heading">Technical specifications</h2>
      <p>Accessibility relies on HTML, CSS, JavaScript, and WAI‑ARIA. The site is built with SvelteKit and Three.js; progressive enhancement is used so content remains available even if advanced effects are disabled.</p>
    </section>

    <section id="ongoing" class="legal-section" aria-labelledby="ongoing-heading">
      <h2 id="ongoing-heading">Ongoing improvements</h2>
      <ul class="rights-list">
        <li>Broader reduced‑motion support for all continuous animations (including WebGL particle/raymarching effects).</li>
        <li>A “Pause animations” control to pause/stop decorative effects beyond system preferences.</li>
        <li>Periodic keyboard‑only and screen reader walkthroughs to catch regressions.</li>
        <li>Image alt text and link purpose reviews on new content.</li>
      </ul>
    </section>
    <footer class="article-footer">
      <button class="back" on:click={() => (location.href = `/${currentLang}`)} aria-label="Back to homepage">Back to homepage</button>
    </footer>
  </article>
  
</main>

<style>
  .legal-page { min-height: 100vh; padding: clamp(1.5rem, 3vw, 3rem); color: var(--legal-fg, #fafafa); background: radial-gradient(circle at 30% 20%, #111 0%, #0a0a0b 60%, #050506 100%); overflow-y: auto; }
  .legal-article { max-width: 75ch; margin: 0 auto; line-height: 1.55; font-size: 1rem; }
  .article-header { margin-bottom: 2.25rem; }
  h1 { font-size: clamp(2.2rem, 5vw, 3.1rem); line-height: 1.1; letter-spacing: -0.5px; margin: 0 0 0.75rem; }
  h2 { font-size: clamp(1.45rem, 3vw, 2rem); margin: 2.5rem 0 1rem; line-height: 1.2; position: relative; }
  h3 { font-size: 1.05rem; margin: 1.75rem 0 0.65rem; letter-spacing: 0.3px; }
  p, li { color: rgba(255,255,255,0.85); }
  p { margin: 0 0 1.15rem; }
  .intro { font-size: 1.05rem; }
  .last-updated { margin: 0 0 1.1rem; color: rgba(255,255,255,0.65); font-size: 0.9rem; }
  .rights-list { list-style: disc; padding-left: 1.2rem; margin: 0 0 1.5rem; }
  .rights-list li { margin: 0 0 0.4rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
  .link { color: #82d6ff; text-decoration: underline; text-underline-offset: 2px; }
  .link:hover, .link:focus-visible { color: #b5e7ff; }
  .article-footer { margin-top: 3rem; display: flex; justify-content: flex-start; }
  .back { background: linear-gradient(145deg, #1d1f21, #2a2d31); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.7rem 1.1rem; border-radius: 10px; cursor: pointer; font-size: 0.95rem; letter-spacing: 0.3px; transition: background .25s, transform .25s; }
  .back:hover, .back:focus-visible { background: linear-gradient(145deg, #303438, #353a40); outline: none; }
  .back:active { transform: translateY(2px); }
  a:focus-visible, .back:focus-visible { box-shadow: 0 0 0 3px rgba(130,214,255,0.45), 0 0 0 6px rgba(130,214,255,0.15); border-radius: 6px; }
  @media (max-width: 680px) {
    .legal-page { padding-top: calc(clamp(1.5rem, 3vw, 3rem) + 4rem); }
    .legal-page :global(.back-button) { top: 2rem; left: 0.5rem; width: 2.4rem; height: 2.4rem; }
    .legal-page :global(.back-button svg) { width: 1.15rem; height: 1.15rem; }
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
