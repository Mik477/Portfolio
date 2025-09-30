# Data Scientist Portfolio

Single-page style portfolio built with SvelteKit, GSAP, and Three.js. It offers a section-scrolling experience with WebGL effects and a modular architecture.

**Live Deployment URL:** <https://mika-mueller.com>

---

## Table of Contents

- [Abstract](#abstract)
- [Key Features](#key-features)
- [Architecture](#architecture)
  - [Software Stack](#software-stack)
  - [Architectural Patterns](#architectural-patterns)
  - [Key Design Decisions](#key-design-decisions)
- [Effect Adaptations](#effect-adaptations)
- [Frontend](#frontend)
  - [Structure and Responsibilities](#structure-and-responsibilities)
  - [Views and Interactions](#views-and-interactions)
  - [Technical Implementation](#technical-implementation)
  - [Challenges](#challenges)
- [Backend](#backend)
  - [Backend Approach: Static Site Generation](#backend-approach-static-site-generation)
  - [Communication and APIs](#communication-and-apis)
- [Accessibility](#accessibility)
- [Data Privacy](#data-privacy)
- [Development Setup](#development-setup)

---

### Abstract

This is a single-page portfolio for a Data Scientist. Audience: employers, recruiters, and peers. Core goals: (1) present projects clearly, (2) demonstrate use of SvelteKit, GSAP, and WebGL, (3) centralize profile and contact details. The main page uses a full-screen, section-scrolling layout; each section is an isolated animated scene managed through a standard lifecycle. The design focuses on predictable transitions, controlled resource usage, and accessibility.

### Key Features

- **Section Scrolling:** Full-screen, SPA-like navigation via wheel, keyboard, and touch.
- **WebGL Effects:**
  - Hero: interactive particle system (Three.js)
  - About: image particle decay effect
  - Contact: raymarching metaball background
- **Animation System:**
  - GSAP timelines with interrupt safety
  - Standard lifecycle API (`onEnterSection`, `onTransitionComplete`, etc.)
- **Resource Management:**
  - Predictive preload scheduler
  - Asset cache (`preloadingStore`) for images and fonts
  - WebGL scenes initialised and disposed (`onUnload`) to control GPU memory
- **Internationalization:** English (`en`) and German (`de`) with URL mapping (e.g. `/en/privacy` ↔ `/de/datenschutz`).
- **Project Showcase:** Background zoom + cross-fade, wrapper + layout composition, deep-dive sub-pages.
- **Responsive:** Scales from mobile to ultra-wide.
- **Accessibility:** Keyboard navigation, focus management, ARIA roles, `prefers-reduced-motion` support.

---

### Architecture

#### System Overview

Runs fully in the browser. Subsystems coordinate around a **section orchestration loop** that converts navigation intent into store updates, asset preparation, animations, and accessibility changes.

```text
User Input (scroll / keyboard / deep link / language change)
  ↓
[Orchestrator +page.svelte] ──▶ updates writable stores
  ↓                                    │
  ├─▶ Schedules work via `LegacySectionScheduler`
  │       ├─▶ queues asset downloads through `preloadingStore`
  │       └─▶ primes section instances (`initializeEffect`, `onEnterSection`)
  ↓
Section Components (`sections/*.svelte`) execute GSAP/Three.js timelines and surface lifecycle hooks
  ↓
Stores & Metrics (`preloadingStore`, `sectionStateStore`, `schedulerMetricsStore`) provide feedback
```

Result: deterministic transitions; required assets and WebGL contexts are prepared before activation; accessibility state is updated at each step.

#### Software Stack

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Animation:** GSAP (GreenSock Animation Platform)
- **3D/WebGL:** Three.js
- **Build Tool:** Vite
- **Package Manager:** npm

#### Architectural Patterns

The site is a **Statically Generated Site (SSG)** using SvelteKit `adapter-static`; no runtime backend.

Main page uses an **Orchestrator Pattern**. Root page (`src/routes/[lang=lang]/+page.svelte`) owns navigation state, coordinates animation timelines, and delegates lifecycle calls. A predictive scheduler warms likely next sections.

#### Core subsystems and responsibilities

Orchestrator

- Location: `src/routes/[lang=lang]/+page.svelte`
- Consumes: user input events, router params, writable stores
- Emits: lifecycle hook calls, store updates, scheduler instructions
- Responsibilities: track active section index; own GSAP transition timeline; forward lifecycle hooks (`onEnterSection`, `onLeaveSection`, `onTransitionComplete`, `onUnload`); keep accessibility state in sync (focus, inert, announcements).

Section components

- Location: `src/lib/components/sections/*.svelte`
- Consumes: lifecycle hook calls, localized data, render profile flags
- Emits: GSAP timelines, WebGL scene handles, completion promises
- Responsibilities: implement Animation Lifecycle API; build per‑section GSAP timelines + Three.js effects; expose cleanup so orchestrator can pause/resume/dispose deterministically.

Layout injections

- Location: `src/lib/components/layouts/*.svelte`
- Consumes: slot props from wrapper components
- Emits: static markup / scoped styles
- Responsibilities: presentational structure (cards, copy, CTAs) inserted into functional wrappers (e.g. `ProjectSection.svelte`) keeping data flow unidirectional.

Predictive preload scheduler

- Location: `src/lib/preload/sectionScheduler.ts`
- Consumes: section descriptors, `sectionStates`, navigation history
- Emits: asset prefetch tasks, `initializeEffect` calls, unload signals
- Responsibilities: predict next sections; stage asset downloads via `preloadingStore`; initialise heavy effects just‑in‑time; trigger `onUnload` for distant sections to manage GPU memory.

Global stores

- Location: `src/lib/stores/*.ts`
- Consumes: updates from orchestrator and scheduler
- Emits: derived UI state, preload metrics, feature toggles
- Responsibilities: `preloadingStore` caches asset status & progress; `sectionStateStore` tracks lifecycle; `renderProfile` broadcasts environment flags; `schedulerMetricsStore` records timing for debugging.

Three.js utilities

- Location: `src/lib/three/*`
- Consumes: configuration from sections (shader uniforms, geometry specs)
- Emits: instantiated scenes, cleanup callbacks
- Responsibilities: encapsulate reusable WebGL constructs (bloom, particle systems) so sections initialise/dispose scenes without duplicating low‑level code.

#### Runtime interaction flow

Four phases:

1. **Intent capture** – Wheel, touch, keyboard, hash-change update `currentSectionIndex`; orchestrator records navigation and updates accessibility (`inert`, focus, live region).
2. **Preparation** – Scheduler checks `sectionStateStore`, queues asset fetches via `preloadAssets` (deduped by `preloadingStore`), then calls `initializeEffect` when ready.
3. **Transition** – GSAP master timeline runs; outgoing section `onLeaveSection`; incoming positioned; `sectionStates` updates READY → ACTIVE.
4. **Post-transition** – `onTransitionComplete` starts longer-running effects; scheduler warms neighbors; distant sections past `unloadDistance` get `onUnload`.

The **Wrapper + Layout Pattern**: `ProjectSection.svelte` owns backdrop + lifecycle; layout components supply content via slot. This keeps orchestration logic separate from presentation.

#### Preloading and asset lifecycle

- **Task tracking:** `preloadingStore` maps URLs to task descriptors; prevents duplicate image/font fetches; feeds loading progress.
- **Concurrency:** `LegacySectionScheduler` throttles with `maxConcurrent`; updates `schedulerMetricsStore` for diagnostics.
- **Warm vs. cold:** Prediction strategy marks warmup candidates (download + `initializeEffect`) vs preload-only (download only) to save GPU work.
- **Cooldown + unload:** Distant sections move to `COOLDOWN`, then `onUnload` frees textures, timelines, listeners → `IDLE`.

#### Observability and tuning

- `schedulerMetricsStore`: timings (fetch, init, ready), queue depth.
- `renderProfile`: device capability flags (mobile, reduced motion) used to skip heavy work.
- Debug logs: optional verbose tracing of scheduling decisions.

#### Key Design Decisions

1. **SvelteKit:** Fast builds, SSG support, good DX, static hosting friendly.
2. **GSAP:** Needed fine-grained, interrupt-safe timeline control beyond CSS.
3. **Three.js:** Standard library for custom WebGL effects.
4. **Custom Lifecycle API:** Ensures predictable start/stop/dispose semantics for animation + WebGL; off‑the‑shelf libs did not cover these resource constraints.

Stack supports an app-like feel while keeping static deploy advantages (performance, SEO, portability).

---

### Effect Adaptations

#### Hero Particle Effect

Original inspiration: mouse‑repulsion concept by **Luis San Prieto** ([CodePen](https://codepen.io/sanprieto/pen/XWNjBdb)). The idea was extended into a stateful generative system:

- Per‑particle state (dot vs. symbol) with heat/distortion tracking feeding a probability function for symbol spawn.
- Interaction‑driven colour ramp (white → green spectrum) plus cooldown back to neutral.
- Adaptive performance: dynamic resolution scaling; parameter tiers (particle count, size, influence radius) based on device profile; fallback particle reduction.
- Frame‑rate independent timing and lifecycle hooks (`initializeEffect`, `onEnterSection`, `onUnload`).
- Modular shaders (separate GLSL sources) and TypeScript rewrite integrated with SvelteKit cleanup semantics.
- Debug overlay (triple 'd') exposing counts, spawn rate, resolution scale, frame time.
- Symbol sizing derived from initial text geometry for consistent appearance across viewports.

#### Contact Section Raymarching Effect

Visual concept based on **Filip Zawada**'s metaballs ([CodePen](https://codepen.io/filipz/pen/RNNbYaK)). Implemented as a production component with these changes:

- CPU updates sphere transforms each frame; GPU shader focuses on raymarch + shading (original performed animation logic per‑pixel via time uniform).
- Adaptive pipeline: dynamic resolution scaling, adjustable raymarch step budget, sphere count tiering.
- Improved smooth‑union blending with normal blending to remove seam artifacts.
- Post‑processing chain (EffectComposer, bloom, FXAA, correct colour space) for stable output.
- Frame‑rate independent smoothing for motion and interaction (orbital scale influenced by cursor proximity).
- Encapsulated `RaymarchingEffect` TypeScript class implementing lifecycle + `dispose` to free Three.js resources.

---

### Frontend

#### Structure and Responsibilities

Frontend is a SvelteKit app responsible for all logic and presentation.

- `src/routes/`: Contains all pages and defines the application's routing structure.
- `src/lib/components/`: Contains all reusable UI components, broken down into layouts, sections, and utilities.
- `src/lib/stores/`: Holds global application state using Svelte stores (e.g., for page transitions and asset preloading).
- `src/lib/three/`: Contains the complex, self-contained Three.js logic for the WebGL effects.

Responsibilities:

- Render UI and content
- Manage state (active section, animation states)
- Run GSAP and Three.js effects
- Handle input (mouse, keyboard, touch)
- Preload and dispose assets/effects

#### Views and Interactions

- **Views:**
  1. **Main (`/[lang]/`):** Full-screen scrolling (Hero, About, Projects, Contact)
  2. **Project sub-pages (`/[lang]/projects/[slug]`):** Detail pages with vertical scroll
  3. **Legal (`/[lang]/imprint`, etc.):** Static pages with native scroll
- **User Interactions:**
  - **Navigation:** Wheel, arrow keys, Home/End, touch
  - **Direct:** Project cards, links, language switcher, hero particle interaction
  - **Passive:** About + Contact effects respond to mouse movement

#### Technical Implementation

- **HTML Generation:** Build-time compiled `.svelte` files produce DOM-manipulating JS; no virtual DOM.
- **Styling:** Scoped CSS per component; global variables and fonts in `src/app.css`; no external CSS framework.

#### Challenges

- **Primary Challenge:** Balance animation/WebGL complexity with performance and accessibility.
- **Other Challenges:**
  1. **Interrupt safety:** Rapid direction changes required lifecycle API enforcing start/stop/reset.
  2. **Resource usage:** Multiple WebGL scenes → added `onUnload` to release GPU memory.
  3. **Accessible custom scrolling:** Solved with `inert`, focus control, ARIA live announcements.

### Backend

---

#### Backend Approach: Static Site Generation

This project **does not have a runtime backend**. It is statically generated (SSG).

- **Structure:** `adapter-static` pre-renders routes into HTML/CSS/JS/images (`npm run build`).
- **Build-time responsibilities:**
  - Generate HTML per route
  - Read data from `src/lib/data/`
  - Bundle + optimize assets
- **Deployment:** Output deployable to any static host (Vercel, Netlify, GitHub Pages, etc.).

#### Communication and APIs

- **Internal Communication:** None; everything runs client-side post load.
- **External APIs:**

  1. **Google Fonts:** `Space Grotesk`, `Playfair Display`, `Source Code Pro`
  1. **Cloudinary:** Particle texture for hero Three.js effect

There is no authentication, authorization, or database, as the site is purely informational and public.

---

### Accessibility

Accessibility decisions:

- `prefers-reduced-motion`: disables/simplifies major effects
- Keyboard: all interactive elements focusable; navigation operable
- Focus management: `inert` on inactive sections; programmatic focus
- ARIA live region: announces new section titles
- Semantic HTML: logical headings and landmarks
- Target: WCAG 2.1 AA
- Testing: keyboard-only (Chrome/Firefox), macOS VoiceOver, Lighthouse/Accessibility Inspector

Accessibility Statement: `/en/accessibility`, `/de/barrierefreiheit`.

### Data Privacy

Privacy:

- No analytics, tracking scripts, or ads.
- **IP address:** handled by host (e.g., Vercel) in standard logs.
- **`locale` cookie:** stores preferred language (`en` / `de`), non-tracking, necessary.
- No special categories of data.
- Rights (access, deletion): handled via contact in Privacy Policy (`/en/privacy`, `/de/datenschutz`).

### Development Setup

Built with SvelteKit; requires Node.js.

#### System-wide Dependencies

- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- npm (comes with Node.js)

#### Local Development

1. **Clone the repository:**

  ```bash
  git clone <repository-url>
  cd <repository-folder>
  ```

1. **Install local dependencies:**

  ```bash
  npm install
  ```

1. **Run the development server:** (typically `http://localhost:5173`, with HMR)

  ```bash
  npm run dev
  ```

#### Building for Production

Create a production build (static files in `/build`):

```bash
npm run build
```
