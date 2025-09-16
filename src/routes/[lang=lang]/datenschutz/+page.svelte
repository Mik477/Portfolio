<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';

  // German-only page (English redirects handled in +page.ts)
  const lang: 'de' = 'de';
  function backHome() { transitionStore.fadeToBlackAndNavigate('/de'); }

  const title = 'Datenschutz';
  const backLabel = 'Zurück zur Startseite';
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = '16.09.2025';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="Datenschutzerklärung: Informationen zum Datenschutz, Server-Logs, Hosting, Cookies, Drittanbietern, E-Mail-Kontakt, externen Links und Ihren Rechten." />
  <!-- Allow indexing (remove robots noindex); add again if you prefer to hide legal pages -->
</svelte:head>

<main class="legal-page">
  <article class="legal-article" lang="de" aria-labelledby="privacy-policy-heading-de">
    <header class="article-header">
      <h1 id="privacy-policy-heading-de">Datenschutzerklärung</h1>
  <p class="last-updated"><strong>Stand:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
      <p class="intro">Ich nehme den Schutz Ihrer persönlichen Daten sehr ernst. Nachfolgend informiere ich Sie ausführlich über den Umgang mit Ihren Daten beim Besuch dieser Webseite. Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) bin ich:</p>
      <address class="controller-address" aria-label="Verantwortlicher">
        <p><span>Miká Müller</span><br />
        <span>Weinbergstraße 16a</span><br />
        <span>38159 Vechelde</span><br />
        <span>Deutschland</span></p>
        <p>E-Mail: <a href="mailto:mika38159@gmail.com" class="link">mika38159@gmail.com</a></p>
      </address>
    </header>

    <section id="datensicherheit" class="legal-section" aria-labelledby="datensicherheit-heading">
      <h2 id="datensicherheit-heading">1. Datensicherheit durch SSL/TLS-Verschlüsselung</h2>
      <p>Um die Sicherheit Ihrer Daten bei der Übertragung zu schützen, verwende ich eine SSL/TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an dem Präfix <code>https://</code> in der Adresszeile Ihres Browsers sowie am Schloss-Symbol. Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an mich übermitteln, nicht von Dritten mitgelesen werden.</p>
    </section>

    <section id="datenerfassung" class="legal-section" aria-labelledby="datenerfassung-heading">
      <h2 id="datenerfassung-heading">2. Datenerfassung auf dieser Webseite</h2>
      <section id="server-log-dateien" class="sub-section" aria-labelledby="server-log-dateien-heading">
        <h3 id="server-log-dateien-heading">a) Server-Log-Dateien</h3>
        <p>Bei jedem Aufruf meiner Webseite erfasst mein System bzw. der Hosting-Provider automatisiert Daten und Informationen vom Computersystem des aufrufenden Rechners.</p>
        <p>Folgende Daten werden hierbei erhoben:</p>
        <ul class="rights-list">
          <li>IP-Adresse des anfragenden Rechners</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>Name und URL der abgerufenen Datei</li>
          <li>Webseite, von der aus der Zugriff erfolgt (Referrer-URL)</li>
          <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
        </ul>
        <p>Die Verarbeitung dieser Daten erfolgt zu dem Zweck, die Nutzung der Webseite zu ermöglichen (Verbindungsaufbau), die Systemsicherheit und -stabilität zu gewährleisten sowie zur technischen Administration der Netzinfrastruktur. Rechtsgrundlage ist Art. 6 Abs. 1 S. 1 lit. f DSGVO. Mein berechtigtes Interesse folgt aus den oben aufgelisteten Zwecken zur Datenerhebung.</p>
      </section>
      <section id="hosting" class="sub-section" aria-labelledby="hosting-heading">
        <h3 id="hosting-heading">b) Hosting</h3>
  <p>Diese Webseite wird bei einem externen Dienstleister gehostet. Die auf dieser Webseite erfassten personenbezogenen Daten werden auf den Servern des Hosters gespeichert.</p>
        <p>Der Einsatz des Hosters erfolgt im Interesse einer sicheren, schnellen und effizienten Bereitstellung meines Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO). Ich habe mit meinem Hoster einen Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO abgeschlossen. Dieser stellt sicher, dass der Hoster Ihre Daten nur nach meinen Weisungen und DSGVO-konform verarbeitet.</p>
      </section>
      <section id="cookies" class="sub-section" aria-labelledby="cookies-heading">
        <h3 id="cookies-heading">c) Cookies</h3>
        <p>Diese Webseite verwendet ausschließlich ein technisch notwendiges Cookie (<code>locale</code>), um Ihre bevorzugte Spracheinstellung zu speichern, wenn Sie diese aktiv auswählen. Rechtsgrundlage ist mein berechtigtes Interesse an einer nutzerfreundlichen Gestaltung der Webseite gemäß Art. 6 Abs. 1 lit. f DSGVO sowie § 25 Abs. 2 Nr. 2 TTDSG.</p>
        <p>Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und deren Verwendung einschränken oder gänzlich unterbinden. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Webseite eingeschränkt sein.</p>
      </section>
    </section>

    <section id="dienste-dritter" class="legal-section" aria-labelledby="dienste-dritter-heading">
      <h2 id="dienste-dritter-heading">3. Einbindung von Diensten Dritter &amp; Datenübermittlung in Drittländer</h2>
      <section id="google-fonts" class="sub-section" aria-labelledby="google-fonts-heading-de">
        <h3 id="google-fonts-heading-de">a) Google Fonts</h3>
        <p>Ich verwende auf meiner Webseite "Google Fonts", einen Dienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Die Einbindung erfolgt durch einen Serveraufruf bei Google, wodurch Ihre IP-Adresse an Google übertragen wird.</p>
        <p><strong>Datenübermittlung in Drittländer:</strong> Google Fonts kann Daten auf Servern in den USA verarbeiten. Die USA gelten datenschutzrechtlich als Drittland. Die Datenübermittlung ist durch die Zertifizierung von Google LLC unter dem EU-U.S. Data Privacy Framework (DPF) legitimiert. Die Europäische Kommission hat mit Angemessenheitsbeschluss vom 10. Juli 2023 das Datenschutzniveau für unter dem DPF zertifizierte Unternehmen als angemessen anerkannt.</p>
        <p>Die Nutzung von Google Fonts erfolgt im Interesse einer einheitlichen und ansprechenden Darstellung meiner Webseite (berechtigtes Interesse gemäß Art. 6 Abs. 1 lit. f DSGVO). Weitere Informationen: <a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" class="link">Google Datenschutzerklärung</a>.</p>
      </section>
      <section id="cloudinary" class="sub-section" aria-labelledby="cloudinary-heading-de">
        <h3 id="cloudinary-heading-de">b) Cloudinary</h3>
        <p>Für die performante Auslieferung von Bild-Assets nutze ich den Dienst Cloudinary Ltd., 111 W 28th St, New York, NY 10001, USA. Beim Laden dieser Assets wird Ihre IP-Adresse an Server von Cloudinary übertragen.</p>
        <p><strong>Datenübermittlung in Drittländer:</strong> Cloudinary verarbeitet Daten auf Servern in den USA. Die Datenübermittlung ist durch die Zertifizierung von Cloudinary, Inc. unter dem EU-U.S. Data Privacy Framework (DPF) legitimiert.</p>
        <p>Die Nutzung von Cloudinary erfolgt im Interesse einer performanten und visuell ansprechenden Gestaltung meiner Webseite (berechtigtes Interesse gemäß Art. 6 Abs. 1 lit. f DSGVO). Weitere Informationen: <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" class="link">Cloudinary Datenschutzerklärung</a>.</p>
      </section>
    </section>

    <section id="kontakt-email" class="legal-section" aria-labelledby="kontakt-email-heading">
      <h2 id="kontakt-email-heading">4. Kontaktaufnahme per E-Mail</h2>
      <p>Wenn Sie mich per E-Mail kontaktieren, speichere ich die von Ihnen übermittelten Daten, um Ihre Anfrage zu bearbeiten. Zielt Ihre Anfrage auf den Abschluss eines Vertrages ab, ist die Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO. In allen anderen Fällen ist die Rechtsgrundlage mein berechtigtes Interesse an der effektiven Bearbeitung der an mich gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden gelöscht, sobald sie für den Zweck ihrer Erhebung nicht mehr erforderlich sind.</p>
    </section>

    <section id="externe-links" class="legal-section" aria-labelledby="externe-links-heading">
      <h2 id="externe-links-heading">5. Externe Links</h2>
      <p>Diese Webseite enthält Links zu externen Webseiten (z.B. GitHub, LinkedIn). Wenn Sie auf einen dieser Links klicken, verlassen Sie meine Webseite. Ich habe keinen Einfluss auf die Datenverarbeitung auf diesen externen Seiten. Es gilt die Datenschutzerklärung des jeweiligen Betreibers.</p>
    </section>

    <section id="rechte-betroffene" class="legal-section" aria-labelledby="rechte-betroffene-heading">
      <h2 id="rechte-betroffene-heading">6. Ihre Rechte als betroffene Person</h2>
      <p>Sie haben das Recht auf:</p>
      <ul class="rights-list">
        <li><strong>Auskunft</strong> (Art. 15 DSGVO)</li>
        <li><strong>Berichtigung</strong> (Art. 16 DSGVO)</li>
        <li><strong>Löschung</strong> (Art. 17 DSGVO)</li>
        <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
        <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
        <li><strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
        <li><strong>Beschwerde</strong> bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
      </ul>
      <p>Sofern eine Verarbeitung auf Ihrer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.</p>
    </section>

    <section id="aenderungen" class="legal-section" aria-labelledby="aenderungen-heading">
      <h2 id="aenderungen-heading">7. Änderung dieser Datenschutzerklärung</h2>
      <p>Ich behalte mir vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.</p>
    </section>

    <footer class="article-footer">
      <button class="back" on:click={backHome} aria-label={backLabel}>{backLabel}</button>
    </footer>
  </article>
</main>

<style>
  .legal-page { min-height: 100vh; padding: clamp(1.5rem, 3vw, 3rem); color: var(--legal-fg, #fafafa); background: radial-gradient(circle at 30% 20%, #111 0%, #0a0a0b 60%, #050506 100%); overflow-y: auto; }
  /* Defensive: ensure nested scroll still works if body accidentally gets locked */
  :global(body) .legal-page { overflow-y: auto; }
  .legal-article { max-width: 75ch; margin: 0 auto; line-height: 1.55; font-size: 1rem; }
  .article-header { margin-bottom: 2.25rem; }
  h1 { font-size: clamp(2.2rem, 5vw, 3.1rem); line-height: 1.1; letter-spacing: -0.5px; margin: 0 0 0.75rem; }
  h2 { font-size: clamp(1.45rem, 3vw, 2rem); margin: 2.5rem 0 1rem; line-height: 1.2; position: relative; }
  h3 { font-size: 1.05rem; margin: 1.75rem 0 0.65rem; letter-spacing: 0.3px; }
  p, li { color: rgba(255,255,255,0.85); }
  p { margin: 0 0 1.15rem; }
  .intro { font-size: 1.05rem; }
  .last-updated { margin: 0 0 1.5rem; color: rgba(255,255,255,0.65); font-size: 0.9rem; }
  address { font-style: normal; line-height: 1.4; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 0.9rem 1rem; border-radius: 10px; margin: 0 0 1.7rem; }
  address p { margin: 0 0 0.5rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
  .rights-list { list-style: disc; padding-left: 1.2rem; margin: 1.25rem 0 1.5rem; }
  .rights-list li { margin: 0 0 0.4rem; }
  .legal-section { scroll-margin-top: 5rem; }
  .sub-section { padding-left: 0.2rem; }
  /* Box accent similar to English version for sub-sections */
  .sub-section { position: relative; padding: 0.2rem 0 0.2rem 0.6rem; border-left: 2px solid rgba(255,255,255,0.08); margin-bottom: 1.2rem; }
  .sub-section h3 { margin-top: 1.2rem; }
  .link { color: #82d6ff; text-decoration: underline; text-underline-offset: 2px; transition: color .25s; }
  .link:hover, .link:focus-visible { color: #b5e7ff; }
  .article-footer { margin-top: 3rem; display: flex; justify-content: flex-start; }
  .back { background: linear-gradient(145deg, #1d1f21, #2a2d31); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.7rem 1.1rem; border-radius: 10px; cursor: pointer; font-size: 0.95rem; letter-spacing: 0.3px; transition: background .25s, transform .25s; }
  .back:hover, .back:focus-visible { background: linear-gradient(145deg, #303438, #353a40); outline: none; }
  .back:active { transform: translateY(2px); }
  /* Focus styles */
  a:focus-visible, .back:focus-visible { box-shadow: 0 0 0 3px rgba(130,214,255,0.45), 0 0 0 6px rgba(130,214,255,0.15); border-radius: 6px; }
  /* Responsive adjustments */
  @media (max-width: 680px) {
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
