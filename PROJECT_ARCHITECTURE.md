# Portfolio Project Architecture Reference

**Purpose:** This document provides a comprehensive overview of the portfolio project for AI agents and developers working on different sessions. It explains the project structure, navigation systems, component relationships, and key patterns without requiring code reading.

**Last Updated:** January 2026

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
13. [Utility Modules](#utility-modules)
14. [Known Technical Debt](#known-technical-debt)
15. [Common Modification Patterns](#common-modification-patterns)

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
- **Six main sections** – Hero, About, Project 1 (BURA), Project 2, Project 3 (Anki Automation), Contact
- **Project sub-pages** – Each project can have detailed sub-pages with vertical scrolling
- **Legal pages** – Impressum, Datenschutz, Barrierefreiheit (native scroll)
- **Standalone demos** – Anki Automation demo pages with card stack interactions

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SvelteKit (SSG mode) |
| Language | TypeScript |
| Animation | GSAP (GreenSock) |
| 3D/WebGL | Three.js |
| Icons | Lucide Svelte |
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
│   │   ├── sections/       # Main page section components
│   │   │   ├── HeroSection.svelte
│   │   │   ├── AboutSection.svelte
│   │   │   ├── ProjectSection.svelte
│   │   │   ├── ContactSection.svelte
│   │   │   └── ContactEffect.svelte
│   │   ├── layouts/        # Project content layouts
│   │   │   ├── ProjectOneLayout.svelte      # Standard card carousel layout
│   │   │   └── ProjectThreeLayout.svelte    # Navigation-focused layout (Anki)
│   │   ├── subpage/        # Project sub-page components
│   │   │   ├── sections/   # Sub-page section types
│   │   │   │   ├── OverviewSection.svelte
│   │   │   │   ├── ManufacturingSection.svelte
│   │   │   │   ├── CapabilitiesSection.svelte
│   │   │   │   └── TestingSection.svelte
│   │   │   ├── FeatureCard.svelte
│   │   │   ├── ImageGalleryItem.svelte
│   │   │   ├── MaterialsStrip.svelte
│   │   │   ├── SectionTitle.svelte
│   │   │   └── StatsBar.svelte
│   │   └── [shared components]
│   │       ├── AboutImageEffect.svelte
│   │       ├── AnkiCardStack.svelte         # Anki demo card stack
│   │       ├── BackButton.svelte            # Navigation back button
│   │       ├── DesktopImageFrameCarousel.svelte
│   │       ├── DesktopVerticalImageFrameCarousel.svelte
│   │       ├── HeroParticleEffect.svelte
│   │       ├── ImageFrameCard.svelte
│   │       ├── ImageFrameWideCard.svelte
│   │       ├── KeyboardButtons.svelte
│   │       ├── LanguageSwitcher.svelte
│   │       ├── LegalFooter.svelte
│   │       ├── LoadingScreen.svelte
│   │       ├── MobileCardsCarousel.svelte
│   │       ├── MobileNavDots.svelte
│   │       ├── MobileOrientationLock.svelte
│   │       ├── NotFoundPage.svelte
│   │       ├── ParallaxCard.svelte
│   │       └── TransitionOverlay.svelte
│   ├── data/               # Static data files
│   │   ├── projectsData.ts # Project definitions, About/Contact content by locale
│   │   ├── siteConfig.ts   # Site-wide config (title, legal links, hero config)
│   │   └── ankiDemoCards.ts # Anki demo card data
│   ├── debug/              # Debug utilities
│   │   └── DebugManager.ts
│   ├── i18n/               # Internationalization
│   │   ├── namespaces.ts   # Namespace definitions
│   │   └── locales/{en,de}/
│   │       ├── common.json # Shared UI text
│   │       └── layout.json # Meta tags, layout-specific
│   ├── preload/            # Preloading/scheduling system
│   │   ├── sectionScheduler.ts      # Legacy scheduler class
│   │   ├── stagedSectionScheduler.ts # New staged warmup scheduler
│   │   ├── schedulerCore.ts         # Prediction strategies
│   │   ├── schedulerMetricsStore.ts # Debug metrics
│   │   ├── sectionDescriptors.ts    # Type definitions
│   │   └── warmupContract.ts        # Warmup contract types
│   ├── server/             # Server-side utilities
│   │   └── locale.ts       # Locale detection
│   ├── stores/             # Svelte stores (global state)
│   │   ├── preloadingStore.ts       # Asset loading state & progress
│   │   ├── sectionStateStore.ts     # Section lifecycle states
│   │   ├── renderProfile.ts         # Device detection (mobile/desktop)
│   │   ├── transitionStore.ts       # Page transition overlay
│   │   ├── navigationHistoryStore.ts # Back button navigation history
│   │   └── navigationLockStore.ts   # Animation-safe navigation lock
│   ├── three/              # Three.js utilities and effects
│   │   ├── BloomEffect.ts
│   │   ├── heroParticleLogic.ts
│   │   └── contactRaymarching_optimized.glsl
│   └── utils/              # Utility functions
│       ├── gestureNavigation.ts  # Touch gesture logic (extracted)
│       ├── projectNavigation.ts  # Project slug/hash utilities
│       └── clientGeo.ts          # Client-side geolocation
├── params/
│   └── lang.ts             # Route param matcher for [lang=lang]
└── routes/
    ├── +layout.svelte      # Root layout
    ├── +layout.ts          # Locale detection, translation loading
    ├── +layout.server.ts   # Server-side locale cookie
    ├── +page.svelte        # Root redirect (→ /en or /de)
    ├── +page.server.ts     # Root page server logic
    ├── +error.svelte       # Error page
    ├── 404/                # Not found page
    ├── anki-automation-demo/ # Standalone Anki demo
    ├── barrierefreiheit/   # German accessibility (root)
    ├── datenschutz/        # German privacy (root)
    ├── impressum/          # German imprint (root)
    ├── debug/              # Debug routes
    └── [lang=lang]/        # Locale-prefixed routes
        ├── +page.svelte    # **MAIN ORCHESTRATOR**
        ├── 404/            # Localized 404
        ├── projects/[slug]/ # Project detail pages
        ├── privacy/        # English privacy
        ├── imprint/        # English imprint
        ├── accessibility/  # English accessibility
        ├── datenschutz/    # German privacy
        ├── impressum/      # German imprint
        ├── barrierefreiheit/ # German accessibility
        └── anki-automation-demo/ # Localized Anki demo
```

---

## Page Types & Routing

### 1. Main Portfolio Page (`/[lang]/`)
- **File:** `src/routes/[lang=lang]/+page.svelte`
- **Behavior:** Full-screen section scrolling, WebGL effects, no native scroll
- **Sections:** Hero → About → Project 1 (BURA) → Project 2 → Project 3 (Anki) → Contact

### 2. Project Detail Pages (`/[lang]/projects/[slug]`)
- **File:** `src/routes/[lang=lang]/projects/[slug]/+page.svelte`
- **Behavior:** Full-screen vertical section scrolling (same pattern as main page)
- **Content:** Overview section + sub-sections defined in `projectsData.ts`
- **Layout Types:** Based on `layoutType` in data:
  - `overview`: Hero section with stats bar
  - `manufacturing`: Two-column with materials strip
  - `capabilities`: Feature grid with center space
  - `testing`: Vertical gallery with stats
  - `simple`: Fallback centered content

### 3. Legal Pages
- **Behavior:** Standard native scrolling pages
- **Content:** Static text content
- **Back Button:** Uses `navigationHistoryStore` to return to previous content page

### 4. Anki Automation Demo (`/anki-automation-demo/`)
- **Behavior:** Standalone demo pages with card stack interaction
- **Files:** Getting started guide, card setup instructions
- **Note:** Language switcher hidden on these pages

### URL Mapping Between Locales
| English | German |
|---------|--------|
| `/en/privacy` | `/de/datenschutz` |
| `/en/imprint` | `/de/impressum` |
| `/en/accessibility` | `/de/barrierefreiheit` |

---

## Main Page Architecture

The main page (`+page.svelte`) acts as an **Orchestrator** (~1420 lines) that:

1. **Owns navigation state** (`currentSectionIndex`, `isAnimating`, `isTransitioning`)
2. **Manages section lifecycle** via standardized API calls
3. **Coordinates GSAP transitions** between sections
4. **Handles all input** (wheel, keyboard, touch)
5. **Manages preloading** via dual scheduler system
6. **Handles locale changes** gracefully during animations

### Section Array Structure
```typescript
allSectionsData = [
  { id: 'hero', component: HeroSection, data: siteConfig.heroSection, layout: null },
  { id: 'about', component: AboutSection, data: aboutContent, layout: null },
  { id: 'project-BURA', component: ProjectSection, layout: ProjectOneLayout, data: project1 },
  { id: 'project-Project2', component: ProjectSection, layout: ProjectOneLayout, data: project2 },
  { id: 'project-AnkiAutomation', component: ProjectSection, layout: ProjectThreeLayout, data: project3 },
  { id: 'contact', component: ContactSection, data: contactContent, layout: null }
]
```

### Key State Variables
| Variable | Type | Purpose |
|----------|------|---------|
| `currentSectionIndex` | writable<number> | Active section (0-5) |
| `isAnimating` | writable<boolean> | Blocks input during transitions |
| `isTransitioning` | writable<boolean> | Animation in progress |
| `isInitialReveal` | writable<boolean> | Initial load animation state |
| `navActiveIndex` | writable<number> | Mobile nav dots active state |
| `isLeavingHero` | writable<boolean> | Hero particle layer z-index control |

### Locale Change Handling
When the language is switched via `LanguageSwitcher`:
1. Detects locale change via reactive statement
2. Waits for Svelte DOM updates (`await tick()`)
3. Re-queries section elements
4. Restores GSAP positions without interrupting animations
5. Updates inert states for accessibility

---

## Navigation Systems

### Input Handlers (Universal)
| Input | Handler | Behavior |
|-------|---------|----------|
| Mouse wheel | `handleWheel()` | Scroll up/down one section |
| Arrow keys | `handleKeyDown()` | Up/Down/PageUp/PageDown navigation |
| Home/End | `handleKeyDown()` | Jump to first/last section |
| Hash change | `onHashChange()` | Deep link to specific section |

**Wheel Gesture Lock:** Prevents rapid-fire navigation by locking wheel input for ~1.35s after a transition starts. Uses dynamic thresholds to prevent accidental double-navigation.

### Touch Gesture System (Mobile)
Uses extracted utility functions from `gestureNavigation.ts`:

1. **Touch Start:** Records start position, time, checks if on interactive effect
2. **Touch Move:** 
   - `decideGestureIntent()` determines vertical vs horizontal
   - `computeDragProgress()` calculates visual feedback with rubber-banding
   - Maximum visual feedback capped at 15% of screen height
3. **Touch End:** 
   - `decideSwipeNavigation()` uses velocity and distance thresholds
   - If drag > 25% OR velocity > 0.15 px/ms → navigate
   - Otherwise → `snapBackToCurrentSection()`

### Mobile Nav Dots
- **Component:** `MobileNavDots.svelte`
- **Location:** Fixed right side of screen (visible on mobile layout profile)
- **Behavior:** Tap to jump, haptic feedback via `navigator.vibrate()`

### Navigation Function Flow
```
User Input → handleWheel/handleKeyDown/onTouchEnd
    ↓
navigateToSection(newIndex)
    ↓
Validation (bounds, animation state, initial reveal)
    ↓
Jump warmup (if |delta| > 1, preload target via StagedScheduler)
    ↓
Update navActiveIndex (dots animate immediately)
    ↓
Initialize target effect if needed
    ↓
Set isAnimating=true, isTransitioning=true
    ↓
Call oldInstance.onLeaveSection()
    ↓
Call newInstance.onEnterSection()
    ↓
GSAP Timeline (slide transition, ~1.1s)
    ↓
On Complete:
  - Update currentSectionIndex
  - Call scheduler.recordNavigation()
  - Update inert/focus for accessibility
  - Call newInstance.onTransitionComplete()
  - Schedule background warmup for neighbors
    ↓
Delayed unlock (minSectionDisplayDuration)
    ↓
Update URL hash (replaceState)
```

---

## Section Lifecycle & Animation API

Every section component must implement this interface:

```typescript
interface IAnimatedComponent {
  onEnterSection(): void;           // Called when navigating TO this section
  onLeaveSection(): void;           // Called when navigating AWAY
  initializeEffect?(signal?: AbortSignal): Promise<void>;  // Heavy init (WebGL, images)
  onTransitionComplete?(): void;    // Called after transition animation finishes
  onUnload?(): void;                // Called to free resources (distant sections)
  primeFirstFrame?(signal?: AbortSignal): Promise<void>;   // Quick first-frame prep
  getPreloadAssets?(): string[];    // Return asset URLs for preloading
}
```

### Lifecycle States
```typescript
type SectionState =
  | 'IDLE'           // Not loaded
  | 'FETCHING_ASSETS'// Downloading images
  | 'EFFECT_INIT'    // GPU initialization
  | 'PRELOADING'     // Legacy transitional
  | 'READY'          // Can transition instantly
  | 'ACTIVE'         // Currently visible
  | 'COOLDOWN';      // Being unloaded
```

### Section Components

| Section | File | WebGL Effect | Notes |
|---------|------|--------------|-------|
| Hero | `HeroSection.svelte` | Particle system (Three.js) | Fixed layer, always in DOM |
| About | `AboutSection.svelte` | Image particle decay | Keyboard-style social buttons |
| Project (1,2) | `ProjectSection.svelte` | Background zoom cycle | Uses `ProjectOneLayout` |
| Project (3) | `ProjectSection.svelte` | Background zoom cycle | Uses `ProjectThreeLayout` (Anki) |
| Contact | `ContactSection.svelte` | Raymarching metaballs | Social links + resume download |

### Wrapper + Layout Pattern

**`ProjectSection.svelte`** (wrapper) handles:
- Background image cycling with cross-fade
- Lifecycle hooks (enter/leave/init/unload)
- GSAP animations for content reveal (headline, summary, buttons)

**Layout Components** provide content:
- `ProjectOneLayout.svelte`: Card carousel + Read More button
- `ProjectThreeLayout.svelte`: Navigation buttons + Anki card stack demo

The layout is injected via `<slot>` with spread props.

---

## Preloading & Resource Management

### Dual Scheduler System

**`LegacySectionScheduler`** (`sectionScheduler.ts`):
- Original scheduler with queue-based asset loading
- Handles `updateNeighborStates()`, `recordNavigation()`
- Uses prediction strategies for warmup

**`StagedSectionScheduler`** (`stagedSectionScheduler.ts`):
- New staged warmup with priority queue
- Supports `idle` and `immediate` modes
- Used for jump preloading and background warmup
- Better abort signal handling

### Prediction Strategies
- **`DirectionalPredictionStrategy`:** Predicts based on last navigation direction
- **`DefaultPredictionStrategy`:** Always warm adjacent sections

### Asset Loading Flow
1. Scheduler calls `getSectionAssetUrls()` for target section
2. URLs passed to `preloadAssets()` (deduped via in-flight map)
3. Images fetched and decoded
4. Section state updated to READY
5. `initializeEffect()` called for GPU setup

### Memory Management
- **Unload Distance:** Sections >4 positions away get `onUnload()` called
- **GPU Cleanup:** WebGL scenes dispose textures/geometries
- **Abort Controllers:** Cancellable warmup operations

---

## Store Architecture

### preloadingStore.ts
```typescript
// Task tracking for loading screen
tasks: Record<string, PreloadTask>
loadingProgress: derived (0-1)
initialSiteLoadComplete: writable<boolean>
localeDetectionStatus: writable<LocaleDetectionStatus>

// Asset tracking
assetLoadingStatus: Record<string, AssetStatus>
preloadAssets(urls): Promise<void>
```

### sectionStateStore.ts
```typescript
type SectionState = 'IDLE' | 'FETCHING_ASSETS' | 'EFFECT_INIT' | 'PRELOADING' | 'READY' | 'ACTIVE' | 'COOLDOWN';
sectionStates: writable<SectionState[]>
```

### renderProfile.ts
```typescript
type RenderProfile = {
  isMobile: boolean;              // Width ≤768px OR coarse pointer OR tall aspect
  hasCoarsePointer: boolean;      // Touch device
  prefersReducedMotion: boolean;
  layoutProfile: 'tall' | 'balanced' | 'wide';  // Aspect-ratio based
  forceMobile?: boolean | null;   // Override from ?mobile= param
}
// Supports ?mobile=1|0 URL override for testing
```

### transitionStore.ts
```typescript
// Manages fade-to-black overlay for page transitions
fadeToBlackAndNavigate(href): void
// Records navigation history before navigating
```

### navigationHistoryStore.ts
```typescript
// Tracks last non-legal page for BackButton
recordPageVisit(pathname, hash): void
getLastNonLegalPage(): { pathname: string; hash: string } | null
isLegalPage(pathname): boolean
// Persists to sessionStorage
```

### navigationLockStore.ts
```typescript
// Prevents navigation during animations
lock(): void
unlock(): void
isLocked: boolean
pendingLocaleSwitch: { targetLocale, targetUrl } | null
// Used by LanguageSwitcher to defer during transitions
```

---

## Component Hierarchy

### Main Page Components
```
+page.svelte (Orchestrator)
├── LoadingScreen.svelte (initial load only)
├── particle-effect-layer
│   └── HeroSection.svelte
│       └── HeroParticleEffect.svelte (Three.js canvas)
├── portfolio-container (main)
│   ├── AboutSection.svelte
│   │   ├── KeyboardButtons.svelte
│   │   └── AboutImageEffect.svelte (conditional on desktop)
│   ├── ProjectSection.svelte (×3)
│   │   ├── Background layers (A/B crossfade)
│   │   └── <slot>
│   │       ├── ProjectOneLayout.svelte (Projects 1 & 2)
│   │       │   ├── MobileCardsCarousel.svelte
│   │       │   ├── DesktopImageFrameCarousel.svelte
│   │       │   └── ParallaxCard / ImageFrameCard
│   │       └── ProjectThreeLayout.svelte (Project 3)
│   │           ├── Keyboard-style navigation buttons
│   │           └── AnkiCardStack.svelte
│   └── ContactSection.svelte
│       └── ContactEffect.svelte (raymarching)
└── MobileNavDots.svelte
```

### Project Sub-Page Components
```
projects/[slug]/+page.svelte (Sub-orchestrator)
├── MobileNavDots.svelte
└── sections (conditional by layoutType)
    ├── OverviewSection.svelte
    │   ├── SectionTitle.svelte
    │   └── StatsBar.svelte
    ├── ManufacturingSection.svelte
    │   ├── SectionTitle.svelte
    │   ├── FeatureCard.svelte
    │   └── MaterialsStrip.svelte
    ├── CapabilitiesSection.svelte
    │   ├── SectionTitle.svelte
    │   └── FeatureCard.svelte
    └── TestingSection.svelte
        ├── SectionTitle.svelte
        ├── ImageGalleryItem.svelte
        └── StatsBar.svelte
```

### Global Layout Components
```
+layout.svelte
├── MobileOrientationLock.svelte
├── TransitionOverlay.svelte
├── LegalFooter.svelte
│   └── LanguageSwitcher.svelte
└── <slot>
```

---

## Internationalization (i18n)

### Structure
```
src/lib/i18n/
├── namespaces.ts           # Namespace type definitions
└── locales/
    ├── en/
    │   ├── common.json     # UI text, buttons, labels
    │   └── layout.json     # Meta tags, a11y text
    └── de/
        ├── common.json
        └── layout.json
```

### Namespace Types
```typescript
type Namespace = 'common' | 'layout' | 'hero' | 'about' | 'contact' | 'projects' | 'project-bura' | 'legal';
const CORE_NAMESPACES = ['common', 'layout'];
```

### Loading Flow
1. `+layout.ts` reads `params.lang` from URL
2. Dynamically imports JSON bundles for locale
3. Passes `messages` and `locale` to page data
4. Components access via `$page.data.messages`
5. Client-side cookie sync for consistency

### Static Content
Project data, About/Contact content defined in `projectsData.ts` with both locales.

### Cookie Management
- **Name:** `locale`
- **Set by:** Server hooks, LanguageSwitcher, layout load function
- **Duration:** 1 year

---

## Responsive Design Strategy

### Layout Profiles (Aspect-Ratio Driven)
| Profile | Condition | Behavior |
|---------|-----------|----------|
| `tall` | `max-aspect-ratio: 4/5` | Mobile layout, touch nav |
| `balanced` | Between tall and wide | Adaptive |
| `wide` | `min-aspect-ratio: 5/4` | Desktop layout |

### Device Detection
`renderProfile.ts` determines mobile via (any triggers mobile):
1. Media query: `max-width: 768px`
2. Pointer type: `pointer: coarse`
3. Aspect ratio: `max-aspect-ratio: 4/5` (tall screens)

### Mobile-Specific Behaviors
- `MobileNavDots` visible
- Touch gesture system (progressive drag)
- `MobileCardsCarousel` for project cards
- About image effect disabled (`disableImageOnMobile`)
- Simplified haptic feedback

### Universal Behaviors
- Wheel navigation with gesture lock
- Keyboard navigation (arrows, Home/End)
- Deep link hash navigation

### Desktop-Specific Behaviors
- `DesktopImageFrameCarousel` or parallax card grid
- Full WebGL effects
- Hover interactions

---

## Utility Modules

### gestureNavigation.ts
Extracted touch gesture logic for reuse:
```typescript
computeInstantVelocityPxPerMs()
decideGestureIntent()
shouldCancelVerticalGesture()
applyRubberBand()
computeDragProgress()
decideSwipeNavigation()
```

### projectNavigation.ts
```typescript
projectIdFromSlug(slug, locale): string | null
projectHashFromSlug(slug, locale): string  // Returns #project-{id}
```

### clientGeo.ts
Client-side geolocation for static hosting:
```typescript
detectLocaleFromIP(): Promise<Locale>
detectLocaleFromBrowser(): Locale
getLocaleFromCookie(): Locale | null
setLocaleCookie(locale): void
handleRootRedirect(): Promise<void>
```

---

## Known Technical Debt

### Code Quality Issues
1. **Large orchestrator files** – Main page ~1420 lines, sub-page ~860 lines
2. **Duplicate patterns** – Similar touch/navigation code in main and sub-pages
3. **Mixed patterns** – Props vs stores vs class bindings
4. **Type looseness** – Some `any` types in data structures

### Architecture Issues
1. **Dual scheduler** – `LegacySectionScheduler` and `StagedSectionScheduler` coexist
2. **Effect coupling** – WebGL effects tightly coupled to section components
3. **Feature flags in data** – `featureFlags` in `projectsData.ts`

### Performance Concerns
1. **Bundle size** – Three.js in main bundle
2. **GPU memory** – Multiple WebGL contexts if improperly unloaded
3. **Animation jank** – Complex GSAP timelines on lower-end devices

---

## Common Modification Patterns

### Adding a New Section
1. Create component in `src/lib/components/sections/`
2. Implement `IAnimatedComponent` interface
3. Add to `allSectionsData` array in `+page.svelte`
4. Update `sectionDescriptors.ts` type union
5. Handle in `getSectionAssetUrls()` if assets needed

### Adding a New Project
1. Add project data to `projectsData.ts` (both locales)
2. Choose or create layout in `layouts/`
3. Add images to `static/images/projects/`
4. Optionally add sub-page sections

### Creating a New Project Layout
1. Create in `src/lib/components/layouts/`
2. Accept spread props from `Project` interface
3. Export needed animations via `.anim-*` classes
4. Reference in project's `layoutType` or directly in orchestrator

### Changing Navigation Timing
Key constants in `+page.svelte`:
```typescript
const transitionDuration = 1.1;        // Section slide duration
const minSectionDisplayDuration = 1.2; // Min time before next nav
const WHEEL_LOCK_DURATION = ~1.35s;    // Calculated from above
```

### Modifying Touch Behavior
Key constants (in `+page.svelte` and `gestureNavigation.ts`):
```typescript
const DRAG_THRESHOLD = 8;         // px before drag starts
const SNAP_THRESHOLD = 0.25;      // 25% screen = navigate
const VELOCITY_THRESHOLD = 0.15;  // px/ms for momentum
const MAX_VISUAL_FEEDBACK = 0.15; // 15% visual offset max
const RUBBER_BAND_FACTOR = 0.4;   // Boundary resistance
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
| Modify transitions | `+page.svelte`, `transitionStore.ts` |
| Change mobile detection | `renderProfile.ts` |
| Edit loading screen | `LoadingScreen.svelte` |
| Modify legal footer | `LegalFooter.svelte` |
| Change language switch | `LanguageSwitcher.svelte` |
| Edit global styles | `app.css` |
| Touch gesture logic | `gestureNavigation.ts` |
| Back navigation | `navigationHistoryStore.ts` |
| Animation-safe nav | `navigationLockStore.ts` |

### Debug Tools
- `?mobile=1` or `?mobile=0` – Force mobile/desktop mode
- `?perf=1` – Enable performance metrics logging
- Triple 'd' key on hero – Debug overlay (particle stats)
- `schedulerMetricsStore` – Preload timing data
- Browser DevTools → Network → Disable cache for asset testing

---

*This document should be updated when significant architectural changes are made.*
