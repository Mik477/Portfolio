// src/lib/data/projectsData.ts

export interface ProjectCard {
  id: string; // Unique ID for this card, e.g., 'data-exploration'
  title: string;
  image: string; // Path to card image, e.g., '/images/projects/project-one/card1.jpg'
  description?: string; // Short description for the card
  effect?: string; // Identifier for the card's hover/interaction effect
  aspectLink?: string; // Anchor link for the subpage section, e.g., '#data-exploration-section'
}

export interface ProjectSubPageSection {
    id: string; // Corresponds to aspectLink from a card, used for scrolling
    title: string;
    content: string; // Can be HTML or Markdown, we'll decide how to render it
    // You might add images, charts, or other specific elements here later
}

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
    //particleEffect?: any; // Optional tsParticles config for this section
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
    slug: 'ai-churn-prediction',
    headline: 'AI-Powered Customer Churn Prediction',
    summary: 'Leveraging machine learning to proactively identify and mitigate customer churn, improving retention rates.',
    background: {
      type: 'image',
      value: '/images/projects/project-one/background.jpg', // Create this path in `static/images/...`
      // particleEffect: { /* config */ }
    },
    tags: ['Machine Learning', 'Python', 'Scikit-learn', 'Data Analysis'],
    cards: [
      {
        id: 'p1-data-exploration',
        title: 'Data Exploration',
        image: '/images/projects/project-one/card-data.jpg',
        description: 'Deep dive into dataset characteristics.',
        aspectLink: '#data-exploration'
      },
      {
        id: 'p1-model-building',
        title: 'Model Building',
        image: '/images/projects/project-one/card-printing.webp',
        description: 'Developing predictive models.',
        aspectLink: '#model-building'
      },
      {
        id: 'p1-results',
        title: 'Results & Impact',
        image: '/images/projects/project-one/card-meWorking.webp',
        description: 'Analyzing model performance and business impact.',
        aspectLink: '#results'
      }
    ],
    subPageSections: [
        {
            id: 'data-exploration',
            title: 'In-Depth: Data Exploration',
            content: 'Detailed walkthrough of the data sources, features, and initial findings...'
        },
        {
            id: 'model-building',
            title: 'Model Building Strategy',
            content: 'Explanation of the algorithms chosen, feature engineering, and training process...'
        },
        {
            id: 'results',
            title: 'Achieved Results and Business Value',
            content: 'Presentation of model accuracy, key metrics, and the tangible benefits realized...'
        }
    ],
    readMoreLinkText: "Explore Churn Prediction Project"
  },
  // Project 2 (Placeholder)
  {
    id: 'project-two',
    slug: 'interactive-data-visualization',
    headline: 'Interactive Dashboard for Sales Analytics',
    summary: 'Developing a dynamic dashboard to visualize sales trends and provide actionable insights for stakeholders.',
    background: {
      type: 'image',
      value: '/images/projects/project-two/background.jpg', // Create this path
      // particleEffect: { /* config */ }
    },
    tags: ['Data Visualization', 'Tableau (or similar)', 'JavaScript', 'SQL'],
    cards: [
      {
        id: 'p2-data-sourcing',
        title: 'Data Sourcing & ETL',
        image: '/images/projects/project-two/card-data.jpg',
        description: 'Gathering and preparing data from multiple sources.',
        aspectLink: '#data-sourcing'
      },
      {
        id: 'p2-dashboard-design',
        title: 'Dashboard Design (UX/UI)',
        image: '/images/projects/project-two/card-design.jpg',
        description: 'User-centric design for intuitive navigation.',
        aspectLink: '#dashboard-design'
      },
      {
        id: 'p2-key-insights',
        title: 'Key Insights & Features',
        image: '/images/projects/project-two/card-insights.jpg',
        description: 'Highlighting impactful visualizations and features.',
        aspectLink: '#key-insights'
      }
    ],
    subPageSections: [
        {
            id: 'data-sourcing',
            title: 'Data Pipeline and ETL Processes',
            content: 'Overview of how data was collected, cleaned, and transformed for the dashboard...'
        },
        {
            id: 'dashboard-design',
            title: 'Designing for User Experience',
            content: 'The thought process behind the dashboard layout, interactivity, and visual choices...'
        },
        {
            id: 'key-insights',
            title: 'Unlocking Actionable Insights',
            content: 'Examples of how the dashboard helps users discover trends and make data-driven decisions...'
        }
    ],
    readMoreLinkText: "Discover Interactive Sales Dashboard"
  }
];