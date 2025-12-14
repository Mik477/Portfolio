# Copilot Agent Instructions — Portfolio SvelteKit Project

**Purpose:** This file defines the canonical AI agent strategy for all Copilot/Claude sessions working on the Portfolio project. Every agent session must load and follow these rules to ensure consistent, performant, accessible development with minimal breaking changes.

**Project Type:** SvelteKit SSG Portfolio with GSAP animations and Three.js WebGL effects.

---

## 1. First-Window Contract (Immutable Session Rules)

Load these rules at the start of **every** session:

1. **Read architecture first:** Load `PROJECT_ARCHITECTURE.md` before making any changes. This contains the complete system overview.
2. **Single-focus sessions:** Work on one component, one feature, or one bug per session. Do not refactor unrelated files.
3. **Responsive strategy (aspect-ratio driven):** Layout decisions must be based on **aspect ratio and layout profiles**, not pixel-width breakpoints. Validate at least one portrait ratio and one landscape ratio.
4. **Desktop-first product orientation:** Desktop/tablet (desktop-layout) is the primary design target; mobile is an alternate layout profile.
5. **Animation safety:** Never modify GSAP timelines without understanding the full lifecycle flow. Interrupted animations cause state corruption.
6. **No silent refactors:** Propose refactors explicitly with impact analysis; await approval before changing navigation logic, stores, or public component APIs.
7. **Preserve working behavior:** The site is deployed and functional. Changes must not break existing functionality.
8. **Performance budget:** No changes that increase initial bundle size by >50KB without approval.
9. **Accessibility maintained:** All interactive elements must remain keyboard accessible and screen-reader friendly.
10. **Locale parity:** Any text/UI change must be applied to both `en` and `de` locales.
11. **Primary contact:** `@Mik477` approves architectural decisions, dependency additions, and navigation changes.

---

## 2. Per-Session Lifecycle (Step-by-Step)

Execute these steps in order for **every** session:

### Session Start
1. **ACK contract:** Output `ACK: Loaded copilot-instructions for Portfolio. Session focus: <component/task>`.
2. **Load context:** Read `PROJECT_ARCHITECTURE.md` for system understanding.
3. **Identify scope:** Determine which files are in scope for this task.

### Planning Phase
4. **List affected files:** Enumerate files to create/modify (max 7 unless approved).
5. **Check dependencies:** Verify changes won't break dependent components.
6. **Consider responsive:** Plan layout-profile behavior (aspect ratio) and input modality (mouse/keyboard vs touch) for any UI change.

### Implementation Phase
7. **Make changes incrementally:** Small, focused edits that can be verified.
8. **Preserve patterns:** Follow existing code patterns in the file being modified.
9. **Add types:** All new code must have TypeScript types.
10. **Test mentally:** Consider edge cases (empty data, rapid input, orientation change).

### Validation Phase
11. **Check for errors:** Use `get_errors` tool after edits to catch TypeScript/lint issues.
12. **Verify build:** Run `npm run build` for significant changes.
13. **Document changes:** Update `PROJECT_ARCHITECTURE.md` if architectural patterns change.

### Session End
14. **Summarize changes:** List all modified files with brief descriptions.
15. **ACK completion:** Output `ACK: Session complete. Files: <list>. Build: <pass/fail>.`

---

## 3. Task Scoping Rules

### Allowed Tasks Per Session
- Fix **one** bug with clear scope
- Implement **one** new UI component
- Modify **one** section's animation/behavior
- Add **one** new route/page
- Refactor **one** component for performance/readability (with approval)
- Update styles for **one** responsive layout-profile issue

### File Edit Limits
- **Standard session:** Maximum 7 files
- **Feature addition:** Maximum 10 files (component, styles, route, store, types, docs)
- **Architectural change:** Requires explicit approval, no limit but must be planned

### Forbidden in Single Session
- Refactoring multiple sections simultaneously
- Changing navigation system logic without explicit request
- Modifying both `+page.svelte` orchestrator AND section components in unrelated ways
- Adding npm dependencies without approval
- Changing GSAP timing constants across multiple files
- Modifying touch gesture thresholds without testing plan

### How to Limit Scope
- If task is too large, propose breaking into sub-tasks
- Document what is OUT of scope for clarity
- Note any discovered issues for future sessions

---

## 4. Project-Specific Knowledge

### Critical Files (High Impact)
| File | Impact | Modify With Caution |
|------|--------|---------------------|
| `src/routes/[lang=lang]/+page.svelte` | Main orchestrator (1100+ lines) | Navigation, lifecycle, all sections |
| `src/lib/stores/renderProfile.ts` | Mobile detection | All responsive behavior |
| `src/lib/preload/sectionScheduler.ts` | Asset loading | Load times, memory usage |
| `src/lib/stores/sectionStateStore.ts` | Section lifecycle | Animation timing |

### Section Lifecycle API (Must Understand)
Every section component implements:
```typescript
interface IAnimatedComponent {
  onEnterSection(): void;          // Called when navigating TO
  onLeaveSection(): void;          // Called when navigating AWAY
  initializeEffect?(): Promise<void>;  // Heavy init (WebGL, images)
  onTransitionComplete?(): void;   // After animation finishes
  onUnload?(): void;               // Free resources
}
```

**Rule:** Never add async operations to `onEnterSection` that could delay the transition. Use `initializeEffect` for heavy work.

### Navigation Flow (Do Not Break)
```
User Input → navigateToSection(index)
  → Validate (bounds, not animating)
  → oldSection.onLeaveSection()
  → newSection.onEnterSection()
  → GSAP timeline (slide)
  → Update stores (currentSectionIndex)
  → newSection.onTransitionComplete()
  → Update accessibility (inert, focus)
```

### Key Constants (Touch With Care)
```typescript
// In +page.svelte
const transitionDuration = 1.1;        // Section slide duration
const minSectionDisplayDuration = 1.2; // Min time before next nav
const WHEEL_LOCK_DURATION = ...;       // Prevents rapid wheel

// Touch thresholds
const DRAG_THRESHOLD = 8;              // px before drag starts
const SNAP_THRESHOLD = 0.25;           // 25% screen = navigate
const VELOCITY_THRESHOLD = 0.15;       // px/ms for momentum
```

---

## 5. SvelteKit & Svelte Best Practices

### Component Structure

**✅ DO: Keep components focused**
```svelte
<script lang="ts">
  // 1. Imports
  import { onMount, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  
  // 2. Props (exports)
  export let data: SomeType;
  export let onComplete: (() => void) | undefined = undefined;
  
  // 3. Local state
  let element: HTMLElement;
  let isActive = false;
  
  // 4. Reactive statements
  $: processedData = data ? transform(data) : null;
  
  // 5. Lifecycle
  onMount(() => { /* ... */ });
  onDestroy(() => { /* cleanup */ });
  
  // 6. Functions
  function handleClick() { /* ... */ }
</script>

<!-- 7. Markup -->
<div bind:this={element}>
  {#if processedData}
    <Content {processedData} />
  {/if}
</div>

<!-- 8. Scoped styles -->
<style>
  div { /* ... */ }
</style>
```

**❌ DON'T: Mix concerns or create God components**
```svelte
<!-- Bad: 500+ lines mixing data fetching, animation, and UI -->
<script>
  // Fetching data
  // Managing animations
  // Handling touch events
  // Rendering UI
  // All in one file
</script>
```

### Reactivity Patterns

**✅ DO: Use reactive statements correctly**
```typescript
// Good: Derived value
$: fullName = `${firstName} ${lastName}`;

// Good: Side effect with dependency
$: if (isActive) {
  startAnimation();
}

// Good: Reactive store subscription in markup
{$currentSectionIndex}
```

**❌ DON'T: Mutate reactive variables in reactive blocks**
```typescript
// Bad: Infinite loop risk
$: {
  count = count + 1; // DON'T
}

// Bad: Side effects without clear dependency
$: {
  doSomething(); // When does this run?
}
```

### Store Usage

**✅ DO: Use stores appropriately**
```typescript
// Good: Import and subscribe
import { currentSectionIndex } from '$lib/stores/navigationStore';

// In component
$: activeIndex = $currentSectionIndex;

// Good: Update from event handler
function handleNavigation(index: number) {
  currentSectionIndex.set(index);
}
```

**❌ DON'T: Create stores inside components**
```typescript
// Bad: New store on every component instance
const localStore = writable(0);
```

### GSAP Animation Patterns

**✅ DO: Clean up animations**
```typescript
let timeline: gsap.core.Timeline | null = null;

onMount(() => {
  timeline = gsap.timeline({ paused: true });
  timeline.to(element, { opacity: 1, duration: 0.5 });
});

onDestroy(() => {
  timeline?.kill();
  gsap.killTweensOf(element);
});
```

**✅ DO: Use callbacks for state sync**
```typescript
gsap.to(element, {
  y: 0,
  duration: 0.5,
  onStart: () => { isAnimating = true; },
  onComplete: () => { 
    isAnimating = false;
    onTransitionComplete?.();
  }
});
```

**❌ DON'T: Leave animations running**
```typescript
// Bad: No cleanup
onMount(() => {
  gsap.to(element, { rotation: 360, repeat: -1 });
});
// Component unmounts → animation continues → memory leak
```

---

## 6. CSS & Responsive Design Rules

### Layout Profiles (Aspect-Ratio Driven)

**Core rule:** Do not implement responsive behavior using `min-width`/`max-width` breakpoints.

- **Layout depends on aspect ratio:** A 16:9 viewport should look the same in composition whether it is 1920×1080 or 3840×2160.
- **Tablet = desktop layout:** Tablets use the same layout profile as desktop/laptop. Touch support is an input modality, not a layout switch.

**✅ DO: Prefer aspect-ratio media queries (or container queries) and fluid units**
```css
.container {
  padding: clamp(1rem, 2.5vmin, 3rem);
  display: flex;
  flex-direction: row;
}

/* Portrait/tall layout profile */
@media (max-aspect-ratio: 4/5) {
  .container {
    flex-direction: column;
  }
}
```

### Sizing Rules (No Hardcoded px)

**✅ DO: Use fluid, resolution-independent sizing**
- Typography: `rem`, `em`, `clamp()`
- Spacing/layout: `%`, `vmin`, `svh/lvh/dvh` (when appropriate), `clamp()`
- Components/media: relative units + `max-*` constraints; avoid fixed pixel dimensions

**❌ DON'T:** hardcode `px` values for fonts, spacing, component sizes, or images.

**Allowed exception:** hairline borders (e.g. `1px`) or interoperability constraints — only with explicit callout in the PR/summary.

### Safe Area Handling

**✅ DO: Respect notches and home indicators**
```css
.footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0rem));
}

.sidebar {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
```

### CSS Custom Properties

**✅ DO: Use existing CSS variables**
```css
/* Use project's established variables */
color: rgb(245 245 247);           /* Primary text */
background: rgb(9 9 11);           /* Background */
font-family: var(--project-title-font-family);
```

### Touch Target Sizes

**✅ DO: Ensure adequate touch targets**
```css
/* Minimum ~44×44 CSS px touch targets (expressed without px) */
.mobile-button {
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  padding: 0.75rem;
}
```

---

## 7. TypeScript Standards

### Type Definitions

**✅ DO: Define clear interfaces**
```typescript
// Good: Explicit interface
interface SectionData {
  id: string;
  component: typeof SvelteComponent;
  data: ProjectData | AboutData | ContactData;
  layout?: typeof SvelteComponent;
}

// Good: Type exports for component instances
export type ProjectSectionInstance = {
  onEnterSection: () => void;
  onLeaveSection: () => void;
  initializeEffect?: () => Promise<void>;
};
```

**❌ DON'T: Use `any` without justification**
```typescript
// Bad
const data: any = fetchData();

// Better: If truly dynamic, use unknown and narrow
const data: unknown = fetchData();
if (isValidData(data)) {
  // Now typed
}
```

### Event Typing

**✅ DO: Type event handlers**
```typescript
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY;
}

function handleTouch(event: TouchEvent) {
  const touch = event.changedTouches[0];
  if (!touch) return;
}
```

---

## 8. Accessibility Requirements

### Keyboard Navigation

**✅ DO: Maintain keyboard accessibility**
```svelte
<button
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Navigate to next section"
>
  Next
</button>
```

### Focus Management

**✅ DO: Manage focus during transitions**
```typescript
function onTransitionComplete() {
  // Move focus to new section
  const target = findFocusTarget(sectionElement);
  target?.focus({ preventScroll: true });
}
```

### ARIA Attributes

**✅ DO: Use appropriate ARIA**
```svelte
<!-- Live region for announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {sectionTitle}
</div>

<!-- Section with inert for inactive -->
<section
  id={sectionId}
  inert={!isActive}
  aria-hidden={!isActive}
>
```

### Reduced Motion

**✅ DO: Respect motion preferences**
```typescript
const prefersReducedMotion = $renderProfile.prefersReducedMotion;

if (prefersReducedMotion) {
  // Instant transition
  gsap.set(element, { opacity: 1 });
} else {
  // Animated transition
  gsap.to(element, { opacity: 1, duration: 0.5 });
}
```

---

## 9. Performance Guidelines

### Bundle Size

**✅ DO: Use dynamic imports for heavy dependencies**
```typescript
// Good: Lazy load Three.js only when needed
const initWebGL = async () => {
  const THREE = await import('three');
  // Use THREE
};
```

### Image Optimization

**✅ DO: Use optimized formats and sizes**
```html
<!-- Good: WebP with fallback, responsive sizes -->
<picture>
  <source srcset="/images/hero-mobile.webp" media="(max-aspect-ratio: 4/5)">
  <source srcset="/images/hero-desktop.webp" media="(min-aspect-ratio: 5/4)">
  <img src="/images/hero-fallback.jpg" alt="Hero image" loading="lazy">
</picture>
```

### Animation Performance

**✅ DO: Use transform and opacity for animations**
```typescript
// Good: GPU-accelerated properties
gsap.to(element, {
  x: 100,           // transform
  opacity: 0.5,     // opacity
  force3D: true     // Ensure GPU layer
});

// Bad: Layout-triggering properties
gsap.to(element, {
  width: '30vw',    // Causes layout
  top: '10vh'       // Causes layout
});
```

### Memory Management

**✅ DO: Clean up resources**
```typescript
export function onUnload() {
  // Kill all GSAP animations
  gsap.killTweensOf(element);
  timeline?.kill();
  
  // Dispose Three.js resources
  geometry?.dispose();
  material?.dispose();
  renderer?.dispose();
  
  // Clear references
  texture = null;
  scene = null;
}
```

---

## 10. Internationalization Rules

### Locale Handling

**✅ DO: Support both locales**
```typescript
// Access current locale
const locale = $page.params.lang as 'en' | 'de';

// Access translations
const messages = $page.data.messages;
const title = messages.common.section.title;
```

### Adding New Text

**✅ DO: Add to both locale files**
```json
// src/lib/i18n/locales/en/common.json
{
  "newSection": {
    "title": "New Feature",
    "description": "Description in English"
  }
}

// src/lib/i18n/locales/de/common.json
{
  "newSection": {
    "title": "Neue Funktion",
    "description": "Beschreibung auf Deutsch"
  }
}
```

### URL Mapping

| English | German |
|---------|--------|
| `/en/privacy` | `/de/datenschutz` |
| `/en/imprint` | `/de/impressum` |
| `/en/accessibility` | `/de/barrierefreiheit` |

**Rule:** When adding new legal/info pages, add route to both locale folders with appropriate URL mapping in `LanguageSwitcher.svelte`.

---

## 11. Approval Gating (When to Pause)

### Explicit Approval Required For:

1. **Navigation changes:** Modifying wheel handler, touch gestures, or keyboard navigation
2. **New dependencies:** Any `npm install` command
3. **Store modifications:** Adding/removing stores or changing store interfaces
4. **Lifecycle changes:** Modifying section lifecycle API or orchestrator flow
5. **Animation timing:** Changing transition durations or easing functions globally
6. **Breaking changes:** Anything that changes existing component APIs
7. **New sections:** Adding sections to main page
8. **Build config:** Modifying `vite.config.ts`, `svelte.config.js`, or `tsconfig.json`

### Approval Request Format
```
APPROVAL REQUEST: <topic>
Context: <what you're trying to achieve>
Proposal: <specific changes planned>
Impact: <files affected, potential risks>
Alternatives: <other approaches considered>
Awaiting: @Mik477
```

---

## 12. Debug & Testing Workflow

### Development Commands
```powershell
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx svelte-check

# Lint
npm run lint
```

### Debug Tools

| Tool | Activation | Purpose |
|------|------------|---------|
| Mobile override | `?mobile=1` or `?mobile=0` | Force mobile/desktop mode |
| Particle debug | Triple 'd' on hero | Show particle system stats |
| Scheduler metrics | `schedulerMetricsStore` | Preload timing data |
| Browser DevTools | F12 | Network, Performance, Console |

### Common Debug Scenarios

**Animation not playing:**
1. Check if `isAnimating` store is stuck `true`
2. Verify GSAP timeline wasn't killed prematurely
3. Check if element exists in DOM when animation starts

**Touch not working:**
1. Verify `renderProfile.isMobile` is `true`
2. Check for `pointer-events: none` on parent elements
3. Look for `event.preventDefault()` blocking events

**Section not loading:**
1. Check `sectionStates` store for section state
2. Verify assets are in correct path
3. Check browser Network tab for 404s

---

## 13. Code Review Checklist

Before considering work complete, verify:

### Functionality
- [ ] Feature works on desktop (Chrome, Firefox, Safari)
- [ ] Feature works on mobile (touch, orientation)
- [ ] No console errors or warnings
- [ ] No TypeScript errors (`npx svelte-check`)

### Accessibility
- [ ] Keyboard navigable
- [ ] Focus visible when tabbing
- [ ] Screen reader announces changes (if applicable)
- [ ] Reduced motion respected

### Performance
- [ ] No unnecessary re-renders
- [ ] Animations use transform/opacity
- [ ] Resources cleaned up on destroy
- [ ] No memory leaks (long-running animations)

### Internationalization
- [ ] Text added to both locales
- [ ] Dynamic content uses translation keys
- [ ] No hardcoded strings in components

### Code Quality
- [ ] Types defined (no `any` without comment)
- [ ] Follows existing patterns in file
- [ ] No TODO/FIXME without issue reference
- [ ] Scoped styles (no global leakage)

---

## 14. Known Issues & Workarounds

### Current Technical Debt
1. **Large orchestrator:** `+page.svelte` is 1100+ lines. Do not add more logic without discussing extraction.
2. **Duplicate touch code:** Similar gesture handling in main page and project sub-pages.
3. **Type looseness:** Some `any` types in data structures that should be refined.

### Workarounds in Use
1. **Wheel gesture lock:** Prevents rapid navigation with timeout-based lock
2. **Inert polyfill:** Some browsers need `inert` attribute handling
3. **Safe area insets:** Using `env()` with fallbacks for older browsers

### Areas Needing Improvement
- Mobile performance on lower-end devices
- Initial bundle size (Three.js)
- Animation jank on complex timelines

---

## 15. Session-Start ACK Template

**After reading this file, output:**
```
ACK: Loaded copilot-instructions for Portfolio SvelteKit project.
Session focus: <component-name or task-description>
Architecture doc: PROJECT_ARCHITECTURE.md loaded.
Key constraints: aspect-ratio responsive, desktop-first layout, animation safety, locale parity, accessibility.
Ready to proceed.
```

---

## 16. Quick Reference

### File Locations
| Task | Primary File(s) |
|------|-----------------|
| Navigation logic | `src/routes/[lang=lang]/+page.svelte` |
| Mobile detection | `src/lib/stores/renderProfile.ts` |
| Section components | `src/lib/components/sections/*.svelte` |
| Project data | `src/lib/data/projectsData.ts` |
| Site config | `src/lib/data/siteConfig.ts` |
| Translations | `src/lib/i18n/locales/{en,de}/*.json` |
| Global styles | `src/app.css` |
| Preloading | `src/lib/preload/sectionScheduler.ts` |

### Import Conventions
```typescript
// Svelte
import { onMount, onDestroy, tick } from 'svelte';
import { writable, derived, get } from 'svelte/store';

// SvelteKit
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Project stores
import { renderProfile } from '$lib/stores/renderProfile';
import { sectionStates } from '$lib/stores/sectionStateStore';

// GSAP
import { gsap } from 'gsap';

// Components use $lib alias
import HeroSection from '$lib/components/sections/HeroSection.svelte';
```

---

## 17. Version & Maintenance

- **File version:** 1.0.0 (2024-12-04)
- **Project:** Portfolio SvelteKit (mika-mueller.com)
- **Maintainer:** @Mik477
- **Review cycle:** Update when architectural patterns change
- **Companion docs:** `PROJECT_ARCHITECTURE.md` (detailed system reference)

---

**End of copilot-instructions.md**
