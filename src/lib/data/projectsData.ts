// src/lib/data/projectsData.ts

export interface ProjectCard {
  id: string; // Unique ID for this card, e.g., 'data-exploration'
  title: string;
  image: string;
  cardImage?: string; // Path to card image, e.g., '/images/projects/project-one/card1.jpg'
  description?: string; // Short description for the card
  effect?: string; // Identifier for the card's hover/interaction effect
  aspectLink?: string; // Anchor link for the subpage section, e.g., '#data-exploration-section'
}

// --- MODIFICATION START ---
// Add a background property to the sub-page section interface
export interface ProjectSubPageSection {
    id: string; // Corresponds to aspectLink from a card, used for scrolling
    title: string;
    content: string; // Can be HTML or Markdown, we'll decide how to render it
    background: {
      type: 'image' | 'video' | 'color';
      value: string;
    };
}
// --- MODIFICATION END ---

export interface Project {
  id: string; // Unique ID for the project, e.g., 'project-alpha'
  slug: string; // URL-friendly slug for the project subpage, e.g., 'customer-churn-prediction'
  headline: string;
  headlineAnimation?: { // Optional: override default headline animation
    type?: string;
    duration?: number;
    delay?: number;
    stagger?: number;
    ease?: string;
  };
  summary: string; // A few sentences introducing the project
  background: {
    type: 'image' | 'video' | 'color'; // Type of background
    value: string; // Path to image/video or color code
  };
  tags?: string[]; // e.g., ['Machine Learning', 'Python', 'TensorFlow']
  cards: ProjectCard[];
  subPageSections: ProjectSubPageSection[]; // Content for the project detail page
  readMoreLinkText?: string;
}

export const projects: Project[] = [
  // Project 1 (Placeholder)
  {
    id: 'project-one',
    slug: 'BURA',
    headline: 'BURA \n Long Range Recon UAV',
    summary: 'A fully 3D-Printed UAV designed for long-range, multi hour reconnaissance missions.',
    background: {
      type: 'image',
      value: '/images/projects/project-one/background_2.webp',
    },
    tags: ['Machine Learning', 'Python', 'Scikit-learn', 'Data Analysis'],
    cards: [
      {
        id: 'p1_capability',
        title: '  Capability  ',
        image: '/images/projects/project-one/sub_bg_1.webp',
        cardImage: '/images/projects/project-one/card1_cropped.webp',
        description: 'Elaborate Sensor Array for advanced autonomous capabilities',
        aspectLink: '#data-exploration' // This #hash is important
      },
      {
        id: 'p1_3D_printing',
        title: '3D-Printing',
        image: '/images/projects/project-one/sub_bg_2.webp',
        cardImage: '/images/projects/project-one/card2_cropped.webp',
        description: 'Fully 3D-printed Airframe with LW-PLA and ASA',
        aspectLink: '#model-building'
      },
      {
        id: 'p1_making',
        title: 'Testing',
        image: '/images/projects/project-one/sub_bg_3.webp',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: 'Analyzing model performance and business impact',
        aspectLink: '#results'
      }
    ],
    // --- MODIFICATION START: Add background data to each sub-section ---
    subPageSections: [
        {
            id: 'data-exploration',
            title: 'In-Depth: Data Exploration',
            content: 'Detailed walkthrough of the data sources, features, and initial findings... This section describes the extensive process of cleaning, analyzing, and visualizing the raw customer data to identify patterns and potential predictors of churn.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_1.webp' } // Using card images for now
        },
        {
            id: 'model-building',
            title: 'Model Building Strategy',
            content: 'Explanation of the algorithms chosen, feature engineering, and training process... We tested several models, including Logistic Regression, Random Forest, and Gradient Boosting, using cross-validation to ensure robustness.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_2.webp' }
        },
        {
            id: 'results',
            title: 'Achieved Results and Business Value',
            content: 'Presentation of model accuracy, key metrics, and the tangible benefits realized... The final model achieved an accuracy of 88% and an F1-score of 0.75, enabling targeted retention campaigns that reduced churn by 15%.',
            background: { type: 'image', value: '/images/projects/project-one/sub_bg_3.webp' }
        }
    ],
    // --- MODIFICATION END ---
    readMoreLinkText: "Explore More"
  },
  // Project 2 (Placeholder)
  {
    id: 'project-two',
    slug: 'interactive-data-visualization',
    // ... (same structure, remember to add backgrounds to its subPageSections as well)
    headline: 'Interactive Dashboard for Sales Analytics',
    summary: 'Developing a dynamic dashboard to visualize sales trends and provide actionable insights for stakeholders.',
    background: {
      type: 'image',
      value: '/images/projects/project-two/background.jpg',
    },
    tags: ['Data Visualization', 'Tableau (or similar)', 'JavaScript', 'SQL'],
    cards: [
      {
        id: 'p2-data-sourcing',
        title: 'Data Sourcing & ETL',
        image: '/images/projects/project-one/sub_bg_3.webp',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: 'Gathering and preparing data.',
        aspectLink: '#data-sourcing'
      },
      {
        id: 'p2-dashboard-design',
        title: 'Dashboard Design (UX/UI)',
        image: '/images/projects/project-one/sub_bg_3.webp',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: 'User-centric design.',
        aspectLink: '#dashboard-design'
      },
      {
        id: 'p2-key-insights',
        title: 'Key Insights & Features',
        image: '/images/projects/project-one/sub_bg_3.webp',
        cardImage: '/images/projects/project-one/card3_cropped.webp',
        description: 'Impactful visualizations.',
        aspectLink: '#key-insights'
      }
    ],
    subPageSections: [
        {
            id: 'data-sourcing',
            title: 'Data Pipeline and ETL Processes',
            content: 'Overview of how data was collected, cleaned, and transformed...',
            background: { type: 'image', value: '/images/projects/project-two/card-data.jpg' }
        },
        {
            id: 'dashboard-design',
            title: 'Designing for User Experience',
            content: 'The thought process behind the dashboard layout and interactivity...',
            background: { type: 'image', value: '/images/projects/project-two/card-design.jpg' }
        },
        {
            id: 'key-insights',
            title: 'Unlocking Actionable Insights',
            content: 'Examples of how the dashboard helps users discover trends...',
            background: { type: 'image', value: '/images/projects/project-two/card-insights.jpg' }
        }
    ],
    readMoreLinkText: "Discover Interactive Sales Dashboard"
  }
];