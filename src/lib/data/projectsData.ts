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
    headline: isDE ? 'Projekt 2' : 'Project 2',
    summary: isDE ? 'Platzhaltertext für ein zweites Projekt (kommt bald)' : 'Placeholder text for a second project (coming soon)',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-two/Vio.webp' }
    ],
    backgroundsMobile: [
      { type: 'image', value: '/images/projects/project-two/Vio.webp' }
    ],
    tags: isDE ? ['Platzhalter', 'Konzept', 'Demo'] : ['Placeholder', 'Concept', 'Demo'],
    cards: [
      { id: 'p2_section_a', title: isDE ? 'Abschnitt A' : 'Section A', cardImage: '/images/projects/project-two/card-data-small.webp', description: isDE ? 'Platzhalter' : 'Placeholder', aspectLink: '#section-a' },
      { id: 'p2_section_b', title: isDE ? 'Abschnitt B' : 'Section B', cardImage: '/images/projects/project-two/card-design-small.webp', description: isDE ? 'Platzhalter' : 'Placeholder', aspectLink: '#section-b' },
      { id: 'p2_section_c', title: isDE ? 'Abschnitt C' : 'Section C', cardImage: '/images/projects/project-two/card-insights-small.webp', description: isDE ? 'Platzhalter' : 'Placeholder', aspectLink: '#section-c' }
    ],
    subPageSections: [
      {
        id: 'section-a',
        title: isDE ? 'Abschnitt A' : 'Section A',
        content: isDE ? 'Platzhalterinhalt A. Lorem ipsum dolor sit amet.' : 'Placeholder content A. Lorem ipsum dolor sit amet.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'section-b',
        title: isDE ? 'Abschnitt B' : 'Section B',
        content: isDE ? 'Platzhalterinhalt B. Consectetur adipiscing elit.' : 'Placeholder content B. Consectetur adipiscing elit.',
        background: { type: 'image', value: '/images/projects/project-two/Vio.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-two/Vio.webp' }
      },
      {
        id: 'section-c',
        title: isDE ? 'Abschnitt C' : 'Section C',
        content: isDE ? 'Platzhalterinhalt C. Sed do eiusmod tempor.' : 'Placeholder content C. Sed do eiusmod tempor.',
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