// src/lib/data/projectsData.ts

// --- MODIFICATION START: The ProjectCard no longer holds the sub-section's background. ---
// It is now only responsible for its own appearance and linking.
export interface ProjectCard {
  id: string; // Unique ID for this card, e.g., 'p1_capability'
  title: string;
  cardImage?: string; // Path to the small, optimized image for the main page card
  description?: string; // Short description for the card
  aspectLink?: string; // Anchor link for the subpage section, e.g., '#capability'
}
// --- MODIFICATION END ---

// This interface is the definitive source for a sub-section's content and background.
export interface ProjectSubPageSection {
    id: string; // Corresponds to aspectLink from a card, used for scrolling
    title: string;
    content: string; // Can be HTML or Markdown, we'll decide how to render it
    background: {
      type: 'image' | 'video' | 'color';
      value: string; // The URL for this specific section's background
    };
}

// This is the main project interface, which holds all data for a project.
export interface Project {
  id: string;
  slug: string;
  headline: string;
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
  tags?: string[];
  cards: ProjectCard[];
  subPageSections: ProjectSubPageSection[];
  readMoreLinkText?: string;
}

export type Locale = 'en' | 'de';

export function getProjects(locale: Locale): Project[] {
  const isDE = locale === 'de';

  const projectOne: Project = {
    id: 'project-one',
    slug: 'BURA',
    headline: isDE ? 'BURA \n Langstrecken-Aufklärungs-UAV' : 'BURA \n Long Range Recon UAV',
    summary: isDE
      ? 'Ein vollständig 3D-gedrucktes UAV für Langstrecken- und mehrstündige Aufklärungsmissionen.'
      : 'A fully 3D-Printed UAV designed for long-range, multi-hour reconnaissance missions.',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-one/Drone_Sunset.webp' },
      { type: 'image', value: '/images/projects/project-one/clouds.webp' },
      { type: 'image', value: '/images/projects/project-one/Me_and_Drone.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_close_clouds.webp' }
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
          : 'Fully 3D-printed Airframe with LW-PLA and ASA',
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
        title: isDE ? 'Erweiterte autonome Fähigkeiten' : 'Advanced Autonomous Capabilities',
        content: isDE
          ? 'Detaillierte Vorstellung der Sensorsuite mit hochauflösenden Kameras, Wärmebildgebung und Echtzeit-Datenlinks – Grundlage für anspruchsvolle autonome Flüge und Datenerfassung.'
          : 'Detailed walkthrough of the sensor suite, including high-resolution cameras, thermal imaging, and real-time data links, enabling sophisticated autonomous flight and data collection.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' }
      },
      {
        id: '3d-printing',
        title: isDE ? 'Innovative Fertigung des Luftfahrzeugs' : 'Innovative Airframe Manufacturing',
        content: isDE
          ? 'Erläuterung des Designs mit Lightweight PLA (LW‑PLA) für Strukturbauteile und ASA für robuste, witterungsbeständige Oberflächen – optimiert für Festigkeit und Flugzeit.'
          : 'Explanation of the design process using lightweight PLA (LW-PLA) for structural components and ASA for durable structural surfaces, optimizing for both strength and flight time.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' }
      },
      {
        id: 'testing',
        title: isDE ? 'Umfassende Feldtests & Validierung' : 'Rigorous Field Testing & Validation',
        content: isDE
          ? 'Präsentation der Flugtestergebnisse, darunter Ausdauer, Reichweite und Nutzlast. Das UAV demonstrierte über 2 Stunden Flugzeit und eine Reichweite von 50 km.'
          : 'Presentation of flight test data, including endurance, range, and payload capacity metrics. The UAV successfully demonstrated over 2 hours of flight time and a range of 50km.',
        background: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' }
      }
    ],
    readMoreLinkText: isDE ? 'Mehr erfahren' : 'Explore More'
  };

  const projectTwo: Project = {
    id: 'project-two',
    slug: 'interactive-data-visualization',
    headline: isDE ? 'Projekt 2' : 'Project 2',
    summary: isDE ? 'Platzhalterinhalt für ein zweites Projekt (in Kürze)' : 'Filler content for a second project (coming soon)',
    backgrounds: [
      { type: 'image', value: '/images/projects/project-two/background.jpg' },
      { type: 'image', value: '/images/projects/project-two/background2.jpg' }
    ],
    tags: isDE ? ['Datenvisualisierung', 'Tableau', 'JavaScript', 'SQL'] : ['Data Visualization', 'Tableau', 'JavaScript', 'SQL'],
    cards: [
      { id: 'Project_2_Card_1', title: isDE ? 'Karte 1' : 'Card 1', cardImage: '/images/projects/project-two/card-data-small.webp', description: isDE ? 'Inhalt' : 'Content', aspectLink: '#1' },
      { id: 'Project_2_Card_2', title: isDE ? 'Karte 2' : 'Card 2', cardImage: '/images/projects/project-two/card-design-small.webp', description: isDE ? 'Inhalt' : 'Content', aspectLink: '#2' },
      { id: 'Project_2_Card_3', title: isDE ? 'Karte 3' : 'Card 3', cardImage: '/images/projects/project-two/card-insights-small.webp', description: isDE ? 'Inhalt' : 'Content', aspectLink: '#3' }
    ],
    subPageSections: [
      { id: 'Project_2_Subpage_Section_1', title: '1', content: isDE ? 'Inhalt' : 'Content', background: { type: 'image', value: '/images/projects/project-two/card-data.jpg' } },
      { id: 'Project_2_Subpage_Section_2', title: '2', content: isDE ? 'Inhalt' : 'Content', background: { type: 'image', value: '/images/projects/project-two/card-design.jpg' } },
      { id: 'Project_2_Subpage_Section_3', title: '3', content: isDE ? 'Inhalt' : 'Content', background: { type: 'image', value: '/images/projects/project-two/card-insights.jpg' } }
    ],
    readMoreLinkText: isDE ? 'Mehr erfahren' : 'Explore More'
  };

  return [projectOne, projectTwo];
}

// Backward-compatible default export (English)
export const projects: Project[] = getProjects('en');