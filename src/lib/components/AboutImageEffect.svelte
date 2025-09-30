<!-- src/lib/components/AboutImageEffect.svelte -->
<script context="module" lang="ts">
  // This allows other components to know about and call them safely.
  export type AboutImageEffectInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
    initializeEffect?: () => Promise<void>;
    onTransitionComplete?: () => void;
    onUnload?: () => void; // <<< ADDED
  };
</script>

<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { gsap } from 'gsap';
    import { prefersReducedMotion as prm } from '$lib/stores/renderProfile';
  import { BloomEffect } from '$lib/three/BloomEffect';

  export let imageUrl: string;
  export let fadeInDelay: number = 250;
    // Mobile-optimized mode controls
    export let mobileMode: boolean = false;
    // Shift image slightly on mobile (percentage of image width; 50=center)
    export let mobileImageOffsetX: number = 58;
    export let mobileSymbolCount: number = 150; // reduced default number of active symbols
    export let mobileSymbolLifetime: { min: number; max: number } = { min: 4, max: 30 };
    export let mobileSymbolSize: { min: number; max: number } = { min: 12, max: 22 };
    // Debug logging
    export let debug: boolean = true;
            // Grouped configuration for easy editing (overrides above if provided)
            type MobileConfig = {
                count: number;
                lifetime: { min: number; max: number };
                size: { min: number; max: number };
                amplitude: { min: number; max: number };
                speedFactor: number; // multiplier on derived speed
                fadeStartScreenFraction: number; // when to start fading relative to screen width (e.g., 0.5)
                fadeStartLifetimeFraction: number; // when to start fading relative to particle lifetime (e.g., 0.5)
                fadeInDuration: number; // seconds
                fadeOutDuration: number; // seconds
                rampDuration: number; // seconds to reach full count
            };
            export let mobileConfig: Partial<MobileConfig> | undefined = undefined;

  let mainContainer: HTMLDivElement;
  let imageElement: HTMLImageElement;
  let particleOverlayElement: HTMLDivElement;

  let effectInstance: DigitalDecayEffect | null = null;
  let isInitialized = false;
    let fadeInTimeoutId: number | undefined;
        let _boundVisibilityHandler: (() => void) | null = null;
        let _boundFocusHandler: (() => void) | null = null;
        let _boundBlurHandler: (() => void) | null = null;
        let _boundPageShowHandler: ((e: Event) => void) | null = null;
        let _boundPageHideHandler: ((e: Event) => void) | null = null;

  // --- Component API ---

  export async function initializeEffect() {
    if (isInitialized) return;
    await tick();
    if (!particleOverlayElement || !imageElement) return;
                effectInstance = new DigitalDecayEffect(particleOverlayElement, imageElement, {
            mobileMode,
            mobileParams: {
                            count: Math.max(50, Math.floor(mobileConfig?.count ?? mobileSymbolCount)),
                            lifetime: mobileConfig?.lifetime ?? mobileSymbolLifetime,
                            size: mobileConfig?.size ?? mobileSymbolSize,
                            amplitude: mobileConfig?.amplitude ?? { min: 3, max: 10 },
                            speedFactor: mobileConfig?.speedFactor ?? 0.8,
                            fadeStartScreenFraction: mobileConfig?.fadeStartScreenFraction ?? 0.5,
                            fadeStartLifetimeFraction: mobileConfig?.fadeStartLifetimeFraction ?? 0.5,
                            fadeInDuration: mobileConfig?.fadeInDuration ?? 0.05,
                            fadeOutDuration: mobileConfig?.fadeOutDuration ?? 0.8,
                            rampDuration: mobileConfig?.rampDuration ?? 15.0
                        },
                        debug
        });
        if (debug) {
            console.log('[AboutImageEffect] initializeEffect()', {
                mobileMode,
                mobileSymbolCount,
                mobileSymbolLifetime,
                mobileSymbolSize,
                overlayEl: !!particleOverlayElement,
                imageEl: !!imageElement
            });
        }
    effectInstance.init();
    isInitialized = true;
  }

  export async function onEnterSection() {
    if (fadeInTimeoutId) clearTimeout(fadeInTimeoutId);

    fadeInTimeoutId = window.setTimeout(() => {
      gsap.to(mainContainer, { autoAlpha: 1, duration: 1.2, ease: 'power2.inOut' });
    }, fadeInDelay);
  }
  
    export function onTransitionComplete() {
          if (debug) console.log('[AboutImageEffect] onTransitionComplete() called. isInitialized:', isInitialized, 'hasInstance:', !!effectInstance);
          if ($prm) { if (debug) console.log('[AboutImageEffect] reduced-motion active, skipping start'); return; }
        if (!effectInstance && !isInitialized) {
            // Safety: ensure initialization happened even if preload didn't call it
            // Non-blocking; we'll poll next frame to start
            initializeEffect();
        }
        const kickoff = () => {
            if (effectInstance) {
            if (debug) console.log('[AboutImageEffect] kickoff start, calling onWindowResize() + start()');
                effectInstance.onWindowResize();
                effectInstance.start();
            } else {
                requestAnimationFrame(kickoff);
            }
        };
        kickoff();
    }

  export function onLeaveSection() {
    if (fadeInTimeoutId) clearTimeout(fadeInTimeoutId);
    
    if (effectInstance) {
      effectInstance.beginLeaveAnimation();
      gsap.killTweensOf(mainContainer);
      gsap.set(mainContainer, { autoAlpha: 0 });
    }
  }

  // --- NEW Component API Method ---
  export function onUnload() {
    if (effectInstance) {
      console.log('AboutImageEffect: Unloading and disposing Three.js resources.');
      effectInstance.dispose();
      effectInstance = null;
    }
    // Reset the initialization flag so it can be re-initialized if needed.
    isInitialized = false;
  }
  
  // --- Lifecycle ---

    onMount(() => {
        // Initialization is fully deferred to the Animation API.
        const handler = () => {
            if (document.visibilityState === 'visible') {
                console.log('[AboutImageEffect][COMP] visibilitychange -> visible: init + enter + kickoff');
                // Ensure the effect is initialized; prefer a hard restart to avoid stuck opacity/pipeline
                initializeEffect();
                onEnterSection();
                if (effectInstance && (effectInstance as any).restart) {
                    (effectInstance as any).restart();
                } else {
                    onTransitionComplete();
                }
            } else {
                console.log('[AboutImageEffect][COMP] visibilitychange -> hidden');
            }
        };
        document.addEventListener('visibilitychange', handler);
        _boundVisibilityHandler = handler;

        const onFocus = () => console.log('[AboutImageEffect][COMP] window focus');
        const onBlur = () => console.log('[AboutImageEffect][COMP] window blur');
        const onPageShow = (e: Event) => console.log('[AboutImageEffect][COMP] pageshow (persisted=', (e as any).persisted, ')');
        const onPageHide = (e: Event) => console.log('[AboutImageEffect][COMP] pagehide (persisted=', (e as any).persisted, ')');
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        window.addEventListener('pageshow', onPageShow);
        window.addEventListener('pagehide', onPageHide);
        _boundFocusHandler = onFocus;
        _boundBlurHandler = onBlur;
        _boundPageShowHandler = onPageShow;
        _boundPageHideHandler = onPageHide;
    });

  onDestroy(() => {
    // onDestroy should also ensure cleanup, acting as a final safeguard.
    onUnload();
    if (fadeInTimeoutId) clearTimeout(fadeInTimeoutId);
        if (_boundVisibilityHandler) {
            document.removeEventListener('visibilitychange', _boundVisibilityHandler);
            _boundVisibilityHandler = null;
        }
    if (_boundFocusHandler) { window.removeEventListener('focus', _boundFocusHandler); _boundFocusHandler = null; }
    if (_boundBlurHandler) { window.removeEventListener('blur', _boundBlurHandler); _boundBlurHandler = null; }
    if (_boundPageShowHandler) { window.removeEventListener('pageshow', _boundPageShowHandler); _boundPageShowHandler = null; }
    if (_boundPageHideHandler) { window.removeEventListener('pagehide', _boundPageHideHandler); _boundPageHideHandler = null; }
  });

  // --- DigitalDecayEffect Class ---

    interface GridCell { state: number; timer: number; opacity: number; }
    interface Particle { index: number; active: boolean; originalPos: THREE.Vector2; amplitude: number; timeOffset: number; speed: number; lifetime: number; age: number; size: number; color: THREE.Color; symbolIndex: number; gridCellIndex: number; lastSymbolChange: number; symbolChangeInterval: number; }
    // replaced with extended MobileParams below
                type MobileParams = {
                    count: number;
                    lifetime: { min: number; max: number };
                    size: { min: number; max: number };
                    amplitude: { min: number; max: number };
                    speedFactor: number;
                    fadeStartScreenFraction: number;
                    fadeStartLifetimeFraction: number;
                    fadeInDuration: number;
                    fadeOutDuration: number;
                    rampDuration: number;
                };

    class DigitalDecayEffect {
    private overlayContainer: HTMLElement;
    private image: HTMLImageElement;
    private clock: THREE.Clock | null = null;
    private animationFrameId: number | null = null;
    private debug = false;
    private frameCount = 0;
    
    private width = 0;   // CSS width of overlay container
    private height = 0;  // CSS height of overlay container
    private scene!: THREE.Scene;
    private camera!: THREE.OrthographicCamera;
    private renderer!: THREE.WebGLRenderer;
    private bloomEffect!: BloomEffect;

    // ================= Symbol Scaling System (hero parity) =================
    private readonly SCREEN_SIZES = {
        mobile: { maxWidth: 640 },
        tablet: { minWidth: 641, maxWidth: 900 },
        laptop: { minWidth: 901, maxWidth: 1200 },
        desktop: { minWidth: 1201, maxWidth: 1800 },
        large: { minWidth: 1801, maxWidth: 2900 },
        ultrawide: { minWidth: 2901 }
    } as const;
    private currentScreenSizeType: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'large' | 'ultrawide' = 'desktop';
    private readonly SCREEN_SYMBOL_RATIO: Record<'mobile' | 'tablet' | 'laptop' | 'desktop' | 'large' | 'ultrawide', number> = {
        mobile: 1.00,
        tablet: 1.00,
        laptop: 1.00,
        desktop: 1.04,
        large: 0.55,
        ultrawide: 1.12
    };
    private globalSymbolSizeMul: number = 1.0;
    private referenceContainerHeight: number | null = null;
    private lastMeasuredContainerHeight: number = 0;
    private baseSizeFactors: Float32Array | null = null;
    private lastSpawnComputedSize: number = 0;
    private lastSpawnRawBase: number = 0;
    private lastSpawnScreenRatio: number = 1;
    private lastSpawnScale: number = 1;
    // Density & GPU handling additions
    private enableDensityCompensation: boolean = true;
    private densityExponent: number = 0.45; // 0=no effect, 1=linear inverse DPR scaling
    private densityBaseDPR: number = 1.0; // reference baseline DPR
    private cachedDPR: number = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    private gpuPointSizeRange: [number, number] | null = null; // queried from GL
    private lastClampOccurred: boolean = false;

    // Internal resolution scaling (DRS)
    private internalScale: number = 1.0; // dynamic internal resolution scale
    private readonly MAX_INTERNAL_DIM = 1440; // cap for larger dimension
    private readonly SCALE_FLOOR = 0.6;
    private readonly SCALE_CEIL = 1.0;
    private frameTimes: number[] = [];
    private readonly FRAME_WINDOW = 50;
    private readonly HIGH_THRESHOLD = 19.5; // ms (≈51 FPS) -> downscale when slower than this
    private readonly LOW_THRESHOLD = 16.7;  // ms (≈60 FPS) -> upscale when consistently faster
    private scaleCooldown = 0;
    private readonly SCALE_COOLDOWN_FRAMES = 45;
    private avgFrameMs = 0;
    private metricsEnabled = false;
    private isPageVisible = true;
    private boundOnVisibilityChange = this.onVisibilityChange.bind(this);

    // Mobile mode
    private isMobileMode = false;
    private mobileParams: MobileParams = {
                count: 100,
                lifetime: { min: 1, max: 4 },
                size: { min: 12, max: 22 },
                amplitude: { min: 8, max: 18 },
                speedFactor: 0.8,
                fadeStartScreenFraction: 0.5,
                fadeStartLifetimeFraction: 0.5,
                fadeInDuration: 0.01,
                fadeOutDuration: 0.6,
                rampDuration: 10.0
            };
            private rampTimer = 0;

    // =========================================================================
    // == EFFECT PARAMETERS ==
    // =========================================================================
    
    // --- Grid & Spawning ---
    private readonly CELL_SIZE = 9;                         // Size of each grid cell over the image.
    private readonly BASE_CHANCE = 0.003;                   // Base probability for a cell to become active per frame.
    private readonly PROBABILITY_DECAY_FACTOR = 9;          // How quickly the spawn chance decreases from left to right. Higher value = more concentrated on the left.
    private readonly SPAWN_AREA_WIDTH = 0.5;                // Percentage of the image width (from the left) where particles can spawn.
    private readonly REGENERATION_TIME = 1.5;               // Seconds a grid cell must wait after a particle dies before it can spawn another.
    private readonly ONSET_DURATION = 5.0;      //Was 2            // Seconds over which the particle spawning ramps up to full intensity.
    
    // --- Particle Pool & Lifetime ---
    private readonly MAX_ACTIVE_PARTICLES = 2000;           // Maximum number of particles that can be on screen at once.
    private readonly PARTICLE_LIFETIME = { min: 4, max: 8 };// Min/max seconds a particle will exist.
    
    // --- Particle Movement & Appearance ---
    private readonly PARTICLE_SPEED = 0.25;                 // Base speed multiplier for horizontal travel.
    private readonly PARTICLE_SPEED_VARIATION = 0.5;        // Randomness in particle speed (e.g., 0.5 = +/- 50%).
    private readonly AMPLITUDE = { min: 90, max: 210 };     // Min/max horizontal distance a particle will travel over its lifetime.
    private readonly SYMBOL_CHANGE_INTERVAL = 2;          // Base time in seconds before a particle's symbol character changes.
    private readonly SYMBOL_CHANGE_VARIATION = 0.95;         // Randomness in the symbol change interval.
    
    // --- Particle Opacity & Fading ---
    private readonly PARTICLE_FADE_IN_DURATION = 0.4;       // Seconds for a particle to fade in.
    private readonly PARTICLE_FADEOUT_DURATION = 0.3;       // Seconds for a particle to fade out at the end of its life.
    private readonly PARTICLE_BASE_OPACITY = 0.9;           // The base opacity multiplied into the final particle color.
    private readonly BLACKOUT_FADE_DURATION = 0.35;         // Seconds for the black squares to fade in/out.
    
    // --- Visuals & Colors ---
    private readonly SYMBOLS = [ '日', '〇', 'ハ', 'ミ', 'ヒ', 'ウ', 'シ', 'ナ', 'モ', 'サ', 'ワ', 'ツ', 'オ', 'リ', 'ア', 'ホ', 'テ', 'マ', 'ケ', 'メ', 'エ', 'カ', 'キ', 'ム', 'ユ', 'ラ', 'セ', 'ネ', 'ヲ', 'イ', 'ク', 'コ', 'ソ', 'タ', 'チ', 'ト', 'ノ', 'フ', 'ヘ', 'ヤ', 'ヨ', 'ル', 'レ', 'ロ', '∆', 'δ', 'ε', 'ζ', 'η', 'θ', '∃', '∄', '∅', 'Д' ];
    private readonly SYMBOL_COLORS = [ new THREE.Color(0.0, 0.95, 0.05), new THREE.Color(0.0, 1.0, 0.0), new THREE.Color(0.3, 1.0, 0.3) ];
    private readonly BLACKOUT_COLOR = new THREE.Color('#09090b');
    
    // --- State & Control ---
    private STATE = { IDLE: 0, ACTIVE: 1, REGENERATING: 2 };
    private isFadingOut = false;
    private fadeOutTimer = 0;
    private onsetTimer = 0;
    private readonly SHUTDOWN_CLEANUP_DELAY = 1.0;          // Seconds after leave animation starts to fully stop the rAF loop.

    // =========================================================================
    
    private grid: { cols: number; rows: number; cells: GridCell[] } = { cols: 0, rows: 0, cells: [] };
    private particles: { pool: Particle[]; active: Map<number, Particle> } = { pool: [], active: new Map() };
    private imageRect: DOMRect | null = null;
    private particleSystem!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
    private blackoutMesh!: THREE.InstancedMesh;
    private symbolsTexture!: THREE.CanvasTexture;
    private boundOnWindowResize = this.onWindowResize.bind(this);

    constructor(overlayContainer: HTMLElement, image: HTMLImageElement, opts?: { mobileMode?: boolean; mobileParams?: MobileParams; debug?: boolean }) {
        this.overlayContainer = overlayContainer;
        this.image = image;
        if (opts?.mobileMode) this.isMobileMode = true;
        if (opts?.mobileParams) this.mobileParams = { ...this.mobileParams, ...opts.mobileParams };
        if (opts?.debug) this.debug = !!opts.debug;
    }

    private dlog(...args: any[]) { if (this.debug) console.log('[DigitalDecayEffect]', ...args); }

    public init(): void {
      if (this.image.complete && this.image.naturalHeight !== 0) {
          this.dlog('init(): image already loaded; setting up scene');
          this.setupSceneOnce();
      } else {
          this.dlog('init(): waiting for image load...');
          this.image.onload = () => { this.dlog('image onload fired'); this.setupSceneOnce(); };
      }
    }

    private setupSceneOnce(): void {
        this.setupScene();
    this.dlog('setupSceneOnce(): dimensions', { width: this.width, height: this.height });
    this.bloomEffect = new BloomEffect(this.renderer, this.scene, this.camera, this.width, this.height);
    this.createSymbolTexture();
    if (!this.isMobileMode) this.createBlackoutMesh();
    this.createParticleSystem();

    // Ensure point size is normalized to CSS pixels initially
    this.updatePointScale(this.width, this.height);
    this.dlog('setupSceneOnce(): point scale set, renderer size', this.renderer.getSize(new THREE.Vector2()).toArray(), 'css', { w: (this.renderer.domElement.style.width), h: (this.renderer.domElement.style.height) });

        if (this.bloomEffect && this.bloomEffect.composer) {
            this.bloomEffect.composer.render(0.01);
        }

    window.addEventListener('resize', this.boundOnWindowResize);
    document.addEventListener('visibilitychange', this.boundOnVisibilityChange);
        this.dlog('setupSceneOnce(): listeners attached, mobileMode=', this.isMobileMode);
    }
    
    private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
        if (!this.clock) return;
        if (!this.isMobileMode && !this.imageRect) return;
    this.frameCount++;

                const rawDt = this.clock.getDelta();
        // clamp large deltas (e.g., after tab becomes visible again) to avoid jumps
        const deltaTime = Math.min(rawDt, 0.05);
        if (this.isPageVisible) {
            const frameMs = deltaTime * 1000;
            this.frameTimes.push(frameMs);
            if (this.frameTimes.length > this.FRAME_WINDOW) this.frameTimes.shift();
            if (this.frameTimes.length === this.FRAME_WINDOW) {
                this.avgFrameMs = this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length;
                if (this.scaleCooldown > 0) this.scaleCooldown--;
                let changed = false;
                if (this.scaleCooldown === 0) {
                    if (this.avgFrameMs > this.HIGH_THRESHOLD && this.internalScale > this.SCALE_FLOOR) {
                        this.internalScale = Math.max(this.SCALE_FLOOR, +(this.internalScale - 0.1).toFixed(2));
                        changed = true;
                    } else if (this.avgFrameMs < this.LOW_THRESHOLD && this.internalScale < this.SCALE_CEIL) {
                        this.internalScale = Math.min(this.SCALE_CEIL, +(this.internalScale + 0.1).toFixed(2));
                        changed = true;
                    }
                    if (changed) { this.scaleCooldown = this.SCALE_COOLDOWN_FRAMES; this.onWindowResize(); }
                }
            }
        }

        if (this.isFadingOut) {
            this.fadeOutTimer += deltaTime;
            if (this.isMobileMode) this.updateParticlesMobile(deltaTime); else this.updateParticles(deltaTime);
            const fadeProgress = Math.max(0, 1.0 - (this.fadeOutTimer / this.PARTICLE_FADEOUT_DURATION));
            this.particleSystem.material.uniforms.globalOpacity.value = fadeProgress;

            if (this.fadeOutTimer >= this.SHUTDOWN_CLEANUP_DELAY) {
                this.stop();
                this.fullReset();
            }
                } else {
                        if (this.isMobileMode) {
                            // Ramp up desired active count over configured duration
                            this.rampTimer += deltaTime;
                            const rampProgress = Math.min(1, this.mobileParams.rampDuration > 0 ? this.rampTimer / this.mobileParams.rampDuration : 1);
                            const target = Math.floor(this.mobileParams.count * rampProgress);
                            if (this.particles.active.size < target) this.initMobileParticles(target);
                            // No emergency spawn; ramp controls initial population from zero
                            this.updateParticlesMobile(deltaTime);
                        } else {
                            this.updateGrid(deltaTime);
                            this.updateParticles(deltaTime);
                            this.updateBlackout();
                        }
        }

    this.bloomEffect.render(deltaTime);
    }

    public onWindowResize(): void {
    // Use overlay container CSS size to keep world-space alignment stable
    this.width = this.overlayContainer.clientWidth;
    this.height = this.overlayContainer.clientHeight;

        this.camera.left = -this.width / 2;
        this.camera.right = this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = -this.height / 2;
        this.camera.updateProjectionMatrix();

        // Compute capped internal size and apply internalScale; upscale via CSS
        const { targetW, targetH } = this.computeInternalSize(this.width, this.height);
        this.renderer.setSize(targetW, targetH, false);
        const canvas = this.renderer.domElement;
        canvas.style.width = this.width + 'px';
        canvas.style.height = this.height + 'px';
        if (this.bloomEffect) {
            this.bloomEffect.setSize(targetW, targetH);
        }

    // Update point-size scale so symbols remain visually consistent
        this.updatePointScale(this.width, this.height);
    if (!this.isMobileMode) this.setupGrid();
        // Update scaling anchors and recompute sizes
        this.lastMeasuredContainerHeight = this.height;
        if (this.referenceContainerHeight === null && this.height > 0) {
            this.referenceContainerHeight = this.height;
        }
        this.currentScreenSizeType = this.getScreenSizeType();
        this.updateSymbolSizesForScale();
        this.dlog('onWindowResize(): css', { w: this.width, h: this.height }, 'internal', { targetW, targetH }, 'pointScale', (this.particleSystem.material as THREE.ShaderMaterial).uniforms.uPointScale.value);
    }
    
    public dispose(): void {
      this.stop();
      window.removeEventListener('resize', this.boundOnWindowResize);
    document.removeEventListener('visibilitychange', this.boundOnVisibilityChange);
      if (this.bloomEffect) {
        this.bloomEffect.dispose();
      }
      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }
      if (this.scene) {
        // Basic scene disposal
      }
    }

    private onVisibilityChange(): void {
        const visible = document.visibilityState === 'visible';
        this.isPageVisible = visible;
        if (visible) {
            this.dlog('visibilitychange -> visible: resetting metrics, checking RAF/particles');
            // Reset performance metrics to avoid stale downscale decisions
            this.frameTimes = [];
            this.avgFrameMs = 0;
            // Add brief cooldown to prevent immediate scaling on resume
            this.scaleCooldown = Math.max(this.scaleCooldown, Math.floor(this.SCALE_COOLDOWN_FRAMES / 2));
            // Ensure sizes and grid are correct after tab return
            try { this.onWindowResize(); } catch {}
            // If loop stopped for any reason, restart it
            if (this.animationFrameId === null) {
                // Reinitialize particle state for a clean start
                this.fullReset();
                if (this.isMobileMode) {
                    this.resetAllParticles();
                    this.rampTimer = 0;
                }
                this.clock = new THREE.Clock();
                this.animate();
                this.dlog('visibilitychange -> visible: RAF restarted');
            } else {
                // If running but no particles are active, kick spawning
                if (this.isMobileMode) {
                    if (this.particles.active.size === 0) {
                        this.rampTimer = 0;
                        this.resetAllParticles();
                        // spawn a small initial batch to make it visible immediately
                        this.initMobileParticles(Math.min(20, this.mobileParams.count));
                        this.dlog('visibilitychange -> visible: mobile particles kickstarted');
                    }
                } else {
                    if (this.particles.active.size === 0) {
                        this.onsetTimer = 0;
                        this.resetBlackoutGrid();
                        // grid-based spawning will resume automatically in updateGrid
                        this.dlog('visibilitychange -> visible: grid reset; waiting for spawns');
                    }
                }
            }
            // Defensive: ensure no residual fade and compositor is primed
            this.isFadingOut = false;
            this.fadeOutTimer = 0;
            if (this.particleSystem) {
                (this.particleSystem.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = 1.0;
            }
            try { this.bloomEffect?.composer?.render(0.01); } catch {}
        } else {
            this.dlog('visibilitychange -> hidden: pausing perf sampling');
        }
    }

    public start(): void {
        if (this.animationFrameId === null) {
            this.fullReset();
            if (this.isMobileMode) {
                // Start empty on mobile and let ramp gradually spawn
                this.resetAllParticles();
                this.rampTimer = 0;
            }
            this.clock = new THREE.Clock();
            this.animate();
        }
    }
    
    public stop(): void {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        this.clock = null;
      }
    }

        // Force a clean restart of the loop and visual state
        public restart(): void {
            this.stop();
            this.fullReset();
            // Ensure fully opaque after resume
            if (this.particleSystem) {
                (this.particleSystem.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = 1.0;
            }
            this.clock = new THREE.Clock();
            this.animate();
            this.dlog('restart(): forced reset + RAF restart');
        }

    public beginLeaveAnimation(): void {
      if (!this.isFadingOut) {
        this.isFadingOut = true;
        this.fadeOutTimer = 0;
    if (!this.isMobileMode) this.resetBlackoutGrid();
      }
    }

    private setupScene(): void {
    // CSS size from overlay container
    this.width = this.overlayContainer.clientWidth;
    this.height = this.overlayContainer.clientHeight;
    this.scene = new THREE.Scene();
        
    this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 1, 1000);
        this.camera.position.z = 100;
        
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // Manual scaling: setPixelRatio(1) and setSize to internal target, CSS to overlay size
    this.renderer.setPixelRatio(1);
    const { targetW, targetH } = this.computeInternalSize(this.width, this.height);
    this.renderer.setSize(targetW, targetH, false);
    const canvas = this.renderer.domElement;
        // Accessibility: this canvas is purely decorative
        try {
            canvas.setAttribute('aria-hidden', 'true');
            canvas.setAttribute('role', 'presentation');
            canvas.setAttribute('tabindex', '-1');
        } catch {}
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.zIndex = '10';
    this.overlayContainer.appendChild(canvas);
    this.dlog('setupScene(): renderer appended. DOM canvas size', { w: canvas.style.width, h: canvas.style.height });
    }

    private fullReset(): void {
        this.isFadingOut = false;
        this.fadeOutTimer = 0;
        this.onsetTimer = 0;
        this.rampTimer = 0;
        if(this.particleSystem) {
            this.particleSystem.material.uniforms.globalOpacity.value = 1.0;
        }
    if (!this.isMobileMode) this.resetBlackoutGrid();
    // Always clear particles so mobile also deletes symbols on leave
    this.resetAllParticles();
    }

    // Compute internal render target dimensions with 1440p cap and internalScale
    private computeInternalSize(cssW: number, cssH: number): { targetW: number; targetH: number } {
        const aspect = cssW / Math.max(1, cssH);
        let targetW = cssW;
        let targetH = cssH;
        if (cssW >= cssH) {
            if (cssW > this.MAX_INTERNAL_DIM) { targetW = this.MAX_INTERNAL_DIM; targetH = Math.round(targetW / aspect); }
        } else {
            if (cssH > this.MAX_INTERNAL_DIM) { targetH = this.MAX_INTERNAL_DIM; targetW = Math.round(targetH * aspect); }
        }
        targetW = Math.max(1, Math.round(targetW * this.internalScale));
        targetH = Math.max(1, Math.round(targetH * this.internalScale));
        return { targetW, targetH };
    }

    // Keep point sprites' visual size stable under internal resolution scaling
    private updatePointScale(cssW: number, cssH: number): void {
        if (!this.particleSystem) return;
        const { targetW, targetH } = this.computeInternalSize(cssW, cssH);
        const scaleX = cssW / Math.max(1, targetW);
        const scaleY = cssH / Math.max(1, targetH);
        const pointScale = Math.min(scaleX, scaleY);
        (this.particleSystem.material as THREE.ShaderMaterial).uniforms.uPointScale.value = pointScale;
    }

    // Metrics
    public getMetrics() { return { internalScale: this.internalScale, avgFrameMs: this.avgFrameMs }; }
    public enableMetrics(v: boolean) { this.metricsEnabled = v; }

    private resetBlackoutGrid(): void {
        if (!this.blackoutMesh) return;
        for (const cell of this.grid.cells) {
            cell.state = this.STATE.IDLE;
            cell.timer = 0;
            cell.opacity = 0;
        }
        this.blackoutMesh.count = 0;
        this.blackoutMesh.instanceMatrix.needsUpdate = true;
        (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).needsUpdate = true;
    }

    private resetAllParticles(): void {
        if (!this.particleSystem) return;

        const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        
        this.particles.active.forEach(p => {
            p.active = false;
            positions[p.index * 3 + 1] = -99999; // Move off-screen
            this.particles.pool.push(p);
        });
        this.particles.active.clear();

        (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    private createSymbolTexture(): void {
        const symbolsPerRow = 8;
        const symbolSize = 64;
        const rows = Math.ceil(this.SYMBOLS.length / symbolsPerRow);
        
        const canvas = document.createElement('canvas');
        canvas.width = symbolsPerRow * symbolSize;
        canvas.height = rows * symbolSize;
        
        const ctx = canvas.getContext('2d')!;
        ctx.font = `bold ${symbolSize * 0.8}px monospace`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < this.SYMBOLS.length; i++) {
            const x = (i % symbolsPerRow) * symbolSize + symbolSize / 2;
            const y = Math.floor(i / symbolsPerRow) * symbolSize + symbolSize / 2;
            ctx.fillText(this.SYMBOLS[i], x, y);
        }
        
        this.symbolsTexture = new THREE.CanvasTexture(canvas);
    }

    private createBlackoutMesh(): void {
        const quadGeom = new THREE.PlaneGeometry(this.CELL_SIZE, this.CELL_SIZE);
        quadGeom.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(new Float32Array(200 * 200), 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: { color: { value: this.BLACKOUT_COLOR } },
            vertexShader: `
                attribute float instanceOpacity;
                varying float vOpacity;
                void main() {
                    vOpacity = instanceOpacity;
                    gl_Position = projectionMatrix * instanceMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vOpacity;
                void main() {
                    gl_FragColor = vec4(color, vOpacity);
                }
            `,
            transparent: true,
        });

        this.blackoutMesh = new THREE.InstancedMesh(quadGeom, material, 150 * 200);
        this.scene.add(this.blackoutMesh);
    }

    private createParticleSystem(): void {
    const geometry = new THREE.BufferGeometry();
        const cap = this.MAX_ACTIVE_PARTICLES;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(cap * 3), 3));
        geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(new Float32Array(cap * 3), 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('symbolIndex', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('particleOpacity', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));

    // Allocate intrinsic size factors array for unified scaling recomputation
    this.baseSizeFactors = new Float32Array(cap);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                symbolsTexture: { value: this.symbolsTexture },
                globalOpacity: { value: 1.0 },
                uPointScale: { value: 1.0 },
            },
            vertexShader: `
                attribute float size;
                attribute vec3 customColor;
                attribute float symbolIndex;
                attribute float particleOpacity;
                uniform float uPointScale;
                varying vec3 vColor;
                varying float vSymbolIndex;
                varying float vOpacity;
                void main() {
                    vColor = customColor;
                    vSymbolIndex = symbolIndex;
                    vOpacity = particleOpacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * uPointScale;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
        fragmentShader: `
                uniform sampler2D symbolsTexture;
                uniform float globalOpacity;
                varying vec3 vColor;
                varying float vSymbolIndex;
                varying float vOpacity;
                void main() {
                    float symbolsPerRow = 8.0;
                    float totalRows = ${Math.ceil(this.SYMBOLS.length / 8)}.0;
                    vec2 symbolCoord = gl_PointCoord;
                    symbolCoord.x = (symbolCoord.x + mod(vSymbolIndex, symbolsPerRow)) / symbolsPerRow;
                    symbolCoord.y = (symbolCoord.y + floor(vSymbolIndex / symbolsPerRow)) / totalRows;
                    
                    vec4 tex = texture2D(symbolsTexture, symbolCoord);
            if (tex.a < 0.2) discard;
                    
                    gl_FragColor = vec4(vColor, tex.a * vOpacity * ${this.PARTICLE_BASE_OPACITY} * globalOpacity);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);

                const symbolIndices = (geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
                for (let i = 0; i < cap; i++) {
            symbolIndices[i] = Math.floor(Math.random() * this.SYMBOLS.length);
        }
    (geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
                for (let i = 0; i < cap; i++) {
                    this.particles.pool.push({
                        index: i, active: false, originalPos: new THREE.Vector2(),
                        amplitude: 0, timeOffset: 0, speed: 0, lifetime: 0, age: 0, size: 0,
                        color: new THREE.Color(), symbolIndex: 0, gridCellIndex: -1,
                        lastSymbolChange: 0, symbolChangeInterval: 0
                    });
                }

                        // Mobile: don't pre-spawn here; ramp will handle spawning after start()
                        this.dlog('createParticleSystem(): created geometry + material. pool size:', this.particles.pool.length, 'active size:', this.particles.active.size, 'mobileMode:', this.isMobileMode);
    }

        // --- Mobile simplified particle spawning: float in from left ---
        private initMobileParticles(desiredCount?: number): void {
            const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            const opacities = (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).array as Float32Array;
            const colors = (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).array as Float32Array;
            const sizes = (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).array as Float32Array;
            const desired = Math.min((desiredCount ?? this.mobileParams.count), this.MAX_ACTIVE_PARTICLES);
            const current = this.particles.active.size;
            let toSpawn = Math.max(0, desired - current);
            if (toSpawn <= 0) { this.dlog('initMobileParticles(): current meets or exceeds desired; skipping', { current, desired }); return; }
            if (this.particles.pool.length <= 0) { this.dlog('initMobileParticles(): pool empty; cannot spawn'); return; }
            toSpawn = Math.min(toSpawn, this.particles.pool.length);
            const rightX = this.width / 2 - 2; // place just inside the screen for immediate visibility
            const unifiedScale = this.getUnifiedSymbolScale(); // retained for debug instrumentation
            for (let i = 0; i < toSpawn; i++) {
                const p = this.particles.pool.pop();
                if (!p) { this.dlog('initMobileParticles(): pool underflow at i=', i); break; }
                p.active = true;
                p.originalPos.set(rightX, (Math.random() - 0.5) * this.height);
                // assign lifetime first, then compute speed; start new particles at age 0
                p.lifetime = this.mobileParams.lifetime.min + Math.random() * (this.mobileParams.lifetime.max - this.mobileParams.lifetime.min);
                p.age = 0;
                // derive base speed so that by fadeStartLifetimeFraction of lifetime, particle reaches ~fadeStartScreenFraction of screen width
                const baseSpeed = (this.width * this.mobileParams.fadeStartScreenFraction) / Math.max(0.001, (p.lifetime * this.mobileParams.fadeStartLifetimeFraction));
                const jitter = 0.7 + Math.random() * 0.6; // ~±30%
                p.speed = baseSpeed * this.mobileParams.speedFactor * jitter; // px/sec
                p.amplitude = this.mobileParams.amplitude.min + Math.random() * (this.mobileParams.amplitude.max - this.mobileParams.amplitude.min); // vertical drift amplitude
                p.timeOffset = Math.random() * Math.PI * 2;
                const rawBase = this.mobileParams.size.min + Math.random() * (this.mobileParams.size.max - this.mobileParams.size.min);
                const { size: finalSize } = this.computeFinalSize(rawBase);
                p.size = finalSize;
                if (this.baseSizeFactors) this.baseSizeFactors[p.index] = rawBase;
                p.symbolIndex = Math.floor(Math.random() * this.SYMBOLS.length);
                p.color.copy(this.getSymbolColor());
                p.lastSymbolChange = 0;
                p.symbolChangeInterval = 1.5 + Math.random() * 1.5;
                this.particles.active.set(p.index, p);
                positions[p.index * 3] = p.originalPos.x;
                positions[p.index * 3 + 1] = p.originalPos.y;
                positions[p.index * 3 + 2] = 1;
                colors[p.index * 3] = p.color.r; colors[p.index * 3 + 1] = p.color.g; colors[p.index * 3 + 2] = p.color.b;
                sizes[p.index] = p.size;
                this.lastSpawnComputedSize = p.size;
                this.lastSpawnRawBase = rawBase;
                this.lastSpawnScreenRatio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType];
                this.lastSpawnScale = unifiedScale;
                opacities[p.index] = 0;
            }
            (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).needsUpdate = true;
            // removed noisy sampling log
        }

        private updateParticlesMobile(deltaTime: number): void {
            const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            const opacities = (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).array as Float32Array;
            const sizes = (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).array as Float32Array;
            const symbolIndices = (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
            let needsUpdate = false;

                        this.particles.active.forEach(p => {
                p.age += deltaTime;
                                // movement from right to left with slight vertical drift
                const x = p.originalPos.x - p.speed * p.age;
                const y = p.originalPos.y + Math.sin(p.age * 2 + p.timeOffset) * p.amplitude;
                positions[p.index * 3] = x;
                positions[p.index * 3 + 1] = y;
                positions[p.index * 3 + 2] = 1;

                                // fade in/out: combine lifetime and screen fraction triggers
                                const fadeIn = Math.min(1, p.age / Math.max(0.001, this.mobileParams.fadeInDuration));
                                const fadeStartLifetime = p.lifetime * this.mobileParams.fadeStartLifetimeFraction;
                                const distFromRight = (this.width / 2) - x;
                                const screenThreshold = this.width * this.mobileParams.fadeStartScreenFraction;
                                const fadeProgressScreen = this.mobileParams.fadeStartScreenFraction <= 0 ? 0 : Math.max(0, (distFromRight - screenThreshold) / Math.max(1, (this.width - screenThreshold)));
                                const hasPassedLifetimeFade = p.age >= fadeStartLifetime;
                                const shouldFade = hasPassedLifetimeFade || fadeProgressScreen > 0;
                                let fadeOut = 1;
                                if (shouldFade) {
                                    const tLife = (p.age - fadeStartLifetime) / Math.max(0.001, this.mobileParams.fadeOutDuration);
                                    const t = Math.max(0, Math.min(1, Math.max(tLife, fadeProgressScreen)));
                                    fadeOut = 1 - t;
                                }
                                opacities[p.index] = Math.min(fadeIn, fadeOut);

                // occasional symbol change
                p.lastSymbolChange += deltaTime;
                if (p.lastSymbolChange > p.symbolChangeInterval) {
                    symbolIndices[p.index] = Math.floor(Math.random() * this.SYMBOLS.length);
                    p.lastSymbolChange = 0;
                }

                // recycle when lifetime ends or out of bounds
                if (p.age >= p.lifetime || x < -this.width / 2 - 30) {
                    // reuse particle: respawn near left
                    p.active = true;
                    p.originalPos.set(this.width / 2 - 2, (Math.random() - 0.5) * this.height);
                    // assign lifetime first, then compute speed; reset age
                    p.lifetime = this.mobileParams.lifetime.min + Math.random() * (this.mobileParams.lifetime.max - this.mobileParams.lifetime.min);
                    p.age = 0;
                    const baseSpeed2 = (this.width * this.mobileParams.fadeStartScreenFraction) / Math.max(0.001, (p.lifetime * this.mobileParams.fadeStartLifetimeFraction));
                    const jitter2 = 0.7 + Math.random() * 0.6;
                    p.speed = baseSpeed2 * this.mobileParams.speedFactor * jitter2;
                    p.amplitude = this.mobileParams.amplitude.min + Math.random() * (this.mobileParams.amplitude.max - this.mobileParams.amplitude.min);
                    p.timeOffset = Math.random() * Math.PI * 2;
                    const rawBase2 = this.mobileParams.size.min + Math.random() * (this.mobileParams.size.max - this.mobileParams.size.min);
                    const unifiedScale2 = this.getUnifiedSymbolScale();
                    const { size: finalSize2 } = this.computeFinalSize(rawBase2);
                    p.size = finalSize2;
                    if (this.baseSizeFactors) this.baseSizeFactors[p.index] = rawBase2;
                    sizes[p.index] = p.size;
                    this.lastSpawnComputedSize = p.size;
                    this.lastSpawnRawBase = rawBase2;
                    this.lastSpawnScreenRatio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType];
                    this.lastSpawnScale = unifiedScale2;
                    opacities[p.index] = 0;
                    needsUpdate = true;
                } else {
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
                (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
                (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
                (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).needsUpdate = true;
                // removed periodic mobile sampling log
            }
        }

    private getSymbolColor(): THREE.Color {
        return this.SYMBOL_COLORS[Math.floor(Math.random() * this.SYMBOL_COLORS.length)];
    }

    private setupGrid(): void {
        this.imageRect = this.image.getBoundingClientRect();
        if (!this.imageRect || !this.imageRect.width) return;
        
        this.grid.cols = Math.floor(this.imageRect.width / this.CELL_SIZE);
        this.grid.rows = Math.floor(this.imageRect.height / this.CELL_SIZE);
        this.grid.cells = [];
        
        for (let i = 0; i < this.grid.cols * this.grid.rows; i++) {
            this.grid.cells.push({ state: this.STATE.IDLE, timer: 0, opacity: 0 });
        }
    }

    private updateGrid(deltaTime: number): void {
        if (this.particles.active.size >= this.MAX_ACTIVE_PARTICLES) return;
        
        this.onsetTimer = Math.min(this.ONSET_DURATION, this.onsetTimer + deltaTime);
        const onsetMultiplier = this.ONSET_DURATION > 0 ? this.onsetTimer / this.ONSET_DURATION : 1;
        const spawnCols = Math.floor(this.grid.cols * this.SPAWN_AREA_WIDTH);

        for (let i = 0; i < this.grid.cells.length; i++) {
            const cell = this.grid.cells[i];
            const fadeSpeed = deltaTime / this.BLACKOUT_FADE_DURATION;

            if (cell.state === this.STATE.ACTIVE) {
                cell.opacity = Math.min(1.0, cell.opacity + fadeSpeed);
            } else {
                cell.opacity = Math.max(0.0, cell.opacity - fadeSpeed);
            }

            if (cell.state === this.STATE.IDLE) {
                const col = i % this.grid.cols;
                if (col < spawnCols) {
                    const normalizedX = col / spawnCols;
                    const probability = this.BASE_CHANCE * onsetMultiplier * Math.exp(-this.PROBABILITY_DECAY_FACTOR * normalizedX) * deltaTime * 60;
                    if (Math.random() < probability) {
                        cell.state = this.STATE.ACTIVE;
                        this.spawnParticleForCell(i);
                    }
                }
            } else if (cell.state === this.STATE.REGENERATING) {
                cell.timer += deltaTime;
                if (cell.timer >= this.REGENERATION_TIME && cell.opacity <= 0) {
                    cell.state = this.STATE.IDLE;
                    cell.timer = 0;
                }
            }
        }
    }

    private spawnParticleForCell(cellIndex: number): void {
        if (this.particles.pool.length === 0 || !this.imageRect) return;

        const particle = this.particles.pool.pop()!;
        particle.active = true;
        particle.gridCellIndex = cellIndex;

        const col = cellIndex % this.grid.cols;
        const row = Math.floor(cellIndex / this.grid.cols);
        const xOnImage = col * this.CELL_SIZE + this.CELL_SIZE / 2;
        const yOnImage = row * this.CELL_SIZE + this.CELL_SIZE / 2;
        const x = this.imageRect.left + xOnImage - this.width / 2;
        const y = -(this.imageRect.top + yOnImage) + this.height / 2;
        
        particle.originalPos.set(x, y);
        const speedVariation = (Math.random() * 2 - 1) * this.PARTICLE_SPEED_VARIATION;
        particle.speed = this.PARTICLE_SPEED * (1 + speedVariation);
        particle.amplitude = this.AMPLITUDE.min + Math.random() * (this.AMPLITUDE.max - this.AMPLITUDE.min);
        particle.timeOffset = Math.random() * Math.PI * 2;
        particle.lifetime = this.PARTICLE_LIFETIME.min + Math.random() * (this.PARTICLE_LIFETIME.max - this.PARTICLE_LIFETIME.min);
        particle.age = 0;
    const rawBase = this.CELL_SIZE * (1 + 1.1 * Math.random());
    const unifiedScale = this.getUnifiedSymbolScale();
    const { size: finalSize } = this.computeFinalSize(rawBase);
    particle.size = finalSize;
    if (this.baseSizeFactors) this.baseSizeFactors[particle.index] = rawBase;
    this.lastSpawnComputedSize = particle.size;
    this.lastSpawnRawBase = rawBase;
    this.lastSpawnScreenRatio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType];
    this.lastSpawnScale = unifiedScale;
        particle.symbolIndex = Math.floor(Math.random() * this.SYMBOLS.length);
        particle.color.copy(this.getSymbolColor());
        particle.lastSymbolChange = 0;
        const variation = 1 + (Math.random() * 2 - 1) * this.SYMBOL_CHANGE_VARIATION;
        particle.symbolChangeInterval = this.SYMBOL_CHANGE_INTERVAL * variation;

        this.particles.active.set(particle.index, particle);
    }

    private updateParticles(deltaTime: number): void {
        const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        const opacities = (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).array as Float32Array;
        const colors = (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).array as Float32Array;
        const sizes = (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).array as Float32Array;
        const symbolIndices = (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
        let needsUpdate = false;

        this.particles.active.forEach(p => {
            p.age += deltaTime;
            if (p.age >= p.lifetime && !this.isFadingOut) {
                this.grid.cells[p.gridCellIndex].state = this.STATE.REGENERATING;
                p.active = false;
                this.particles.active.delete(p.index);
                this.particles.pool.push(p);
                positions[p.index * 3 + 1] = -99999;
                opacities[p.index] = 0;
                needsUpdate = true;
                return;
            }

            if (p.age < this.PARTICLE_FADE_IN_DURATION) {
                opacities[p.index] = p.age / this.PARTICLE_FADE_IN_DURATION;
            } else if (p.age > p.lifetime - this.PARTICLE_FADEOUT_DURATION && !this.isFadingOut) {
                opacities[p.index] = (p.lifetime - p.age) / this.PARTICLE_FADEOUT_DURATION;
            } else {
                opacities[p.index] = 1.0;
            }

            p.lastSymbolChange += deltaTime;
            if(p.lastSymbolChange > p.symbolChangeInterval) {
                symbolIndices[p.index] = Math.floor(Math.random() * this.SYMBOLS.length);
                p.lastSymbolChange = 0;
            }

            const offsetX = -p.age * p.speed * p.amplitude;
            const offsetY = Math.sin(p.age * 1.5 + p.timeOffset) * 10;

            positions[p.index * 3] = p.originalPos.x + offsetX;
            positions[p.index * 3 + 1] = p.originalPos.y + offsetY;
            positions[p.index * 3 + 2] = 1;
            p.color.toArray(colors, p.index * 3);
            sizes[p.index] = p.size;
            needsUpdate = true;
        });
        
        if (needsUpdate) {
            (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).needsUpdate = true;
        }
    }
    
    private updateBlackout(): void {
        if (!this.imageRect) return;

        const dummy = new THREE.Object3D();
        const opacities = (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).array as Float32Array;
        let instanceIdx = 0;

        for (let i = 0; i < this.grid.cells.length; i++) {
            if (this.grid.cells[i].opacity > 0) {
                const col = i % this.grid.cols;
                const row = Math.floor(i / this.grid.cols);
                const xOnImage = col * this.CELL_SIZE + this.CELL_SIZE / 2;
                const yOnImage = row * this.CELL_SIZE + this.CELL_SIZE / 2;
                const x = this.imageRect.left + xOnImage - this.width / 2;
                const y = -(this.imageRect.top + yOnImage) + this.height / 2;
                
                dummy.position.set(x, y, 0);
                dummy.updateMatrix();
                
                this.blackoutMesh.setMatrixAt(instanceIdx, dummy.matrix);
                opacities[instanceIdx] = this.grid.cells[i].opacity;
                instanceIdx++;
            }
        }
        
        this.blackoutMesh.count = instanceIdx;
        this.blackoutMesh.instanceMatrix.needsUpdate = true;
        (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).needsUpdate = true;
    }
    // ================= Symbol Scaling Helpers =================
    private getScreenSizeType(): typeof this.currentScreenSizeType {
        const width = this.overlayContainer.clientWidth;
        if (width <= this.SCREEN_SIZES.mobile.maxWidth) return 'mobile';
        if (width >= this.SCREEN_SIZES.tablet.minWidth && width <= this.SCREEN_SIZES.tablet.maxWidth) return 'tablet';
        if (width >= this.SCREEN_SIZES.laptop.minWidth && width <= this.SCREEN_SIZES.laptop.maxWidth) return 'laptop';
        if (width >= this.SCREEN_SIZES.desktop.minWidth && width <= this.SCREEN_SIZES.desktop.maxWidth) return 'desktop';
        if (width >= this.SCREEN_SIZES.large.minWidth && width <= this.SCREEN_SIZES.large.maxWidth) return 'large';
        return 'ultrawide';
    }
    private getAnchoredScale(): number {
        if (this.referenceContainerHeight && this.lastMeasuredContainerHeight > 0) {
            const raw = this.referenceContainerHeight / this.lastMeasuredContainerHeight; // inverse so if container grows symbols scale up
            return Math.min(1.6, Math.max(0.65, raw));
        }
        return 1.0;
    }
    private getUnifiedSymbolScale(): number {
        const anchored = this.getAnchoredScale();
        const ratio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType] ?? 1.0;
        this.cachedDPR = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
        // We want higher devicePixelRatio screens (denser) to allow modest enlargement so perceived size matches large low-DPI displays.
        // densityExponent controls curve aggression. Clamp overall effect.
        let densityScale = 1.0;
        if (this.enableDensityCompensation) {
            densityScale = Math.pow(this.cachedDPR / this.densityBaseDPR, this.densityExponent);
            densityScale = Math.min(1.8, Math.max(0.7, densityScale));
        }
        return anchored * ratio * this.globalSymbolSizeMul * densityScale;
    }
    private computeFinalSize(rawBase: number): { size: number; clamped: boolean } {
        const unifiedScale = this.getUnifiedSymbolScale();
        let size = rawBase * unifiedScale;
        let clamped = false;
        if (this.gpuPointSizeRange && this.particleSystem) {
            const maxPoint = this.gpuPointSizeRange[1];
            const uPointScale = (this.particleSystem.material as THREE.ShaderMaterial).uniforms.uPointScale.value || 1.0;
            const maxAttr = maxPoint / Math.max(0.0001, uPointScale);
            if (size > maxAttr) { size = maxAttr; clamped = true; }
        }
        this.lastClampOccurred = clamped;
        return { size, clamped };
    }
    private updateSymbolSizesForScale(): void {
        if (!this.particleSystem || !this.baseSizeFactors) return;
        const sizesAttr = this.particleSystem.geometry.getAttribute('size') as THREE.BufferAttribute;
        const sizes = sizesAttr.array as Float32Array;
        this.particles.active.forEach(p => {
            const base = this.baseSizeFactors![p.index];
            if (base > 0) {
                const { size } = this.computeFinalSize(base);
                p.size = size;
                sizes[p.index] = size;
            }
        });
        sizesAttr.needsUpdate = true;
    }
    public setGlobalSymbolSizeMultiplier(m: number) {
        this.globalSymbolSizeMul = Math.max(0.05, m);
        this.updateSymbolSizesForScale();
    }
    public setScreenSymbolRatio(screen: typeof this.currentScreenSizeType, ratio: number) {
        if (ratio > 0 && screen in this.SCREEN_SYMBOL_RATIO) {
            this.SCREEN_SYMBOL_RATIO[screen] = ratio;
            this.updateSymbolSizesForScale();
        }
    }
    public setDensityCompensation(enabled: boolean) {
        this.enableDensityCompensation = enabled;
        this.updateSymbolSizesForScale();
    }
    public setDensityExponent(exp: number) {
        this.densityExponent = Math.max(0, Math.min(2, exp));
        this.updateSymbolSizesForScale();
    }
    public getSymbolDebugInfo() {
        return {
            currentScreen: this.currentScreenSizeType,
            ratio: this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType],
            anchoredScale: this.getAnchoredScale(),
            unifiedScale: this.getUnifiedSymbolScale(),
            globalMul: this.globalSymbolSizeMul,
            dpr: this.cachedDPR,
            densityComp: this.enableDensityCompensation,
            densityExponent: this.densityExponent,
            gpuPointSizeRange: this.gpuPointSizeRange,
            lastClampOccurred: this.lastClampOccurred,
            lastSpawnComputedSize: this.lastSpawnComputedSize,
            lastSpawnRawBase: this.lastSpawnRawBase,
            lastSpawnScreenRatio: this.lastSpawnScreenRatio,
            lastSpawnScale: this.lastSpawnScale
        };
    }
  }

    // React to reduced-motion changes at runtime
    $: if ($prm) {
        // Stop visuals and ensure container is hidden
        if (effectInstance) {
            effectInstance.stop?.();
        }
        gsap.killTweensOf(mainContainer);
        gsap.set(mainContainer, { autoAlpha: 0 });
    }
</script>

<div class="main-container gpu-prewarm-target" bind:this={mainContainer}>
  <div class="image-pane">
    <img src={imageUrl} alt="Profile" bind:this={imageElement} style={`object-position: ${mobileMode ? mobileImageOffsetX : 50}% center;`}/>
  </div>
</div>

<div class="particle-overlay" bind:this={particleOverlayElement} aria-hidden="true" role="presentation"></div>

<style>
  .main-container {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    visibility: hidden;
    opacity: 0;
  }
  .image-pane {
    position: relative;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .image-pane img {
    height: 100vh;
    width: auto;
    display: block;
    object-fit: cover;
    object-position: center;
  }
    .particle-overlay {
        position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10;
    pointer-events: none;
  }

    /* Mobile: ensure full-screen centered background image */
    @media (max-width: 768px) {
        .main-container { visibility: visible; opacity: 1; }
        .image-pane { position: fixed; inset: 0; z-index: 0; display: flex; justify-content: center; align-items: center; }
        .image-pane img { width: 100vw; height: 100dvh; object-fit: cover; object-position: center; }
    }
</style>