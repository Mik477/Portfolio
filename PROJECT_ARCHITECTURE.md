# Portfolio Project Architecture Reference

**Purpose:** This document provides a comprehensive overview of the portfolio project for AI agents and developers working on different sessions. It explains the project structure, navigation systems, component relationships, and key patterns without requiring code reading.

**Last Updated:** December 2024

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Page Types & Routing](#page-types--routing)
5. [Main Page Architecture](#main-page-architecture)
6. [Navigation Systems](#navigation-systems)
7. [Section Lifecycle & Animation API](#section-lifecycle--animation-api)
8. [Preloading & Resource Management](#preloading--resource-management)
9. [Store Architecture](#store-architecture)
10. [Component Hierarchy](#component-hierarchy)
11. [Internationalization (i18n)](#internationalization-i18n)
12. [Responsive Design Strategy](#responsive-design-strategy)
13. [Known Technical Debt](#known-technical-debt)
14. [Common Modification Patterns](#common-modification-patterns)

---

## Project Overview

This is a **Data Scientist portfolio website** built as a single-page application (SPA) style experience with SvelteKit. The main page uses **full-screen section scrolling** (similar to fullPage.js) rather than native scroll. Each section is an isolated animated scene with WebGL effects and GSAP animations.

### Core Goals
- Present projects clearly with stunning visuals
- Demonstrate technical capability (SvelteKit, GSAP, Three.js/WebGL)
- Provide predictable navigation and controlled resource usage
- Support accessibility (keyboard, screen readers, reduced motion)
- Deploy as a static site (SSG via `adapter-static`)

### Key Characteristics
- **No runtime backend** – fully static, pre-rendered at build time
- **Two languages** – English (`en`) and German (`de`) with URL-based locale
- **Five main sections** – Hero, About, Project 1, Project 2, Contact
- **Project sub-pages** – Each project can have detailed sub-pages with vertical scrolling
- **Legal pages** – Impressum, Datenschutz, Barrierefreiheit (native scroll)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SvelteKit (SSG mode) |
| Language | TypeScript |
| Animation | GSAP (GreenSock) |
| 3D/WebGL | Three.js |
| Build | Vite |
| Package Manager | npm |
| Styling | Scoped CSS (no framework) |

---

## Directory Structure

```
src/
├── app.css                 # Global styles, CSS variables, fonts
├── app.html                # HTML shell template
├── lib/
│   ├── components/         # All UI components
│   │   ├── sections/       # Main page section components (Hero, About, Project, Contact)
│   │   ├── layouts/        # Content layouts for sections (e.g., ProjectOneLayout)
│   │   └── [*.svelte]      # Shared components (carousels, nav dots, cards, etc.)
│   ├── data/               # Static data files
│   │   ├── projectsData.ts # Project definitions, About/Contact content by locale
│   │   └── siteConfig.ts   # Site-wide config (title, legal links, hero config)
│   ├── i18n/               # Internationalization
│   │   └── locales/{en,de}/  # JSON translation files (common.json, layout.json)
│   ├── preload/            # Preloading/scheduling system
│   │   ├── sectionScheduler.ts      # Main scheduler class
│   │   ├── schedulerCore.ts         # Prediction strategies
│   │   ├── schedulerMetricsStore.ts # Debug metrics
│   │   └── sectionDescriptors.ts    # Type definitions
│   ├── stores/             # Svelte stores (global state)
│   │   ├── preloadingStore.ts   # Asset loading state & progress
│   │   ├── sectionStateStore.ts # Section lifecycle states
│   │   ├── renderProfile.ts     # Device detection (mobile/desktop)
│   │   └── transitionStore.ts   # Page transition overlay
│   ├── three/              # Three.js utilities and effects (not documented in detail)
│   └── utils/              # Utility functions
├── params/
│   └── lang.ts             # Route param matcher for [lang=lang]
└── routes/
    ├── +layout.svelte      # Root layout (footer, language switcher, transition overlay)
    ├── +layout.ts          # Load function (locale detection, translations)
    ├── +page.svelte        # Root redirect (→ /en or /de based on cookie/geo)
    ├── [lang=lang]/        # Locale-prefixed routes
    │   ├── +page.svelte    # **MAIN ORCHESTRATOR** – the main portfolio page
    │   ├── projects/[slug]/+page.svelte  # Project detail pages
    │   ├── privacy/        # English privacy policy
    │   ├── imprint/        # English imprint
    │   ├── accessibility/  # English accessibility statement
    │   ├── datenschutz/    # German privacy policy
    │   ├── impressum/      # German imprint
    │   └── barrierefreiheit/ # German accessibility
    └── 404/                # Not found page
```

---

## Page Types & Routing

### 1. Main Portfolio Page (`/[lang]/`)
- **File:** `src/routes/[lang=lang]/+page.svelte`
- **Behavior:** Full-screen section scrolling, WebGL effects, no native scroll
- **Sections:** Hero → About → Project 1 → Project 2 → Contact

### 2. Project Detail Pages (`/[lang]/projects/[slug]`)
- **File:** `src/routes/[lang=lang]/projects/[slug]/+page.svelte`
- **Behavior:** Full-screen vertical section scrolling (same pattern as main page)
- **Content:** Overview section + sub-sections defined in `projectsData.ts`

### 3. Legal Pages (`/[lang]/privacy`, `/[lang]/imprint`, `/[lang]/accessibility`)
- **Behavior:** Standard native scrolling pages
- **Content:** Static text content

### URL Mapping Between Locales
| English | German |
|---------|--------|
| `/en/privacy` | `/de/datenschutz` |
| `/en/imprint` | `/de/impressum` |
| `/en/accessibility` | `/de/barrierefreiheit` |

---

## Main Page Architecture

The main page (`+page.svelte`) acts as an **Orchestrator** that:

1. **Owns navigation state** (`currentSectionIndex`, `isAnimating`, `isTransitioning`)
2. **Manages section lifecycle** via standardized API calls
3. **Coordinates GSAP transitions** between sections
4. **Handles all input** (wheel, keyboard, touch)
5. **Manages preloading** via `LegacySectionScheduler`

### Section Array Structure
```typescript
allSectionsData = [
  { id: 'hero', component: HeroSection, data: siteConfig.heroSection },
  { id: 'about', component: AboutSection, data: aboutContent },
  { id: 'project-BURA', component: ProjectSection, layout: ProjectOneLayout, data: project1 },
  { id: 'project-Project2', component: ProjectSection, layout: ProjectOneLayout, data: project2 },
  { id: 'contact', component: ContactSection, data: contactContent }
]
```

### Key State Variables
| Variable | Type | Purpose |
|----------|------|---------|
| `currentSectionIndex` | writable<number> | Active section (0-4) |
| `isAnimating` | writable<boolean> | Blocks input during transitions |
| `isTransitioning` | writable<boolean> | Animation in progress |
| `isInitialReveal` | writable<boolean> | Initial load animation state |
| `navActiveIndex` | writable<number> | Mobile nav dots active state |

---

## Project Sub-Page Architecture

The project detail pages (`src/routes/[lang=lang]/projects/[slug]/+page.svelte`) function as independent orchestrators for vertical scrolling within a specific project.

### Structure & Data
- **Orchestrator:** Handles its own navigation state, touch gestures, and section rendering.
- **Data Source:** `src/lib/data/projectsData.ts` defines the structure via `subPageSections`.
- **Layout Types:** Sections are rendered based on `layoutType`:
  - `overview`: Hero section with stats
  - `manufacturing`: Two-column layout with materials strip
  - `capabilities`: Feature grid
  - `testing`: Vertical gallery
  - `simple`: Fallback centered content

### Animation Strategy
Unlike the main page which uses lifecycle methods (`onEnterSection`), sub-pages use a reactive prop pattern:
- **Prop:** `isActive={i === currentSectionIndex}` passed to each section.
- **Behavior:** Components watch `isActive` to trigger GSAP entrance/exit animations.
- **Components:** Located in `src/lib/components/subpage/sections/`.

---

## Navigation Systems

### Desktop Navigation
| Input | Handler | Behavior |
|-------|---------|----------|
| Mouse wheel | `handleWheel()` | Scroll up/down one section |
| Arrow keys | `handleKeyDown()` | Up/Down/PageUp/PageDown navigation |
| Home/End | `handleKeyDown()` | Jump to first/last section |
| Hash change | `handleHashChange()` | Deep link to specific section |

**Wheel Gesture Lock:** Prevents rapid-fire navigation by locking wheel input for ~1.35s after a transition starts.

### Mobile Navigation

#### Touch Gesture System (Progressive Drag)
Located in main page `+page.svelte`:

1. **Touch Start:** Records start position, time, determines if on interactive effect
2. **Touch Move:** 
   - Determines intent (vertical vs horizontal) based on movement ratio
   - If vertical: Shows progressive visual feedback (section follows finger with damping)
   - Maximum visual feedback capped at 15-20% of screen height
3. **Touch End:** 
   - Calculates velocity for momentum-based navigation
   - If drag > 25% of screen OR velocity > threshold → navigate
   - Otherwise → snap back to current section

#### Mobile Nav Dots
- **Component:** `MobileNavDots.svelte`
- **Location:** Fixed right side of screen (only visible on mobile)
- **Behavior:** Tap to jump to any section

### Navigation Function Flow
```
User Input → handleWheel/handleKeyDown/onTouchEnd
    ↓
navigateToSection(newIndex)
    ↓
Validation (bounds, animation state)
    ↓
Update navActiveIndex (dots animate immediately)
    ↓
Call oldInstance.onLeaveSection()
    ↓
Call newInstance.onEnterSection()
    ↓
GSAP Timeline (slide transition)
    ↓
On Complete:
  - Update currentSectionIndex
  - Call scheduler.recordNavigation()
  - Update inert/focus for accessibility
  - Call newInstance.onTransitionComplete()
```

---

## Section Lifecycle & Animation API

Every section component must implement this interface:

```typescript
interface IAnimatedComponent {
  onEnterSection(): void;          // Called when navigating TO this section
  onLeaveSection(): void;          // Called when navigating AWAY from this section
  initializeEffect?(): Promise<void>;  // Heavy initialization (WebGL, images)
  onTransitionComplete?(): void;   // Called after transition animation finishes
  onUnload?(): void;               // Called to free resources (distant sections)
}
```

### Lifecycle Flow
```
IDLE → FETCHING_ASSETS → EFFECT_INIT → PRELOADING → READY → ACTIVE → COOLDOWN → IDLE
```

### Section Components

| Section | File | WebGL Effect | Notes |
|---------|------|--------------|-------|
| Hero | `HeroSection.svelte` | Particle system (Three.js) | Fixed position, always in DOM |
| About | `AboutSection.svelte` | Image particle decay | Keyboard-style social buttons |
| Project | `ProjectSection.svelte` | Background zoom cycle | Wrapper + Layout pattern |
| Contact | `ContactSection.svelte` | Raymarching metaballs | Social links + resume download |

### Wrapper + Layout Pattern

`ProjectSection.svelte` is a **wrapper** that handles:
- Background image cycling with cross-fade
- Lifecycle hooks (enter/leave/init)
- GSAP animations for content reveal

`ProjectOneLayout.svelte` is a **layout** that provides:
- Text content (headline, summary)
- Card carousel (desktop or mobile variant)
- "Read More" button linking to sub-pages

The layout is injected via `<slot>` into the wrapper.

---

## Preloading & Resource Management

### LegacySectionScheduler
**File:** `src/lib/preload/sectionScheduler.ts`

Central class managing asset preloading and section preparation:

```typescript
class LegacySectionScheduler {
  prepareSection(index)      // Fetch assets + init effect
  updateNeighborStates(idx)  // Mark adjacent sections READY
  predictiveWarmup(idx)      // Preload likely next sections
  coolDownSection(index)     // Free resources
  recordNavigation(index)    // Track for prediction
}
```

### Prediction Strategies
- **DirectionalPredictionStrategy:** Predicts based on last navigation direction
- **DefaultPredictionStrategy:** Always warm adjacent sections

### Asset Loading Flow
1. Scheduler identifies URLs needed for section (backgrounds, card images)
2. URLs enqueued in `preloadingStore` (deduped)
3. Images fetched with `loadAndDecodeImage()`
4. On complete, section marked READY

### Memory Management
- **Unload Distance:** Sections farther than 4 positions from active get `onUnload()` called
- **GPU Cleanup:** WebGL scenes dispose textures/geometries in `onUnload()`

---

## Store Architecture

### preloadingStore.ts
```typescript
// Task tracking for loading screen
tasks: Record<string, PreloadTask>
loadingProgress: derived (0-1)
initialSiteLoadComplete: writable<boolean>

// Asset tracking
assetLoadingStatus: Record<string, AssetStatus>
preloadAssets(urls): Promise<void>
```

### sectionStateStore.ts
```typescript
type SectionState = 
  | 'IDLE'           // Not loaded
  | 'FETCHING_ASSETS'// Downloading images
  | 'EFFECT_INIT'    // GPU initialization
  | 'PRELOADING'     // Legacy transitional
  | 'READY'          // Can transition instantly
  | 'ACTIVE'         // Currently visible
  | 'COOLDOWN'       // Being unloaded

sectionStates: writable<SectionState[]>
```

### renderProfile.ts
```typescript
type RenderProfile = {
  isMobile: boolean;           // Width ≤768px OR coarse pointer
  hasCoarsePointer: boolean;   // Touch device
  prefersReducedMotion: boolean;
}
// Supports ?mobile=1|0 URL override for testing
```

### transitionStore.ts
```typescript
// Manages fade-to-black overlay for page transitions
fadeToBlackAndNavigate(href): void
```

---

## Component Hierarchy

### Main Page Components
```
+page.svelte (Orchestrator)
├── LoadingScreen.svelte (initial load only)
├── HeroSection.svelte
│   └── HeroParticleEffect.svelte (Three.js canvas)
├── AboutSection.svelte
│   ├── KeyboardButtons.svelte (social links)
│   └── AboutImageEffect.svelte (particle decay)
├── ProjectSection.svelte (×2)
│   ├── Background layers (A/B for crossfade)
│   └── <slot> → ProjectOneLayout.svelte
│       ├── MobileCardsCarousel.svelte (mobile)
│       ├── DesktopImageFrameCarousel.svelte (desktop)
│       └── ParallaxCard / ImageFrameCard
├── ContactSection.svelte
│   └── ContactEffect.svelte (raymarching)
└── MobileNavDots.svelte (mobile only)
```

### Project Sub-Page Components
```
src/lib/components/subpage/
├── sections/
│   ├── OverviewSection.svelte
│   ├── ManufacturingSection.svelte
│   ├── CapabilitiesSection.svelte
│   └── TestingSection.svelte
├── SectionTitle.svelte (Shared headline animation)
├── StatsBar.svelte
├── MaterialsStrip.svelte
└── FeatureCard.svelte
```

### Global Layout Components
```
+layout.svelte
├── TransitionOverlay.svelte (fade-to-black)
├── LegalFooter.svelte
│   └── LanguageSwitcher.svelte
└── <slot> (page content)
```

---

## Internationalization (i18n)

### Structure
```
src/lib/i18n/locales/
├── en/
│   ├── common.json   # Shared UI text (buttons, labels)
│   └── layout.json   # Meta tags, layout-specific
└── de/
    ├── common.json
    └── layout.json
```

### Loading Flow
1. `+layout.ts` reads `params.lang` from URL
2. Dynamically imports JSON bundles for locale
3. Passes `messages` and `locale` to page data
4. Components access via `$page.data.messages`

### Static Content
Project data, About/Contact content are defined in `projectsData.ts` with both `en` and `de` versions.

### Cookie
- Name: `locale`
- Purpose: Remember user's language preference
- Set by: `LanguageSwitcher`, server hooks on first visit

---

## Responsive Design Strategy

### Breakpoints
| Breakpoint | Target |
|------------|--------|
| ≤640px | Mobile phone |
| ≤768px | Mobile/tablet (nav dots visible, touch handling) |
| ≤900px | Small tablet |
| >768px | Desktop (wheel navigation, keyboard nav) |

### Device Detection
`renderProfile.ts` determines mobile via:
1. Media query: `max-width: 768px`
2. Pointer type: `pointer: coarse`
3. Aspect ratio: `max-aspect-ratio: 4/5` (Tall/Vertical screens)
4. Any condition → `isMobile = true`

### Mobile-Specific Behaviors
- `MobileNavDots` visible instead of scroll hints
- Touch gesture system (progressive drag)
- `MobileCardsCarousel` for project cards
- Some effects disabled (e.g., `disableImageOnMobile` flag)

### Universal Behaviors (Desktop & Mobile)
- Wheel navigation with gesture lock (enabled on mobile for vertical monitors/mice)
- Keyboard navigation (arrow keys, Home/End)

### Desktop-Specific Behaviors
- `DesktopImageFrameCarousel` or parallax card grid
- Full WebGL effects

---

## Known Technical Debt

### Code Quality Issues
1. **Large orchestrator file** – `+page.svelte` is 1100+ lines, mixing navigation logic, touch handling, lifecycle management
2. **Duplicate touch logic** – Similar mobile scroll code in main page and project sub-pages
3. **Historical growth** – Many features added incrementally without refactoring
4. **Mixed patterns** – Some components use class bindings, some use stores, some use props
5. **Unused code** – Likely dead code from previous iterations

### Architecture Issues
1. **Scheduler complexity** – `LegacySectionScheduler` has transitional naming/states
2. **Effect coupling** – WebGL effects tightly coupled to section components
3. **Type looseness** – Some `any` types in data structures

### Performance Concerns
1. **Initial bundle size** – Three.js included in main bundle
2. **GPU memory** – Multiple WebGL contexts if not properly unloaded
3. **Animation jank** – Complex GSAP timelines on lower-end devices

---

## Common Modification Patterns

### Adding a New Section
1. Create component in `src/lib/components/sections/`
2. Implement `IAnimatedComponent` interface
3. Add to `allSectionsData` array in `+page.svelte`
4. Add entry in `sectionDescriptors.ts` type union
5. Handle in `getSectionAssetUrls()` if assets needed

### Adding a New Project
1. Add project data to `projectsData.ts` (both locales)
2. Optionally create custom layout in `layouts/`
3. Add images to `static/images/projects/`
4. Project section auto-generated from data

### Changing Navigation Timing
Key constants in `+page.svelte`:
```typescript
const transitionDuration = 1.1;        // Section slide duration
const minSectionDisplayDuration = 1.2; // Min time before next nav
const WHEEL_LOCK_DURATION = ...;       // Calculated from above
```

### Modifying Mobile Touch Behavior
Key constants in touch handler:
```typescript
const DRAG_THRESHOLD = 8;        // px before drag starts
const SNAP_THRESHOLD = 0.25;     // 25% screen = navigate
const VELOCITY_THRESHOLD = 0.15; // px/ms for momentum
const MAX_VISUAL_FEEDBACK = 0.15; // 15% visual offset max
```

### Adding Translations
1. Add keys to `src/lib/i18n/locales/{lang}/common.json`
2. Access via `$page.data.messages.common.yourKey`
3. For static content, add to `projectsData.ts` per locale

---

## Quick Reference

### File Locations for Common Tasks

| Task | File(s) |
|------|---------|
| Change site title/meta | `siteConfig.ts`, `layout.json` |
| Edit project content | `projectsData.ts` |
| Modify transitions | `+page.svelte` (main), `transitionStore.ts` |
| Change mobile detection | `renderProfile.ts` |
| Edit loading screen | `LoadingScreen.svelte` |
| Modify legal footer | `LegalFooter.svelte` |
| Change language switch | `LanguageSwitcher.svelte` |
| Edit global styles | `app.css` |

### Debug Tools
- `?mobile=1` or `?mobile=0` – Force mobile/desktop mode
- Triple 'd' key on hero – Debug overlay (particle stats)
- `schedulerMetricsStore` – Timing metrics for preloading
- Browser DevTools → Network → Disable cache for asset testing

---

*This document should be updated when significant architectural changes are made.*
