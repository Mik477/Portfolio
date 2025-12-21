<!-- src/lib/components/layouts/ProjectThreeLayout.svelte -->
<!-- Navigation-focused layout for Anki Automation project -->
<script lang="ts">
  import type { Project, ProjectHeadlineSegment, ProjectCard, ProjectSubPageSection, ProjectCardDisplayConfig } from '$lib/data/projectsData';
  import { page } from '$app/stores';
  import { renderProfile } from '$lib/stores/renderProfile';
  import AnkiCardStack from '$lib/components/AnkiCardStack.svelte';
  import { ankiDemoCards } from '$lib/data/ankiDemoCards';
  import { Play, BookOpen, Settings, Sparkles } from 'lucide-svelte';

  // Required props (from Project interface spread)
  export let headline: string;
  export let summary: string;
  export let headlineSegments: ProjectHeadlineSegment[] | undefined = undefined;
  export let navigationLinks: Project['navigationLinks'] | undefined = undefined;
  
  // These props are passed but not used in this layout (required for compatibility with ProjectSection wrapper)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let cards: ProjectCard[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let slug: string = '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let readMoreLinkText: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let readMoreFallbackLabel: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let backgrounds: Project['backgrounds'] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let backgroundsMobile: Project['backgrounds'] | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let subPageSections: ProjectSubPageSection[] | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let paperUrl: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let cardDisplay: ProjectCardDisplayConfig | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let id: string = '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let tags: string[] | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let layoutType: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let overviewBackground: Project['overviewBackground'] | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let overviewBackgroundMobile: Project['overviewBackgroundMobile'] | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let headlineAnimation: Project['headlineAnimation'] | undefined = undefined;

  $: locale = $page.params?.lang === 'de' ? 'de' : 'en';
</script>

<div class="layout-container" class:mobile-layout={$renderProfile.isMobile}>
  <div class="content-wrapper">
    <!-- Text content section -->
    <div class="text-block">
      <h2 class="anim-headline">
        {#if headlineSegments && headlineSegments.length > 0}
          {#each headlineSegments as segment, idx (idx)}
            {#if segment.breakBefore}
              <br>
            {/if}
            <span
              class="headline-segment"
              class:bold={segment.bold}
              class:secondary={idx === 1}
              style:font-weight={segment.weight ?? (segment.bold ? 'var(--project-title-bold-weight)' : undefined)}
              style:font-size={segment.fontScale ? `calc(1em * ${segment.fontScale})` : undefined}
            >{segment.text}</span>
          {/each}
        {:else}
          {headline}
        {/if}
      </h2>
      <p class="anim-summary">{summary}</p>

      <!-- Keyboard-style Navigation buttons -->
      {#if navigationLinks}
        <div class="keyboard-buttons-wrapper">
          <!-- First Row: Main Actions -->
          <div class="button-row">
            <!-- Demo button - primary with cyan glow -->
            {#if navigationLinks.demo}
              <div class="key-position">
                <a 
                  href={navigationLinks.demo.url} 
                  class="key key-wide key-primary"
                  aria-label={navigationLinks.demo.label}
                >
                  <Play size={16} />
                  <span class="key-content">{navigationLinks.demo.label}</span>
                </a>
              </div>
            {/if}
            
            <!-- Guide button -->
            {#if navigationLinks.guide}
              <div class="key-position">
                <a 
                  href={navigationLinks.guide.url} 
                  class="key key-wide"
                  aria-label={navigationLinks.guide.label}
                >
                  <BookOpen size={16} />
                  <span class="key-content">{$renderProfile.isMobile ? 'Guide' : navigationLinks.guide.label}</span>
                </a>
              </div>
            {/if}
            
            <!-- Card Setup button -->
            {#if navigationLinks.cardSetup}
              <div class="key-position">
                <a 
                  href={navigationLinks.cardSetup.url} 
                  class="key key-wide"
                  aria-label={navigationLinks.cardSetup.label}
                >
                  <Settings size={16} />
                  <span class="key-content">{navigationLinks.cardSetup.label}</span>
                </a>
              </div>
            {/if}
          </div>
          
          <!-- Second Row: GitHub & Releases (desktop only) -->
          {#if navigationLinks.github && !$renderProfile.isMobile}
            <div class="button-row">
              <!-- GitHub icon button -->
              <div class="key-position">
                <a 
                  href={navigationLinks.github.url} 
                  class="key"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="{navigationLinks.github.label} (opens in new tab)"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M10 20.568c-3.429 1.157-6.286 0-8-3.568"></path><path d="M10 22v-3.242c0-.598.184-1.118.48-1.588c.204-.322.064-.78-.303-.88C7.134 15.452 5 14.107 5 9.645c0-1.16.38-2.25 1.048-3.2c.166-.236.25-.354.27-.46c.02-.108-.015-.247-.085-.527c-.283-1.136-.264-2.343.16-3.43c0 0 .877-.287 2.874.96c.456.285.684.428.885.46s.469-.035 1.005-.169A9.5 9.5 0 0 1 13.5 3a9.6 9.6 0 0 1 2.343.28c.536.134.805.2 1.006.169c.2-.032.428-.175.884-.46c1.997-1.247 2.874-.96 2.874-.96c.424 1.087.443 2.294.16 3.43c-.07.28-.104.42-.084.526s.103.225.269.461c.668.95 1.048 2.04 1.048 3.2c0 4.462-2.364 5.807-5.177 6.643c-.367.101-.507.559-.303.88c.296.47.48.99.48 1.589V22"></path></g></svg>
                </a>
              </div>
              
              <!-- New Releases button -->
              <div class="key-position">
                <a 
                  href="https://github.com/Mik477/Anki-Automation/releases" 
                  class="key key-wide"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="New Releases (opens in new tab)"
                >
                  <Sparkles size={16} />
                  <span class="key-content">New Releases</span>
                </a>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Anki Card Stack Preview -->
    <div class="preview-block">
      <AnkiCardStack cards={ankiDemoCards} isActive={true} />
    </div>
  </div>
</div>

<style>
  :root {
    /* === PROJECT SECTION TYPOGRAPHY TUNABLES === */
    --project-title-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --project-title-font-weight: 300;
    --project-title-bold-weight: 600;
    --project-title-secondary-scale: 1;
    --project-summary-font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --project-summary-font-weight: 400;
    --project-summary-letter-spacing: 0;
  }

  .layout-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .content-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 max(calc(env(safe-area-inset-left, 0px) + 6vw), 3rem);
    gap: 4vw;
  }

  .text-block {
    flex: 1;
    max-width: 45%;
    z-index: 2;
  }

  h2 {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-family: var(--project-title-font-family);
    font-weight: var(--project-title-font-weight);
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
    line-height: 1.1;
    text-shadow: 0 3px 15px rgba(0,0,0,0.3);
  }

  h2 .headline-segment.bold {
    font-weight: var(--project-title-bold-weight);
  }

  h2 .headline-segment.secondary {
    font-size: calc(1em * var(--project-title-secondary-scale));
  }

  p {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    font-family: var(--project-summary-font-family);
    font-weight: var(--project-summary-font-weight);
    letter-spacing: var(--project-summary-letter-spacing);
    color: rgb(212 212 216);
    line-height: 1.8;
    margin-bottom: 2rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  /* ============ KEYBOARD-STYLE BUTTONS ============ */
  .keyboard-buttons-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--keyboard-key-base-size) * 0.25);
  }

  .button-row {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--keyboard-key-base-size) * 0.15);
    flex-wrap: wrap;
  }

  .keyboard-buttons-wrapper svg {
    width: 1.75rem;
    height: 1.75rem;
    color: var(--keyboard-contrast);
  }

  .key-position {
    perspective: 800px;
    transform: rotateY(0.05turn) rotateX(-0.1turn);
  }

  .key {
    position: relative;
    width: var(--keyboard-key-base-size);
    height: var(--keyboard-key-base-size);
    font-size: calc(var(--keyboard-key-base-size) / 2.2);
    border: 0.1rem solid var(--keyboard-background-3);
    border-radius: calc(var(--keyboard-key-base-size) * 0.2);
    background: var(--keyboard-background-2);
    color: var(--keyboard-contrast);
    box-shadow: 
      0.15rem 0.15rem 0 0 var(--keyboard-background-3),
      0.3rem 0.3rem 0 0 var(--keyboard-background-3),
      0.45rem 0.45rem 0 0 var(--keyboard-background-3),
      0.6rem 0.6rem 0 0 var(--keyboard-background-3);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transform-style: preserve-3d;
  }

  .key:hover {
    cursor: pointer;
    transform: translate(0.3rem, 0.3rem);
  }

  .key:active {
    cursor: grabbing;
    transform: translate(0.8rem, 0.8rem);
    box-shadow: 
      0.1rem 0.1rem 0 0 var(--keyboard-background-3),
      0.1rem 0.1rem 0 0 var(--keyboard-background-3),
      0.2rem 0.2rem 0 0 var(--keyboard-background-3),
      0.2rem 0.2rem 0 0 var(--keyboard-background-3);
    filter: blur(0.02rem);
  }

  /* Wide key for text buttons */
  .key.key-wide {
    width: auto;
    min-width: 120px;
    padding: 0 1rem;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    gap: 0.4rem;
  }

  .key.key-wide :global(svg) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .key-content {
    position: relative;
  }

  .key-content::after {
    position: absolute;
    content: "";
    width: 0;
    left: 0;
    bottom: -4px;
    background: var(--keyboard-contrast);
    height: 1.5px;
    transition: 0.3s ease-out;
  }

  .key:hover .key-content::after {
    width: 100%;
  }

  /* Primary button with cyan glow (Demo button) */
  .key.key-primary {
    border-color: #00E5FF;
    box-shadow: 
      0.15rem 0.15rem 0 0 #00B8D4,
      0.3rem 0.3rem 0 0 #00B8D4,
      0.45rem 0.45rem 0 0 #00B8D4,
      0.6rem 0.6rem 0 0 #00B8D4,
      0 0 20px rgba(0, 229, 255, 0.3),
      0 0 40px rgba(0, 229, 255, 0.15);
  }

  .key.key-primary:hover {
    box-shadow: 
      0.1rem 0.1rem 0 0 #00B8D4,
      0.2rem 0.2rem 0 0 #00B8D4,
      0.3rem 0.3rem 0 0 #00B8D4,
      0 0 25px rgba(0, 229, 255, 0.4),
      0 0 50px rgba(0, 229, 255, 0.2);
  }

  .key.key-primary:active {
    box-shadow: 
      0.1rem 0.1rem 0 0 #00B8D4,
      0.1rem 0.1rem 0 0 #00B8D4,
      0 0 15px rgba(0, 229, 255, 0.3);
  }

  .key.key-primary .key-content::after {
    background: #00E5FF;
  }

  /* Preview block */
  .preview-block {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    min-height: clamp(400px, 50vh, 520px);
  }

  /* ============ MOBILE LAYOUT ============ */
  .layout-container.mobile-layout {
    height: auto;
    min-height: 100vh;
  }

  .layout-container.mobile-layout .content-wrapper {
    flex-direction: column;
    padding: 1.5rem 4vw 3rem;
    gap: 2rem;
    justify-content: flex-start;
  }

  .layout-container.mobile-layout .text-block {
    max-width: none;
    width: 100%;
    text-align: left;
  }

  .layout-container.mobile-layout h2 {
    font-size: clamp(1.8rem, 8vw, 2.5rem);
    margin-bottom: 1rem;
  }

  .layout-container.mobile-layout p {
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
    line-height: 1.7;
  }

  .layout-container.mobile-layout .keyboard-buttons-wrapper {
    gap: 0.5rem;
    --keyboard-key-base-size: 3rem;
  }

  .layout-container.mobile-layout .button-row {
    justify-content: center;
    gap: 0.5rem;
  }

  .layout-container.mobile-layout .key.key-wide {
    min-width: auto;
    padding: 0 0.6rem;
    font-size: 10px;
    height: calc(var(--keyboard-key-base-size) * 0.85);
    letter-spacing: 0.02rem;
  }

  .layout-container.mobile-layout .key svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .layout-container.mobile-layout .preview-block {
    width: 100%;
    flex: none;
    min-height: clamp(340px, 90vw, 450px);
  }

  /* Media query fallback for non-JS scenarios */
  @media (max-width: 768px) {
    .layout-container {
      height: auto;
      min-height: 100vh;
    }

    .content-wrapper {
      flex-direction: column;
      padding: 1.5rem 4vw 3rem;
      gap: 2rem;
      justify-content: flex-start;
    }

    .text-block {
      max-width: none;
      width: 100%;
    }

    h2 {
      font-size: clamp(1.8rem, 8vw, 2.5rem);
      margin-bottom: 1rem;
    }

    p {
      font-size: 0.8rem;
      margin-bottom: 1.5rem;
    }

    .keyboard-buttons-wrapper {
      gap: 0.5rem;
      --keyboard-key-base-size: 3rem;
    }

    .button-row {
      justify-content: center;
      gap: 0.5rem;
    }

    .key.key-wide {
      min-width: auto;
      padding: 0 0.6rem;
      font-size: 10px;
      height: calc(var(--keyboard-key-base-size) * 0.85);
    }

    .key svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .preview-block {
      width: 100%;
      min-height: clamp(340px, 90vw, 450px);
    }
  }
</style>
