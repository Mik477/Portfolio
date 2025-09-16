<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  $: currentLang = $page.params.lang === 'de' ? 'de' : 'en';
  function backHome() { transitionStore.fadeToBlackAndNavigate(`/${currentLang}`); }
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = 'September 16, 2025';
</script>

<svelte:head>
  <title>Imprint (Legal Notice)</title>
  <meta name="description" content="Imprint (Legal Notice): Information under § 5 TMG, contact, VAT ID, responsibility for content, EU dispute resolution, consumer arbitration, and legal disclaimers." />
  <link rel="alternate" hreflang="en" href="/en/imprint" />
  <link rel="alternate" hreflang="de" href="/de/impressum" />
  <link rel="alternate" hreflang="x-default" href="/de/impressum" />
  
</svelte:head>

<main class="legal-page">
  <article class="legal-article" lang="en" aria-labelledby="imprint-heading">
    <header class="article-header">
  <h1 id="imprint-heading">Imprint (Legal Notice)</h1>
  <p class="last-updated"><strong>Last Updated:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
    </header>

    <section id="info-5-tmg" class="legal-section" aria-labelledby="info-5-tmg-heading">
      <h2 id="info-5-tmg-heading">Information according to § 5 TMG (German Telemedia Act)</h2>
      <address class="controller-address" aria-label="Address">
        <p><span>Miká Müller</span><br />
        <span>Weinbergstraße 16a</span><br />
        <span>38159 Vechelde</span><br />
        <span>Germany</span></p>
      </address>
    </section>

    <section id="contact" class="legal-section" aria-labelledby="contact-heading">
      <h2 id="contact-heading">Contact</h2>
  <p>Email: <a href="mailto:mika38159@gmail.com" class="link">mika38159@gmail.com</a></p>
    </section>

    

    <section id="responsible-content" class="legal-section" aria-labelledby="responsible-content-heading">
      <h2 id="responsible-content-heading">Responsible for the Content</h2>
      <p>Responsible for the content according to § 18 Abs. 2 MStV (German State Media Treaty): see contact details above.</p>
    </section>

    <section id="eu-dispute" class="legal-section" aria-labelledby="eu-dispute-heading">
      <h2 id="eu-dispute-heading">EU Dispute Resolution</h2>
      <p>The European Commission provides information on consumer dispute resolution:
        <a href="https://europa.eu/youreurope/citizens/consumers/consumers-dispute-resolution/index_en.htm" target="_blank" rel="noopener noreferrer" class="link">https://europa.eu/youreurope/citizens/consumers/consumers-dispute-resolution/index_en.htm</a>.
        <br />My email address can be found above in this imprint.</p>
    </section>

    <section id="consumer-dispute" class="legal-section" aria-labelledby="consumer-dispute-heading">
      <h2 id="consumer-dispute-heading">Consumer Dispute Resolution / Universal Arbitration Board</h2>
      <p>I am not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
    </section>

    <hr class="divider" />

    <section id="disclaimer" class="legal-section" aria-labelledby="disclaimer-heading">
      <h2 id="disclaimer-heading">Disclaimer</h2>

      <section id="liability-content" class="sub-section" aria-labelledby="liability-content-heading">
        <h3 id="liability-content-heading">Liability for Content</h3>
        <p>As a service provider, I am responsible for my own content on these pages according to § 7 Abs.1 TMG and general laws. However, according to §§ 8 to 10 TMG, I am not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general laws remain unaffected. However, liability in this regard is only possible from the moment of knowledge of a specific infringement. Upon notification of such violations, I will remove the content immediately.</p>
      </section>

      <section id="liability-links" class="sub-section" aria-labelledby="liability-links-heading">
        <h3 id="liability-links-heading">Liability for Links</h3>
        <p>My offer contains links to external third-party websites, over whose content I have no influence. Therefore, I cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the content of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. However, a permanent content control of the linked pages is not reasonable without concrete evidence of an infringement. Upon notification of violations, I will remove such links immediately.</p>
      </section>

      <section id="copyright" class="sub-section" aria-labelledby="copyright-heading">
        <h3 id="copyright-heading">Copyright</h3>
        <p>The content and works created by me on these pages are subject to German copyright law. The reproduction, processing, distribution, and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator. Downloads and copies of this site are for private, non-commercial use only. Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is identified as such. Should you still become aware of a copyright infringement, I ask for a corresponding notice. Upon notification of violations, I will remove such content immediately.</p>
      </section>
    </section>

    <footer class="article-footer">
      <button class="back" on:click={backHome} aria-label="Back to homepage">Back to homepage</button>
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
  /* Scope list item color to lists inside legal article to avoid unused selector warnings */
  p { color: rgba(255,255,255,0.85); }
  .legal-article :global(li) { color: rgba(255,255,255,0.85); }
  p { margin: 0 0 1.15rem; }
  address { font-style: normal; line-height: 1.4; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 0.9rem 1rem; border-radius: 10px; margin: 0.75rem 0 1.5rem; }
  address p { margin: 0 0 0.5rem; }
  .divider { border: 0; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); margin: 1.5rem 0 0.25rem; }
  .legal-section { scroll-margin-top: 5rem; }
  .sub-section { position: relative; padding: 0.2rem 0 0.2rem 0.6rem; border-left: 2px solid rgba(255,255,255,0.08); margin-bottom: 1.2rem; }
  .link { color: #82d6ff; text-decoration: underline; text-underline-offset: 2px; transition: color .25s; }
  .link:hover, .link:focus-visible { color: #b5e7ff; }
  .last-updated { margin: 0.25rem 0 1.25rem; color: rgba(255,255,255,0.65); font-size: 0.9rem; }
  .article-footer { margin-top: 3rem; display: flex; justify-content: flex-start; }
  .back { background: linear-gradient(145deg, #1d1f21, #2a2d31); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.7rem 1.1rem; border-radius: 10px; cursor: pointer; font-size: 0.95rem; letter-spacing: 0.3px; transition: background .25s, transform .25s; }
  .back:hover, .back:focus-visible { background: linear-gradient(145deg, #303438, #353a40); outline: none; }
  .back:active { transform: translateY(2px); }
  a:focus-visible, .back:focus-visible { box-shadow: 0 0 0 3px rgba(130,214,255,0.45), 0 0 0 6px rgba(130,214,255,0.15); border-radius: 6px; }
  @media (max-width: 680px) {
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
