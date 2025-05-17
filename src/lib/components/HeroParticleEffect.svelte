<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
  import { 
    Environment as ParticleEnvironment,
  } from '$lib/three/heroParticleLogic';
  import { preloadingStore, startLoadingTask } from '$lib/stores/preloadingStore';

  export let activeSectionIndex: number;
  
  const HERO_SECTION_LOGICAL_INDEX = 0; 
  const HERO_ASSETS_TASK_ID = 'heroEffectAssets';
  const HERO_INIT_TASK_ID = 'heroEffectInitialization'; // New task for Three.js setup

  let threeContainerElement: HTMLDivElement | undefined;

  let particleSystemInstance: ParticleEnvironment | null = null;
  let loadedFontAsset: Font | null = null;
  let loadedParticleTextureMap: THREE.Texture | null = null;
  
  let effectIsVisiblyRunning = false; 

  const FONT_ASSET_PATH = '/fonts/Inter_18pt_ExtraLight.json';
  const PARTICLE_TEXTURE_ASSET_PATH = 'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png';

  async function preloadEffectAssets() {
    const currentStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (currentStatus === 'loaded') {
        if (!loadedFontAsset || !loadedParticleTextureMap) {
            // Assets marked loaded globally, but not in this instance's vars yet.
            // Proceed to load; manager will use cache.
        } else {
            return; // Already loaded and local vars populated
        }
    }
    if (currentStatus === 'loading') return; 
    
    startLoadingTask(HERO_ASSETS_TASK_ID);

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'loaded');
    };
    manager.onError = (url) => {
      console.error(`HeroParticleEffect: Error loading asset: ${url}`);
      preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', `Failed to load ${url}`);
    };

    const fontLoader = new FontLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);

    try {
      loadedFontAsset = await fontLoader.loadAsync(FONT_ASSET_PATH);
      loadedParticleTextureMap = await textureLoader.loadAsync(PARTICLE_TEXTURE_ASSET_PATH);
    } catch (error) {
      console.error("HeroParticleEffect: Asset loading promise failed:", error);
      if (preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID) !== 'error') {
        preloadingStore.updateTaskStatus(HERO_ASSETS_TASK_ID, 'error', 'Asset loading promise failed.');
      }
    }
  }

  function initializeAndRunEffect() {
    const assetsStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
    if (assetsStatus !== 'loaded') {
      console.warn("HeroParticleEffect: Assets not loaded. Cannot initialize.", { assetsStatus });
      if (assetsStatus !== 'error' && preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) !== 'error') {
        // If assets are pending/loading, init task should also wait or reflect this dependency.
        // For simplicity, we let the reactive block re-trigger when assets are ready.
      }
      return;
    }

    if (!threeContainerElement || !loadedFontAsset || !loadedParticleTextureMap) {
      console.warn("HeroParticleEffect: Cannot initialize, DOM or asset prerequisites not met.");
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'DOM/asset prerequisites missing for init.');
      return;
    }

    if (particleSystemInstance) { 
      // Instance exists, resume it
      if (!particleSystemInstance.isLooping()) { 
        particleSystemInstance.startAnimationLoop();
      }
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.bindInteractionEvents();
        particleSystemInstance.createParticles.resetParticleState(); 
      }
      effectIsVisiblyRunning = true; 
      if (threeContainerElement) threeContainerElement.style.opacity = '1';
      // If resuming, init task should already be 'loaded'. If not, something is wrong.
      // For safety, ensure it's marked loaded if we successfully resume.
      if (preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) !== 'loaded') {
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
      }
      return;
    }

    // First-time initialization for this instance
    preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loading');
    try {
      particleSystemInstance = new ParticleEnvironment(loadedFontAsset, loadedParticleTextureMap, threeContainerElement);
      
      if (particleSystemInstance.createParticles) {
          particleSystemInstance.createParticles.bindInteractionEvents();
      }
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'loaded');
      effectIsVisiblyRunning = true; 

      if (threeContainerElement) {
          threeContainerElement.style.opacity = '0'; 
          requestAnimationFrame(() => { 
              if (threeContainerElement) threeContainerElement.style.opacity = '1';
          });
      }
    } catch (error) {
      console.error("HeroParticleEffect: Error during ParticleEnvironment instantiation:", error);
      preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Failed to instantiate ParticleEnvironment.');
      particleSystemInstance = null; // Ensure it's null on failure
    }
  }

  function pauseEffectLogic() {
    if (particleSystemInstance && effectIsVisiblyRunning) {
      particleSystemInstance.stopAnimationLoop();
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.unbindInteractionEvents();
        // console.log("HeroParticleEffect: Unbound interaction events on pause.");
      }
      effectIsVisiblyRunning = false; 
      if (threeContainerElement) threeContainerElement.style.opacity = '0'; 
      // console.log("HeroParticleEffect: Effect paused.");
    }
  }

  async function destroyEffectLogic() { // Made async
    if (particleSystemInstance) {
      // console.log("HeroParticleEffect: Attempting to destroy ParticleEnvironment...");
      effectIsVisiblyRunning = false; 
      if (threeContainerElement) {
        threeContainerElement.style.opacity = '0';
        // Wait for opacity transition to take effect visually before heavy dispose
        await new Promise(resolve => setTimeout(resolve, 500)); // Match opacity transition duration
      }
      
      if (particleSystemInstance.createParticles) {
        particleSystemInstance.createParticles.unbindInteractionEvents();
      }
      particleSystemInstance.stopAnimationLoop();
      
      particleSystemInstance.dispose();
      particleSystemInstance = null;
      // console.log("HeroParticleEffect: Effect destroyed.");
    }
    // Reset init task status as the instance is gone
    if (preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) === 'loaded' || preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) === 'error') {
        preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'pending');
    }
  }
  
  onMount(async () => {
    await tick(); 
    if (!preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID)) {
        preloadingStore.registerTask(HERO_ASSETS_TASK_ID, 'pending');
    }
    if (!preloadingStore.getTaskStatus(HERO_INIT_TASK_ID)) {
        preloadingStore.registerTask(HERO_INIT_TASK_ID, 'pending');
    }
  });

  onDestroy(async () => { // onDestroy can be async
    await destroyEffectLogic();
  });

  $: if (typeof activeSectionIndex === 'number' && typeof window !== 'undefined') { 
    (async () => { 
        while (!threeContainerElement) {
            await tick(); 
        }
        
        const currentAssetStatus = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
        const currentInitStatus = preloadingStore.getTaskStatus(HERO_INIT_TASK_ID);
        
        if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX) { 
            // Step 1: Handle asset loading
            if (currentAssetStatus !== 'loaded' && currentAssetStatus !== 'loading') { 
                await preloadEffectAssets(); 
            }
            
            // Re-check asset status after attempt
            const assetStatusAfterAttempt = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);

            if (assetStatusAfterAttempt === 'loaded') {
                // Step 2: Assets are loaded, handle initialization
                if (currentInitStatus !== 'loaded' && currentInitStatus !== 'loading') {
                    // If not initialized or currently initializing, call initializeAndRunEffect.
                    // This function handles setting init task to 'loading' then 'loaded'/'error'.
                    initializeAndRunEffect();
                } else if (currentInitStatus === 'loaded') {
                    // Assets and Init are both loaded.
                    // Ensure effect is running (e.g. if paused or instance was somehow lost).
                    if (!particleSystemInstance || !effectIsVisiblyRunning) {
                        initializeAndRunEffect(); // This will recreate or resume
                    } else {
                         // Already running, ensure events are bound (e.g. quick nav back)
                        initializeAndRunEffect(); // Handles resume logic
                    }
                }
                // If initStatus is 'loading', wait for it to complete.
                // If initStatus is 'error', something went wrong during init.
            } else if (assetStatusAfterAttempt === 'error') {
                console.error("HeroParticleEffect: Assets failed to load. Cannot display effect.");
                // If assets failed, init task should also reflect an error if it's not already errored.
                if (preloadingStore.getTaskStatus(HERO_INIT_TASK_ID) !== 'error') {
                    preloadingStore.updateTaskStatus(HERO_INIT_TASK_ID, 'error', 'Dependent asset loading failed.');
                }
            }
            // If assets are 'loading' or 'pending', do nothing more in this cycle; wait for status change.

        } else if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX + 1) { 
            if (particleSystemInstance && effectIsVisiblyRunning) {
                pauseEffectLogic();
            }
            // Preload assets if not already handled, for faster transition back to hero
            if (currentAssetStatus !== 'loaded' && currentAssetStatus !== 'loading') {
                await preloadEffectAssets(); // Non-blocking if not awaited, but better to await for pre-init
            }
            // Optional: Pre-initialize if assets are loaded but instance doesn't exist/init not done
            const assetStatusForPreInit = preloadingStore.getTaskStatus(HERO_ASSETS_TASK_ID);
            const initStatusForPreInit = preloadingStore.getTaskStatus(HERO_INIT_TASK_ID);

            if (assetStatusForPreInit === 'loaded' && initStatusForPreInit !== 'loaded' && initStatusForPreInit !== 'loading') {
                if (!particleSystemInstance) { // Only if no instance
                    // console.log("HeroParticleEffect: Pre-initializing instance then pausing (section 1).");
                    initializeAndRunEffect(); // This will handle HERO_INIT_TASK_ID
                    await tick(); 
                    // After init, if still on section 1, pause it.
                    if (activeSectionIndex === HERO_SECTION_LOGICAL_INDEX + 1 && particleSystemInstance) {
                       pauseEffectLogic(); 
                    }
                }
            }
        } else if (activeSectionIndex >= HERO_SECTION_LOGICAL_INDEX + 2) { 
            if (particleSystemInstance) {
                await destroyEffectLogic();
            }
        }
    })();
  }

</script>

<div 
  class="hero-particle-container" 
  bind:this={threeContainerElement} 
  id="magic"
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
    background-color: transparent; 
    opacity: 0; 
    transition: opacity 0.5s ease-in-out;
    overflow: hidden;
    pointer-events: auto; 
  }
</style>