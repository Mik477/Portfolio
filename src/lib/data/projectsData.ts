// src/lib/data/projectsData.ts

// The ProjectCard no longer holds the sub-section's background.
// It is now only responsible for its own appearance and linking.
export interface ProjectCard {
  id: string; // Unique ID for this card, e.g., 'p1_capability'
  title: string;
  cardImage?: string; // Path to the small, optimized image for the main page card
  description?: string; // Short description for the card
  aspectLink?: string; // Anchor link for the subpage section, e.g., '#capability'
}

export interface ProjectCardDisplayConfig {
  variant: 'parallax' | 'image-frame';
  tiltIntensity?: number;
  mobileTiltIntensity?: number;
}

export interface ProjectHeadlineSegment {
  text: string;
  bold?: boolean;
  breakBefore?: boolean;
  weight?: number;
  fontScale?: number;
}

// This interface is the definitive source for a sub-section's content and background.
export interface ProjectSubPageSection {
    id: string; // Corresponds to aspectLink from a card, used for scrolling
    title: string;
    content: string;
    background: {
      type: 'image' | 'video' | 'color';
      value: string; // The URL for this specific section's background
    };
    backgroundMobile?: {
      type: 'image' | 'video' | 'color';
      value: string;
    };
}

// This is the main project interface, which holds all data for a project.
export interface Project {
  id: string;
  slug: string;
  headline: string;
  headlineSegments?: ProjectHeadlineSegment[];
  headlineAnimation?: {
    type?: string;
    duration?: number;
    delay?: number;
    stagger?: number;
    ease?: string;
  };
  summary: string;
  backgrounds: { // The list of images to cycle through on the main page
    type: 'image';
    value: string;
  }[];
  backgroundsMobile?: {
    type: 'image';
    value: string;
  }[];
  tags?: string[];
  cards: ProjectCard[];
  subPageSections: ProjectSubPageSection[];
  readMoreLinkText?: string;
  cardDisplay?: ProjectCardDisplayConfig;
}

export type Locale = 'en' | 'de';

// ---- NEW: Localized About & Contact Content (moved from siteConfig) ----
export interface AboutContent {
  title: string;
  introduction: string;
  imageUrl: string;
  imageParticleEffect: { type: string }; // minimal ParticleEffectConfig reference
  socialLinks: { name: string; url: string; icon?: string }[];
  disableImageOnMobile?: boolean;
}

// Feature flags (simple manual toggles)
export const featureFlags = {
  showInstagram: false,
  disableAboutImageOnMobile: true
};

export interface ContactContent {
  title: string;
  // Supports optional line break token [[br]] which will render as a <br> in ContactSection
  outroMessage: string;
  email: string;
  additionalLinks: { name: string; url: string }[];
}

const aboutContentByLocale: Record<Locale, AboutContent> = {
  en: {
    title: 'About Me',
    introduction: "I am a data science student specializing in building end-to-end systems that derive actionable intelligence from real-world data. The projects below demonstrate my capability in integrating custom hardware, robust software, and advanced perception models to solve complex operational challenges.",
    imageUrl: '/images/profile.webp',
    imageParticleEffect: { type: 'imageAuraParticles' },
    disableImageOnMobile: featureFlags.disableAboutImageOnMobile,
    socialLinks: (() => {
      const links = [
        { name: 'GitHub', url: 'https://github.com/coming_soon' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/coming_soon/' },
        { name: 'Email', url: 'mailto:mika.mueller.work@gmail.com' }
      ];
      if (featureFlags.showInstagram) {
        links.splice(2, 0, { name: 'Instagram', url: 'https://www.instagram.com/coming_soon/' });
      }
      return links;
    })()
  },
  de: {
    title: 'Über Mich',
    introduction: 'Ich bin Data Science Student und entwickle Ende-zu-Ende Systeme, die aus realen Daten verwertbare Erkenntnisse gewinnen. Die folgenden Projekte zeigen meine Fähigkeit, maßgeschneiderte Hardware, robuste Software und hoch moderne Wahrnehmungs-Modelle zu integrieren, um komplexe operative Herausforderungen zu lösen.',
    imageUrl: '/images/profile.webp',
    imageParticleEffect: { type: 'imageAuraParticles' },
    disableImageOnMobile: featureFlags.disableAboutImageOnMobile,
    socialLinks: (() => {
      const links = [
        { name: 'GitHub', url: 'https://github.com/coming_soon' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/coming_soon/' },
        { name: 'Email', url: 'mailto:mika.mueller.work@gmail.com' }
      ];
      if (featureFlags.showInstagram) {
        links.splice(2, 0, { name: 'Instagram', url: 'https://www.instagram.com/coming_soon/' });
      }
      return links;
    })()
  }
};

const contactContentByLocale: Record<Locale, ContactContent> = {
  en: {
    title: 'Get in Touch',
    // Insert [[br]] for a manual line break
    outroMessage: "I'm always excited to discuss new projects, [[br]] collaborations, or opportunities. Feel free to reach out!",
  email: 'mika.mueller.work@gmail.com',
    additionalLinks: [{ name: 'View My Resume', url: '/resume.pdf' }]
  },
  de: {
    title: 'Kontakt',
    outroMessage: 'Ich freue mich über neue Projekte, Kooperationen oder Austausch. [[br]]Schreiben Sie mir gerne!',
  email: 'mika.mueller.work@gmail.com',
    additionalLinks: [{ name: 'Lebenslauf', url: '/resume.pdf' }]
  }
};

export function getAboutContent(locale: Locale): AboutContent {
  return aboutContentByLocale[locale] ?? aboutContentByLocale.en;
}

export function getContactContent(locale: Locale): ContactContent {
  return contactContentByLocale[locale] ?? contactContentByLocale.en;
}

export function getProjects(locale: Locale): Project[] {
  const isDE = locale === 'de';

  const projectOne: Project = {
    id: 'project-one',
    slug: 'BURA',
    headline: isDE ? 'BURA \n Langstrecken-Aufklärungs-Drohne' : 'BURA \n Long Range Recon UAV',
    headlineSegments: isDE
      ? [
          { text: 'BURA', bold: true, weight: 460 },
          { text: 'Langstrecken Aufklärung', breakBefore: false, fontScale: 0.92 }
        ]
      : [
          { text: 'BURA', bold: true, weight: 460 },
          { text: 'Long Range Recon', breakBefore: true, fontScale: 0.92 }
        ],
    summary: isDE
      ? 'Ein vollständig 3D-gedruckte Drohne für Langstrecken- und mehrstündige Aufklärungsmissionen.'
      : 'A fully 3D-Printed UAV designed for long-range, multi-hour reconnaissance missions.',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-one/Drone_Sunset.webp' },
      { type: 'image', value: '/images/projects/project-one/clouds.webp' },
      { type: 'image', value: '/images/projects/project-one/Me_and_Drone.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_close_clouds.webp' }
    ],
    backgroundsMobile: [
      { type: 'image', value: '/images/projects/project-one/mobile2_Drone_Sunset.jpg' },
      { type: 'image', value: '/images/projects/project-one/mobile_clouds.jpg' },
      { type: 'image', value: '/images/projects/project-one/Me_and_Drone.webp' },
      { type: 'image', value: '/images/projects/project-one/mobile_Drone_close_clouds.jpg' }
    ],
    tags: isDE
      ? ['3D‑Druck', 'UAV‑Design', 'Luft- und Raumfahrttechnik', 'Elektronik']
      : ['3D Printing', 'UAV Design', 'Aerospace Engineering', 'Electronics'],
    cards: [
      {
        id: 'p1_capability',
        title: isDE ? 'Fähigkeiten' : 'Capability',
        cardImage: '/images/projects/project-one/card1_cropped.webp',
        description: isDE
          ? 'Ausgefeilte Sensorik für fortgeschrittene autonome Funktionen'
          : 'Elaborate Sensor Array for advanced autonomous capabilities',
        aspectLink: '#capability'
      },
      {
        id: 'p1_3d_printing',
        title: isDE ? '3D‑Druck' : '3D-Printing',
        cardImage: '/images/projects/project-one/card2_cropped.webp',
        description: isDE
          ? 'Vollständig 3D‑gedruckt mit LW‑PLA und ASA'
          : 'Fully 3D-printed Airframe using LW-PLA and ASA',
        aspectLink: '#3d-printing'
      },
      {
        id: 'p1_testing',
        title: isDE ? 'Tests' : 'Testing',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: isDE
          ? 'Analyse der Leistungsdaten und Flugeigenschaften'
          : 'Analyzing model performance and flight characteristics',
        aspectLink: '#testing'
      }
    ],
    subPageSections: [
      {
        id: 'capability',
        title: isDE ? 'Autonome Fähigkeiten' : 'Advanced Autonomous Capabilities',
        content: isDE
          ? 'Detaillierte Vorstellung der Sensorsuite mit hochauflösender Kamera, GPS und Echtzeit-Datenlinks – Grundlage für anspruchsvolle autonome Flüge und Datenerfassung. (Coming soon)'
          : 'Detailed walkthrough of the sensor suite, including a high-resolution camera, GPS and real-time data links, enabling sophisticated autonomous flight and data collection. (Coming soon)',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' }
      },
      {
        id: '3d-printing',
        title: isDE ? 'Fertigung' : 'Manufacturing',
        content: isDE
          ? 'Erläuterung des Designs mit Lightweight PLA (LW‑PLA) für Strukturbauteile und ASA für robuste, strukturelle Teile optimiert für Langlebigkeit und optimale Flugzeit. (Coming soon)'
          : 'Explanation of the design process using lightweight PLA (LW-PLA) for structural components and ASA for durable structural surfaces, optimizing for both strength and flight time. (Coming soon)',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' }
      },
      {
        id: 'testing',
        title: isDE ? 'Feldtests & Validierung' : 'Field Testing & Validation',
        content: isDE
          ? 'Präsentation der Flugtestergebnisse, darunter Ausdauer, Reichweite und Nutzlast (Coming Soon). Das UAV demonstrierte über 2 Stunden Flugzeit und eine Reichweite von über 20 km.'
          : 'Presentation of flight test data, including endurance, range, and payload capacity metrics (Coming Soon). The UAV successfully demonstrated over 2 hours of flight time and a range of more than 20 km.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' }
      }
    ],
    readMoreLinkText: isDE ? 'Mehr erfahren' : 'Explore More'
  };

  const projectTwo: Project = {
    id: 'project-two',
    slug: 'Project2',
    headline: isDE ? 'VIO // Einsatzleitsystem' : 'VIO // Mission Intelligence Console',
    headlineSegments: isDE
      ? [
          { text: 'VIO', bold: true, weight: 520 },
          { text: 'Einsatzleit-System', breakBefore: true, fontScale: 0.9 }
        ]
      : [
          { text: 'VIO', bold: true, weight: 520 },
          { text: 'Mission Intelligence Console', breakBefore: true, fontScale: 0.9 }
        ],
    summary: isDE
      ? 'Ein KI-gestütztes Einsatzleit-System, das Luftbilder, Telemetrie und Einsatzberichte zu einem gemeinsamen Lagebild fusioniert.'
      : 'An AI-assisted mission console that fuses aerial imagery, telemetry and operator annotations into a single live picture.',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-two/Vio.webp' }
    ],
    backgroundsMobile: [
      { type: 'image', value: '/images/projects/project-two/Vio.webp' }
    ],
    tags: isDE
      ? ['Mission Control', 'Sensorfusion', 'Echtzeit-Analytik']
      : ['Mission Control', 'Sensor Fusion', 'Realtime Analytics'],
    cardDisplay: {
      variant: 'image-frame',
      tiltIntensity: 1.4,
      mobileTiltIntensity: 0
    },
    cards: [
      {
        id: 'p2_live_ops',
        title: isDE ? 'Live-Lagebild' : 'Live Operations Feed',
        cardImage: '/images/projects/project-two/H_CUT_1_Fog.png',
        description: isDE
          ? 'Telemetrie, Karten und Drohnenvideo verschmelzen zu einem synchronisierten Lagebild.'
          : 'Telemetry, maps and drone video merge into one synchronized feed.',
        aspectLink: '#live-ops'
      },
      {
        id: 'p2_adaptive_ui',
        title: isDE ? 'Adaptive Missions-UI' : 'Adaptive Mission UI',
        cardImage: '/images/projects/project-two/H_1_Fog.png',
        description: isDE
          ? 'Bedienoberfläche passt sich Crew-Rollen an und reduziert Funkverkehr.'
          : 'The interface adapts to crew roles while reducing voice chatter.',
        aspectLink: '#adaptive-ui'
      },
      {
        id: 'p2_ai_insights',
        title: isDE ? 'Insight Engine' : 'Insight Engine',
        cardImage: '/images/projects/project-two/card-insights-small.webp',
        description: isDE
          ? 'KI markiert Gefahren, generiert Einsatznotizen und priorisiert Aufgaben live.'
          : 'AI flags hazards, drafts mission notes and prioritises tasks in real time.',
        aspectLink: '#analytics'
      },
      {
        id: 'p2_collab_overlay',
        title: isDE ? 'Collaborative Overlay' : 'Collaboration Overlay',
        cardImage: '/images/projects/project-two/Vio.webp',
        description: isDE
          ? 'Geteilte Markierungen und Statusupdates synchronisieren sich für jede Rolle in Sekunden.'
          : 'Shared callouts and status tags sync across every role in seconds.',
        aspectLink: '#collaboration'
      },
      {
        id: 'p2_after_action',
        title: isDE ? 'Nachbereitungsmodus' : 'After-Action Mode',
        cardImage: '/images/projects/project-two/card-design-small.webp',
        description: isDE
          ? 'Zeitachsen-Clips, Erkenntnisse und Aufgabenlisten verdichten sich zu exportierbaren Einsatzpaketen.'
          : 'Timeline clips, insights and task lists condense into export-ready mission packets.',
        aspectLink: '#debrief'
      }
    ],
    subPageSections: [
      {
        id: 'live-ops',
        title: isDE ? 'Gemeinsames Lagebild' : 'Unified Mission Picture',
        content: isDE
          ? 'VIO verbindet Drohnen, stationäre Kameras und GPS-Tracker in einer Zeitleiste. Einsatzleitungen erkennen Konflikte oder Lücken sofort und können Luftaufnahmen mit Telemetrie-Fakten referenzieren.'
          : 'VIO stitches drones, fixed cameras and GPS trackers into one scrub-able timeline. Commanders spot conflicts or blind spots instantly and cross-reference aerial imagery with telemetry facts.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'adaptive-ui',
        title: isDE ? 'Rollenbasierte Arbeitsfläche' : 'Role-aware Workflows',
        content: isDE
          ? 'Operator:innen erhalten modulare Bedienpanels: Taktik, Technik und Pilotenansicht stellen nur relevante Widgets zusammen. Die UI lernt aus Einsatzmustern und blendet Nebeninfos automatisch aus.'
          : 'Operators receive modular work panels: tacticians, technicians and pilots each see curated widgets. The UI learns from mission patterns and hides secondary details automatically.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'analytics',
        title: isDE ? 'Echtzeit-Insights' : 'Realtime Insights',
        content: isDE
          ? 'Ein Insight-Engine markiert Gefahrenzonen, fasst Sprachkommandos zu Einsatznotizen zusammen und priorisiert Tasks für die Nachteams. Alle Befunde lassen sich in Einsatzberichte exportieren.'
          : 'An insight engine flags hazards, transcribes radio calls into mission notes and queues follow-up actions for relief crews. Findings export directly into the debrief package.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'collaboration',
        title: isDE ? 'Crew-Kollaboration' : 'Crew Collaboration',
        content: isDE
          ? 'Gemeinsame Layer verbinden Funksprüche, Skizzen und Gefahrenmarker auf einer einzigen Leinwand. Jede Änderung wird sofort für Leitstand, Einsatzkräfte und Drohnenpiloten synchronisiert.'
          : 'Shared overlays blend radio snippets, sketches and hazard markers onto one canvas. Updates sync instantly for command, field teams and drone pilots.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'debrief',
        title: isDE ? 'Nachbereitung & Reports' : 'Debrief & Reports',
        content: isDE
          ? 'Der Nachbereitungsmodus aggregiert Timeline-Clips, KI-Funde und Aufgabenlisten zu einem strukturierten Einsatzbericht. Exportiert wird wahlweise als PDF, Missionspaket oder API-Feed.'
          : 'After-action mode bundles timeline clips, AI findings and task queues into a structured mission report. Export as PDF, mission bundle or API feed.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      }
    ],
    readMoreLinkText: isDE ? 'Mehr erfahren' : 'Explore More'
  };

  return [projectOne, projectTwo];
}

// Backward-compatible default export (English)
export const projects: Project[] = getProjects('en');