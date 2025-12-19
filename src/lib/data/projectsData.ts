// src/lib/data/projectsData.ts

// The ProjectCard no longer holds the sub-section's background.
// It is now only responsible for its own appearance and linking.
export interface ProjectCard {
  id: string; // Unique ID for this card, e.g., 'p1_capability'
  title: string;
  cardImage?: string; // Path to the small, optimized image for the main page card
  cardImageMobile?: string; // Optional mobile-specific image variant
  description?: string; // Short description for the card
  aspectLink?: string; // Anchor link for the subpage section, e.g., '#capability'
}

export interface ProjectCardDisplayConfig {
  variant: 'parallax' | 'image-frame' | 'image-frame-vertical';
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

// Stat item for StatsBar component
export interface SubPageStatItem {
  value: string;
  label: string;
}

// Extended section layout types for the new subpage designs
export type SubPageLayoutType = 
  | 'overview'      // Hero with stats bar
  | 'manufacturing' // Two-column with materials strip
  | 'capabilities'  // Feature grid with center space
  | 'testing'       // Vertical gallery with stats
  | 'simple';       // Fallback: simple centered content

// Extended data for each layout type
export interface OverviewLayoutData {
  subtitle: string;
  stats: SubPageStatItem[];
}

export interface ManufacturingLayoutData {
  printingTitle: string;
  printingPoints: string[];
  printingImage?: string;
  batteryTitle: string;
  batteryDescription: string;
  batteryImage?: string;
  materials: string[];
}

export interface CapabilitiesLayoutData {
  sensorTitle: string;
  sensorDescription: string;
  sensorImage?: string;
  antennaTitle: string;
  antennaDescription: string;
  antennaImage?: string;
  gpsTitle: string;
  gpsFeatures: string[];
}

export interface TestingLayoutData {
  introText: string;
  materialImage?: string;
  materialCaption: string;
  versionImage?: string;
  versionCaption: string;
  stats: SubPageStatItem[];
}

// This interface is the definitive source for a sub-section's content and background.
export interface ProjectSubPageSection {
    id: string; // Corresponds to aspectLink from a card, used for scrolling
    title: string;
    content: string; // Legacy simple content (used for mobile)
    background: {
      type: 'image' | 'video' | 'color';
      value: string; // The URL for this specific section's background
    };
    backgroundMobile?: {
      type: 'image' | 'video' | 'color';
      value: string;
    };
    // Extended layout support (desktop)
    layoutType?: SubPageLayoutType;
    layoutData?: OverviewLayoutData | ManufacturingLayoutData | CapabilitiesLayoutData | TestingLayoutData;
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
  overviewBackground?: {
    type: 'image';
    value: string;
  };
  overviewBackgroundMobile?: {
    type: 'image';
    value: string;
  };
  tags?: string[];
  cards: ProjectCard[];
  subPageSections?: ProjectSubPageSection[];
  readMoreLinkText?: string;
  paperUrl?: string; // Optional PDF link for projects without subpages
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
        { name: 'GitHub', url: 'https://github.com/Mik477' },
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
      ? 'Eine vollständig 3D-gedruckte Drohne für Langstrecken- und mehrstündige Aufklärungsmissionen.'
      : 'A fully 3D-Printed UAV designed for long-range, multi-hour reconnaissance missions.',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-one/Drone_Sunset.webp' },
      { type: 'image', value: '/images/projects/project-one/Sonnenblumen.webp' },
      { type: 'image', value: '/images/projects/project-one/clouds.webp' },
      { type: 'image', value: '/images/projects/project-one/LightClouds1.webp' },
      { type: 'image', value: '/images/projects/project-one/Trees.webp' },
      { type: 'image', value: '/images/projects/project-one/Me_and_Drone.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_close_clouds.webp' }
    ],
    backgroundsMobile: [
      { type: 'image', value: '/images/projects/project-one/mobile2_Drone_Sunset.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_Trees.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_Front.webp' },      
      { type: 'image', value: '/images/projects/project-one/mobile_clouds.jpg' },      
      { type: 'image', value: '/images/projects/project-one/Drone_Sunflowers_Wide.webp' },      
      { type: 'image', value: '/images/projects/project-one/mobile_Drone_close_clouds.jpg' }     
    ],
    overviewBackground: { type: 'image', value: '/images/projects/project-one/profile_drone.webp' },
    overviewBackgroundMobile: { type: 'image', value: '/images/projects/project-one/profile_drone_shorter1.JPG' },
    tags: isDE
      ? ['3D‑Druck', 'UAV‑Design', 'Luft- und Raumfahrttechnik', 'Elektronik']
      : ['3D Printing', 'UAV Design', 'Aerospace Engineering', 'Electronics'],
    cards: [
      {
        id: 'p1_manufacturing',
        title: isDE ? '3D-Druck' : '3D-Printing',
        cardImage: '/images/projects/project-one/card2_cropped.webp',
        description: isDE
          ? 'Vollständig 3D‑gedruckt mit LW‑PLA und ASA'
          : 'Fully 3D-printed Airframe using LW-PLA and ASA',
        aspectLink: '#manufacturing'
      },
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
      // Section 2: Manufacturing (3D printing + batteries)
      {
        id: 'manufacturing',
        title: isDE ? 'Fertigung' : 'Manufacturing',
        content: isDE
          ? 'Vollständig 3D-gedruckter Rahmen mit LW-PLA und ASA. Maßgeschneiderte LiIon-Akkupacks für optimale Leistung.'
          : 'Fully 3D-printed airframe using LW-PLA and ASA. Custom LiIon battery packs for optimal performance.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' },
        layoutType: 'manufacturing',
        layoutData: {
          printingTitle: isDE ? '3D-Druck' : '3D Printing',
          printingPoints: isDE
            ? [
                'LW-PLA für minimales Gewicht',
                'ASA für strukturelle Festigkeit',
                'Kohlefaserverstärkungen',
                'Optimierte Schichtorientierung'
              ]
            : [
                'LW-PLA for minimal weight',
                'ASA for structural durability',
                'Carbon fiber reinforcements',
                'Optimized layer orientation'
              ],
          printingImage: '/images/projects/project-one/printer2.webp',
          batteryTitle: isDE ? 'Akkusystem' : 'Battery System',
          batteryDescription: isDE
            ? 'Maßgeschneiderte 18650 4S2P und 4S4P LiIon-Akkupacks, optimiert für das beste Verhältnis von Energie zu Gewicht für verlängerte Flugzeiten.'
            : 'Custom 18650 4S2P and 4S4P LiIon battery packs optimized for best energy-to-weight ratio for extended flight times.',
          batteryImage: '/images/projects/project-one/battery.webp',
          materials: ['LW-PLA', 'ASA', isDE ? 'Kohlefaser' : 'Carbon Fiber', '18650 Cells']
        }
      },
      // Section 3: Capabilities (sensors, GPS, antenna)
      {
        id: 'capability',
        title: isDE ? 'Fähigkeiten' : 'Capabilities',
        content: isDE
          ? 'Fortschrittliche Sensoren, GPS-gestützte Autonomie und Dual-Antennen-Design für optimale Reichweite.'
          : 'Advanced sensor array, GPS-guided autonomy, and dual antenna design for optimal range.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' },
        layoutType: 'capabilities',
        layoutData: {
          sensorTitle: isDE ? 'Sensorik' : 'Sensor Array',
          sensorDescription: isDE
            ? 'Digitale und analoge Videoübertragung für Echtzeit-Aufklärungsmissionen. Maßgeschneidertes FPV-Setup für kombinierte First- und Third-Person-Ansichten.'
            : 'Digital and analog video transmission for real-time reconnaissance missions. Custom FPV setup for combined first and third-person views.',
          sensorImage: '/images/projects/project-one/FPV_Headset.webp',
          antennaTitle: isDE ? 'Dual-RX-Antenne' : 'Dual RX Antenna',
          antennaDescription: isDE
            ? 'Diversitäts-Empfang für optimale Reichweite und Signalqualität auch bei schwierigen Bedingungen.'
            : 'Diversity reception for optimal range and signal quality even in challenging conditions.',
          antennaImage: '/images/projects/project-one/battery.webp',
          gpsTitle: isDE ? 'GPS-Autonomie' : 'GPS Autonomy',
          gpsFeatures: isDE
            ? ['Wegpunkt-Navigation', 'Return-to-Home', 'Loiter-Modus', 'Geofencing']
            : ['Waypoint Navigation', 'Return-to-Home', 'Loiter Mode', 'Geofencing']
        }
      },
      // Section 4: Testing & Optimization
      {
        id: 'testing',
        title: isDE ? 'Tests & Optimierung' : 'Testing & Optimization',
        content: isDE
          ? 'Iterative Entwicklung über mehrere Versionen. Materialvergleiche und über 25 Testflüge.'
          : 'Iterative development across multiple versions. Material comparisons and over 25 test flights.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' },
        backgroundMobile: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' },
        layoutType: 'testing',
        layoutData: {
          introText: isDE
            ? 'Der Weg zur optimalen Leistung erforderte umfangreiche Iterationen bei Druckeinstellungen, Materialien und Strukturkonfigurationen.'
            : 'The path to optimal performance required extensive iteration across print settings, materials, and structural configurations.',
          materialImage: '/images/projects/project-one/material_comparison.webp',
          versionImage: '/images/projects/project-one/version_evolution.webp',
          stats: [
            { value: 'V1→V4', label: isDE ? 'Iterationen' : 'Iterations' },
            { value: '25+', label: isDE ? 'Testflüge' : 'Test Flights' },
            { value: isDE ? 'Gewicht' : 'Weight', label: isDE ? 'Optimiert' : 'Optimized' }
          ]
        }
      }
    ],
    readMoreLinkText: isDE ? 'Mehr erfahren' : 'Explore More'
  };

  const projectTwo: Project = {
    id: 'project-two',
    slug: 'Project2',
    headline: isDE ? 'VIO // Hierarchisches Multi Object Tracking' : 'VIO // Hierarchical Multi Object Tracking',
    headlineSegments: isDE
      ? [
          { text: 'VIO', bold: true, weight: 520 },
          { text: 'Hierarchisches Multi Object Tracking', breakBefore: true, fontScale: 0.9 }
        ]
      : [
          { text: 'VIO', bold: true, weight: 520 },
          { text: 'Hierarchichal Multi Object Tracking', breakBefore: true, fontScale: 0.9 }
        ],
    summary: isDE
      ? 'Ein post-hoc hierarchisches Framework für YOLO und ähnliche Modelle, das unsichere Detektionen validiert und den Tracking-Recall drastisch verbessert.'
      : 'Enhancing YOLO like models with a post-hoc hierarchical framework to validate uncertain detections and dramatically improve tracking recall.',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-two/bg1.jpg' }
    ],
    backgroundsMobile: [
      { type: 'image', value: '/images/projects/project-two/bg_mobile.webp' }
    ],
    tags: isDE
      ? ['Mission Control', 'Sensorfusion', 'Echtzeit-Analytik']
      : ['Mission Control', 'Sensor Fusion', 'Realtime Analytics'],
    cardDisplay: {
      variant: 'image-frame-vertical',
      tiltIntensity: 1.4,
      mobileTiltIntensity: 0
    },
    cards: [
      {
        id: 'p2_live_ops',
        title: isDE ? '' : '',
        cardImage: '/images/projects/project-two/Wide_1_Fog.png',
        cardImageMobile: '/images/projects/project-two/Mobile_1_Fog.png',
        description: isDE ? '' : ''
      },
      {
        id: 'p2_adaptive_ui',
        title: isDE ? '' : '',
        cardImage: '/images/projects/project-two/Wide_2_Vehicle.png',
        cardImageMobile: '/images/projects/project-two/Mobile_2_Vehicle.png',
        description: isDE ? '' : ''
      },
      {
        id: 'p2_ai_insights',
        title: isDE ? '' : '',
        cardImage: '/images/projects/project-two/Wide_3_dark.png',
        cardImageMobile: '/images/projects/project-two/Mobile_3_dark.png',
        description: isDE ? '' : ''
      },
      {
        id: 'p2_collab_overlay',
        title: isDE ? '' : '',
        cardImage: '/images/projects/project-two/Wide_4_Occlusions.png',
        cardImageMobile: '/images/projects/project-two/Mobile_4_Occlusions.png',
        description: isDE ? '' : ''
      },
      {
        id: 'p2_after_action',
        title: isDE ? '' : '',
        cardImage: '/images/projects/project-two/Wide_5_distance.png',
        cardImageMobile: '/images/projects/project-two/Mobile_5_distance.png',
        description: isDE ? '' : ''
      }
    ],
    readMoreLinkText: isDE ? 'Paper ansehen' : 'View Paper',
    paperUrl: '/papers/Redacted_Report_Mika_Mueller.pdf'
  };

  return [projectOne, projectTwo];
}

// Backward-compatible default export (English)
export const projects: Project[] = getProjects('en');