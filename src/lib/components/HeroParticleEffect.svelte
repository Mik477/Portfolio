<!-- src/lib/components/HeroParticleEffect.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import *  as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { Environment as ParticleEnvironment } from '$lib/three/heroParticleLogic';
  import { preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';

  export let activeSectionIndex: number;
  export let isTransitioning: boolean = false;
  export let transitionDuration: number = 1.1;

  const HERO_SECTION_LOGICAL_INDEX = 0;
  const HERO_ASSETS_TASK_ID = 'heroEffectAssets';
  const HERO_INIT_TASK_ID = 'heroEffectInitialization';

  let threeContainerElement: HTMLDivElement | undefined;
  let particleSystemInstance: ParticleEnvironment | null = null;
  let loadedFontAsset: Font | null = null;
  let loadedParticleTextureMap: THREE.Texture | null = null;

  let isThreeJsLoopRunning = false;
  let areInteractionsBound = false;
  let animationLoopPauseTimeoutId: number | undefined;

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  async function _preloadAssets() {
    const currentStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (currentStatus === 'loaded' && loadedFontAsset && loadedParticleTextureMap) return;
    if (currentStatus === 'loading') return;

    startLoadingTask(HERO_ASSETS_TASK_ID);
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'loaded');
    manager.onError = (url) => {
      console.error(`HPE: Error loading asset: ${url}`);
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', `Failed to load ${url}`);
    };
    const fontLoader = new FontLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);
    try {
      loadedFontAsset = await fontLoader.loadAsync(FONT_ASSET_PATH);
      loadedParticleTextureMap = await textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH);
    } catch (error) {
      console.error("HPE: Asset loading promise failed:", error);
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'error') {
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', 'Asset loading failed.');
      }
    }
  }

  async function _ensureInstanceAndStartLoop() {
    if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded' || !loadedFontAsset || !loadedParticleTextureMap) {
      console.warn("HPE: Assets not ready for _ensureInstanceAndStartLoop.");
      await _preloadAssets(); 
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'loaded') return; 
    }
    if (!threeContainerElement) {
      console.warn("HPE: DOM container not ready for _ensureInstanceAndStartLoop.");
      return;
    }

    if (!particleSystemInstance) {
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loading');
      try {
        particleSystemInstance = new ParticleEnvironment(loadedFontAsset!, loadedParticleTextureMap!, threeContainerElement);
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
        console.log("HPE: Created new Three.js instance.");
      } catch (error) {
        console.error("HPE: Error during ParticleEnvironment instantiation:", error);
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Instantiation failed.');
        particleSystemInstance = null;
        return;
      }
    }

    if (particleSystemInstance && !particleSystemInstance.isLooping()) {
      particleSystemInstance.startAnimationLoop();
      isThreeJsLoopRunning = true;
      console.log("HPE: Three.js animation loop STARTED.");
    }
  }

  function _pauseThreeJsLoop() {
    if (particleSystemInstance && particleSystemInstance.isLooping()) {
      particleSystemInstance.stopAnimationLoop();
      isThreeJsLoopRunning = false;
      console.log("HPE: Three.js animation loop PAUSED.");
    }
  }

  function _bindInteractionEvents() {
    if (particleSystemInstance?.createParticles && !areInteractionsBound) {
      particleSystemInstance.createParticles.bindInteractionEvents();
      // Resetting state when interactions are bound ensures a fresh start for interaction
      particleSystemInstance.createParticles.resetParticleState(); 
      areInteractionsBound = true;
      console.log("HPE: Interaction events BOUND and particle state RESET.");
    }
  }

  function _unbindInteractionEvents() {
    if (particleSystemInstance?.createParticles && areInteractionsBound) {
      particleSystemInstance.createParticles.unbindInteractionEvents();
      particleSystemInstance.createParticles.neutralizeLastMousePosition(); 
      areInteractionsBound = false;
      console.log("HPE: Interaction events UNBOUND and mouse position neutralized.");
    }
  }

  function _fadeInVisuals() {
    if (threeContainerElement) threeContainerElement.style.opacity = '1';
  }

  function _fadeOutVisuals() {
    if (threeContainerElement) threeContainerElement.style.opacity = '0';
  }

  // --- EXPORTED METHODS FOR +page.svelte ---
  export async function onTransitionToHeroStart() {
    console.log("HPE Method: onTransitionToHeroStart triggered.");
    clearTimeout(animationLoopPauseTimeoutId); // Cancel any pending pause
    await _ensureInstanceAndStartLoop(); // Resume/start animation loop immediately
    _fadeInVisuals();                    // Start fading in visuals
    _unbindInteractionEvents();          // Ensure interactions are off during slide-in (mouse neutralized)
  }

  export function onTransitionToHeroComplete() {
    console.log("HPE Method: onTransitionToHeroComplete triggered.");
    // Animation loop should be running, visuals faded in.
    _bindInteractionEvents(); // Enable interactions now that Hero is fully in view (also resets particle state)
  }

  export function onTransitionFromHeroStart() {
    console.log("HPE Method: onTransitionFromHeroStart triggered.");
    _unbindInteractionEvents(); // Disable interactions immediately, neutralizes mouse
    _fadeOutVisuals();          // Start fading out visuals
                                // Animation loop continues during fade-out.
    clearTimeout(animationLoopPauseTimeoutId);
    animationLoopPauseTimeoutId = setTimeout(() => {
      // This block executes after `transitionDuration` (when visuals are faded out)
      if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
        console.log("HPE: Particle state RESET after fade out.");
      }
      _pauseThreeJsLoop();      // Then pause the animation loop
    }, transitionDuration * 1000);
  }

  async function _handleSettledState() {
    if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) {
      console.log("HPE: Settled on Hero.");
      clearTimeout(animationLoopPauseTimeoutId); // Cancel any pending pause
      await _ensureInstanceAndStartLoop();
      _fadeInVisuals();
      _bindInteractionEvents(); // Includes resetParticleState
    } else {
      console.log("HPE: Settled off Hero.");
      _unbindInteractionEvents(); // Neutralizes mouse
      _fadeOutVisuals();

      // If the loop is still running and no pause is scheduled, schedule one with reset.
      // This handles cases like initial load on a non-hero section or direct navigation.
      if (isThreeJsLoopRunning && particleSystemInstance?.isLooping() && !animationLoopPauseTimeoutId) {
        console.log("HPE (SettledOff): Scheduling deferred pause and reset.");
        animationLoopPauseTimeoutId = setTimeout(() => {
          if (particleSystemInstance?.createParticles) {
            particleSystemInstance.createParticles.resetParticleState();
            console.log("HPE (SettledOff): Particle state RESET.");
          }
          _pauseThreeJsLoop();
        }, transitionDuration * 1000); // Use transitionDuration for visual consistency with fade
      } else if (!isThreeJsLoopRunning && particleSystemInstance && particleSystemInstance.isLooping()) {
         // This case implies our isThreeJsLoopRunning flag is out of sync. Correct it and pause.
         console.warn("HPE (SettledOff): Loop running but flag was false. Pausing.");
        _pauseThreeJsLoop(); // Pause immediately
      } else if (!particleSystemInstance?.isLooping() && particleSystemInstance?.createParticles) {
        // Loop is already paused, but ensure state is reset if particles exist
        // This might be if it was paused without reset previously.
        console.log("HPE (SettledOff): Loop already paused. Ensuring particle state is reset.");
        particleSystemInstance.createParticles.resetParticleState();
      }
    }
  }

  let isMountedAndInitialized = false;
  onMount(async () => {
    await tick(); 
    if (!preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID)) {
      preloadingStore.registerTask(HERO_ASSETS_TASK_ID, 'pending');
    }
    if (!preloadingStore.getTaskStatus(HERO_INIT_TASK_ID)) {
      preloadingStore.registerTask(HERO_INIT_TASK_ID, 'pending');
    }
    await _preloadAssets();
    isMountedAndInitialized = true;

    if (!isTransitioning) {
        _handleSettledState();
    }
  });

  onDestroy(() => {
    clearTimeout(animationLoopPauseTimeoutId);
    _unbindInteractionEvents(); // Ensure mouse is neutralized
    // Ensure particle state is reset before final pause/dispose if instance exists
    if (particleSystemInstance?.createParticles) {
        particleSystemInstance.createParticles.resetParticleState();
    }
    _pauseThreeJsLoop(); // Ensure loop is stopped
    if (particleSystemInstance) {
      particleSystemInstance.dispose();
      particleSystemInstance = null;
      console.log("HPE: Three.js instance disposed.");
    }
  });

  $: if (isMountedAndInitialized && typeof activeSectionIndex === 'number') {
    if (!isTransitioning) {
        // This ensures that if activeSectionIndex changes directly (e.g. dev tools, future direct nav)
        // and we are NOT in a GSAP transition, the state is correctly handled.
        _handleSettledState();
    }
  }

</script>

<div
  class="hero-particle-container"
  bind:this={threeContainerElement}
  id="magic"
  style="opacity: 0; transition: opacity {transitionDuration}s ease-in-out;"
  >
  <!-- Three.js canvas will be appended here by heroParticleLogic.ts -->
</div>

<style>
  .hero-particle-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgb(9 9 11);
    overflow: hidden;
    pointer-events: auto;
  }
</style>