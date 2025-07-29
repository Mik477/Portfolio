// src/lib/data/projectsData.ts

export interface ProjectCard {
  id: string;
  title: string;
  image: string; // The large background for the sub-section
  cardImage?: string; // The small, optimized image for the main page card
  description?: string;
  aspectLink?: string;
}

export interface ProjectSubPageSection {
    id: string;
    title: string;
    content: string;
    background: {
      type: 'image' | 'video' | 'color';
      value: string;
    };
}

// FIX: Renamed 'background' to 'backgrounds' and made it an array
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

export const projects: Project[] = [
  {
    id: 'project-one',
    slug: 'BURA',
    headline: 'BURA \n Long Range Recon UAV',
    summary: 'A fully 3D-Printed UAV designed for long-range, multi hour reconnaissance missions.',
    // FIX: Converted to an array for the cycling effect
    backgrounds: [
      { type: 'image', value: '/images/projects/project-one/Drone_Sunset.webp' },
      { type: 'image', value: '/images/projects/project-one/clouds.webp' },
      { type: 'image', value: '/images/projects/project-one/Me_and_Drone.webp' },
      { type: 'image', value: '/images/projects/project-one/Drone_close_clouds.webp' },
    ],
    tags: ['3D Printing', 'UAV Design', 'Aerospace Engineering', 'Electronics'],
    cards: [
      {
        id: 'p1_capability',
        title: 'Capability',
        image: '/images/projects/project-one/sub_bg_1.webp',
        cardImage: '/images/projects/project-one/card1_cropped.webp',
        description: 'Elaborate Sensor Array for advanced autonomous capabilities',
        aspectLink: '#capability'
      },
      {
        id: 'p1_3D_printing',
        title: '3D-Printing',
        image: '/images/projects/project-one/sub_bg_2.webp',
        cardImage: '/images/projects/project-one/card2_cropped.webp',
        description: 'Fully 3D-printed Airframe with LW-PLA and ASA',
        aspectLink: '#3d-printing'
      },
      {
        id: 'p1_making',
        title: 'Testing',
        image: '/images/projects/project-one/sub_bg_3.webp',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: 'Analyzing model performance and business impact',
        aspectLink: '#testing'
      }
    ],
    subPageSections: [
        {
            id: 'capability',
            title: 'Advanced Autonomous Capabilities',
            content: 'Detailed walkthrough of the sensor suite, including high-resolution cameras, thermal imaging, and real-time data links, enabling sophisticated autonomous flight and data collection.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' }
        },
        {
            id: '3d-printing',
            title: 'Innovative Airframe Manufacturing',
            content: 'Explanation of the design process using lightweight PLA (LW-PLA) for structural components and ASA for durable, weather-resistant outer surfaces, optimizing for both strength and flight time.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' }
        },
        {
            id: 'testing',
            title: 'Rigorous Field Testing & Validation',
            content: 'Presentation of flight test data, including endurance, range, and payload capacity metrics. The UAV successfully demonstrated over 2 hours of flight time and a range of 50km.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' }
        }
    ],
    readMoreLinkText: "Explore More"
  },
  {
    id: 'project-two',
    slug: 'interactive-data-visualization',
    headline: 'Interactive Dashboard for Sales Analytics',
    summary: 'Developing a dynamic dashboard to visualize sales trends and provide actionable insights for stakeholders.',
    // FIX: Converted to an array and using unique images
    backgrounds: [
      { type: 'image', value: '/images/projects/project-two/background.jpg' },
      { type: 'image', value: '/images/projects/project-two/background2.jpg' },
    ],
    tags: ['Data Visualization', 'Tableau', 'JavaScript', 'SQL'],
    cards: [
      {
        id: 'p2-data-sourcing',
        title: 'Data Sourcing & ETL',
        image: '/images/projects/project-two/card-data.jpg',
        // FIX: Added unique cardImage
        cardImage: '/images/projects/project-two/card-data-small.webp',
        description: 'Gathering and preparing data.',
        aspectLink: '#data-sourcing'
      },
      {
        id: 'p2-dashboard-design',
        title: 'Dashboard Design (UX/UI)',
        image: '/images/projects/project-two/card-design.jpg',
        // FIX: Added unique cardImage
        cardImage: '/images/projects/project-two/card-design-small.webp',
        description: 'User-centric design.',
        aspectLink: '#dashboard-design'
      },
      {
        id: 'p2-key-insights',
        title: 'Key Insights & Features',
        image: '/images/projects/project-two/card-insights.jpg',
        // FIX: Added unique cardImage
        cardImage: '/images/projects/project-two/card-insights-small.webp',
        description: 'Impactful visualizations.',
        aspectLink: '#key-insights'
      }
    ],
    subPageSections: [
        {
            id: 'data-sourcing',
            title: 'Data Pipeline and ETL Processes',
            content: 'Overview of how data was collected from multiple sources, cleaned, and transformed into a unified schema for analysis.',
            background: { type: 'image', value: '/images/projects/project-two/card-data.jpg' }
        },
        {
            id: 'dashboard-design',
            title: 'Designing for User Experience',
            content: 'The thought process behind the dashboard layout, color schemes, and interactivity to ensure insights are intuitive and accessible to non-technical users.',
            background: { type: 'image', value: '/images/projects/project-two/card-design.jpg' }
        },
        {
            id: 'key-insights',
            title: 'Unlocking Actionable Insights',
            content: 'Examples of how the dashboard helps users discover key trends, identify top-performing regions, and forecast future sales with interactive filters.',
            background: { type: 'image', value: '/images/projects/project-two/card-insights.jpg' }
        }
    ],
    readMoreLinkText: "Discover Interactive Sales Dashboard"
  }
];