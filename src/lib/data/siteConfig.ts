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

  aboutSection: {
    title: "About Me", // MODIFIED
    introduction: "I am a data scientist specializing in building end-to-end systems that derive actionable intelligence from real-world sensor data. The projects below demonstrate my capability in integrating custom hardware, robust software, and advanced perception models to solve complex operational challenges.",
    imageUrl: "/images/profile.webp", // MODIFIED - ensure this image exists in static/images
    imageParticleEffect: {
      type: 'imageAuraParticles', // We'll define this later
    } as ParticleEffectConfig,
    socialLinks: [ // Existing links, will be used by KeyboardButtons
      { name: "GitHub", url: "https://github.com/coming_soon" }, // Replace with your actual URL
      { name: "LinkedIn", url: "https://www.linkedin.com/in/coming_soon/" }, // Replace with your actual URL
      { name: "Email", url: "mailto:mika38159@gmail.com" }, // Replace with your actual email
    ] as SocialLink[],
  },

  contactSection: {
    title: "Get in Touch",
    outroMessage: "I'm always excited to discuss new projects, collaborations, or opportunities. Feel free to reach out!",
    email: "youremail@example.com", // Replace with your actual email
    additionalLinks: [
        { name: "View My Resume", url: "/resume.pdf" } // Place resume in `static` folder
    ]
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