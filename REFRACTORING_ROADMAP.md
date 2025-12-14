# Portfolio Refactoring Roadmap (Agent-Executable)

**Goal:** Make the portfolio easier to maintain, faster (especially on section navigation after idle), and more robust across aspect ratios—without breaking the existing deployed behavior.

**Status (as of 2025-12-13):**
- Phase 3: completed and standardized (staged warmup + true cancellation; perf logs validate warmup finishes before transition trigger).
- Phase 4: completed (shared gesture math extracted; project subpage + main page migrated).

**Context anchors (current code):**
- Main orchestrator: `src/routes/[lang=lang]/+page.svelte` (full-screen sections + wheel/keyboard/touch + GSAP transitions)
- Project sub-pages: `src/routes/[lang=lang]/projects/[slug]/+page.svelte` (similar navigation; separate preloading)
- Preloading (main page):
   - Staged warmup: `src/lib/preload/stagedSectionScheduler.ts`
   - Warmup contract: `src/lib/preload/warmupContract.ts`
   - Legacy lifecycle/unload: `src/lib/preload/sectionScheduler.ts` (`LegacySectionScheduler`)
- Render profile: `src/lib/stores/renderProfile.ts` (currently uses `(max-width: 768px)` and `(pointer: coarse)`)

---

## Non‑Negotiables (for any agent)

1. **Preserve working behavior**: small, verifiable steps; no drive-by refactors.
2. **Animation safety**: do not modify GSAP timelines or lifecycle flow unless you understand the full call chain.
3. **Single-focus per phase**: one system/component per phase.
4. **Accessibility stays intact**: keyboard navigation, focus, `aria-live`, `inert` rules must remain correct.
5. **Locale parity**: any text changes must be applied to both `en` and `de`.
6. **Performance budget**: no dependency additions or bundle growth >50KB without approval.
7. **Responsive strategy**: migrate toward **aspect-ratio driven layout profiles** (not pixel breakpoints).

---

## What’s actually happening today (high-level)

### Navigation
- **Main page** (`/[lang]/`):
  - Wheel + keyboard for desktop.
  - Touch “progressive drag” navigation for mobile.
  - `navigateToSection()` triggers:
    - `old.onLeaveSection()`
    - `new.onEnterSection()`
    - GSAP slide
   - onComplete: update index, update inert/focus, update hash, schedule staged background warmup.

- **Project sub-pages** (`/[lang]/projects/[slug]`):
  - Similar wheel/keyboard/touch navigation.
  - Separate preloading step in `onMount()` that preloads all section backgrounds.

### Preloading
- Main page warmup is handled by `StagedSectionScheduler`:
   - Stages: `fetch+decode` → `init` (optional `AbortSignal`) → `prime`.
   - Uses per-section in-flight promise caching to avoid duplicate work across triggers.
- `LegacySectionScheduler` remains for section lifecycle state/unload semantics (and does not auto-prepare neighbors).

### Scroll lag after idle (probable causes to validate)
This repo already tries to preload and initialize, but “lag after not scrolling for a bit” often comes from one (or multiple) of:
- **Cold-start effect init** on first transition (GPU program compilation, texture upload, first canvas render).
- **Late image decode** (images are “loaded” but decoding and upload happens at navigation time).
- **Main-thread contention** right when wheel triggers (scheduler tasks, timeline creation, layout reads).
- **Browser power-saving / tab hidden**: work paused, then resumed with a burst.

This roadmap makes you *measure first*, then changes the scheduler so “first transition after idle” has no heavy work left.

---

## Refactor method (repeatable workflow)

### 1) Baseline + guardrails
- Run `npm run build` and `npx svelte-check` (if present) before and after each phase.
- Add or use existing instrumentation before changing behavior.

### 2) Change in “thin slices”
- Introduce new code paths behind flags (local consts) until verified.
- Replace one call site at a time; do not rewrite the orchestrator in one go.

### 3) Define “done” for every change
- No TypeScript errors.
- No console errors.
- Navigation works for:
  - desktop wheel
  - desktop keyboard
  - mobile swipe
  - hash deep links
- Reduced motion preference does not break transitions.

---

## Phase Plan (≈20h per phase)

Each phase is scoped so an AI agent can execute it end-to-end with minimal risk.

### Phase 1 (≈20h): Performance Baseline + Dead Code Triage (no behavior changes)
**Objective:** identify the real bottleneck(s) and remove obvious dead/low-risk bloat.

**Work items**
1. Establish a repeatable perf scenario:
   - “first scroll after 30–60s idle” on desktop.
   - “first swipe after idle” on mobile (or `?mobile=1`).
2. Instrument section transitions (minimal, low-risk):
   - Measure durations for:
     - scheduler fetch stage (`FETCHING_ASSETS`)
     - effect init stage (`EFFECT_INIT`)
     - time from wheel event → first frame of transition
   - Leverage existing `schedulerMetricsStore.ts` and add *non-invasive* timing logs.
3. Dead code triage:
   - Remove/flag empty unused files (example: `src/lib/preload/particlePreloadController.ts` is currently empty and not referenced).
   - Search and list “candidate cleanup” areas:
     - duplicated touch handling (main + project sub-page)
     - inline hardcoded px layouts (sub-page CSS is heavily px-based)
     - “Phase 1 extraction” TODOs that never progressed
4. Write a short “Perf Baseline Notes” section into this file with:
   - device/browser
   - measured timings
   - which stage spikes after idle

**Definition of Done**
- You can state “the lag is caused by X (measured)”, not guess.
- Build still passes.

**Likely files**
- `src/routes/[lang=lang]/+page.svelte`
- `src/lib/preload/sectionScheduler.ts`
- `src/lib/preload/schedulerMetricsStore.ts`

---

### Phase 2 (≈20h): Preloading System Upgrade (core requirement)
**Objective:** rework preloading so transitions never trigger heavy work on-demand.

**Key design goals**
- Split scheduling into explicit stages:
  1) **Asset fetch + decode** (images decoded before navigation)
  2) **Effect init** (GPU warm-up)
  3) **Prime render** (ensure first frame is ready)
- Support:
  - priority (active neighbor > predicted > distant)
  - cancellation (don’t waste work if user changes direction)
  - time budgeting (do warmups in idle time, not during transition)

**Implementation outline**
1. Introduce a new scheduler (keep `LegacySectionScheduler` intact at first):
   - `SectionScheduler` with:
     - a priority queue
     - task tokens / cancellation
     - “idle budget” runner using `requestIdleCallback` (fallback to `setTimeout`)
2. Upgrade `preloadAssets()` to guarantee **decode completion** for images:
   - Ensure `img.decode()` completion is awaited where supported.
   - Avoid duplicate concurrent loads (already tracked by `assetLoadingStatus`).
3. Add a **“warm transition” contract**:
   - Before starting GSAP slide, scheduler guarantees:
     - target section assets decoded
     - target `initializeEffect()` completed (or reduced-motion fallback)
4. Replace orchestrator calls incrementally:
   - Replace `ensureScheduler().prepareSection(i)` with the new scheduler in one spot.
   - Keep `sectionStates` semantics stable until fully migrated.

**Definition of Done**
- Measured “first scroll after idle” no longer spikes (or spike reduced materially).
- No new animation bugs.

**Likely files**
- `src/lib/preload/sectionScheduler.ts` (new scheduler added or new file in same folder)
- `src/lib/stores/preloadingStore.ts`
- `src/routes/[lang=lang]/+page.svelte`

---

### Phase 3 (≈20h): Warmup Contract + True Cancellation (comprehensive rework)
**Status:** DONE (and now the default path).
**Objective:** remove remaining “first transition after idle” spikes by moving warmup responsibility to sections (explicit contract), making warmup fully idempotent and cancellable, and ensuring “GPU warm” happens off the transition path.

**Why this phase exists (observed risks that still remain after Phase 2)**
- `img.decode()` reduces decode stalls, but **WebGL stalls** often come from shader/program compilation and texture upload.
- The scheduler still contains **section-specific heuristics** (about/contact vs projects) and can’t reliably “prime first frame” for every section.
- Cancellation currently stops queued work, but **section init itself can’t be aborted** and can still waste time during rapid direction changes.
- Multiple entry points (deep link, jump, predictive warmup, neighbor prep) can still lead to **duplicate init/prime** unless unified via per-section in-flight promises.

**Design contract (new, explicit, section-owned)**
Introduce a small interface implemented by section instances (incrementally; start with one section):

```ts
interface ISectionWarmup {
  // Assets needed for the section’s first meaningful frame.
  getPreloadAssets?: () => string[];

  // Heavy effect init; must be idempotent.
  // If AbortSignal is provided, it should stop ASAP and not commit partial state.
  initializeEffect?: (signal?: AbortSignal) => Promise<void>;

  // Optional: do one cheap “first frame” render/paint without making the section visible.
  // Must be safe to call multiple times.
  primeFirstFrame?: () => Promise<void>;
}
```

**Key behavior requirements**
- **Idempotency:** repeated calls must not duplicate WebGL resources, listeners, or GSAP timelines.
- **Cancellation propagation:** when navigation intent changes, the scheduler cancels queued work *and* passes abort signals into section init when supported.
- **Unified in-flight promises:** scheduler tracks `assetsPromise/initPromise/primePromise` per section id so every code path awaits the same work.
- **GPU warm stage:** explicitly run “GPU warm” during idle time (program compilation/texture creation + one hidden render if available), never inside the GSAP transition window.

**Implementation outline (thin slices, low risk)**
1. Add types + minimal plumbing (no behavior changes yet):
   - Create a shared warmup type in `src/lib/preload/sectionDescriptors.ts` (or a new `src/lib/preload/warmupContract.ts`).
   - Extend scheduler(s) to treat warmup as three named stages with per-section in-flight promises:
     - `fetch+decode` (assets)
     - `effect init` (supports `AbortSignal` where available)
     - `prime render` (calls `primeFirstFrame` if present, else keep legacy heuristics)
2. Implement the contract for **one section first** (recommended: `ProjectSection.svelte`):
   - Add `getPreloadAssets()` using the already-available project data.
   - Update `initializeEffect` to accept optional `AbortSignal` and bail out early.
   - Add a minimal `primeFirstFrame()` that does the cheapest possible safe prime for that section.
3. Scheduler upgrades:
   - Replace hardcoded `getSectionAssetUrls()` logic with `instance.getPreloadAssets?.()` (fallback to current heuristic).
   - Implement per-section promise caches so multiple triggers never double-run init.
   - When canceling, abort tokens should invalidate only “future” stages and avoid committing state.
4. Orchestrator integration (incremental):
   - Keep GSAP timings and UX unchanged.
   - Add a single “warm transition” precondition for **one** high-impact path (e.g. jump > 1 section), gated by a local flag.
5. Instrumentation:
   - Extend `[Perf] transition` logging to optionally print `firstFrameAt - triggerAt` and stage timings for the target section.

**Definition of Done**
- On `/en?perf=1`, the scenario “idle 30–60s → first navigation” shows no new spikes; stage timings should be stable and (ideally) happen before the transition.
- No regressions in wheel/key/touch/hash navigation.
- No new memory growth after repeated navigation cycles (basic manual check).

**Implemented (high-level)**
- Contract file: `src/lib/preload/warmupContract.ts`.
- Scheduler: `src/lib/preload/stagedSectionScheduler.ts` now owns warmup as standard and propagates `AbortSignal`.
- Section implementation (exactly one): `src/lib/components/sections/ProjectSection.svelte`.
- Orchestrator uses staged warmup as standard: `src/routes/[lang=lang]/+page.svelte`.
- Legacy scheduler configured to not auto-prepare neighbors: `src/lib/preload/schedulerCore.ts`, `src/lib/preload/sectionScheduler.ts`.

**Likely files (keep scope tight)**
- `src/routes/[lang=lang]/+page.svelte`
- `src/lib/preload/stagedSectionScheduler.ts`
- `src/lib/preload/sectionScheduler.ts` (legacy: only if needed for compatibility)
- `src/lib/preload/schedulerMetricsStore.ts`
- One section component (start with **one**): `src/lib/components/sections/ProjectSection.svelte`

---

### Phase 4 (≈20h): Unify Navigation Primitives (main + project sub-page)
**Status:** DONE.
**Objective:** reduce duplication and inconsistency without changing UX.

**What to consolidate**
- The **progressive drag** system exists in both:
  - `src/routes/[lang=lang]/+page.svelte`
  - `src/routes/[lang=lang]/projects/[slug]/+page.svelte`
- Wheel/keyboard debounce and locking differs between pages.

**Implementation outline**
1. Extract a pure utility module (DONE):
   - `src/lib/utils/gestureNavigation.ts`
   - Pure helpers for velocity/intent decision/rubber-band/drag decision.
2. Migrate one consumer (DONE):
   - `src/routes/[lang=lang]/projects/[slug]/+page.svelte` now uses the shared helpers.
3. Migrate main page (DONE):
   - `src/routes/[lang=lang]/+page.svelte` now reuses `gestureNavigation.ts` for touch gesture math.
   - Keep hero/contact interactive-effect touch forwarding and nav-dots exclusions unchanged.
4. Standardize constants (TODO, optional):
   - Keep thresholds identical; consider moving to named exports.
5. Re-test:
   - mobile swipe
   - carousel horizontal gestures unaffected

**Definition of Done**
- Same UX, less duplicate logic.
- No regressions in hero/contact interactive effects.

---

### Phase 5 (≈20h): Section Lifecycle Audit (idempotency + cleanup)
**Status:** IN PROGRESS (Contact slice DONE).
**Objective:** make every section safe to initialize/unload repeatedly.

**Targets**
- Every section’s `initializeEffect()` must be:
  - idempotent (calling twice does not double-create resources)
  - cancellable or guarded (ignore if already initialized)
- Every section’s `onUnload()` must actually release GPU/GSAP resources.

**Implementation outline**
1. For each main section component:
   - `src/lib/components/sections/HeroSection.svelte`
   - `src/lib/components/sections/AboutSection.svelte`
   - `src/lib/components/sections/ProjectSection.svelte`
   - `src/lib/components/sections/ContactSection.svelte`
   Ensure:
   - GSAP timelines are killed on destroy/unload.
   - Three.js resources disposed.
2. Ensure orchestrator never awaits heavy work inside the transition window.

**Completed slice: Contact section (2025-12-13)**
- Files:
   - `src/lib/components/sections/ContactEffect.svelte`
   - `src/lib/components/sections/ContactSection.svelte`
- Idempotency:
   - `initializeEffect(signal?: AbortSignal)` is now concurrency-safe (`initPromise`) and abort-aware.
   - Aborted/failed init disposes partial WebGL resources and avoids committing global state.
- Cleanup:
   - Kills GSAP tweens targeting section DOM and internal vectors.
   - Disposes postprocessing targets/materials and removes canvas + event listeners on unload.
- Validation:
   - `npm run build` passes.

**Completed slice: Lifecycle hardening sweep (2025-12-13)**
- Sections and section-scoped dependencies:
   - `src/lib/components/HeroParticleEffect.svelte`
   - `src/lib/three/heroParticleLogic.ts`
   - `src/lib/components/sections/AboutSection.svelte`
   - `src/lib/components/AboutImageEffect.svelte`
   - `src/lib/components/sections/ProjectSection.svelte`
   - `src/lib/components/KeyboardButtons.svelte`
   - `src/lib/components/ImageFrameWideCard.svelte`
   - `src/lib/components/LoadingScreen.svelte`
   - `src/lib/components/MobileCardsCarousel.svelte`
- Additional UI components/pages with rAF/timer/observer guards:
   - `src/lib/components/ImageFrameCard.svelte`
   - `src/lib/components/ParallaxCard.svelte`
   - `src/lib/components/DesktopImageFrameCarousel.svelte`
   - `src/lib/components/DesktopVerticalImageFrameCarousel.svelte`
   - `src/lib/components/NotFoundPage.svelte`
   - `src/routes/+page.svelte` (abort timeout always cleared)
   - `src/routes/[lang=lang]/projects/[slug]/+page.svelte` (async/GSAP guards + timeout cleanup)
   - `src/routes/projects/[slug]/+page.svelte` (async/GSAP guards + TS safety for optional sections)
- Validation:
   - `npm run build` passes after each batch.

**Known limitation**
- Abort cannot interrupt an in-flight dynamic import; we still avoid state commit and dispose immediately after the awaited step when aborted.

**Definition of Done**
- No increasing memory usage after repeated navigation cycles.
- No “first frame pop-in” when returning to a section.

---

### Phase 6 (≈20h): Responsive Layout Profiles (aspect ratio first)
**Objective:** improve layout across resolutions/aspect ratios without adding breakpoint sprawl.

**Current issue:** `renderProfile.ts` uses `(max-width: 768px)` and many components use px-based sizing. This conflicts with the project’s “aspect-ratio driven” direction.

**Implementation outline**
1. Define layout profiles by aspect ratio:
   - e.g. `portrait/tall`, `balanced`, `landscape/wide`
2. Create a store or derived signal (no behavior change first):
   - `renderProfile.layoutProfile: 'tall' | 'wide' | 'balanced'`
3. Update the worst offenders first:
   - project sub-page CSS (currently hard px for containers and max-widths)
   - components that hardcode spacing
4. Validate at least:
   - portrait ratio (e.g. 9/16)
   - landscape ratio (e.g. 16/9)

**Definition of Done**
- Layout holds compositionally across aspect ratios.
- No new hard-coded px (except allowed 1px borders).

---

### Phase 7 (≈20h): Content + i18n cleanup (job-application readiness)
**Objective:** replace filler content and ensure both languages remain coherent.

**Implementation outline**
1. Update:
   - `src/lib/data/projectsData.ts` (projects, summaries, sub-sections)
   - `src/lib/i18n/locales/en/*.json` and `src/lib/i18n/locales/de/*.json`
2. Keep translations aligned (no missing keys).
3. Rebuild and verify output routes for both locales.

**Definition of Done**
- No filler text.
- Both locales complete.

---

### Phase 8 (≈20h): Final hardening (a11y + reduced motion + regressions)
**Objective:** polish, prevent regressions, and stabilize.

**Implementation outline**
1. Reduced motion audit:
   - ensure transitions degrade cleanly and quickly.
2. Keyboard/focus audit:
   - ensure focus sentinel approach still works after refactors.
3. Regression checklist run (below).

**Definition of Done**
- Smooth navigation and no console errors across key scenarios.

---

## Regression Checklist (run every phase)

1. **Main page** (`/[lang]/`)
   - wheel up/down navigation
   - keyboard navigation (arrows, page up/down, home/end)
   - deep-link hash to a section and load fresh
   - switch language and verify content updates
2. **Mobile** (`?mobile=1`)
   - swipe navigation
   - nav dots tap
   - hero particle interaction still works
3. **Project sub-page** (`/[lang]/projects/[slug]`)
   - preload completes
   - swipe navigation + hash updates
4. **Legal pages**
   - normal scroll and links

---

## Agent Execution Notes (how to avoid breaking things)

- **Do not rewrite** `src/routes/[lang=lang]/+page.svelte` wholesale. Make surgical edits.
- Prefer “add new scheduler → swap one call site → verify → swap next”.
- Keep `sectionStates` values stable until scheduler migration is complete.
- Any change touching navigation, stores, or GSAP timing constants should be treated as high risk and validated immediately.

---

## Appendix: Candidate cleanup list (starter)

- `src/lib/preload/particlePreloadController.ts` was empty/unused (removed in Phase 1).
- Touch/gesture code is duplicated between:
  - `src/routes/[lang=lang]/+page.svelte`
  - `src/routes/[lang=lang]/projects/[slug]/+page.svelte`
- Sub-page styles include many px-based sizes; migrate to fluid/aspect-ratio driven units.

---

## Perf Baseline Notes (fill in during Phase 1)

### How to capture baseline (Phase 1 instrumentation)

1. Run the site (dev or preview).
2. Open main page with perf logging enabled:
   - Desktop: `/en?perf=1` (or `/de?perf=1`)
   - Mobile simulation: `/en?perf=1&mobile=1`
3. Open DevTools Console.
4. Scenario:
   - Navigate once (to ensure initial warmup is done), then wait 30–60s idle.
   - Trigger one navigation (wheel / key / swipe / dots / hash).
5. Record the emitted console line(s) starting with `[Perf] transition`.

**What the log contains**
- `totalMs`: end-to-end from input trigger → GSAP onComplete
- `fetchMs`: scheduler asset fetch stage (if it ran for that target section)
- `initMs`: scheduler effect-init stage (if it ran for that target section)

If `totalMs` spikes but `fetchMs/initMs` stay low/undefined, the lag is likely outside the scheduler (e.g. main-thread contention, layout, browser throttling).

- Environment: `Microsoft Edge (version: unknown)`, `Windows laptop`, `3.5K display`, aspect ratio `4:3`
- Scenario: desktop wheel navigation between sections after idle (hard-to-reproduce lag; one run showed some scheduler work on first transition)
- Metrics (from `[Perf] transition` logs; most transitions were near the intended GSAP duration):
   - wheel event → transition start: `not captured yet` (we currently log `firstFrameAt` into the store, but do not print it)
   - scheduler fetch stage:
      - `~53.9ms` (project-two, transition 2 → 3)
      - `~6.7ms` (project-one, transition 3 → 2)
   - scheduler init stage:
      - `~43.6ms` (project-two, transition 2 → 3)
      - `~0.9ms` (project-one, transition 3 → 2)
   - total time to stable frame: `~1088–1116ms` (examples: 1088.5ms, 1108.9ms)
