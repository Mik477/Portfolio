# Immersive Data Scientist Portfolio

An immersive, single-page-style portfolio website built with SvelteKit, GSAP, and Three.js. It features a section-scrolling experience with a focus on high-quality animations, WebGL-powered visual effects, and a robust, extensible architecture.

**Live Deployment URL:** `TODO`

---

## Table of Contents

-   [Abstract](#abstract)
-   [Key Features](#key-features)
-   [Architecture](#architecture)
    -   [Software Stack](#software-stack)
    -   [Architectural Patterns](#architectural-patterns)
    -   [Key Design Decisions](#key-design-decisions)
-   [Frontend](#frontend)
    -   [Structure and Responsibilities](#structure-and-responsibilities)
    -   [Views and Interactions](#views-and-interactions)
    -   [Technical Implementation](#technical-implementation)
    -   [Challenges](#challenges)
-   [Backend](#backend)
    -   [Backend Approach: Static Site Generation](#backend-approach-static-site-generation)
    -   [Communication and APIs](#communication-and-apis)
-   [Accessibility](#accessibility)
-   [Data Privacy](#data-privacy)
-   [Development Setup](#development-setup)

---

### Abstract

This project is a highly interactive and visually rich personal portfolio for a Data Scientist. The core idea is to move beyond traditional, static web pages and create an immersive, memorable user experience that showcases both technical skill and creative vision. The primary user group includes potential employers, recruiters, and peers in the technology industry. Key use cases involve: (1) presenting complex projects in an engaging, story-driven format; (2) demonstrating proficiency in modern web technologies like SvelteKit and WebGL; and (3) providing a central, professional hub for contact information and credentials. The application achieves this through a full-screen, section-scrolling interface on its main page, where each section is a self-contained, animated "scene." This approach turns the act of browsing a portfolio into a seamless, cinematic journey.

### Key Features

-   **Immersive Section Scrolling:** A full-screen, SPA-like main page navigated via mouse wheel, keyboard, or touch gestures.
-   **Advanced WebGL Effects:**
    -   An interactive, generative particle system on the hero section built with Three.js.
    -   A "digital decay" particle effect on the "About" section image, also using Three.js.
    -   A raymarching-based metaball effect for the "Contact" section background.
-   **Robust Animation System:**
    -   Animations are orchestrated using GSAP for precise, interrupt-safe control.
    -   A standardized Animation Lifecycle API (`onEnterSection`, `onTransitionComplete`, etc.) ensures components behave predictably and manage resources efficiently.
-   **Sophisticated Resource Management:**
    -   A predictive preloading scheduler warms up assets for upcoming sections to ensure seamless transitions.
    -   A global asset cache (`preloadingStore`) prevents re-downloading images and fonts.
    -   WebGL scenes are properly initialized and disposed of (`onUnload`) to manage GPU memory.
-   **Internationalization (i18n):** Fully localized for English (`en`) and German (`de`), including a language switcher that maps corresponding URLs (e.g., `/en/privacy` to `/de/datenschutz`).
-   **Modular Project Showcase:**
    -   Project sections feature a continuous background zoom and cross-fade effect.
    -   The "Wrapper + Layout" pattern allows for distinct content layouts to be injected into a generic, functional wrapper, promoting code reuse and extensibility.
    -   Dedicated, scrollable sub-pages for detailed project deep-dives.
-   **Responsive Design:** The layout and effects adapt gracefully to various screen sizes, from mobile to ultra-wide desktops.
-   **Comprehensive Accessibility:** Strong focus on keyboard navigation, focus management, ARIA roles, and support for `prefers-reduced-motion`.

### Architecture

#### Software Stack

-   **Framework:** SvelteKit
-   **Language:** TypeScript
-   **Animation:** GSAP (GreenSock Animation Platform)
-   **3D/WebGL:** Three.js
-   **Build Tool:** Vite
-   **Package Manager:** npm

#### Architectural Patterns

The application is a **Statically Generated Site (SSG)** built with SvelteKit's `adapter-static`. There is no traditional runtime backend server.

The core architectural pattern on the main page is the **Orchestrator Pattern**. The root page (`src/routes/[lang=lang]/+page.svelte`) acts as a master controller. It does not contain presentational logic itself; instead, it manages the state of all child "section" components and orchestrates the high-level transitions between them.

```
+--------------------------------+
| Orchestrator ([lang=lang]/+page.svelte) |
| - Manages active section index |
| - Controls master transition   |
| - Invokes Animation Lifecycle API |
+-----------------|--------------+
                  |
 V V V V V V V V V V V V V V V V V V V V V V V V
+-----------------+-----------------+-----------------+
| Section 1       | Section 2 (Project) | Section 3       |
| (HeroSection)   | (ProjectSection)    | (AboutSection)  |
| - Implements API| - Implements API    | - Implements API|
|                 | +-- Injects -->   |                 |
|                 | | +-------------+ |                 |
|                 | | | Layout      | |                 |
|                 | | | (e.g. L_P1) | |                 |
|                 | | +-------------+ |                 |
+-----------------+-----------------+-----------------+
```

This is complemented by the **Wrapper + Layout Pattern** for project sections. The `ProjectSection.svelte` component is a functional "wrapper" responsible only for the complex background animations. A separate "layout" component (e.g., `ProjectOneLayout.svelte`) is injected via `<slot>`, responsible only for the content's presentation. This separation of concerns makes the system highly modular and reusable.

#### Key Design Decisions

1.  **Why SvelteKit?** Chosen for its exceptional performance (compiling to vanilla JS), excellent developer experience, and first-class support for SSG. This is ideal for a portfolio that needs to be fast, SEO-friendly, and hostable on any static provider.
2.  **Why GSAP?** For complex, sequenced, and interactive animations, GSAP provides far more power and control than CSS transitions/animations. Its timeline features are essential for orchestrating the section transitions, and its robustness ensures animations are smooth and interrupt-safe.
3.  **Why Three.js?** The immersive, generative visual effects are a core part of the site's identity. Three.js is the industry standard for creating high-performance, custom WebGL experiences directly in the browser.
4.  **Why the Custom Animation Lifecycle API?** A pre-built library might not have handled the specific requirements for interrupt-safety and resource management (especially for WebGL). A custom, standardized API ensures every component integrates perfectly into the orchestrator's state machine, allowing for complex effects to be started, stopped, and cleaned up reliably.

The chosen stack and architecture are a perfect fit. They enable the creation of a visually stunning, app-like experience while retaining the performance, SEO, and deployment benefits of a static website.

### Frontend

#### Structure and Responsibilities

The frontend is structured as a standard SvelteKit application and is responsible for **100% of the application's logic and presentation**.

-   `src/routes/`: Contains all pages and defines the application's routing structure.
-   `src/lib/components/`: Contains all reusable UI components, broken down into layouts, sections, and utilities.
-   `src/lib/stores/`: Holds global application state using Svelte stores (e.g., for page transitions and asset preloading).
-   `src/lib/three/`: Contains the complex, self-contained Three.js logic for the WebGL effects.

The frontend's responsibilities include:
-   Rendering all UI and content.
-   Managing application state (active section, animation states, etc.).
-   Executing all animation logic via GSAP and Three.js.
-   Handling all user interactions (mouse, keyboard, touch).
-   Orchestrating the preloading and disposal of assets and effects.

#### Views and Interactions

-   **Views:**
    1.  **Main View (`/[lang]/`):** The immersive, full-screen scrolling experience containing the Hero, About, Projects, and Contact sections.
    2.  **Project Sub-pages (`/[lang]/projects/[slug]`):** Detailed project pages with their own internal vertical scrolling logic.
    3.  **Legal Pages (`/[lang]/imprint`, etc.):** Standard, static content pages with native browser scrolling.
-   **User Interactions:**
    -   **Navigation:** Users navigate the main page via mouse wheel, keyboard (arrow keys, Home, End), and touch swipes.
    -   **Direct Interaction:** Users can click on project cards and links, use the language switcher, and interact with the hero section's particle effect using their mouse.
    -   **Passive Interaction:** The "About" and "Contact" section effects react to mouse movement.

#### Technical Implementation

-   **HTML Generation:** HTML is generated at build time by the Svelte compiler. `.svelte` files, which combine HTML-like syntax with JavaScript and CSS, are compiled into highly efficient JavaScript that creates and manipulates the DOM. No virtual DOM is used at runtime.
-   **Styling:** Styling is primarily achieved with **scoped CSS** inside each Svelte component. This prevents style collisions and promotes modularity. Global styles, CSS variables, and font imports are defined in `src/app.css`. No external CSS frameworks like Bootstrap or Tailwind are used, allowing for a fully custom and optimized design.

#### Challenges

-   **Primary Challenge:** The main conceptual challenge was to balance a highly dynamic, animation-heavy, WebGL-driven experience with the need for high performance, fast loading, and robust accessibility.
-   **Unexpected Challenges:**
    1.  **Interrupt-Safety:** Early prototypes broke when users scrolled back and forth quickly. This led to the development of the rigorous Animation Lifecycle API, which ensures animations can be safely started, stopped, and reset at any point.
    2.  **Resource Management:** The multiple Three.js scenes consumed significant GPU memory. This was solved by adding an `onUnload` method to the lifecycle API, allowing the orchestrator to explicitly command a component to dispose of its WebGL context and free up resources when it is no longer needed.
    3.  **Accessible "Scroll-Jacking":** Creating a custom navigation model that feels like scrolling while remaining accessible was difficult. The solution involved a combination of `inert` attributes to hide off-screen content from screen readers, programmatic focus management, and ARIA live regions to announce section changes.

### Backend

#### Backend Approach: Static Site Generation

This project **does not have a traditional runtime backend server**. It is a statically generated site (SSG).

-   **Structure:** The SvelteKit `adapter-static` is used to pre-render the entire website into a set of static HTML, CSS, JavaScript, and image files during the build process (`npm run build`).
-   **Responsibilities:** The "backend" logic exists only at build time. This process is responsible for:
    -   Generating HTML pages for every route.
    -   Reading project and site data from local TypeScript files (`src/lib/data/`).
    -   Bundling and optimizing all code and assets.
-   **Deployment:** The resulting output folder can be deployed to any static web host (e.g., Vercel, Netlify, GitHub Pages).

#### Communication and APIs

-   **Internal Communication:** As a static site, there are no internal API calls between a frontend and backend. After the initial page load, the application runs entirely in the browser.
-   **External APIs:** The application makes requests to two external services:
    1.  **Google Fonts:** To download the `Space Grotesk`, `Playfair Display`, and `Source Code Pro` web fonts.
    2.  **Cloudinary:** To load a single particle texture used in the hero section's Three.js effect.

There is no authentication, authorization, or database, as the site is purely informational and public.

### Accessibility

Accessibility was a primary consideration throughout development, especially given the site's dynamic nature.

-   **Extent of Accessibility:** The site is designed to be highly usable for keyboard-only and screen reader users.
    -   **`prefers-reduced-motion`:** All major WebGL effects and complex transitions are disabled or simplified when this OS-level setting is detected.
    -   **Keyboard Navigation:** All interactive elements are focusable, and main page navigation is fully keyboard-operable.
    -   **Focus Management:** The `inert` attribute is used to trap focus within the active section, and focus is programmatically managed during transitions.
    -   **ARIA Live Regions:** An `aria-live` region announces the title of the new section to screen reader users after each transition.
    -   **Semantic HTML:** The site uses a logical heading structure and semantic elements.
-   **Standards:** The site aims for conformance with **WCAG 2.1 Level AA**.
-   **Testing:** Accessibility was tested manually using:
    -   Keyboard-only navigation in Chrome and Firefox.
    -   VoiceOver on macOS.
    -   Browser developer tools (Lighthouse, Accessibility Inspector).

A dedicated Accessibility Statement is available at `/en/accessibility` and `/de/barrierefreiheit`.

### Data Privacy

-   **Privacy by Design:** The system was designed from the ground up to collect the absolute minimum data required for functionality. There are no analytics, tracking scripts, or advertising networks.
-   **Personal Data Processed:**
    -   **IP Address:** Processed by the hosting provider (e.g., Vercel) as part of standard server logs for security and operational purposes. This is unavoidable.
    -   **`locale` Cookie:** A single, non-tracking cookie is used to store the user's preferred language (`en` or `de`). This is for user convenience and falls under technically necessary cookies.
    -   No special categories of personal data are processed.
-   **Data Subject Rights:** As no user-specific personal data is stored in an application database, rights such as data access or deletion are handled via the contact information provided in the Privacy Policy. The site provides a comprehensive, GDPR-compliant Privacy Policy at `/en/privacy` and `/de/datenschutz`.

### Development Setup

This project is built with SvelteKit and requires Node.js.

#### System-wide Dependencies

-   [Node.js](https://nodejs.org/) (v18.x or higher recommended)
-   npm (comes with Node.js)

#### Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install local dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This will start a local server, typically at `http://localhost:5173`, with Hot Module Replacement (HMR).
    ```bash
    npm run dev
    ```

#### Building for Production

To create a production version of the app (generates static files in the `/build` directory):

```bash
npm run build
```