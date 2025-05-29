// src/lib/data/siteConfig.ts

export interface ParticleEffectConfig {
  // Define properties for tsParticles configuration later
  // For now, it can be a placeholder or a simple structure
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
    //greeting: "Hello, I'm",
    //name: "Your Name", // Or however you want to display it
    //introduction: "A Data Scientist passionate about uncovering insights and building intelligent solutions.",
    particleEffect: {
      type: 'defaultGreetingParticles', // We'll define this later
      // options: { /* tsParticles config object could go here */ }
    } as ParticleEffectConfig,
  },

  aboutSection: {
    title: "About Me",
    introduction: [
      "Driven by a passion for data and its power to transform businesses, I specialize in [mention your key specializations, e.g., machine learning, statistical analysis, data visualization].",
      "My journey into data science was fueled by [mention a brief motivation or story]. I thrive on tackling complex challenges and translating data into actionable strategies.",
      "When I'm not exploring datasets, you might find me [mention a hobby or two]."
    ],
    imageUrl: "/images/your-profile-image.jpg", // Place your image in the `static/images` folder
    imageParticleEffect: {
      type: 'imageAuraParticles', // We'll define this later
      // options: { /* tsParticles config object */ }
    } as ParticleEffectConfig,
    socialLinks: [
      { name: "LinkedIn", url: "https://www.linkedin.com/in/yourprofile/" },
      { name: "GitHub", url: "https://github.com/yourusername" },
      { name: "Email", url: "mailto:youremail@example.com" },
      // Add more social links if needed
    ] as SocialLink[],
  },

  contactSection: {
    title: "Get in Touch",
    outroMessage: "I'm always excited to discuss new projects, collaborations, or opportunities. Feel free to reach out!",
    email: "youremail@example.com",
    // You can add more detailed contact info or links here
    additionalLinks: [
        { name: "View My Resume", url: "/resume.pdf" } // Place resume in `static` folder
    ]
  },

  // Global animation defaults (can be overridden per project/element)
  // These are placeholders; we'll define actual usable parameters
  defaultHeadlineAnimation: {
    type: 'fadeInUp', // Maps to a GSAP animation function we'll create
    duration: 0.8,
    delay: 0.2,
    stagger: 0.1,
  },
};