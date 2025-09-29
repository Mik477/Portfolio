// src/lib/data/siteConfig.ts

export interface ParticleEffectConfig {
  type: string; // e.g., 'default', 'starryNight', etc.
  //options?: any; // This will hold the actual tsParticles JSON config
}

export interface SocialLink {
  name: string; // e.g., 'LinkedIn', 'GitHub', 'Email'
  url: string;
  icon?: string; // Optional: path to an icon or an icon library class name
}

export interface LegalLink {
  name: string; // e.g., 'Impressum', 'Datenschutz', 'Barrierefreiheit'
  url: string;  // e.g., '/impressum'
}

export const siteConfig = {
  title: "Your Name - Data Scientist Portfolio",
  author: "Your Name",
  description: "A portfolio showcasing data science projects and expertise.",

  heroSection: {
    greeting: "Hello, I'm",
    name: "Miká Müller", // Or however you want to display it
    particleEffect: {
      type: 'defaultGreetingParticles', // We'll define this later
    } as ParticleEffectConfig,
  },

  // Centralized legal links for global footer
  legalLinks: [
    { name: 'Impressum', url: '/impressum' },
    { name: 'Datenschutz', url: '/datenschutz' },
    { name: 'Barrierefreiheit', url: '/barrierefreiheit' },
  ] as LegalLink[],

  defaultHeadlineAnimation: {
    type: 'fadeInUp',
    duration: 0.8,
    delay: 0.2,
    stagger: 0.1,
  },
};