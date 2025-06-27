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

export const siteConfig = {
  title: "Your Name - Data Scientist Portfolio",
  author: "Your Name",
  description: "A portfolio showcasing data science projects and expertise.",

  heroSection: {
    greeting: "Hello, I'm",
    name: "Your Name", // Or however you want to display it
    introduction: "A Data Scientist passionate about uncovering insights and building intelligent solutions.",
    particleEffect: {
      type: 'defaultGreetingParticles', // We'll define this later
    } as ParticleEffectConfig,
  },

  aboutSection: {
    title: "About Me", // MODIFIED
    introduction: "This is where you'll learn about who I am and what I do.", // MODIFIED
    imageUrl: "/images/profile.png", // MODIFIED - ensure this image exists in static/images
    imageParticleEffect: {
      type: 'imageAuraParticles', // We'll define this later
    } as ParticleEffectConfig,
    socialLinks: [ // Existing links, will be used by KeyboardButtons
      { name: "GitHub", url: "https://github.com/yourusername" }, // Replace with your actual URL
      { name: "LinkedIn", url: "https://www.linkedin.com/in/yourprofile/" }, // Replace with your actual URL
      { name: "Email", url: "mailto:youremail@example.com" }, // Replace with your actual email
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

  defaultHeadlineAnimation: {
    type: 'fadeInUp',
    duration: 0.8,
    delay: 0.2,
    stagger: 0.1,
  },
};