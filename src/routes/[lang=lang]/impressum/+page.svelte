<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  import { navigationHistoryStore } from '$lib/stores/navigationHistoryStore';
  import BackButton from '$lib/components/BackButton.svelte';

  // German-only page (English users are redirected to /en/imprint via +page.ts)
  const lang: 'de' = 'de';
  function backHome() { 
    const target = navigationHistoryStore.getBackUrl(lang);
    transitionStore.fadeToBlackAndNavigate(target); 
  }
  const title = 'Impressum';
  const backLabel = 'Zurück zur Startseite';
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = '16.09.2025';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="Impressum: Angaben gemäß § 5 TMG, Kontakt, USt-ID, Verantwortlichkeit, EU‑Streitschlichtung, Verbraucherstreitbeilegung und rechtliche Hinweise." />
</svelte:head>

<main class="legal-page">
  <BackButton />
  <article class="legal-article" lang="de" aria-labelledby="impressum-heading">
    <header class="article-header">
  <h1 id="impressum-heading">Impressum</h1>
  <p class="last-updated"><strong>Stand:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
    </header>

    <section id="angaben-5-tmg" class="legal-section" aria-labelledby="angaben-5-tmg-heading">
      <h2 id="angaben-5-tmg-heading">Angaben gemäß § 5 TMG</h2>
      <address class="controller-address" aria-label="Anschrift">
        <p><span>Miká Müller</span><br />
        <span>Weinbergstraße 16a</span><br />
        <span>38159 Vechelde</span><br />
        <span>Deutschland</span></p>
      </address>
    </section>

    <section id="kontakt" class="legal-section" aria-labelledby="kontakt-heading">
      <h2 id="kontakt-heading">Kontakt</h2>
  <p>E‑Mail: <a href="mailto:mika.mueller.work@gmail.com" class="link">mika.mueller.work@gmail.com</a></p>
    </section>

    

    <section id="redaktionell-verantwortlich" class="legal-section" aria-labelledby="redaktionell-verantwortlich-heading">
      <h2 id="redaktionell-verantwortlich-heading">Redaktionell verantwortlich</h2>
      <p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: siehe Kontaktdaten oben.</p>
    </section>

    <section id="eu-streitschlichtung" class="legal-section" aria-labelledby="eu-streitschlichtung-heading">
      <h2 id="eu-streitschlichtung-heading">EU‑Streitschlichtung</h2>
      <p>Die Europäische Kommission informiert zur Verbraucherstreitbeilegung:
        <a href="https://europa.eu/youreurope/citizens/consumers/consumers-dispute-resolution/index_en.htm" target="_blank" rel="noopener noreferrer" class="link">https://europa.eu/youreurope/citizens/consumers/consumers-dispute-resolution/index_en.htm</a>.
        <br />Meine E‑Mail‑Adresse finden Sie oben im Impressum.</p>
    </section>

    <section id="verbraucherstreitbeilegung" class="legal-section" aria-labelledby="verbraucherstreitbeilegung-heading">
      <h2 id="verbraucherstreitbeilegung-heading">Verbraucher­streit­beilegung / Universal­schlichtungs­stelle</h2>
      <p>Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </section>

    <hr class="divider" />

    <section id="haftungsausschluss" class="legal-section" aria-labelledby="haftungsausschluss-heading">
      <h2 id="haftungsausschluss-heading">Haftungsausschluss (Disclaimer)</h2>

      <section id="haftung-inhalte" class="sub-section" aria-labelledby="haftung-inhalte-heading">
        <h3 id="haftung-inhalte-heading">Haftung für Inhalte</h3>
        <p>Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.</p>
      </section>

      <section id="haftung-links" class="sub-section" aria-labelledby="haftung-links-heading">
        <h3 id="haftung-links-heading">Haftung für Links</h3>
        <p>Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.</p>
      </section>

      <section id="urheberrecht" class="sub-section" aria-labelledby="urheberrecht-heading">
        <h3 id="urheberrecht-heading">Urheberrecht</h3>
        <p>Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitte ich um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Inhalte umgehend entfernen.</p>
      </section>
    </section>

    <footer class="article-footer">
      <button class="back" on:click={backHome} aria-label={backLabel}>{backLabel}</button>
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
    .legal-page { padding-top: calc(clamp(1.5rem, 3vw, 3rem) + 4rem); }
    .legal-page :global(.back-button) { top: 2.2rem; left: 0.5rem; width: 2.4rem; height: 2.4rem; }
    .legal-page :global(.back-button svg) { width: 1.15rem; height: 1.15rem; }
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
