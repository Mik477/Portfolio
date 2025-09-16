<script lang="ts">
  import { page } from '$app/stores';
  import { transitionStore } from '$lib/stores/transitionStore';
  // Force English content; if lang param is 'de', we will optionally redirect higher up (handled in datenschutz redirect) or still show EN fallback.
  const lastUpdatedISO = '2025-09-16';
  const lastUpdatedText = 'September 16, 2025';
  $: currentLang = $page.params.lang === 'de' ? 'de' : 'en';
  function backHome() { transitionStore.fadeToBlackAndNavigate(`/${currentLang}`); }
</script>

<svelte:head>
  <title>Privacy Policy</title>
  <meta name="description" content="Privacy Policy: Information on data protection, server logs, hosting, cookies, third-party services, contact by email, external links, and your GDPR rights." />
  <link rel="alternate" hreflang="en" href="/en/privacy" />
  <link rel="alternate" hreflang="de" href="/de/datenschutz" />
</svelte:head>

<main class="legal-page">
  <article class="legal-article" lang="en" aria-labelledby="privacy-policy-heading">
    <header class="article-header">
      <h1 id="privacy-policy-heading">Privacy Policy</h1>
  <p class="last-updated"><strong>Last Updated:</strong> <time datetime={lastUpdatedISO}>{lastUpdatedText}</time></p>
      <p class="intro">I take the protection of your personal data very seriously. This policy provides detailed information about how I handle your data when you visit this website. The data controller, as defined by the General Data Protection Regulation (GDPR), is:</p>
      <address class="controller-address" aria-label="Data Controller Contact">
        <p><span>Miká Müller</span><br />
        <span>Weinbergstraße 16a</span><br />
        <span>38159 Vechelde</span><br />
        <span>Germany</span></p>
        <p>Email: <a href="mailto:mika38159@gmail.com" class="link">mika38159@gmail.com</a></p>
      </address>
    </header>

    <section id="data-security" class="legal-section" aria-labelledby="data-security-heading">
      <h2 id="data-security-heading">1. Data Security Through SSL/TLS Encryption</h2>
      <p>To protect the security of your data during transmission, this site uses SSL/TLS encryption. You can recognize an encrypted connection by the <code>https://</code> prefix in your browser address bar and by the lock symbol. When SSL or TLS encryption is activated, the data you transmit cannot be read by third parties.</p>
    </section>

    <section id="data-collection" class="legal-section" aria-labelledby="data-collection-heading">
      <h2 id="data-collection-heading">2. Data Collection on This Website</h2>
      <section id="server-log-files" class="sub-section" aria-labelledby="server-log-files-heading">
        <h3 id="server-log-files-heading">a) Server Log Files</h3>
        <p>Each time you access this website, the system or hosting provider automatically collects data from the accessing device. This includes your IP address, date and time of access, requested file, referrer URL, and browser information. Processing is based on the legitimate interest (Art. 6(1)(f) GDPR) in ensuring stability, security, and technical administration of the website.</p>
      </section>
      <section id="hosting" class="sub-section" aria-labelledby="hosting-heading">
        <h3 id="hosting-heading">b) Hosting</h3>
        <p>This website is hosted by an external service provider. Personal data collected on this website is stored on the host's servers.</p>
        <p>The use of a hosting provider is based on the legitimate interest in a secure, fast, and efficient provision of online services by a professional provider (Art. 6(1)(f) GDPR). A Data Processing Agreement (DPA) pursuant to Art. 28 GDPR ensures data is processed only on documented instructions and in compliance with the GDPR.</p>
      </section>
      <section id="cookies" class="sub-section" aria-labelledby="cookies-heading">
        <h3 id="cookies-heading">c) Cookies</h3>
        <p>This website uses a single, technically necessary cookie (<code>locale</code>) to save your preferred language setting. This is based on the legitimate interest in providing a user-friendly website (Art. 6(1)(f) GDPR). You can manage or disable cookies in your browser settings; doing so may affect functionality.</p>
      </section>
    </section>

    <section id="third-party" class="legal-section" aria-labelledby="third-party-heading">
      <h2 id="third-party-heading">3. Third-Party Services &amp; Data Transfer to Third Countries</h2>
      <section id="google-fonts" class="sub-section" aria-labelledby="google-fonts-heading">
        <h3 id="google-fonts-heading">a) Google Fonts</h3>
        <p>Google Fonts (provider: Google Ireland Limited) are used to ensure a consistent and appealing presentation. When you access a page, your browser loads the required fonts and your IP address is transmitted to Google servers.</p>
        <p><strong>Data Transfer to Third Countries:</strong> Google Fonts may process data on servers in the USA. The USA is considered a third country under data protection law. The transfer is legitimized by Google LLC's certification under the EU-U.S. Data Privacy Framework (DPF). The EU Commission deemed the level of protection adequate for certified companies (decision of 10 July 2023).</p>
        <p>The use of Google Fonts is based on legitimate interest according to Art. 6(1)(f) GDPR. Further information: <a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" class="link">Google Privacy Policy</a>.</p>
      </section>
      <section id="cloudinary" class="sub-section" aria-labelledby="cloudinary-heading">
        <h3 id="cloudinary-heading">b) Cloudinary</h3>
        <p>The content delivery network Cloudinary (provider: Cloudinary Ltd., USA) is used for performant delivery of image assets. Loading these assets transmits your IP address to Cloudinary servers.</p>
        <p><strong>Data Transfer to Third Countries:</strong> Cloudinary processes data on servers in the USA. The transfer is legitimized by Cloudinary Inc.'s certification under the EU-U.S. Data Privacy Framework (DPF).</p>
        <p>The use of Cloudinary is based on the legitimate interest in performance and visual quality (Art. 6(1)(f) GDPR). More information: <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" class="link">Cloudinary Privacy Policy</a>.</p>
      </section>
    </section>

    <section id="contact-email" class="legal-section" aria-labelledby="contact-email-heading">
      <h2 id="contact-email-heading">4. Contacting Me by Email</h2>
      <p>If you contact me by email, the data you provide is stored to process your request. If your inquiry aims at entering into a contract, processing is based on Art. 6(1)(b) GDPR; otherwise on the legitimate interest in effectively handling inquiries (Art. 6(1)(f) GDPR). Data is deleted when no longer necessary for its original purpose.</p>
    </section>

    <section id="external-links" class="legal-section" aria-labelledby="external-links-heading">
      <h2 id="external-links-heading">5. External Links</h2>
      <p>This website contains links to external websites (e.g., GitHub, LinkedIn). Clicking these links leaves this site. I have no influence on data processing by external operators. Their respective privacy policies apply.</p>
    </section>

    <section id="data-subject-rights" class="legal-section" aria-labelledby="data-subject-rights-heading">
      <h2 id="data-subject-rights-heading">6. Your Rights as a Data Subject</h2>
      <p>You have the following rights under the GDPR:</p>
      <ul class="rights-list">
        <li><strong>Access</strong> (Art. 15)</li>
        <li><strong>Rectification</strong> (Art. 16)</li>
        <li><strong>Erasure</strong> (Art. 17)</li>
        <li><strong>Restriction of Processing</strong> (Art. 18)</li>
        <li><strong>Data Portability</strong> (Art. 20)</li>
        <li><strong>Object to Processing</strong> (Art. 21)</li>
        <li><strong>Complaint</strong> with a supervisory authority (Art. 77)</li>
      </ul>
      <p>Where processing is based on consent, you may withdraw that consent at any time with future effect.</p>
    </section>

    <section id="changes" class="legal-section" aria-labelledby="changes-heading">
      <h2 id="changes-heading">7. Changes to this Privacy Policy</h2>
      <p>I reserve the right to adapt this privacy policy to ensure ongoing compliance with legal requirements. The updated policy applies to future visits.</p>
    </section>

    <footer class="article-footer">
      <button class="back" on:click={backHome} aria-label="Back to homepage">Back to homepage</button>
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
  h2 { font-size: clamp(1.45rem, 3vw, 2rem); margin: 3rem 0 1rem; line-height: 1.2; position: relative; }
  h3 { font-size: 1.15rem; margin: 2rem 0 0.75rem; letter-spacing: 0.3px; }
  p, li { color: rgba(255,255,255,0.85); }
  p { margin: 0 0 1.15rem; }
  .intro { font-size: 1.05rem; }
  .last-updated { margin: 0 0 1.5rem; color: rgba(255,255,255,0.65); font-size: 0.9rem; }
  address { font-style: normal; line-height: 1.4; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 0.9rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; }
  address p { margin: 0 0 0.5rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
  .rights-list { list-style: disc; padding-left: 1.2rem; margin: 0 0 1.5rem; }
  .rights-list li { margin: 0 0 0.4rem; }
  .legal-section { scroll-margin-top: 5rem; }
  .sub-section { padding-left: 0.2rem; }
  .link { color: #82d6ff; text-decoration: underline; text-underline-offset: 2px; }
  .link:hover, .link:focus-visible { color: #b5e7ff; }
  .article-footer { margin-top: 3rem; display: flex; justify-content: flex-start; }
  .back { background: linear-gradient(145deg, #1d1f21, #2a2d31); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.7rem 1.1rem; border-radius: 10px; cursor: pointer; font-size: 0.95rem; letter-spacing: 0.3px; transition: background .25s, transform .25s; }
  .back:hover, .back:focus-visible { background: linear-gradient(145deg, #303438, #353a40); outline: none; }
  .back:active { transform: translateY(2px); }
  a:focus-visible, .back:focus-visible { box-shadow: 0 0 0 3px rgba(130,214,255,0.45), 0 0 0 6px rgba(130,214,255,0.15); border-radius: 6px; }
  @media (max-width: 680px) {
    .legal-article { font-size: 0.96rem; }
    h2 { margin-top: 2.4rem; }
    h3 { margin-top: 1.4rem; }
    .article-footer { margin-top: 2.2rem; }
  }
</style>
