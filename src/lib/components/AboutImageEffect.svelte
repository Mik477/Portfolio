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
  export let particleSize: number = 0.60; // Default slightly smaller based on feedback

  let mainContainer: HTMLDivElement;
  let imageElement: HTMLImageElement;
  let particleOverlayElement: HTMLDivElement;

  let effectInstance: DigitalDecayEffect | null = null;
  let isInitialized = false;
    let initPromise: Promise<void> | null = null;
    let isDestroyed = false;
    let kickoffRafId: number | null = null;
    let kickoffToken = 0;
    let fadeInTimeoutId: number | undefined;
        let _boundVisibilityHandler: (() => void) | null = null;
        let _boundFocusHandler: (() => void) | null = null;
        let _boundBlurHandler: (() => void) | null = null;
        let _boundPageShowHandler: ((e: Event) => void) | null = null;
        let _boundPageHideHandler: ((e: Event) => void) | null = null;

    function cancelKickoff(): void {
        if (kickoffRafId !== null) {
            cancelAnimationFrame(kickoffRafId);
            kickoffRafId = null;
        }
        kickoffToken++;
    }

  // --- Component API ---

  export async function initializeEffect() {
        if (isInitialized) return;
        if (initPromise) return initPromise;

        initPromise = (async () => {
            await tick();
            if (isDestroyed) return;
            if (!particleOverlayElement || !imageElement) {
                // Elements not ready yet; abort initialization but allow retry
                initPromise = null;
                return;
            }

            const instance = new DigitalDecayEffect(particleOverlayElement, imageElement);
            instance.init();
            if (isDestroyed) {
                instance.dispose();
                return;
            }
            effectInstance = instance;
            isInitialized = true;
        })()
            .catch((error) => {
                try {
                    effectInstance?.dispose();
                } catch {}
                effectInstance = null;
                isInitialized = false;
                throw error;
            })
            .finally(() => {
                initPromise = null;
            });

        return initPromise;
  }

  export async function onEnterSection() {
    if (fadeInTimeoutId) clearTimeout(fadeInTimeoutId);

    fadeInTimeoutId = window.setTimeout(() => {
      gsap.to(mainContainer, { autoAlpha: 1, duration: 1.2, ease: 'power2.inOut' });
    }, fadeInDelay);
  }
  
    export function onTransitionComplete() {
        if ($prm) { return; }
        
        // CRITICAL: Gracefully handle case where effect isn't initialized
        // This prevents breaking section visibility
        if (!effectInstance) {
            console.warn('[AboutImageEffect] Effect instance not available during transition complete - skipping particle animation');
            cancelKickoff();
            return;
        }
        
        // CRITICAL: Ensure effect restarts cleanly on every re-entry
        // Stop any existing animation before restarting
        effectInstance.stop();
        
        cancelKickoff();
        const token = kickoffToken;

        // Effect is initialized, start it immediately
        const kickoff = () => {
            if (isDestroyed || token !== kickoffToken) return;
            if (effectInstance && effectInstance.isReady()) {
              // Ensure proper state reset before starting
              effectInstance.onWindowResize();
              effectInstance.start();
              kickoffRafId = null;
            } else {
              // Effect lost or became unready - abort
              console.warn('[AboutImageEffect] Effect became unavailable during kickoff');
              kickoffRafId = null;
            }
        };
        kickoff();
    }

  export function onLeaveSection() {
    if (fadeInTimeoutId) clearTimeout(fadeInTimeoutId);
        cancelKickoff();
    
    if (effectInstance) {
      effectInstance.beginLeaveAnimation();
      // If we are leaving, we should consider the effect "stopped" for the purpose of a future restart.
      // However, we don't dispose it yet.
    }

        gsap.killTweensOf(mainContainer);
        gsap.set(mainContainer, { autoAlpha: 0 });
  }

  // --- NEW Component API Method ---
  export function onUnload() {
        cancelKickoff();
        if (fadeInTimeoutId) {
            clearTimeout(fadeInTimeoutId);
            fadeInTimeoutId = undefined;
        }
        gsap.killTweensOf(mainContainer);
        gsap.set(mainContainer, { autoAlpha: 0 });

    if (effectInstance) {
      effectInstance.dispose();
      effectInstance = null;
    }
    // Reset the initialization flag so it can be re-initialized if needed.
    isInitialized = false;
        initPromise = null;
  }
  
  // --- Lifecycle ---

    onMount(() => {
        // Initialization is fully deferred to the Animation API.
        const handler = () => {
            if (document.visibilityState === 'visible') {
                // Ensure the effect is initialized; prefer a hard restart to avoid stuck opacity/pipeline
                initializeEffect();
                onEnterSection();
                if (effectInstance && (effectInstance as any).restart) {
                    (effectInstance as any).restart();
                } else {
                    onTransitionComplete();
                }
            }
        };
        document.addEventListener('visibilitychange', handler);
        _boundVisibilityHandler = handler;

        const onFocus = () => {};
        const onBlur = () => {};
        const onPageShow = (e: Event) => {};
        const onPageHide = (e: Event) => {};
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
        isDestroyed = true;
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
    interface Particle { index: number; active: boolean; originalPos: THREE.Vector2; amplitude: number; timeOffset: number; speed: number; lifetime: number; age: number; size: number; color: THREE.Color; symbolIndex: number; symbolToIndex: number; symbolBlend: number; gridCellIndex: number; lastSymbolChange: number; symbolChangeInterval: number; }

    class DigitalDecayEffect {
    private overlayContainer: HTMLElement;
    private image: HTMLImageElement;
    private clock: THREE.Clock | null = null;
    private animationFrameId: number | null = null;
    private frameCount = 0;
    private didSetupScene = false;
    private isDisposed = false;
    private isEffectReady = false;
    
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
    private densityExponent: number = 0.20; // Reduced based on feedback
    private densityBaseDPR: number = 1.0; // reference baseline DPR
    private cachedDPR: number = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    private gpuPointSizeRange: [number, number] | null = null; // queried from GL
    private lastClampOccurred: boolean = false;
    private dprQuery: MediaQueryList | null = null;
    private boundOnDPRChange = this.onDPRChange.bind(this);

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
    private readonly SYMBOL_CROSSFADE_DURATION = 0.14;      // Seconds to crossfade between glyphs on swap.
    private readonly BLACKOUT_FADE_DURATION = 0.35;         // Seconds for the black squares to fade in/out.
    
    // --- Visuals & Colors ---
    private readonly SYMBOLS = [ '日', '〇', 'ハ', 'ミ', 'ヒ', 'ウ', 'シ', 'ナ', 'モ', 'サ', 'ワ', 'ツ', 'オ', 'リ', 'ア', 'ホ', 'テ', 'マ', 'ケ', 'メ', 'エ', 'カ', 'キ', 'ム', 'ユ', 'ラ', 'セ', 'ネ', 'ヲ', 'イ', 'ク', 'コ', 'ソ', 'タ', 'チ', 'ト', 'ノ', 'フ', 'ヘ', 'ヤ', 'ヨ', 'ル', 'レ', 'ロ', '∆', 'δ', 'ε', 'ζ', 'η', 'θ', '∃', '∄', '∅', 'Д' ];
    // Runtime-filtered symbol set (some glyphs may not render depending on font/platform)
    private symbols: string[] = [...this.SYMBOLS];
    private readonly SYMBOLS_PER_ROW = 8;
    private readonly SYMBOL_TEX_SIZE = 64;
    private readonly SYMBOL_TEX_PADDING_PX = 2; // padding inside each cell to avoid bleed with linear filtering
    private symbolRows = Math.ceil(this.SYMBOLS.length / this.SYMBOLS_PER_ROW);
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

    constructor(overlayContainer: HTMLElement, image: HTMLImageElement) {
        this.overlayContainer = overlayContainer;
        this.image = image;
    }

    public init(): void {
      if (this.image.complete && this.image.naturalHeight !== 0) {
          this.setupSceneOnce();
      } else {
          this.image.onload = () => { this.setupSceneOnce(); };
      }
    }

    private setupSceneOnce(): void {
        if (this.didSetupScene || this.isDisposed) return;
        this.didSetupScene = true;

        this.setupScene();
    // Keep composer pixel ratio fixed so manual internal scaling stays consistent.
    // (If composer renders at DPR>1 while renderer is manually scaled, points can drop below 1px and flicker on some GPUs.)
    this.bloomEffect = new BloomEffect(this.renderer, this.scene, this.camera, this.width, this.height, { pixelRatio: 1 });
    this.createSymbolTexture();
    this.createBlackoutMesh();
    this.createParticleSystem();
    
    // Query GPU point-size limits (useful to diagnose disappearing points on some devices)
    try {
        const gl = this.renderer.getContext();
        const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as unknown;
        const min = Array.isArray(range) ? Number((range as any)[0]) : Number((range as any)[0]);
        const max = Array.isArray(range) ? Number((range as any)[1]) : Number((range as any)[1]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            this.gpuPointSizeRange = [min, max];
        }
    } catch {
        // ignore
    }

    // Ensure point size is normalized to CSS pixels initially
    this.updatePointScale(this.width, this.height);

        if (this.bloomEffect && this.bloomEffect.composer) {
            this.bloomEffect.composer.render(0.01);
        }

    window.addEventListener('resize', this.boundOnWindowResize);
    document.addEventListener('visibilitychange', this.boundOnVisibilityChange);
    this.monitorDPR();

        this.isEffectReady = true;
    }

    public isReady(): boolean {
        return this.isEffectReady && !this.isDisposed;
    }
    
    private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
        if (!this.clock) return;
        if (!this.imageRect) return;
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
            this.updateParticles(deltaTime);
            const fadeProgress = Math.max(0, 1.0 - (this.fadeOutTimer / this.PARTICLE_FADEOUT_DURATION));
            this.particleSystem.material.uniforms.globalOpacity.value = fadeProgress;

            if (this.fadeOutTimer >= this.SHUTDOWN_CLEANUP_DELAY) {
                this.stop();
                this.fullReset();
            }
                } else {
                            this.updateGrid(deltaTime);
                            this.updateParticles(deltaTime);
                            this.updateBlackout();
        }

    this.bloomEffect.render(deltaTime);
    }

    private monitorDPR(): void {
        if (typeof window === 'undefined') return;
        const dpr = window.devicePixelRatio;
        // Remove old listener if exists
        if (this.dprQuery) {
             try { this.dprQuery.removeEventListener('change', this.boundOnDPRChange); } catch (e) { this.dprQuery.removeListener(this.boundOnDPRChange); }
        }
        // Create new query for current DPR
        this.dprQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
        // When this query no longer matches, DPR has changed
        try { this.dprQuery.addEventListener('change', this.boundOnDPRChange); } catch (e) { this.dprQuery.addListener(this.boundOnDPRChange); }
    }

    private onDPRChange(): void {
        this.monitorDPR(); // Re-arm for next change
        this.onWindowResize(); // Trigger full update
    }

    public onWindowResize(): void {
    if (!this.isReady()) return;
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
    this.setupGrid();
        // Update scaling anchors and recompute sizes
        this.lastMeasuredContainerHeight = this.height;
        if (this.referenceContainerHeight === null && this.height > 0) {
            this.referenceContainerHeight = this.height;
        }
        this.currentScreenSizeType = this.getScreenSizeType();
        this.updateSymbolSizesForScale();
    }
    
    public dispose(): void {
            if (this.isDisposed) return;
            this.isDisposed = true;

      this.stop();
            try { this.image.onload = null; } catch {}
            window.removeEventListener('resize', this.boundOnWindowResize);
            document.removeEventListener('visibilitychange', this.boundOnVisibilityChange);
            if (this.dprQuery) {
                try { this.dprQuery.removeEventListener('change', this.boundOnDPRChange); } catch (e) { this.dprQuery.removeListener(this.boundOnDPRChange); }
                this.dprQuery = null;
            }

            const bloomEffect = (this as any).bloomEffect as BloomEffect | undefined;
            try { bloomEffect?.dispose(); } catch {}

            const particleSystem = (this as any).particleSystem as THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | undefined;
            if (particleSystem) {
                try { particleSystem.geometry.dispose(); } catch {}
                try { (particleSystem.material as unknown as { dispose?: () => void }).dispose?.(); } catch {}
            }

            const blackoutMesh = (this as any).blackoutMesh as THREE.InstancedMesh | undefined;
            if (blackoutMesh) {
                try { blackoutMesh.geometry.dispose(); } catch {}
                try { (blackoutMesh.material as unknown as { dispose?: () => void }).dispose?.(); } catch {}
            }

            const symbolsTexture = (this as any).symbolsTexture as THREE.Texture | undefined;
            try { symbolsTexture?.dispose(); } catch {}

            const renderer = (this as any).renderer as THREE.WebGLRenderer | undefined;
            if (renderer) {
                try { renderer.dispose(); } catch {}
                const canvas = renderer.domElement;
                try { canvas?.parentNode?.removeChild(canvas); } catch {}
            }
    }

    private onVisibilityChange(): void {
        const visible = document.visibilityState === 'visible';
        this.isPageVisible = visible;
        if (visible) {
            // Reset performance metrics to avoid stale downscale decisions
            this.frameTimes = [];
            this.avgFrameMs = 0;
            // Add brief cooldown to prevent immediate scaling on resume
            this.scaleCooldown = Math.max(this.scaleCooldown, Math.floor(this.SCALE_COOLDOWN_FRAMES / 2));
            // Ensure sizes and grid are correct after tab return
            try { this.onWindowResize(); } catch {}
            // If loop stopped for any reason, restart it
            if (this.animationFrameId === null) {
                // Resume without full reset to prevent visual jump
                this.clock = new THREE.Clock();
                this.animate();
            } else {
                // If running but no particles are active, kick spawning
                if (this.particles.active.size === 0) {
                    this.onsetTimer = 0;
                    this.resetBlackoutGrid();
                    // grid-based spawning will resume automatically in updateGrid
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
        }
    }

    public start(): void {
        if (!this.isReady()) return;
        if (this.animationFrameId === null) {
            this.fullReset();
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
        }

    public beginLeaveAnimation(): void {
      if (!this.isFadingOut) {
        this.isFadingOut = true;
        this.fadeOutTimer = 0;
                this.resetBlackoutGrid();
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
    }

    private fullReset(): void {
        this.isFadingOut = false;
        this.fadeOutTimer = 0;
        this.onsetTimer = 0;
        if(this.particleSystem) {
            this.particleSystem.material.uniforms.globalOpacity.value = 1.0;
        }
        this.resetBlackoutGrid();
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

    private getRandomSymbolIndex(): number {
        const count = this.symbols.length;
        if (count <= 0) {
            console.warn('[DigitalDecayEffect] getRandomSymbolIndex called with empty symbols array!');
            return 0;
        }
        const idx = Math.floor(Math.random() * count);
        // Safety clamp (should never trigger if logic is correct)
        return Math.max(0, Math.min(idx, count - 1));
    }
    
    // Safely clamp any symbol index to valid range
    private clampSymbolIndex(idx: number): number {
        const max = Math.max(0, this.symbols.length - 1);
        if (!Number.isFinite(idx) || idx < 0 || idx > max) {
            return Math.max(0, Math.min(Math.floor(idx) || 0, max));
        }
        return idx;
    }

    private mapAtlasAlphaLikeShader(alpha01: number): number {
        // Mirrors fragment shader mapping:
        // a = pow(smoothstep(0.02, 0.28, texA.a), 0.75)
        const edge0 = 0.02;
        const edge1 = 0.28;
        const t = Math.max(0, Math.min(1, (alpha01 - edge0) / Math.max(1e-6, (edge1 - edge0))));
        const smooth = t * t * (3 - 2 * t);
        return Math.pow(smooth, 0.75);
    }

    private measureGlyphVisibilityFromImageData(img: Uint8ClampedArray): {
        maxRaw: number;
        rawCount: number;
        meanRaw: number;
        maxMapped: number;
        mappedCount: number;
        meanMapped: number;
    } {
        let maxRaw = 0;
        let rawCount = 0;
        let sumRaw = 0;
        let maxMapped = 0;
        let mappedCount = 0;
        let sumMapped = 0;
        const pixelCount = Math.max(1, Math.floor(img.length / 4));

        for (let i = 3; i < img.length; i += 4) {
            const a01 = img[i] / 255;
            if (a01 > maxRaw) maxRaw = a01;
            if (a01 > 0.01) rawCount++;
            sumRaw += a01;
            const mapped = this.mapAtlasAlphaLikeShader(a01);
            if (mapped > maxMapped) maxMapped = mapped;
            if (mapped > 0.02) mappedCount++;
            sumMapped += mapped;
        }
        return {
            maxRaw,
            rawCount,
            meanRaw: sumRaw / pixelCount,
            maxMapped,
            mappedCount,
            meanMapped: sumMapped / pixelCount
        };
    }

    private testGlyphVisibility(
        symbol: string,
        testCtx: CanvasRenderingContext2D,
        symbolSize: number,
        padPx: number,
        smallTargets: Array<{ ctx: CanvasRenderingContext2D; size: number }>
    ) {
        // Draw with the exact style used for the atlas.
        testCtx.clearRect(0, 0, symbolSize, symbolSize);
        testCtx.fillStyle = '#FFFFFF';
        testCtx.textAlign = 'center';
        testCtx.textBaseline = 'middle';
        testCtx.lineWidth = Math.max(1, Math.floor(symbolSize * 0.04));
        testCtx.strokeStyle = 'rgba(255,255,255,0.35)';
        testCtx.strokeText(symbol, symbolSize / 2, symbolSize / 2);
        testCtx.fillText(symbol, symbolSize / 2, symbolSize / 2);

        // IMPORTANT: The shader clamps gl_PointCoord to [pad..1-pad],
        // so if a glyph only has ink near the cell edges, it may sample as empty.
        const innerSize = Math.max(1, symbolSize - padPx * 2);
        const fullImg = testCtx.getImageData(padPx, padPx, innerSize, innerSize).data;
        const full = this.measureGlyphVisibilityFromImageData(fullImg);

        // Downsample only the inner region to approximate small gl_PointSize cases.
        const smallBySize = new Map<number, ReturnType<typeof this.measureGlyphVisibilityFromImageData>>();
        for (const t of smallTargets) {
            t.ctx.clearRect(0, 0, t.size, t.size);
            t.ctx.imageSmoothingEnabled = true;
            t.ctx.drawImage(testCtx.canvas, padPx, padPx, innerSize, innerSize, 0, 0, t.size, t.size);
            const smallImg = t.ctx.getImageData(0, 0, t.size, t.size).data;
            smallBySize.set(t.size, this.measureGlyphVisibilityFromImageData(smallImg));
        }

        return { full, smallBySize };
    }

    private createSymbolTexture(): void {
        const symbolSize = this.SYMBOL_TEX_SIZE;
        const fontSize = Math.floor(symbolSize * 0.82);
        const fontStack = `900 ${fontSize}px ui-monospace, "Cascadia Mono", "Consolas", "Segoe UI Symbol", "Yu Gothic", "MS Gothic", monospace`;

        const pad = Math.max(0, Math.min(this.SYMBOL_TEX_PADDING_PX, Math.floor(symbolSize / 6)));

        // First pass: filter to symbols that would be *visible in the effect*.
        // This explicitly mirrors the shader's alpha mapping and sampling constraints.
        const testCanvas = document.createElement('canvas');
        testCanvas.width = symbolSize;
        testCanvas.height = symbolSize;
        const testCtx = testCanvas.getContext('2d', { willReadFrequently: true })!;
        testCtx.font = fontStack;

        // Downsample tests: cover the range where the flicker tends to happen (very small sprites).
        // Note: on some GPUs + internal scaling, effective on-screen point sprites can get tiny.
        const smallTargets: Array<{ ctx: CanvasRenderingContext2D; size: number }> = [];
        for (const sz of [14, 10, 8, 6, 4]) {
            const c = document.createElement('canvas');
            c.width = sz;
            c.height = sz;
            const ctx = c.getContext('2d', { willReadFrequently: true })!;
            smallTargets.push({ ctx, size: sz });
        }

        const renderable: string[] = [];
        const removed: Array<{
            glyph: string;
            reason: string;
            full: { maxRaw: number; rawCount: number; meanRaw: number; maxMapped: number; mappedCount: number; meanMapped: number };
            small: Array<{ size: number; maxRaw: number; rawCount: number; meanRaw: number; maxMapped: number; mappedCount: number; meanMapped: number }>;
        }> = [];
        for (const s of this.SYMBOLS) {
            const { full, smallBySize } = this.testGlyphVisibility(s, testCtx, symbolSize, pad, smallTargets);

            const fullCoverage = full.mappedCount / Math.max(1, (symbolSize - pad * 2) * (symbolSize - pad * 2));
            const fullOk = full.maxMapped >= 0.18 && full.meanMapped >= 0.010 && fullCoverage >= 0.006;

            const smallList: Array<{ size: number; maxRaw: number; rawCount: number; meanRaw: number; maxMapped: number; mappedCount: number; meanMapped: number }> = [];
            let allSmallOk = true;
            for (const [sz, m] of smallBySize.entries()) {
                const cov = m.mappedCount / Math.max(1, sz * sz);
                // Very strict at tiny sizes to eliminate “sometimes invisible” glyphs.
                // Thresholds are size-dependent because coverage collapses quickly when minified.
                let ok = true;
                if (sz >= 10) {
                    ok = m.maxMapped >= 0.10 && m.meanMapped >= 0.006 && cov >= 0.020;
                } else if (sz === 8) {
                    ok = m.maxMapped >= 0.12 && m.meanMapped >= 0.008 && cov >= 0.030;
                } else if (sz === 6) {
                    ok = m.maxMapped >= 0.15 && m.meanMapped >= 0.010 && cov >= 0.050;
                } else {
                    // 4x4 (or smaller): only keep glyphs that remain clearly visible.
                    ok = m.maxMapped >= 0.20 && m.meanMapped >= 0.015 && cov >= 0.100;
                }
                if (!ok) allSmallOk = false;
                smallList.push({ size: sz, ...m });
            }

            // Keep only if it passes full-res and *all* small-size checks.
            if (fullOk && allSmallOk) {
                renderable.push(s);
            } else {
                removed.push({
                    glyph: s,
                    reason: !fullOk ? 'too-weak-after-shader-map' : 'vanishes-at-small-size',
                    full,
                    small: smallList
                });
            }
        }
        // Defensive: never end up with an empty atlas.
        // If the strict visibility test removes everything, fall back to a tiny known-good set.
        this.symbols = renderable.length > 0 ? renderable : ['日', '〇', '∆'];
        this.symbolRows = Math.ceil(this.symbols.length / this.SYMBOLS_PER_ROW);

        const canvas = document.createElement('canvas');
        canvas.width = this.SYMBOLS_PER_ROW * symbolSize;
        canvas.height = this.symbolRows * symbolSize;

        const ctx = canvas.getContext('2d')!;
        ctx.font = fontStack;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < this.symbols.length; i++) {
            const cellX = (i % this.SYMBOLS_PER_ROW) * symbolSize;
            const cellY = Math.floor(i / this.SYMBOLS_PER_ROW) * symbolSize;
            const x = cellX + symbolSize / 2;
            const y = cellY + symbolSize / 2;

            ctx.clearRect(cellX, cellY, symbolSize, symbolSize);
            // Keep a clean border inside each cell to prevent sampling bleed across glyphs.
            if (pad > 0) {
                ctx.clearRect(cellX, cellY, symbolSize, pad);
                ctx.clearRect(cellX, cellY + symbolSize - pad, symbolSize, pad);
                ctx.clearRect(cellX, cellY, pad, symbolSize);
                ctx.clearRect(cellX + symbolSize - pad, cellY, pad, symbolSize);
            }
            // Slight stroke keeps very thin glyphs from disappearing under alpha thresholding.
            ctx.lineWidth = Math.max(1, Math.floor(symbolSize * 0.04));
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.strokeText(this.symbols[i], x, y);
            ctx.fillText(this.symbols[i], x, y);
        }

        this.symbolsTexture = new THREE.CanvasTexture(canvas);
        // IMPORTANT: Disable mipmaps for glyph atlas.
        // Mipmap alpha averaging can push thin glyphs below the discard threshold, causing
        // apparent "disappear/reappear" when symbols change or when point sizes vary.
        this.symbolsTexture.generateMipmaps = false;
        this.symbolsTexture.minFilter = THREE.LinearFilter;
        this.symbolsTexture.magFilter = THREE.LinearFilter;
        this.symbolsTexture.wrapS = THREE.ClampToEdgeWrapping;
        this.symbolsTexture.wrapT = THREE.ClampToEdgeWrapping;
        this.symbolsTexture.needsUpdate = true;
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

        // Prevent transparent depth artifacts and make compositing deterministic.
        material.depthWrite = false;
        material.depthTest = false;

        this.blackoutMesh = new THREE.InstancedMesh(quadGeom, material, 150 * 200);
        // Always render blackout behind particles.
        this.blackoutMesh.renderOrder = 0;
        this.scene.add(this.blackoutMesh);
    }

    private createParticleSystem(): void {
    const geometry = new THREE.BufferGeometry();
        const cap = this.MAX_ACTIVE_PARTICLES;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(cap * 3), 3));
        geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(new Float32Array(cap * 3), 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('symbolIndex', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('symbolIndex2', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('symbolMix', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));
        geometry.setAttribute('particleOpacity', new THREE.Float32BufferAttribute(new Float32Array(cap), 1));

    // Allocate intrinsic size factors array for unified scaling recomputation
    this.baseSizeFactors = new Float32Array(cap);

    // Track previous per-particle opacity to detect re-brightening/blink patterns
    this.lastParticleOpacity = new Float32Array(cap);

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
                attribute float symbolIndex2;
                attribute float symbolMix;
                attribute float particleOpacity;
                uniform float uPointScale;
                varying vec3 vColor;
                varying float vSymbolIndex;
                varying float vSymbolIndex2;
                varying float vSymbolMix;
                varying float vOpacity;
                void main() {
                    vColor = customColor;
                    vSymbolIndex = symbolIndex;
                    vSymbolIndex2 = symbolIndex2;
                    vSymbolMix = symbolMix;
                    vOpacity = particleOpacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Prevent driver-dependent disappearance when point sprites drop below ~1px.
                    gl_PointSize = max(1.0, size * uPointScale);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
        fragmentShader: `
                uniform sampler2D symbolsTexture;
                uniform float globalOpacity;
                varying vec3 vColor;
                varying float vSymbolIndex;
                varying float vSymbolIndex2;
                varying float vSymbolMix;
                varying float vOpacity;
                void main() {
                    float symbolsPerRow = ${this.SYMBOLS_PER_ROW}.0;
                    float totalRows = ${Math.max(1, this.symbolRows)}.0;
                    float maxValidIndex = ${Math.max(0, this.symbols.length - 1)}.0;
                    
                    // Clamp indices to valid range to prevent sampling empty atlas cells
                    float sIdxA = clamp(floor(vSymbolIndex + 0.5), 0.0, maxValidIndex);
                    float sIdxB = clamp(floor(vSymbolIndex2 + 0.5), 0.0, maxValidIndex);
                    
                    float pad = ${this.SYMBOL_TEX_PADDING_PX}.0 / ${this.SYMBOL_TEX_SIZE}.0;
                    vec2 local = clamp(gl_PointCoord, vec2(pad), vec2(1.0 - pad));
                    
                    // Compute atlas UV for symbol A
                    float colA = mod(sIdxA, symbolsPerRow);
                    float rowA = floor(sIdxA / symbolsPerRow);
                    
                    // CRITICAL: Canvas draws row 0 at TOP (y=0), but WebGL texture has V=0 at BOTTOM.
                    // We need to flip the row: row 0 should sample from TOP of texture (high V).
                    // With totalRows rows, row 0 should map to V = (totalRows-1)/totalRows to 1.0
                    float flippedRowA = (totalRows - 1.0) - rowA;
                    vec2 coordA = vec2(
                        (local.x + colA) / symbolsPerRow,
                        (local.y + flippedRowA) / totalRows
                    );
                    
                    // Compute atlas UV for symbol B
                    float colB = mod(sIdxB, symbolsPerRow);
                    float rowB = floor(sIdxB / symbolsPerRow);
                    float flippedRowB = (totalRows - 1.0) - rowB;
                    vec2 coordB = vec2(
                        (local.x + colB) / symbolsPerRow,
                        (local.y + flippedRowB) / totalRows
                    );

                    vec4 texA = texture2D(symbolsTexture, coordA);
                    vec4 texB = texture2D(symbolsTexture, coordB);
                    
                    // Smooth alpha to prevent thin glyphs from vanishing
                    float aA = smoothstep(0.02, 0.28, texA.a);
                    float aB = smoothstep(0.02, 0.28, texB.a);
                    aA = pow(aA, 0.75);
                    aB = pow(aB, 0.75);
                    
                    float mixT = smoothstep(0.0, 1.0, clamp(vSymbolMix, 0.0, 1.0));
                    float a = mix(aA, aB, mixT);
                    
                    // Final output
                    vec3 finalColor = vColor;
                    float finalAlpha = a * vOpacity * ${this.PARTICLE_BASE_OPACITY} * globalOpacity;
                    
                    // Discard fully transparent pixels
                    if (finalAlpha < 0.01) discard;
                    
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });

        this.particleSystem = new THREE.Points(geometry, material);
        // Always render particles on top of blackout.
        this.particleSystem.renderOrder = 1;
        this.scene.add(this.particleSystem);

                const symbolIndices = (geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
                const symbolIndices2 = (geometry.attributes.symbolIndex2 as THREE.BufferAttribute).array as Float32Array;
                const symbolMix = (geometry.attributes.symbolMix as THREE.BufferAttribute).array as Float32Array;
                for (let i = 0; i < cap; i++) {
                    const s = this.getRandomSymbolIndex();
                    symbolIndices[i] = s;
                    symbolIndices2[i] = s;
                    symbolMix[i] = 0;
                }
                (geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
                (geometry.attributes.symbolIndex2 as THREE.BufferAttribute).needsUpdate = true;
                (geometry.attributes.symbolMix as THREE.BufferAttribute).needsUpdate = true;
                for (let i = 0; i < cap; i++) {
                    this.particles.pool.push({
                        index: i, active: false, originalPos: new THREE.Vector2(),
                        amplitude: 0, timeOffset: 0, speed: 0, lifetime: 0, age: 0, size: 0,
                        color: new THREE.Color(), symbolIndex: 0, symbolToIndex: 0, symbolBlend: 0, gridCellIndex: -1,
                        lastSymbolChange: 0, symbolChangeInterval: 0
                    });
                }
    }

    private getSymbolColor(): THREE.Color {
        return this.SYMBOL_COLORS[Math.floor(Math.random() * this.SYMBOL_COLORS.length)];
    }

    private setupGrid(): void {
        this.imageRect = this.image.getBoundingClientRect();
        if (!this.imageRect || !this.imageRect.width) return;
        
        const newCols = Math.floor(this.imageRect.width / this.CELL_SIZE);
        const newRows = Math.floor(this.imageRect.height / this.CELL_SIZE);

        // If grid dimensions match, preserve state to avoid visual reset on minor layout shifts or DPR changes
        if (newCols === this.grid.cols && newRows === this.grid.rows && this.grid.cells.length > 0) {
            return;
        }

        this.grid.cols = newCols;
        this.grid.rows = newRows;
        this.grid.cells = [];
        
        for (let i = 0; i < this.grid.cols * this.grid.rows; i++) {
            this.grid.cells.push({ state: this.STATE.IDLE, timer: 0, opacity: 0 });
        }
        // Grid structure changed, so existing particle cell indices are invalid.
        this.resetAllParticles();
    }

    private updateGrid(deltaTime: number): void {
        if (this.particles.active.size >= this.MAX_ACTIVE_PARTICLES) return;
        
        this.onsetTimer = Math.min(this.ONSET_DURATION, this.onsetTimer + deltaTime);
        const onsetMultiplier = this.ONSET_DURATION > 0 ? this.onsetTimer / this.ONSET_DURATION : 1;
        const spawnCols = Math.floor(this.grid.cols * this.SPAWN_AREA_WIDTH);

        for (let i = 0; i < this.grid.cells.length; i++) {
            const cell = this.grid.cells[i];
            const fadeSpeed = deltaTime / this.BLACKOUT_FADE_DURATION;

            if (cell.state === this.STATE.IDLE) {
                const col = i % this.grid.cols;
                if (col < spawnCols) {
                    const normalizedX = col / spawnCols;
                    const probability = this.BASE_CHANCE * onsetMultiplier * Math.exp(-this.PROBABILITY_DECAY_FACTOR * normalizedX) * deltaTime * 60;
                    if (Math.random() < probability) {
                        cell.state = this.STATE.ACTIVE;
                        cell.timer = 0;
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

            // Apply opacity AFTER state changes so newly activated cells render a blackout square
            // before/with the particle spawn (prevents "symbol without square" frames).
            if (cell.state === this.STATE.ACTIVE) {
                cell.opacity = Math.min(1.0, cell.opacity + fadeSpeed);
            } else {
                cell.opacity = Math.max(0.0, cell.opacity - fadeSpeed);
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
        particle.symbolIndex = this.getRandomSymbolIndex();
        particle.symbolToIndex = particle.symbolIndex;
        particle.symbolBlend = 0;
        particle.color.copy(this.getSymbolColor());
        particle.lastSymbolChange = 0;
        const variation = 1 + (Math.random() * 2 - 1) * this.SYMBOL_CHANGE_VARIATION;
        particle.symbolChangeInterval = this.SYMBOL_CHANGE_INTERVAL * variation;

        // Apply glyph attributes immediately so the particle doesn't render with stale indices.
        try {
            const geom = this.particleSystem.geometry;
            const a1 = (geom.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
            const a2 = (geom.attributes.symbolIndex2 as THREE.BufferAttribute).array as Float32Array;
            const mix = (geom.attributes.symbolMix as THREE.BufferAttribute).array as Float32Array;
            a1[particle.index] = particle.symbolIndex;
            a2[particle.index] = particle.symbolIndex;
            mix[particle.index] = 0;
            (geom.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
            (geom.attributes.symbolIndex2 as THREE.BufferAttribute).needsUpdate = true;
            (geom.attributes.symbolMix as THREE.BufferAttribute).needsUpdate = true;
        } catch {
            // ignore
        }

        this.particles.active.set(particle.index, particle);
    }

    private updateParticles(deltaTime: number): void {
        const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        const opacities = (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).array as Float32Array;
        const colors = (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).array as Float32Array;
        const sizes = (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).array as Float32Array;
        const symbolIndices = (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array;
        const symbolIndices2 = (this.particleSystem.geometry.attributes.symbolIndex2 as THREE.BufferAttribute).array as Float32Array;
        const symbolMix = (this.particleSystem.geometry.attributes.symbolMix as THREE.BufferAttribute).array as Float32Array;
        let needsUpdate = false;

        this.particles.active.forEach(p => {
            p.age += deltaTime;
            if (p.age >= p.lifetime && !this.isFadingOut) {
                this.grid.cells[p.gridCellIndex].state = this.STATE.REGENERATING;
                p.active = false;
                this.particles.active.delete(p.index);
                this.particles.pool.push(p);
                // Fully clear this particle's buffer state to prevent any stale rendering
                positions[p.index * 3 + 1] = -99999;
                opacities[p.index] = 0;
                sizes[p.index] = 0;
                symbolIndices[p.index] = 0;
                symbolIndices2[p.index] = 0;
                symbolMix[p.index] = 0;
                needsUpdate = true;
                return;
            }

            const fadeInDur = Math.min(this.PARTICLE_FADE_IN_DURATION, this.BLACKOUT_FADE_DURATION);
            const isFadingIn = p.age < fadeInDur;
            const isFadingOut = !this.isFadingOut && (p.age > p.lifetime - this.PARTICLE_FADEOUT_DURATION);
            let nextOpacity: number;
            if (isFadingIn) {
                nextOpacity = p.age / Math.max(0.0001, fadeInDur);
            } else if (isFadingOut) {
                nextOpacity = (p.lifetime - p.age) / this.PARTICLE_FADEOUT_DURATION;
            } else {
                nextOpacity = 1.0;
            }

            opacities[p.index] = nextOpacity;

            // Symbol swap logic
            p.lastSymbolChange += deltaTime;
            if (p.lastSymbolChange > p.symbolChangeInterval) {
                // Avoid symbol swaps while fading in/out to prevent visible blinking.
                const allowSwap = !isFadingIn && !isFadingOut && opacities[p.index] >= 0.999;
                if (allowSwap) {
                    // Start a short crossfade instead of an instantaneous swap.
                    if (p.symbolBlend <= 0) {
                        const s = this.getRandomSymbolIndex();
                        if (s !== p.symbolIndex) {
                            p.symbolToIndex = s;
                            p.symbolBlend = 0.0001;
                        }
                        p.lastSymbolChange = 0;
                    }
                } else {
                    // Keep at threshold so it swaps as soon as safe.
                    p.lastSymbolChange = p.symbolChangeInterval;
                }
            }

            // Advance crossfade if active.
            if (p.symbolBlend > 0) {
                p.symbolBlend = Math.min(1, p.symbolBlend + deltaTime / Math.max(0.0001, this.SYMBOL_CROSSFADE_DURATION));
                if (p.symbolBlend >= 1) {
                    // Crossfade complete: commit the new symbol
                    p.symbolIndex = p.symbolToIndex;
                    p.symbolBlend = 0;
                }
            }
            
            // CRITICAL: Always write symbol buffer state every frame to prevent stale/inconsistent values.
            // When not crossfading (symbolBlend=0), both indices show the same symbol and mix=0.
            // When crossfading, indices show old→new and mix interpolates.
            // Always clamp indices to valid range to prevent sampling empty atlas cells.
            const safeSymbolIndex = this.clampSymbolIndex(p.symbolIndex);
            const safeSymbolToIndex = this.clampSymbolIndex(p.symbolToIndex);
            
            if (p.symbolBlend > 0) {
                symbolIndices[p.index] = safeSymbolIndex;      // "from" symbol
                symbolIndices2[p.index] = safeSymbolToIndex;   // "to" symbol
                symbolMix[p.index] = p.symbolBlend;
            } else {
                // Not crossfading: ensure both slots show current symbol, mix=0
                symbolIndices[p.index] = safeSymbolIndex;
                symbolIndices2[p.index] = safeSymbolIndex;
                symbolMix[p.index] = 0;
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
            (this.particleSystem.geometry.attributes.symbolIndex2 as THREE.BufferAttribute).needsUpdate = true;
            (this.particleSystem.geometry.attributes.symbolMix as THREE.BufferAttribute).needsUpdate = true;
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

        // Dynamic scaling tuned to grow slower on wide screens.
        // Key goals:
        // - Avoid over-scaling on wide/ultrawide viewports (growth based on vmin, not width)
        // - Keep 1080p 16:9 close to baseline
        // - Keep 4:3 displays largely unaffected by the "wide" damping
        const cssW = this.width || 1440;
        const cssH = this.height || 900;
        const vmin = Math.max(1, Math.min(cssW, cssH));
        const aspect = cssW / Math.max(1, cssH);

        // --- Explicit tuning knobs (safe, local, no breakpoints) ---
        const REFERENCE_VMIN = 1080; // baseline ~1080p height
        const GROW_EXPONENT = 0.001;  // lower => grows slower on large screens
        const SHRINK_EXPONENT = 0.75; // keep mobile/compact shrink behavior closer to previous
        const MIN_RATIO = 0.4;
        const MAX_RATIO = 1.25; // hard cap for very large viewports

        // Wide-aspect damping (only affects wider-than-16:9 compositions)
        const WIDE_START_AR = 16 / 9;
        const WIDE_END_AR = 21 / 9;
        const WIDE_MAX_REDUCTION = 0.18; // 18% reduction at or beyond 21:9

        // Smoothstep helper
        const smoothstep = (edge0: number, edge1: number, x: number) => {
            const t = Math.min(1, Math.max(0, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
            return t * t * (3 - 2 * t);
        };

        const ratioToRef = vmin / REFERENCE_VMIN;
        const exponent = ratioToRef >= 1 ? GROW_EXPONENT : SHRINK_EXPONENT;
        const baseRatio = Math.pow(ratioToRef, exponent);

        const wideT = smoothstep(WIDE_START_AR, WIDE_END_AR, aspect);
        const wideDamping = 1 - WIDE_MAX_REDUCTION * wideT;

        const dynamicRatio = baseRatio * wideDamping;
        const clampedRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, dynamicRatio));

        this.cachedDPR = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
        
        // We want higher devicePixelRatio screens (denser) to allow modest enlargement so perceived size matches large low-DPI displays.
        // densityExponent controls curve aggression. Clamp overall effect.
        let densityScale = 1.0;
        if (this.enableDensityCompensation) {
            densityScale = Math.pow(this.cachedDPR / this.densityBaseDPR, this.densityExponent);
            densityScale = Math.min(1.6, Math.max(0.8, densityScale));
        }
        return anchored * clampedRatio * this.globalSymbolSizeMul * densityScale;
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

    // React to particle size prop changes
    $: if (effectInstance) {
        effectInstance.setGlobalSymbolSizeMultiplier(particleSize);
    }
</script>

<div class="main-container gpu-prewarm-target" bind:this={mainContainer}>
  <div class="image-pane">
        <img src={imageUrl} alt="Profile" bind:this={imageElement} />
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

</style>