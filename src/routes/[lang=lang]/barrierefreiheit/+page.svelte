<script lang="ts">
  import { transitionStore } from '$lib/stores/transitionStore';
  import BackButton from '$lib/components/BackButton.svelte';
  // Deutschsprachige Seite (englisches Pendant unter /en/accessibility)
  const lang: 'de' = 'de';
  function backHome() { transitionStore.fadeToBlackAndNavigate(`/${lang}`); }
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = '16.09.2025';
</script>

<svelte:head>
  <title>Barrierefreiheit</title>
  <meta name="description" content="Erklärung zur Barrierefreiheit: Fokusmanagement, Live-Regionen, Unterstützung von reduzierten Bewegungen, ausgeblendete dekorative WebGL-Canvas, semantische Struktur, sprachsensitive URLs und laufende Verbesserungen." />
  <link rel="alternate" hreflang="de" href="/de/barrierefreiheit" />
  <link rel="alternate" hreflang="en" href="/en/accessibility" />
</svelte:head>

<main class="legal-page">
  <BackButton />
  <article class="legal-article" lang="de" aria-labelledby="a11y-heading-de">
    <header class="article-header">
      <h1 id="a11y-heading-de">Erklärung zur Barrierefreiheit</h1>
  <p class="last-updated"><strong>Stand:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
      <p class="intro">Ich möchte diese Seite für möglichst viele Menschen nutzbar machen. Es handelt sich um ein immersives, visuell geprägtes Portfolio mit animierten Übergängen und WebGL‑Effekten; ich gestalte und teste mit Blick auf Barrierefreiheit und entwickle kontinuierlich weiter.</p>
    </header>

    <section id="konformitaet" class="legal-section" aria-labelledby="konformitaet-heading">
      <h2 id="konformitaet-heading">Konformitätsstatus</h2>
      <p>Dies ist eine selbsteingeschätzte Barrierefreiheits­erklärung; es wurde keine formale, externe Bewertung durchgeführt.</p>
      <p>Diese Website ist <strong>teilweise konform</strong> mit den Web Content Accessibility Guidelines in der Version 2.1 auf Stufe AA (WCAG 2.1 AA). „Teilweise konform“ bedeutet, dass einige Teile der Inhalte den Standard noch nicht vollständig erfüllen. Angesichts des interaktiven und visuell komplexen Charakters dieses Portfolios priorisiere ich Verbesserungen, die Screenreader‑Nutzer:innen, reine Tastaturnutzung und Personen mit Bewegungssensibilität am direktesten unterstützen.</p>
    </section>

    <section id="massnahmen" class="legal-section" aria-labelledby="massnahmen-heading">
      <h2 id="massnahmen-heading">Umgesetzte Maßnahmen</h2>

      <section id="fokusmanagement" class="sub-section" aria-labelledby="fokusmanagement-heading">
        <h3 id="fokusmanagement-heading">Robustes Fokusmanagement</h3>
        <p>Während Abschnittsübergängen wird der Tastaturfokus gezielt auf das relevanteste Element des neuen Abschnitts gesetzt. Außerhalb des Bildschirms liegende Bereiche werden vorübergehend <code>inert</code>, um Fokusfallen zu vermeiden und eine eindeutige Lesereihenfolge sicherzustellen.</p>
      </section>

      <section id="live-ankuendigungen" class="sub-section" aria-labelledby="live-ankuendigungen-heading">
        <h3 id="live-ankuendigungen-heading">Live‑Ankündigungen von Inhaltsänderungen</h3>
        <p>Eine visuell verborgene <code>aria-live</code>-Region kündigt nach Übergängen (und beim ersten Laden) den Titel des aktuellen Abschnitts an, sodass Screenreader‑Nutzer:innen nicht aktiv nach Änderungen suchen müssen.</p>
      </section>

      <section id="reduzierte-bewegung" class="sub-section" aria-labelledby="reduzierte-bewegung-heading">
        <h3 id="reduzierte-bewegung-heading">Unterstützung für reduzierte Bewegungen</h3>
        <p>Wenn <code>prefers-reduced-motion</code> aktiviert ist, werden immersive WebGL‑/GSAP‑Effekte angehalten oder deaktiviert (einschließlich der Partikel im Hero, des Bild‑Effekts im About‑Bereich und der Raymarching‑Szene im Kontaktbereich); Seitenübergänge werden vereinfacht und verkürzt. Eine Änderung der Systemeinstellung greift sofort, ohne die Seite neu zu laden.</p>
      </section>

      <section id="dekorative-effekte" class="sub-section" aria-labelledby="dekorative-effekte-heading">
        <h3 id="dekorative-effekte-heading">Dekorative Effekte aus dem Zugänglichkeitsbaum entfernt</h3>
        <p>Für rein visuelle Atmosphäre eingesetzte WebGL‑Canvas (Three.js) sind mit <code>aria-hidden="true"</code>, <code>role="presentation"</code> und <code>tabindex="-1"</code> aus dem Zugänglichkeitsbaum entfernt.</p>
      </section>

      <section id="semantik" class="sub-section" aria-labelledby="semantik-heading">
        <h3 id="semantik-heading">Korrekte semantische Struktur</h3>
        <p>
          Überschriften bilden eine logische Gliederung (z. B. Abschnittstitel als <code>h2</code>, Untertitel als <code>h3</code>), was die Navigation über Screenreader‑Kurzbefehle verbessert.
        </p>
      </section>

      <section id="i18n" class="sub-section" aria-labelledby="i18n-heading">
        <h3 id="i18n-heading">Zugängliche Internationalisierung & URL‑Abbildung</h3>
        <p>Der Sprachwechsel ist per Tastatur bedienbar, übermittelt seinen Zustand, erhält den Fokus und bildet lokalisierte Slugs korrekt ab (z. B. <code>/en/privacy</code> ↔ <code>/de/datenschutz</code>; <code>/en/imprint</code> ↔ <code>/de/impressum</code>; <code>/en/accessibility</code> ↔ <code>/de/barrierefreiheit</code>). Query und Hash bleiben erhalten.</p>
      </section>

      <section id="scroll" class="sub-section" aria-labelledby="scroll-heading">
        <h3 id="scroll-heading">Vorhersehbares Scrollverhalten</h3>
        <p>Die Startseite nutzt einen gesteuerten Abschnittsnavigator; Unterseiten (z. B. rechtliche Inhalte) verwenden nativen, vertikalen Scroll, um Kompatibilität mit Hilfstechnologien sicherzustellen.</p>
      </section>
    </section>

    <section id="einschraenkungen" class="legal-section" aria-labelledby="einschraenkungen-heading">
      <h2 id="einschraenkungen-heading">Bekannte Einschränkungen</h2>
      <ul class="rights-list">
        <li><strong>Komplexe visuelle Effekte:</strong> Obwohl dekorativ und für Hilfstechnologien ausgeblendet, können WebGL‑Effekte manche Nutzer:innen ablenken. Die Einstellung „Bewegung reduzieren“ dämpft die Effekte. Geplant ist eine Seitenschaltfläche, um Animationen zusätzlich zu pausieren.</li>
        <li><strong>Abdeckung für reduzierte Bewegung:</strong> Alle größeren immersiven WebGL‑Effekte werden inzwischen bei reduzierter Bewegung pausiert/deaktiviert; einzelne kurze Mikroanimationen können noch auftreten. Ich vereinfache verbleibende Bewegungen schrittweise weiter.</li>
        <li><strong>Alternative Beschreibungen für Medien:</strong> Statische Bilder besitzen Alt‑Texte; ich verbessere die Beschreibungsqualität fortlaufend, insbesondere bei Projektdarstellungen mit inhaltlicher Bedeutung.</li>
      </ul>
    </section>

    <section id="feedback" class="legal-section" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">Feedback und Kontakt</h2>
  <p>Wenn Sie auf Barrieren stoßen, die hier nicht aufgeführt sind, melden Sie sich bitte:</p>
  <p>E‑Mail: <a class="link" href="mailto:mika.mueller.work@gmail.com">mika.mueller.work@gmail.com</a>. Ich versuche, innerhalb von 5 Werktagen zu antworten.</p>
    </section>

    <section id="technisch" class="legal-section" aria-labelledby="technisch-heading">
      <h2 id="technisch-heading">Technische Spezifikationen</h2>
      <p>Die Barrierefreiheit dieser Website basiert auf HTML, CSS, JavaScript und WAI‑ARIA. Die Seite ist mit SvelteKit und Three.js erstellt; durch progressive Enhancement bleiben Inhalte verfügbar, auch wenn erweiterte Effekte deaktiviert sind.</p>
    </section>

    <section id="fortlaufend" class="legal-section" aria-labelledby="fortlaufend-heading">
      <h2 id="fortlaufend-heading">Laufende Verbesserungen</h2>
      <ul class="rights-list">
        <li>Breitere Unterstützung für reduzierte Bewegung bei kontinuierlichen Animationen (inklusive WebGL‑Partikel/Raymarching).</li>
        <li>Ein Schalter „Animationen pausieren“ als zusätzliche Kontrolle unabhängig von Systemeinstellungen.</li>
        <li>Regelmäßige Tastatur‑ und Screenreader‑Überprüfungen, um Regressionen zu vermeiden.</li>
        <li>Laufende Prüfung von Alternativtexten und Linkzwecken bei neuen Inhalten.</li>
      </ul>
    </section>

    <footer class="article-footer">
      <button class="back" on:click={backHome} aria-label="Zurück zur Startseite">Zurück zur Startseite</button>
    </footer>
  </article>
</main>

<style>
  .legal-page { min-height: 100vh; padding: clamp(1.5rem, 3vw, 3rem); color: var(--legal-fg, #fafafa); background: radial-gradient(circle at 30% 20%, #111 0%, #0a0a0b 60%, #050506 100%); overflow-y: auto; }
  /* Defensive: falls der Body versehentlich gelockt wird, bleibt Scrollen möglich */
  :global(body) .legal-page { overflow-y: auto; }
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
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
