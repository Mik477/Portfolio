// src/lib/three/heroParticleLogic.ts
import * as THREE from 'three';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { BloomEffect } from './BloomEffect';
import Stats from 'stats.js';

// Shaders (VERTEX_SHADER and FRAGMENT_SHADER remain the same)
export const VERTEX_SHADER = `
attribute float size;
attribute vec3 customColor;
attribute float symbolState;
attribute float symbolIndex;
attribute float variability;

varying vec3 vColor;
varying float vSymbolState;
varying float vSymbolIndex;
varying float vVariability;

void main() {
  vColor = customColor;
  vSymbolState = symbolState;
  vSymbolIndex = symbolIndex;
  vVariability = variability;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const FRAGMENT_SHADER = `
uniform sampler2D pointTexture;
uniform sampler2D symbolsTexture;
uniform float symbolRows;

varying vec3 vColor;
varying float vSymbolState;
varying float vSymbolIndex;
varying float vVariability;

void main() {
  if(vSymbolState < 0.5) { // It's a normal particle (dot)
    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
  } 
  else { // It's a symbol
    const float symbolsPerRow = 8.0;
    float symbolIndexVal = vSymbolIndex;
    
    float columnIndex = mod(symbolIndexVal, symbolsPerRow);
    float rowIndex = floor(symbolIndexVal / symbolsPerRow);
    
    vec2 symbolCoord = gl_PointCoord;
    symbolCoord.x = (symbolCoord.x + columnIndex) / symbolsPerRow;
    symbolCoord.y = (symbolCoord.y + rowIndex) / symbolRows; // Use dynamic row count
    
    vec4 symbolTexColor = texture2D(symbolsTexture, symbolCoord);
    
    if(symbolTexColor.a < 0.3) discard; // Discard transparent parts of the symbol
    
    gl_FragColor = vec4(vColor, symbolTexColor.a); 
  }
}
`;

export interface EnvironmentOptions {
  initialInternalScale?: number; // e.g., 0.7 for mobile
  maxInternalDim?: number;       // e.g., 960 for mobile
  amountScale?: number;          // e.g., 0.85 to reduce initial particles
  antialias?: boolean;           // default true
  effectSpeed?: number;          // global speed multiplier
  referenceFps?: number;         // override reference FPS (default 60)
}

// Reference FPS baseline for converting legacy per-frame tuned constants
export const REF_FPS = 60;

export class Environment {
  public font: Font;
  public particleTexture: THREE.Texture;
  public container: HTMLElement;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  public createParticles!: CreateParticles;
  private animationLoopCallback: (() => void) | null = null;

  private clock!: THREE.Clock; 
  private bloomEffect!: BloomEffect;

  private internalScale: number = 1.0; // dynamic internal resolution scale
  private MAX_INTERNAL_DIM = 1440; // cap for larger dimension (overridable)
  private readonly SCALE_FLOOR = 0.6;
  private readonly SCALE_CEIL = 1.0;
  private options: EnvironmentOptions | undefined;
  // performance tracking
  private frameTimes: number[] = [];
  private readonly FRAME_WINDOW = 50;
  private readonly HIGH_THRESHOLD = 19.5; // ~51 FPS
  private readonly LOW_THRESHOLD = 16.7;  // ~60 FPS to allow upscaling when stable
  private scaleCooldownSec = 0; // seconds
  private readonly SCALE_COOLDOWN_SEC = 45 / REF_FPS; // 45 frames originally
  private avgFrameMs = 0;
  // metrics flag
  private metricsEnabled = false;
  private debugOverlayActive = false;
  private debugKeyPressTimes: number[] = []; // timestamps of 'd' presses
  private readonly DEBUG_MULTI_PRESS_WINDOW = 800; // ms
  private statsInstance: Stats | null = null;
  private debugDomContainer: HTMLElement | null = null;
  private lastDomUpdateTime = 0;
  private readonly DOM_UPDATE_INTERVAL = 0.25; // seconds
  private boundKeyHandler = this.onKeyDown.bind(this);
  private isPageVisible = true;
  private boundOnVisibilityChange = this.onVisibilityChange.bind(this);

  private baseAmountScale = 1.0;
  private readonly AMOUNT_TIERS = [1.0, 0.85, 0.7, 0.55];
  private amountTierIdx = 0;
  private amountTierCooldownSec = 0; // seconds
  private readonly AMOUNT_TIER_COOLDOWN_SEC = 240 / REF_FPS; // 240 frames originally

  private effectSpeed: number = 1.0;
  private readonly referenceFps: number = REF_FPS;

  constructor(font: Font, particleTexture: THREE.Texture, container: HTMLElement, options?: EnvironmentOptions) {
    this.font = font;
    this.particleTexture = particleTexture;
    this.container = container;
    this.options = options;
    
    if (!this.container) {
      console.error("HeroParticleLogic: Container not provided to Environment!");
      return;
    }
    
  this.clock = new THREE.Clock(); 
  this.effectSpeed = options?.effectSpeed ?? 1.0;
  this.referenceFps = options?.referenceFps ?? REF_FPS;

    this.scene = new THREE.Scene();
    // Apply initial overrides for mobile or perf
    if (this.options?.maxInternalDim && this.options.maxInternalDim > 0) {
      this.MAX_INTERNAL_DIM = this.options.maxInternalDim;
    }
    if (this.options?.initialInternalScale && this.options.initialInternalScale > 0) {
      this.internalScale = Math.min(this.SCALE_CEIL, Math.max(this.SCALE_FLOOR, this.options.initialInternalScale));
    }

    this.createCamera();
    this.createRenderer();
    
    this.bloomEffect = new BloomEffect(
        this.renderer, 
        this.scene, 
        this.camera, 
        this.container.clientWidth, 
        this.container.clientHeight
    );

    this.setup(); 

    // Optionally reduce initial particle amount after first creation
    if (this.options?.amountScale && this.options.amountScale > 0 && this.options.amountScale < 1 && this.createParticles) {
      try {
        const current = this.createParticles.getAmount();
        const target = Math.max(100, Math.floor(current * this.options.amountScale));
        if (target < current) {
          this.createParticles.rebuildWithAmount(target);
        }
      } catch {}
    }
  this.bindWindowResize();
  document.addEventListener('visibilitychange', this.boundOnVisibilityChange);

  if (this.renderer) {
    this.startAnimationLoop();
  }
  // bind debug key listener
  window.addEventListener('keydown', this.boundKeyHandler);
  }

  public startAnimationLoop() {
    if (this.renderer && !this.animationLoopCallback) {
        this.animationLoopCallback = () => { this.render(); };
        this.renderer.setAnimationLoop(this.animationLoopCallback);
    }
  }

  public stopAnimationLoop() {
    if (this.renderer && this.animationLoopCallback) {
        this.renderer.setAnimationLoop(null);
        this.animationLoopCallback = null;
    }
  }

  public isLooping(): boolean {
    return !!this.animationLoopCallback;
  }

  private bindWindowResize() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private unbindWindowResize() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private setup() {
    this.createParticles = new CreateParticles(
      this.scene, 
      this.font, 
      this.particleTexture, 
      this.camera, 
      this.renderer, 
      this.container 
    );
  }

  public render() {
    const rawDt = this.clock.getDelta();
    const deltaTime = Math.min(rawDt, 0.05); // clamp large dt spikes after tab resume (effectSpeed applied inside subsystems)
    const beforeStats = this.statsInstance ? performance.now() : 0;
    if (this.statsInstance) this.statsInstance.begin();
    if (this.isPageVisible) {
      const frameMs = deltaTime * 1000;
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length > this.FRAME_WINDOW) this.frameTimes.shift();
      if (this.frameTimes.length === this.FRAME_WINDOW) {
      this.avgFrameMs = this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length;
      if (this.scaleCooldownSec > 0) this.scaleCooldownSec -= deltaTime;
      let changed = false;
      if (this.scaleCooldownSec <= 0) {
        if (this.avgFrameMs > this.HIGH_THRESHOLD && this.internalScale > this.SCALE_FLOOR) {
          this.internalScale = Math.max(this.SCALE_FLOOR, +(this.internalScale - 0.1).toFixed(2));
          changed = true;
        } else if (this.avgFrameMs < this.LOW_THRESHOLD && this.internalScale < this.SCALE_CEIL) {
          this.internalScale = Math.min(this.SCALE_CEIL, +(this.internalScale + 0.1).toFixed(2));
          changed = true;
        }
        if (changed) { this.scaleCooldownSec = this.SCALE_COOLDOWN_SEC; this.onWindowResize(); }
      }
      // Particle amount tiering: only when at scale floor and still slow OR restore when fast
      if (this.createParticles) {
        if (this.amountTierCooldownSec > 0) this.amountTierCooldownSec -= deltaTime;
        if (this.amountTierCooldownSec <= 0) {
          if (this.internalScale <= this.SCALE_FLOOR + 1e-3 && this.avgFrameMs > this.HIGH_THRESHOLD + 1.0) {
            if (this.amountTierIdx < this.AMOUNT_TIERS.length - 1) {
              this.amountTierIdx++;
              const newAmount = Math.floor(this.createParticles.getAmount() * this.AMOUNT_TIERS[this.amountTierIdx]);
              this.createParticles.rebuildWithAmount(newAmount);
              this.amountTierCooldownSec = this.AMOUNT_TIER_COOLDOWN_SEC;
            }
          } else if (this.avgFrameMs < this.LOW_THRESHOLD - 0.7) {
            if (this.amountTierIdx > 0) {
              this.amountTierIdx--;
              const newAmount = Math.floor(this.createParticles.getAmount() / this.AMOUNT_TIERS[this.amountTierIdx+1]);
              this.createParticles.rebuildWithAmount(newAmount);
              this.amountTierCooldownSec = this.AMOUNT_TIER_COOLDOWN_SEC;
            }
          }
        }
      }
      }
    }
    // Force stable background
    this.scene.background = new THREE.Color(0x000000);
  if (this.createParticles) this.createParticles.render(deltaTime, this.effectSpeed); 
    if (this.bloomEffect) {
      this.bloomEffect.render(deltaTime);
    } else if (this.renderer && this.scene && this.camera) { 
      this.renderer.render(this.scene, this.camera);
    }
    if (this.statsInstance) this.statsInstance.end();
    if (this.debugOverlayActive && this.createParticles) {
      this.lastDomUpdateTime += deltaTime;
      if (this.lastDomUpdateTime >= this.DOM_UPDATE_INTERVAL) {
        this.lastDomUpdateTime = 0;
        this.updateDebugDom();
      }
    }
  }

  private createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      65, 
      this.container.clientWidth / this.container.clientHeight, 
      1, 
      10000
    );
    this.camera.position.set(0, 0, 100);
  }

  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options?.antialias ?? true,
      alpha: true 
    });
    // compute capped internal size
    const cssW = this.container.clientWidth;
    const cssH = this.container.clientHeight;
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
    this.renderer.setPixelRatio(1); // manual scaling
    this.renderer.setSize(targetW, targetH, false);
    this.renderer.setClearColor(0x000000, 0);
    if (THREE.ColorManagement.enabled) { 
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else { 
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    this.container.appendChild(this.renderer.domElement);
    const canvas = this.renderer.domElement;
    // Accessibility: mark decorative canvas as hidden from assistive tech
    try {
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('role', 'presentation');
      canvas.setAttribute('tabindex', '-1');
    } catch {}
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.style.display = 'block';
    canvas.style.objectFit = 'contain';
  }
  // expose metrics
  public getMetrics() { return { internalScale: this.internalScale, avgFrameMs: this.avgFrameMs }; }
  public enableMetrics(v: boolean) { this.metricsEnabled = v; }
  public onWindowResize() {
    if (this.camera && this.renderer && this.container) {
      const cssW = this.container.clientWidth;
      const cssH = this.container.clientHeight;
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
      this.camera.aspect = cssW / cssH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(targetW, targetH, false);
      const canvas = this.renderer.domElement;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      if (this.bloomEffect) this.bloomEffect.setSize(targetW, targetH);
      if (this.createParticles) {
        if (this.createParticles.checkScreenSizeChange()) {
          this.createParticles.regenerateParticles();
        }
        // Always update symbol sizes to match new viewport height scaling
        this.createParticles.updateSymbolSizesForViewport();
      }
    }
  }

  public dispose() {
    this.stopAnimationLoop();
    this.unbindWindowResize();
  document.removeEventListener('visibilitychange', this.boundOnVisibilityChange);
    window.removeEventListener('keydown', this.boundKeyHandler);
    if (this.createParticles) {
      this.createParticles.dispose();
    }
    if (this.bloomEffect) {
        this.bloomEffect.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    if (this.scene) {
        this.scene.traverse(object => {
            const obj = object as THREE.Mesh; 
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((material: THREE.Material) => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            }
        });
    }
  if (this.debugDomContainer && this.debugDomContainer.parentNode) {
    this.debugDomContainer.parentNode.removeChild(this.debugDomContainer);
    this.debugDomContainer = null;
  }
  }

  private onVisibilityChange() {
    const visible = document.visibilityState === 'visible';
    this.isPageVisible = visible;
    if (visible) {
      // clear metrics so stale hidden-frame spikes don't cause downscale
      this.frameTimes = [];
      this.avgFrameMs = 0;
      // small cooldown to avoid immediate rescale upon resume
      this.scaleCooldownSec = Math.max(this.scaleCooldownSec, this.SCALE_COOLDOWN_SEC / 2);
      // also pause amount tiering adjustments briefly
      this.amountTierCooldownSec = Math.max(this.amountTierCooldownSec, this.AMOUNT_TIER_COOLDOWN_SEC / 4);
    }
  }

  public setEffectSpeed(v: number) { this.effectSpeed = Math.max(0, v); }
  public getEffectSpeed() { return this.effectSpeed; }
  public isDebugOverlayActive() { return this.debugOverlayActive; }

  // --- Debug overlay handling ---
  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'd' || e.key === 'D') {
      const now = performance.now();
      // purge old presses
      this.debugKeyPressTimes = this.debugKeyPressTimes.filter(t => now - t < this.DEBUG_MULTI_PRESS_WINDOW);
      this.debugKeyPressTimes.push(now);
      if (!this.debugOverlayActive) {
        if (this.debugKeyPressTimes.length >= 3) {
          this.enableDebugOverlay();
          this.debugKeyPressTimes = [];
        }
      } else {
        // single press to deactivate
        this.disableDebugOverlay();
        this.debugKeyPressTimes = [];
      }
    }
  }

  private enableDebugOverlay() {
    if (this.debugOverlayActive) return;
    this.debugOverlayActive = true;
    // stats.js instance
    if (!this.statsInstance) {
      this.statsInstance = new Stats();
      // Panel 0 default: ms
      // Add FPS panel explicitly for clarity
      this.statsInstance.showPanel(0);
      this.statsInstance.dom.style.position = 'absolute';
      this.statsInstance.dom.style.top = '0';
      this.statsInstance.dom.style.left = '0';
    }
    if (!this.debugDomContainer) {
      this.debugDomContainer = document.createElement('div');
      this.debugDomContainer.style.position = 'absolute';
      this.debugDomContainer.style.top = '0';
      this.debugDomContainer.style.right = '0';
      this.debugDomContainer.style.maxWidth = '300px';
      this.debugDomContainer.style.background = 'rgba(0,0,0,0.6)';
      this.debugDomContainer.style.font = '12px monospace';
      this.debugDomContainer.style.color = '#0f0';
      this.debugDomContainer.style.padding = '6px 8px';
      this.debugDomContainer.style.lineHeight = '1.35';
      this.debugDomContainer.style.zIndex = '9999';
      this.debugDomContainer.style.pointerEvents = 'none';
      this.debugDomContainer.style.whiteSpace = 'pre';
    }
    if (this.container && this.statsInstance && !this.statsInstance.dom.parentNode) {
      this.container.appendChild(this.statsInstance.dom);
    }
    if (this.container && this.debugDomContainer && !this.debugDomContainer.parentNode) {
      this.container.appendChild(this.debugDomContainer);
    }
    this.lastDomUpdateTime = 0;
    this.updateDebugDom();
  }

  private disableDebugOverlay() {
    if (!this.debugOverlayActive) return;
    this.debugOverlayActive = false;
    if (this.statsInstance && this.statsInstance.dom.parentNode) {
      this.statsInstance.dom.parentNode.removeChild(this.statsInstance.dom);
    }
    if (this.debugDomContainer && this.debugDomContainer.parentNode) {
      this.debugDomContainer.parentNode.removeChild(this.debugDomContainer);
    }
    this.statsInstance = null; // allow GC
  }

  private updateDebugDom() {
    if (!this.debugDomContainer || !this.createParticles) return;
    const pMetrics = this.createParticles.getMetrics();
    const envMetrics = this.getMetrics();
    const lines = [
      'DEBUG OVERLAY (press d to hide)',
      `Particles: ${pMetrics.particleCount}`,
      `Active symbols: ${pMetrics.activeSymbols}`,
      `Symbol spawn rate: ${pMetrics.spawnRate.toFixed(2)} /s` ,
      `Avg heat: ${(pMetrics.avgHeat*100).toFixed(1)}%  Max heat: ${(pMetrics.maxHeat*100).toFixed(1)}%`,
      `Internal scale: ${envMetrics.internalScale.toFixed(2)}`,
      `Avg frame: ${envMetrics.avgFrameMs.toFixed(2)} ms` ,
      `Effect speed: ${this.effectSpeed.toFixed(2)}`
    ];
    this.debugDomContainer.textContent = lines.join('\n');
  }
}

interface ParticleData {
  text: string;
  amount: number;
  particleSize: number;
  textSize: number;
  area: number;
  ease: number;
  distortionThreshold: number;
  minFadeOutRate: number;
  maxFadeOutRate: number;
  minSymbolSize: number;
  maxSymbolSize: number;
  symbolMinThreshold: number;
  symbolMidThreshold: number;
  symbolMaxThreshold: number;
  symbolMinProb: number;
  symbolMaxProb: number;
  symbolHeatRequirement: number;
  particleCooldownDurationMin: number;
  particleCooldownDurationMax: number;
  symbolCooldownSpeedMultiplier: number;
}

// Screen size categories for responsive design
type ScreenSizeType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'large' | 'ultrawide';

export class CreateParticles {
  private scene: THREE.Scene;
  private font: Font;
  private particleImg: THREE.Texture;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer; 
  private hostContainer: HTMLElement; 

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isPressed: boolean = false;
  private hasMouseMoved: boolean = false; 
  // Prevent immediate color influence until user interacts
  private interactionActivated: boolean = false;
  private activationMoveThreshold: number = 12; // pixels of cumulative motion to activate
  private cumulativeMoveDistance: number = 0;
  private lastPointerClientX: number | null = null;
  private lastPointerClientY: number | null = null;

  private matrixSymbols: string[];
  private matrixColors: { [key: string]: THREE.Color };
  private bloomSymbolColor: THREE.Color; 
  // Color transition state for non-symbol dots
  private colorProgress: number[] = []; // [0..1], 0=white, 1=final green
  private influenceEMA: number[] = [];  // smoothed influence per particle
  private whiteCooldownFrames: number[] = []; // frames to wait before allowing pure white (legacy, will be replaced)
  private whiteCooldownTimeSec: number[] = []; // time-based replacement
  private kReturn: number = 0; // exponential return constant
  private lastEaseFrameValue: number = -1;
  private riseRateMul: number[] = []; // per-particle jitter
  private fallRateMul: number[] = [];
  private readonly colorParams = {
  // Distortion-driven color thresholds and rates (tuned for earlier, gradual greening)
  colorMinDistort: 2,   // start greening at small but noticeable displacement
  colorMaxDistort: 13.0,  // reach full green below symbol threshold range
  riseLerpPerSec: 4.5,    // approach speed when increasing
  fallLerpPerSec: 0.115,    // approach speed when decreasing
  minTimeToWhite: 5.0,   // seconds before returning to pure white
  curveShape: 1.6,       // perceptual curve for mid-tones
  finalDotGreenDarken: 0.1, // reduce brightness vs symbol green
  jitterRise: 0.1,       // ±10%
  jitterFall: 0.1        // ±10%
  };
  
  private particleStates: number[] = [];
  private heatLevels: number[] = [];
  private cooldownRates: number[] = []; // per-particle heat decay rate (per second)
  private symbolIndicesAttributeValues: number[] = [];
  private fadeOutRates: number[] = [];
  private fadeOutRatesPerSec: number[] = []; // converted per-second rates
  private cooldownDurationsSec: number[] = []; // store original durations in seconds for clarity
  private activeSymbolFactors: number[] = []; // store raw random factor (with modifiers) for active symbol resizing

  // --- Metrics tracking ---
  private activeSymbolsCount: number = 0;               // currently active symbol particles
  private symbolsSpawnedInWindow: number = 0;            // spawned within current accumulation window
  private spawnWindowTime: number = 0;                   // seconds accumulated for spawn rate window
  private symbolSpawnRate: number = 0;                   // symbols per second (rolling over ~1s windows)
  private readonly SPAWN_RATE_WINDOW_SEC = 1.0;          // window length to compute symbol spawn rate

  private data: ParticleData;
  private symbolsTexture!: THREE.Texture;
  private planeArea!: THREE.Mesh; 
  public particles!: THREE.Points;
  private geometryCopy!: THREE.BufferGeometry;
  private referenceTextHeight: number | null = null; // first measured text height (world units)
  private textBoundingHeight: number | null = null;  // current text height after latest generation

  private boundOnMouseDown: (event: MouseEvent) => void;
  private boundOnMouseMove: (event: MouseEvent) => void;
  private boundOnMouseUp: (event: MouseEvent) => void;
  private boundOnTouchStart: (event: TouchEvent) => void;
  private boundOnTouchMove: (event: TouchEvent) => void;
  private boundOnTouchEnd: (event: TouchEvent) => void;

  // Responsive design related properties
  private currentScreenSizeType: ScreenSizeType = 'desktop';
  private lastKnownWidth: number = 0;
  private lastKnownHeight: number = 0;
  private needsParticleRegeneration: boolean = false;

  private readonly SYMBOL_HUE_SHIFT_RANGE = 0.03;
  private readonly SYMBOL_LUMINANCE_REDUCTION_MAX = 0.08;
  private readonly SYMBOL_MIN_LUMINANCE_TARGET = 0.45;

  private readonly SCREEN_SIZES = {
    mobile: { maxWidth: 640 },
    tablet: { minWidth: 641, maxWidth: 1024 },
    laptop: { minWidth: 1025, maxWidth: 1440 },
    desktop: { minWidth: 1441, maxWidth: 1920 },
    large: { minWidth: 1921, maxWidth: 2560 },
    ultrawide: { minWidth: 2561 }
  };

  private readonly RESPONSIVE_PARAMS: Record<ScreenSizeType, Partial<ParticleData>> = {
    // Symbol min/max now unified; actual on-screen size is scaled by viewport height for consistency across resolutions.
    mobile: { amount: 2000, particleSize: 1.0, textSize: 12, minSymbolSize: 7, maxSymbolSize: 12, area: 150 },
    tablet: { amount: 2200, particleSize: 1.1, textSize: 14, minSymbolSize: 7, maxSymbolSize: 12, area: 200 },
    laptop: { amount: 2200, particleSize: 1.5, textSize: 15, minSymbolSize: 7, maxSymbolSize: 12, area: 230 },
    desktop: { amount: 2400, particleSize: 1.68, textSize: 16, minSymbolSize: 7, maxSymbolSize: 10, area: 250 },
    large: { amount: 2700, particleSize: 1.55, textSize: 18, minSymbolSize: 7, maxSymbolSize: 12, area: 280 },
    ultrawide: { amount: 2900, particleSize: 1.6, textSize: 20, minSymbolSize: 8, maxSymbolSize: 140, area: 300 }
  };
  private readonly SYMBOL_SIZE_MODIFIERS: Record<ScreenSizeType, { minMul: number; maxMul: number }> = {
    mobile: { minMul: 0.95, maxMul: 0.95 },
    tablet: { minMul: 1.0, maxMul: 1.0 },
    laptop: { minMul: 1.0, maxMul: 1.0 },
    desktop: { minMul: 0.9,maxMul: 0.9},
    large: { minMul: 1.07, maxMul: 1.08 },
    ultrawide: { minMul: 13, maxMul: 19 }
  };

  private symbolTextureRows: number = 6;
  // Global hard override multiplier (debug) applied after all other scaling (min/max, modifiers, text scale)
  private globalSymbolSizeMul: number = 1.0;
  // Instrumentation for debugging size issues
  private lastSpawnComputedSize: number = 0; // final size written to attribute on last spawn
  private lastSpawnRawRandom: number = 0;    // randomSymbolSize before global multiplier
  private lastSpawnSymbolScale: number = 0;  // symbolScale at spawn
  private lastSpawnScreenType: ScreenSizeType = 'desktop';
  // Per-screen additional ratio to gently scale symbols on higher resolutions
  private readonly SCREEN_SYMBOL_RATIO: Record<ScreenSizeType, number> = {
    mobile: 1.0,
    tablet: 1.0,
    laptop: 1.0,
    desktop: 1.0,
    large: 1.03,
    ultrawide: 1.12
  };
  private pointSizeMax: number | null = null; // GPU max point size (caps gl_PointSize)

  constructor(scene: THREE.Scene, font: Font, particleImg: THREE.Texture, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, hostContainer: HTMLElement) {
    this.scene = scene;
    this.font = font;
    this.particleImg = particleImg;
    this.camera = camera;
    this.renderer = renderer; 
    this.hostContainer = hostContainer;
    this.isPressed = false;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(1e5, 1e5);

    this.matrixSymbols = [ 
      '日', '〇', 'ﾊ', 'ﾐ', 'ﾋ', 'ｰ', 'ｳ', 'ｼ', 'ﾅ', 'ﾓ', 'ﾆ', 'ｻ', 'ﾜ',
      'ﾂ', 'ｵ', 'ﾘ', 'ｱ', 'ﾎ', 'ﾃ', 'ﾏ', 'ｹ', 'ﾒ', 'ｴ', 'ｶ', 'ｷ', 'ﾑ', 
      'ﾕ', 'ﾗ', 'ｾ', 'ﾈ', 'ｦ', 'ｲ', 'ｸ', 'ｺ', 'ｿ', 'ﾀ', 'ﾁ', 'ﾄ', 'ﾉ', 'ﾌ', 'ﾍ', 'ﾏ', 'ﾔ', 'ﾖ', 'ﾙ', 'ﾚ', 'ﾛ',
      '∆','δ', 'ε', 'ζ', 'η', 'θ', '∃', '∄','∅','ﾊ', 'ﾍ', 'ﾎ', 'ﾞ', 'ﾟ', 'ｧ', 'ｨ', 'ｩ', 'ｪ', 'ｫ', 'ｬ', 'ｭ', 'ｮ', 'ｯ','Д'
    ];
    
    this.matrixColors = {
      white: new THREE.Color(1.0, 1.0, 1.0),
      verySubtleGreenTint: new THREE.Color(0.9, 1.0, 0.9), 
      almostWhiteGreen: new THREE.Color(0.8, 1.0, 0.8),
      paleGreen: new THREE.Color(0.58, 1.0, 0.58),
      lightMatrixGreen: new THREE.Color(0.3, 1.0, 0.3),
      classicMatrixGreen: new THREE.Color(0.0, 1.0, 0.0),
      deepMatrixGreen: new THREE.Color(0.0, 0.85, 0.0)
    };

    this.bloomSymbolColor = new THREE.Color(0.0, 0.95, 0.05); 

    this.data = { 
      text: "Hi, I'm\nMiká",
      amount: 2700,
      particleSize: 1.5,
      textSize: 16,
      area: 250, 
      ease: .05, 
      distortionThreshold: 12,
      minFadeOutRate: 0.09,
      maxFadeOutRate: 0.12,
      minSymbolSize: 7,
      maxSymbolSize: 12,
      symbolMinThreshold: 13,
      symbolMidThreshold: 20,
      symbolMaxThreshold: 40,
      symbolMinProb: 0.001,
      symbolMaxProb: 0.15,
      symbolHeatRequirement: 0.4,
      particleCooldownDurationMin: 200, 
      particleCooldownDurationMax: 340,
      symbolCooldownSpeedMultiplier: 3.1,
    };
    
    this.lastKnownWidth = this.hostContainer.clientWidth;
    this.lastKnownHeight = this.hostContainer.clientHeight;
    
    this.currentScreenSizeType = this.getScreenSizeType();
    this.applyResponsiveParameters(this.currentScreenSizeType);
    
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    
    this.createMatrixSymbolsTexture();
    this.setupPlaneArea();
    this.createText();

    // Query GPU point size cap (helps explain lack of visual change when exceeding)
    try {
      const gl = this.renderer.getContext();
      const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      if (Array.isArray(range) || (range && range.length === 2)) {
        this.pointSizeMax = range[1];
        // console.log('GPU point size range', range); // optional dev log
      }
    } catch {}
  }

  // --- Public debug helpers ---
  public setGlobalSymbolSizeMultiplier(m: number) {
    this.globalSymbolSizeMul = Math.max(0.01, m);
    // Rescale currently active symbols immediately
    this.updateSymbolSizesForTextScale();
  }
  public setScreenSymbolRatio(screen: ScreenSizeType, ratio: number) {
    if (ratio > 0 && screen in this.SCREEN_SYMBOL_RATIO) {
      this.SCREEN_SYMBOL_RATIO[screen] = ratio;
      this.updateSymbolSizesForTextScale();
    }
  }
  public getSymbolDebugInfo() {
    return {
      globalMul: this.globalSymbolSizeMul,
      lastSpawnComputedSize: this.lastSpawnComputedSize,
      lastSpawnRawRandom: this.lastSpawnRawRandom,
      lastSpawnSymbolScale: this.lastSpawnSymbolScale,
      screenType: this.lastSpawnScreenType,
      minSymbolSize: this.data.minSymbolSize,
      maxSymbolSize: this.data.maxSymbolSize,
      modifiers: this.SYMBOL_SIZE_MODIFIERS[this.currentScreenSizeType],
      screenRatio: this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType],
      gpuPointSizeMax: this.pointSizeMax
    };
  }

  private getMatrixColor(heatLevel: number): THREE.Color {
    if (heatLevel <= 0.05) return this.matrixColors.white;                
    if (heatLevel <= 0.18) return this.matrixColors.verySubtleGreenTint; 
    if (heatLevel <= 0.35) return this.matrixColors.almostWhiteGreen;     
    if (heatLevel <= 0.55) return this.matrixColors.paleGreen;            
    if (heatLevel <= 0.75) return this.matrixColors.lightMatrixGreen;
    if (heatLevel <= 0.92) return this.matrixColors.classicMatrixGreen;   
    return this.matrixColors.deepMatrixGreen;                             
  }

  private getSymbolProbability(distortion: number): number {
    const { symbolMinThreshold, symbolMidThreshold, symbolMaxThreshold, symbolMinProb, symbolMaxProb } = this.data;
    if (distortion < symbolMinThreshold) return 0;
    if (distortion >= symbolMaxThreshold) return symbolMaxProb; 
    if (distortion < symbolMidThreshold) {
      const ratio = (distortion - symbolMinThreshold) / (symbolMidThreshold - symbolMinThreshold);
      return symbolMinProb + (symbolMaxProb / 10) * Math.pow(ratio, 3);
    } else {
      const ratio = (distortion - symbolMidThreshold) / (symbolMaxThreshold - symbolMidThreshold);
      return (symbolMaxProb / 10) + 
             (symbolMaxProb - symbolMaxProb / 10) * Math.pow(ratio, 1.5);
    }
  }

  // Symbol scale anchored to initial text height so symbols keep consistent proportion relative to text across devices.
  private getSymbolScale(): number {
    if (this.referenceTextHeight && this.textBoundingHeight && this.textBoundingHeight > 0) {
      const raw = this.referenceTextHeight / this.textBoundingHeight; // if text got larger, scale symbols up proportionally
  // Optionally: blend with a viewport factor if reintroducing hybrid behavior in future.
      // Clamp to avoid extreme jumps when fonts/rendering differ slightly.
      return Math.min(1.6, Math.max(0.65, raw));
    }
    // Fallback: no text metrics yet, neutral scale
    return 1.0;
  }

  // Recalculate current symbol point sizes so that active symbols maintain consistent proportion to text after resize.
  public updateSymbolSizesForTextScale(): void {
    if (!this.particles) return;
    const geo = this.particles.geometry as THREE.BufferGeometry;
    const sizes = geo.getAttribute('size') as THREE.BufferAttribute;
    const symbolStates = geo.getAttribute('symbolState') as THREE.BufferAttribute;
    const sizeArr = sizes.array as Float32Array;
    const stateArr = symbolStates.array as Float32Array;
    const count = sizes.count;
    const symbolScale = this.getSymbolScale();
    const baseSize = this.data.particleSize;
    const ratio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType] ?? 1.0;
    for (let i = 0; i < count; i++) {
      if (stateArr[i] === 1) {
        const factor = this.activeSymbolFactors[i];
        if (factor > 0) {
          sizeArr[i] = baseSize * factor * symbolScale * ratio * this.globalSymbolSizeMul;
        }
      }
    }
    sizes.needsUpdate = true;
  }

  // Backwards compatibility alias (can remove once all call sites updated)
  public updateSymbolSizesForViewport(): void {
    this.updateSymbolSizesForTextScale();
  }

  private initParticleStates(count: number) { 
    this.particleStates = new Array(count).fill(0);
    this.heatLevels = new Array(count).fill(0);
  this.cooldownRates = new Array(count); // will become per-second decay rates
    this.symbolIndicesAttributeValues = new Array(count);
    this.fadeOutRates = new Array(count);
  this.fadeOutRatesPerSec = new Array(count);
  this.cooldownDurationsSec = new Array(count);
   this.activeSymbolFactors = new Array(count).fill(0);
    // initialize color transition state
    this.colorProgress = new Array(count).fill(0);
    this.influenceEMA = new Array(count).fill(0);
  this.whiteCooldownFrames = new Array(count).fill(0);
  this.whiteCooldownTimeSec = new Array(count).fill(0);
    this.riseRateMul = new Array(count);
    this.fallRateMul = new Array(count);
    
    for (let i = 0; i < count; i++) {
      this.symbolIndicesAttributeValues[i] = Math.floor(Math.random() * this.matrixSymbols.length);
      
  const randomDurationFrames = this.data.particleCooldownDurationMin + 
             Math.random() * (this.data.particleCooldownDurationMax - this.data.particleCooldownDurationMin);
  // Convert to seconds baseline at REF_FPS
  const randomDurationSec = randomDurationFrames / REF_FPS;
  this.cooldownDurationsSec[i] = randomDurationSec;
  this.cooldownRates[i] = 1 / randomDurationSec; // per-second heat decay rate
  const fadePerFrame = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
  this.fadeOutRates[i] = fadePerFrame; // legacy storage (optional)
  this.fadeOutRatesPerSec[i] = fadePerFrame * REF_FPS; // per-second size reduction
      // per-particle jitter multipliers
      const jr = (Math.random() * 2 - 1) * this.colorParams.jitterRise;
      const jf = (Math.random() * 2 - 1) * this.colorParams.jitterFall;
      this.riseRateMul[i] = 1 + jr;
      this.fallRateMul[i] = 1 + jf;
    }
  }

  private createMatrixSymbolsTexture() {
    const cols = 8;
    const symbolSize = 64;
    const rows = Math.ceil(this.matrixSymbols.length / cols);
    
    const canvas = document.createElement('canvas');
    canvas.width = cols * symbolSize; 
    canvas.height = rows * symbolSize;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0,0,0,0)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00FF00';
    
    if (ctx.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    for (let i = 0; i < this.matrixSymbols.length; i++) {
      const col = i % cols; 
      const row = Math.floor(i / cols);
      const x = col * symbolSize + symbolSize / 2; 
      const y = row * symbolSize + symbolSize / 2;
      
      const symbol = this.matrixSymbols[i];
      ctx.fillText(symbol, x, y);
    }
    
    this.symbolsTexture = new THREE.Texture(canvas);
    this.symbolsTexture.needsUpdate = true;
    this.symbolsTexture.generateMipmaps = false;
    this.symbolsTexture.minFilter = THREE.LinearFilter;
    this.symbolsTexture.magFilter = THREE.LinearFilter;
    this.symbolsTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.symbolsTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    this.symbolTextureRows = rows;
  }

  private setupPlaneArea() {
    const planeZ = 0;
    const planeWidth = this.visibleWidthAtZDepth(planeZ, this.camera);
    const planeHeight = this.visibleHeightAtZDepth(planeZ, this.camera);

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0, 
        depthWrite: false 
    });
    this.planeArea = new THREE.Mesh(geometry, material);
    this.planeArea.position.z = planeZ;
    this.planeArea.visible = true;
    this.scene.add(this.planeArea);
  }

  private createText() {
    const thePoints: THREE.Vector3[] = [];
    const colorsArr: number[] = []; 
    const sizesArr: number[] = []; 
    const symbolStatesArr: number[] = []; 
    const symbolIndicesArrForAttribute: number[] = []; 
    const variabilitiesArr: number[] = [];

    if (!this.font) { console.error("HeroParticleLogic: Font not available for createText"); return; }

    const mainShapes = this.font.generateShapes(this.data.text, this.data.textSize);
    const allPaths: THREE.Path[] = [];
    mainShapes.forEach(shape => {
        allPaths.push(shape); 
        if (shape.holes && shape.holes.length > 0) {
            allPaths.push(...shape.holes); 
        }
    });
    
    const tempShapeGeometry = new THREE.ShapeGeometry(mainShapes); 
    tempShapeGeometry.computeBoundingBox();
    const bb = tempShapeGeometry.boundingBox!;
    const bboxWidth = bb.max.x - bb.min.x;
    const bboxHeight = bb.max.y - bb.min.y;
    // Center offset
    const xMid = -0.5 * bboxWidth;
    const yMid = bboxHeight / 2.85; 
    // Update text height tracking (world units)
    this.textBoundingHeight = bboxHeight;
    if (this.referenceTextHeight === null) {
      this.referenceTextHeight = bboxHeight; // anchor
    }
    tempShapeGeometry.dispose();

    let totalLength = 0;
    allPaths.forEach(path => totalLength += path.getLength());
    if (totalLength === 0) totalLength = 1; 

    const initialColor = this.matrixColors.white; 

    allPaths.forEach(path => {
      const pathLength = path.getLength();
      const numPointsForThisPath = Math.max(10, Math.floor((pathLength / totalLength) * this.data.amount));
      const points = path.getSpacedPoints(numPointsForThisPath);
      
      points.forEach(p => {
        thePoints.push(new THREE.Vector3(p.x, p.y, 0));
        colorsArr.push(initialColor.r, initialColor.g, initialColor.b); 
        sizesArr.push(this.data.particleSize);
        symbolStatesArr.push(0); 
        symbolIndicesArrForAttribute.push(Math.floor(Math.random() * this.matrixSymbols.length));
        variabilitiesArr.push(Math.random());
      });
    });
    
    const finalPointCount = thePoints.length;
    if (colorsArr.length / 3 !== finalPointCount) { colorsArr.length = finalPointCount * 3; for(let i=0; i<finalPointCount; ++i) colorsArr.splice(i*3, 3, initialColor.r, initialColor.g, initialColor.b); }
    if (sizesArr.length !== finalPointCount) { sizesArr.length = finalPointCount; sizesArr.fill(this.data.particleSize); }
    if (symbolStatesArr.length !== finalPointCount) { symbolStatesArr.length = finalPointCount; symbolStatesArr.fill(0); }
    if (symbolIndicesArrForAttribute.length !== finalPointCount) { symbolIndicesArrForAttribute.length = finalPointCount; for(let i=0; i<finalPointCount; ++i) symbolIndicesArrForAttribute[i] = Math.floor(Math.random() * this.matrixSymbols.length); }
    if (variabilitiesArr.length !== finalPointCount) { variabilitiesArr.length = finalPointCount; for(let i=0; i<finalPointCount; ++i) variabilitiesArr[i] = Math.random(); }


    const geoParticles = new THREE.BufferGeometry().setFromPoints(thePoints);
    geoParticles.translate(xMid, yMid, 0); 
    geoParticles.setAttribute('customColor', new THREE.Float32BufferAttribute(colorsArr, 3));
    geoParticles.setAttribute('size', new THREE.Float32BufferAttribute(sizesArr, 1));
    geoParticles.setAttribute('symbolState', new THREE.Float32BufferAttribute(symbolStatesArr, 1));
    geoParticles.setAttribute('symbolIndex', new THREE.Float32BufferAttribute(symbolIndicesArrForAttribute, 1));
    geoParticles.setAttribute('variability', new THREE.Float32BufferAttribute(variabilitiesArr, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.particleImg },
        symbolsTexture: { value: this.symbolsTexture },
        symbolRows: { value: this.symbolTextureRows }
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      blending: THREE.NormalBlending, 
      depthTest: false, 
      transparent: true, 
    });

    this.particles = new THREE.Points(geoParticles, particleMaterial);
    this.scene.add(this.particles);
    this.geometryCopy = new THREE.BufferGeometry().copy(this.particles.geometry);
    this.initParticleStates(thePoints.length);
   }

  public bindInteractionEvents() {
    this.hostContainer.addEventListener('mousedown', this.boundOnMouseDown);
    this.hostContainer.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('mouseup', this.boundOnMouseUp); 

    this.hostContainer.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    this.hostContainer.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    this.hostContainer.addEventListener('touchend', this.boundOnTouchEnd, { passive: false });
    this.isPressed = false;
  }

  public unbindInteractionEvents() {
    this.hostContainer.removeEventListener('mousedown', this.boundOnMouseDown);
    this.hostContainer.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);

    this.hostContainer.removeEventListener('touchstart', this.boundOnTouchStart);
    this.hostContainer.removeEventListener('touchmove', this.boundOnTouchMove);
    this.hostContainer.removeEventListener('touchend', this.boundOnTouchEnd);
    
    this.neutralizeLastMousePosition();
  }

  public neutralizeLastMousePosition() {
    this.mouse.set(1e5, 1e5); 
    this.hasMouseMoved = false; 
    this.isPressed = false; 
    this.interactionActivated = false;
    this.cumulativeMoveDistance = 0;
    this.lastPointerClientX = null;
    this.lastPointerClientY = null;
  }

  private onMouseDown(event: MouseEvent) {
    this.updateMousePosition(event.clientX, event.clientY);
    this.isPressed = true;
    this.data.ease = .01;
    this.interactionActivated = true;
    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;
  }
  private onMouseUp() { this.isPressed = false; this.data.ease = .05; }
  private onMouseMove(event: MouseEvent) {
    const cx = event.clientX, cy = event.clientY;
    if (!this.hasMouseMoved) this.hasMouseMoved = true;
    if (this.lastPointerClientX !== null && this.lastPointerClientY !== null) {
      const dx = cx - this.lastPointerClientX; const dy = cy - this.lastPointerClientY;
      this.cumulativeMoveDistance += Math.hypot(dx, dy);
      if (!this.interactionActivated && this.cumulativeMoveDistance >= this.activationMoveThreshold) {
        this.interactionActivated = true;
      }
    }
    this.lastPointerClientX = cx; this.lastPointerClientY = cy;
    this.updateMousePosition(cx, cy);
  }
  private onTouchStart(event: TouchEvent) {
    if (event.touches.length > 0) {
      const cx = event.touches[0].clientX, cy = event.touches[0].clientY;
      this.updateMousePosition(cx, cy);
      this.isPressed = true; this.data.ease = .01; this.hasMouseMoved = true;
      this.interactionActivated = true;
      this.lastPointerClientX = cx; this.lastPointerClientY = cy;
    }
    event.preventDefault();
  }
  private onTouchMove(event: TouchEvent) {
    if (event.touches.length > 0) {
      const cx = event.touches[0].clientX, cy = event.touches[0].clientY;
      this.hasMouseMoved = true;
      if (this.lastPointerClientX !== null && this.lastPointerClientY !== null) {
        const dx = cx - this.lastPointerClientX; const dy = cy - this.lastPointerClientY;
        this.cumulativeMoveDistance += Math.hypot(dx, dy);
        if (!this.interactionActivated && this.cumulativeMoveDistance >= this.activationMoveThreshold) {
          this.interactionActivated = true;
        }
      }
      this.lastPointerClientX = cx; this.lastPointerClientY = cy;
      this.updateMousePosition(cx, cy);
    }
    event.preventDefault();
  }
  private onTouchEnd(event: TouchEvent) { this.isPressed = false; this.data.ease = .05; event.preventDefault(); }
  
  private updateMousePosition(clientX: number, clientY: number) {
    const rect = this.hostContainer.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getVariedSymbolColor(): THREE.Color {
    const variedColor = this.bloomSymbolColor.clone();
    const hsl = { h: 0, s: 0, l: 0 };
    variedColor.getHSL(hsl); 

    const hueOffset = (Math.random() - 0.5) * this.SYMBOL_HUE_SHIFT_RANGE;
    hsl.h += hueOffset;
    hsl.h = (hsl.h + 1.0) % 1.0; 

    const luminanceReduction = Math.random() * this.SYMBOL_LUMINANCE_REDUCTION_MAX;
    hsl.l -= luminanceReduction;
    
    hsl.l = Math.max(this.SYMBOL_MIN_LUMINANCE_TARGET, hsl.l);
    hsl.l = Math.min(1.0, hsl.l);

    variedColor.setHSL(hsl.h, hsl.s, hsl.l); 
    return variedColor;
  }

  public render(deltaTime?: number, effectSpeed: number = 1.0) {
    if (!this.particles || !this.planeArea || !this.camera) return; 

    const dt = Math.max(0.00001, deltaTime ?? 1/60);
    const clamp01 = (x: number) => x < 0 ? 0 : (x > 1 ? 1 : x);
    // reset per-frame counters
    this.activeSymbolsCount = 0;
    

    // recompute exponential return constant if ease changed
    if (this.lastEaseFrameValue !== this.data.ease) {
      const ef = Math.min(Math.max(this.data.ease, 0), 0.9999);
      this.kReturn = -REF_FPS * Math.log(1 - ef);
      this.lastEaseFrameValue = this.data.ease;
    }

    const decayFromDt = (t: number) => Math.exp(-this.kReturn * t * effectSpeed);

    // cache attributes & typed arrays
    const geo = this.particles.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = geo.attributes.customColor as THREE.BufferAttribute;
    const sizes = geo.attributes.size as THREE.BufferAttribute;
    const symbolStates = geo.attributes.symbolState as THREE.BufferAttribute;
    const symbolIndicesBuffer = geo.attributes.symbolIndex as THREE.BufferAttribute;

    const posArr = pos.array as Float32Array;
    const colArr = colors.array as Float32Array;
    const sizeArr = sizes.array as Float32Array;
    const stateArr = symbolStates.array as Float32Array;
    const indexArr = symbolIndicesBuffer.array as Float32Array;

    const count = pos.count;

    // target dot green derived from symbol color, slightly darkened
    const targetGreen = this.bloomSymbolColor.clone();
    const tgHSL = { h: 0, s: 0, l: 0 };
    targetGreen.getHSL(tgHSL);
    tgHSL.l = Math.max(0, tgHSL.l - this.colorParams.finalDotGreenDarken);
    targetGreen.setHSL(tgHSL.h, tgHSL.s, tgHSL.l);
    const tgR = targetGreen.r, tgG = targetGreen.g, tgB = targetGreen.b;

  if ((!this.hasMouseMoved && !this.isPressed) || !this.interactionActivated) {
      const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
      const copyArr = copyPos.array as Float32Array;
      let changed = false;
      let colorChanged = false;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const initX = copyArr[i3], initY = copyArr[i3+1], initZ = copyArr[i3+2];
        const px = posArr[i3], py = posArr[i3+1], pz = posArr[i3+2];
  const decay = decayFromDt(dt);
  let npx = initX + (px - initX) * decay;
  let npy = initY + (py - initY) * decay;
  let npz = initZ + (pz - initZ) * decay;
        if (npx !== px || npy !== py || npz !== pz) {
          posArr[i3] = npx; posArr[i3+1] = npy; posArr[i3+2] = npz; changed = true;
        }
        // Color decay when idle or before activation
        if (this.particleStates[i] === 0) {
          let prog = this.colorProgress[i];
          if (this.whiteCooldownTimeSec[i] > 0) {
            this.whiteCooldownTimeSec[i] -= dt * effectSpeed;
            prog = Math.max(0.05, prog - this.colorParams.fallLerpPerSec * this.fallRateMul[i] * dt);
          } else {
            prog = Math.max(0, prog - this.colorParams.fallLerpPerSec * this.fallRateMul[i] * dt);
          }
          prog = clamp01(prog);
          this.colorProgress[i] = prog;
          const t = Math.pow(prog, this.colorParams.curveShape);
          const r = 1 + (tgR - 1) * t;
          const g = 1 + (tgG - 1) * t;
          const b = 1 + (tgB - 1) * t;
          const ci3 = i3;
          if (colArr[ci3] !== r || colArr[ci3+1] !== g || colArr[ci3+2] !== b) {
            colArr[ci3] = r; colArr[ci3+1] = g; colArr[ci3+2] = b; colorChanged = true;
          }
        }
      }
      if (changed) pos.needsUpdate = true;
      if (colorChanged) colors.needsUpdate = true;
      return;
    }

    // direct plane intersection instead of three Raycaster object allocation
    const rect = this.hostContainer.getBoundingClientRect();
    const ndcX = this.mouse.x; // already in NDC from updateMousePosition
    const ndcY = this.mouse.y;
    const origin = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const ray = new THREE.Ray();
    origin.setFromMatrixPosition(this.camera.matrixWorld);
    dir.set(ndcX, ndcY, 0.5).unproject(this.camera).sub(origin).normalize();
    ray.set(origin, dir);
    const plane = new THREE.Plane(new THREE.Vector3(0,0,1), -this.planeArea.position.z);
    const hitPoint = new THREE.Vector3();
    const hasHit = ray.intersectPlane(plane, hitPoint) !== null;

  let attributesNeedUpdate = false;
  let colorsNeedUpdate = false;

    if (hasHit) {
      const mx = hitPoint.x;
      const my = hitPoint.y;

      const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
      const copyArr = copyPos.array as Float32Array;

      const pressed = this.isPressed;
      const area = this.data.area;
      const baseSize = this.data.particleSize;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const initX = copyArr[i3], initY = copyArr[i3+1], initZ = copyArr[i3+2];
        let px = posArr[i3], py = posArr[i3+1], pz = posArr[i3+2];

        const dx = mx - px; const dy = my - py;
        const mouseDistance = Math.hypot(dx, dy);
        const d2 = Math.max(1e-5, dx*dx + dy*dy);
  const f = -area / d2;
  // time-normalized scaling so displacement accumulates consistently across FPS
  const timeScale = dt * REF_FPS * effectSpeed; // REF_FPS keeps original tuning feel
        // color influence will be based on actual distortion from rest position

        if (pressed) {
          const t = Math.atan2(dy, dx);
          px -= f * Math.cos(t) * timeScale; py -= f * Math.sin(t) * timeScale;
          // Heat gain originally 0.1 per frame => 0.1 * REF_FPS per second
          const heatGainPerSec = 0.1 * REF_FPS;
          this.heatLevels[i] = Math.min(this.heatLevels[i] + heatGainPerSec * dt * effectSpeed, 1.0);
          attributesNeedUpdate = true;
        } else if (mouseDistance < area) {
          const t = Math.atan2(dy, dx);
          px += f * Math.cos(t) * timeScale; py += f * Math.sin(t) * timeScale;
          attributesNeedUpdate = true;
          const distortion = Math.hypot(px - initX, py - initY);
          if (distortion > this.data.distortionThreshold) {
            const perFrameAdd = Math.min(distortion / 50, 0.1);
            const perSecAdd = perFrameAdd * REF_FPS;
            this.heatLevels[i] = Math.min(this.heatLevels[i] + perSecAdd * dt * effectSpeed, 1.0);
            if (this.particleStates[i] === 0 && this.heatLevels[i] > this.data.symbolHeatRequirement) {
              // Convert original per-frame probability into per-second lambda approximation
              const pFrame = this.getSymbolProbability(distortion); // tuned for ~REF_FPS
              // For small probabilities: lambda ≈ pFrame * REF_FPS
              const lambdaPerSec = -Math.log(Math.max(1e-6, 1 - pFrame)) * REF_FPS; // stable even if pFrame larger
              const pThisFrame = 1 - Math.exp(-lambdaPerSec * dt * effectSpeed);
              if (Math.random() < pThisFrame) {
                this.particleStates[i] = 1;
                stateArr[i] = 1.0;
                const symbolScale = this.getSymbolScale();
                const mods = this.SYMBOL_SIZE_MODIFIERS[this.currentScreenSizeType];
                const minAdj = this.data.minSymbolSize * mods.minMul;
                const maxAdj = this.data.maxSymbolSize * mods.maxMul;
                const randomSymbolSize = minAdj + Math.random() * (maxAdj - minAdj);
                const randomSymbolIndex = Math.floor(Math.random() * this.matrixSymbols.length);
                // Apply text-anchored scaling so symbols maintain proportion to text PLUS global debug multiplier.
                const ratio = this.SCREEN_SYMBOL_RATIO[this.currentScreenSizeType] ?? 1.0;
                const finalSize = baseSize * randomSymbolSize * symbolScale * ratio * this.globalSymbolSizeMul;
                sizeArr[i] = finalSize;
                // Debug instrumentation capture
                this.lastSpawnComputedSize = finalSize;
                this.lastSpawnRawRandom = randomSymbolSize;
                this.lastSpawnSymbolScale = symbolScale;
                this.lastSpawnScreenType = this.currentScreenSizeType;
                this.activeSymbolFactors[i] = randomSymbolSize;
                indexArr[i] = randomSymbolIndex;
                const c = this.getVariedSymbolColor();
                const ci3 = i3;
                colArr[ci3] = c.r; colArr[ci3+1] = c.g; colArr[ci3+2] = c.b;
                colorsNeedUpdate = true; attributesNeedUpdate = true;
                // metrics: count spawn
                this.symbolsSpawnedInWindow++;
              }
            }
          }
        }

        if (this.particleStates[i] === 1) {
          this.activeSymbolsCount++;
          const currentSize = sizeArr[i];
          const newSize = Math.max(baseSize, currentSize - this.fadeOutRatesPerSec[i] * dt * effectSpeed);
          if (currentSize !== newSize) { sizeArr[i] = newSize; attributesNeedUpdate = true; }
          // heat decay while symbol active
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - (this.cooldownRates[i] * this.data.symbolCooldownSpeedMultiplier) * dt * effectSpeed);
          const fadeThreshold = baseSize + 0.01;
          if (newSize <= fadeThreshold) {
            this.particleStates[i] = 0;
            stateArr[i] = 0.0;
            sizeArr[i] = baseSize;
            this.activeSymbolFactors[i] = 0;
            this.activeSymbolFactors[i] = 0;
            attributesNeedUpdate = true;
          }
        } else {
          // Distortion-driven color: map distance from rest to target greenness [0..1]
          const d = Math.hypot(px - initX, py - initY);
          let target = clamp01((d - this.colorParams.colorMinDistort) / Math.max(1e-6, (this.colorParams.colorMaxDistort - this.colorParams.colorMinDistort)));
          if (pressed) target = clamp01(target * 1.1);
          let prog = this.colorProgress[i];
          const increasing = target > prog;
          const rate = (increasing ? this.colorParams.riseLerpPerSec * this.riseRateMul[i]
                                   : this.colorParams.fallLerpPerSec * this.fallRateMul[i]);
          const step = Math.min(Math.abs(target - prog), rate * dt);
          prog += Math.sign(target - prog) * step;
          if (increasing) {
            this.whiteCooldownTimeSec[i] = Math.max(this.whiteCooldownTimeSec[i], this.colorParams.minTimeToWhite);
          } else if (target <= 0 && this.whiteCooldownTimeSec[i] > 0) {
            prog = Math.max(0.05, prog);
            this.whiteCooldownTimeSec[i] -= dt * effectSpeed;
          }
          prog = clamp01(prog);
          this.colorProgress[i] = prog;
          const t = Math.pow(prog, this.colorParams.curveShape);
          const r = 1 + (tgR - 1) * t;
          const g = 1 + (tgG - 1) * t;
          const b = 1 + (tgB - 1) * t;
          const ci3 = i3;
          if (colArr[ci3] !== r || colArr[ci3+1] !== g || colArr[ci3+2] !== b) {
            colArr[ci3] = r; colArr[ci3+1] = g; colArr[ci3+2] = b; colorsNeedUpdate = true;
          }
        }

        if (this.heatLevels[i] > 0 && this.particleStates[i] === 0) {
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - this.cooldownRates[i] * dt * effectSpeed);
        }

        const prevPx = px, prevPy = py, prevPz = pz;
  const decayFollow = decayFromDt(dt);
  px = initX + (px - initX) * decayFollow;
  py = initY + (py - initY) * decayFollow;
  pz = initZ + (pz - initZ) * decayFollow;
        if (px !== prevPx || py !== prevPy || pz !== prevPz) {
          posArr[i3] = px; posArr[i3+1] = py; posArr[i3+2] = pz; attributesNeedUpdate = true;
        }
      }
    } else {
      const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
      const copyArr = copyPos.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const initX = copyArr[i3], initY = copyArr[i3+1], initZ = copyArr[i3+2];
        const px = posArr[i3], py = posArr[i3+1], pz = posArr[i3+2];
  const decay = decayFromDt(dt);
  const npx = initX + (px - initX) * decay;
  const npy = initY + (py - initY) * decay;
  const npz = initZ + (pz - initZ) * decay;
        if (npx !== px || npy !== py || npz !== pz) {
          posArr[i3] = npx; posArr[i3+1] = npy; posArr[i3+2] = npz; attributesNeedUpdate = true;
        }
        // No hit: derive color from current distortion and decay
        if (this.particleStates[i] === 0) {
          const d = Math.hypot(px - initX, py - initY);
          let target = clamp01((d - this.colorParams.colorMinDistort) / Math.max(1e-6, (this.colorParams.colorMaxDistort - this.colorParams.colorMinDistort)));
          let prog = this.colorProgress[i];
          const increasing = target > prog;
          const rate = (increasing ? this.colorParams.riseLerpPerSec * this.riseRateMul[i]
                                   : this.colorParams.fallLerpPerSec * this.fallRateMul[i]);
          const step = Math.min(Math.abs(target - prog), rate * dt);
          prog += Math.sign(target - prog) * step;
          if (increasing) {
            this.whiteCooldownTimeSec[i] = Math.max(this.whiteCooldownTimeSec[i], this.colorParams.minTimeToWhite);
          } else if (target <= 0 && this.whiteCooldownTimeSec[i] > 0) {
            prog = Math.max(0.05, prog);
            this.whiteCooldownTimeSec[i] -= dt * effectSpeed;
          }
          prog = clamp01(prog);
          this.colorProgress[i] = prog;
          const t = Math.pow(prog, this.colorParams.curveShape);
          const r = 1 + (tgR - 1) * t;
          const g = 1 + (tgG - 1) * t;
          const b = 1 + (tgB - 1) * t;
          const ci3 = i3;
          if (colArr[ci3] !== r || colArr[ci3+1] !== g || colArr[ci3+2] !== b) {
            colArr[ci3] = r; colArr[ci3+1] = g; colArr[ci3+2] = b; colorsNeedUpdate = true;
          }
        }
      }
    }

    if (attributesNeedUpdate) {
      pos.needsUpdate = true;
      colors.needsUpdate = true;
      sizes.needsUpdate = true;
      symbolStates.needsUpdate = true;
      symbolIndicesBuffer.needsUpdate = true;
    }
    if (!attributesNeedUpdate && colorsNeedUpdate) {
      colors.needsUpdate = true;
    }

    // Update spawn rate window
    this.spawnWindowTime += dt;
    if (this.spawnWindowTime >= this.SPAWN_RATE_WINDOW_SEC) {
      this.symbolSpawnRate = this.symbolsSpawnedInWindow / this.spawnWindowTime; // average over window
      this.spawnWindowTime = 0;
      this.symbolsSpawnedInWindow = 0;
    }
  }
  
  public resetParticleState() {
    if (!this.particles || !this.particles.geometry) return;
    const geo = this.particles.geometry as THREE.BufferGeometry;
    const colors = geo.attributes.customColor as THREE.BufferAttribute;
    const sizes = geo.attributes.size as THREE.BufferAttribute;
    const symbolStates = geo.attributes.symbolState as THREE.BufferAttribute;
    const symbolIndicesBuffer = geo.attributes.symbolIndex as THREE.BufferAttribute;
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const count = pos.count;
    const baseColor = this.matrixColors.white;

    for (let i = 0; i < count; i++) {
      // reset state & heat
      this.particleStates[i] = 0;
      this.heatLevels[i] = 0;

      // reset geometry attributes
      symbolStates.setX(i, 0);
      sizes.setX(i, this.data.particleSize);
      const c = baseColor;
      colors.setXYZ(i, c.r, c.g, c.b);

      // randomize symbol index and per-particle rates
      const idx = Math.floor(Math.random() * this.matrixSymbols.length);
      this.symbolIndicesAttributeValues[i] = idx;
      symbolIndicesBuffer.setX(i, idx);

      const randomDuration = this.data.particleCooldownDurationMin +
        Math.random() * (this.data.particleCooldownDurationMax - this.data.particleCooldownDurationMin);
      this.cooldownRates[i] = 1 / Math.max(1, randomDuration);
      this.fadeOutRates[i] = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
    }

    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    symbolStates.needsUpdate = true;
    symbolIndicesBuffer.needsUpdate = true;
  }

  private visibleHeightAtZDepth(depth: number, camera: THREE.PerspectiveCamera): number {
    const cameraOffset = camera.position.z;
    const relativeDepth = depth - cameraOffset; 
    const vFOV = camera.fov * Math.PI / 180; 
    return 2 * Math.tan(vFOV / 2) * Math.abs(relativeDepth);
  }
  private visibleWidthAtZDepth(depth: number, camera: THREE.PerspectiveCamera): number {
    return this.visibleHeightAtZDepth(depth, camera) * camera.aspect;
  }

  // Responsive design methods
  private getScreenSizeType(): ScreenSizeType {
    const width = this.hostContainer.clientWidth;
    
    if (width <= this.SCREEN_SIZES.mobile.maxWidth) {
      return 'mobile';
    } else if (width >= this.SCREEN_SIZES.tablet.minWidth && width <= this.SCREEN_SIZES.tablet.maxWidth) {
      return 'tablet';
    } else if (width >= this.SCREEN_SIZES.laptop.minWidth && width <= this.SCREEN_SIZES.laptop.maxWidth) {
      return 'laptop';
    } else if (width >= this.SCREEN_SIZES.desktop.minWidth && width <= this.SCREEN_SIZES.desktop.maxWidth) {
      return 'desktop';
    } else if (width >= this.SCREEN_SIZES.large.minWidth && width <= this.SCREEN_SIZES.large.maxWidth) {
      return 'large';
    } else {
      return 'ultrawide';
    }
  }
  private applyResponsiveParameters(screenType: ScreenSizeType): void {
    const params = this.RESPONSIVE_PARAMS[screenType];
    
    if (params.amount !== undefined) this.data.amount = params.amount;
    if (params.particleSize !== undefined) this.data.particleSize = params.particleSize;
    if (params.textSize !== undefined) this.data.textSize = params.textSize;
    if (params.minSymbolSize !== undefined) this.data.minSymbolSize = params.minSymbolSize;
    if (params.maxSymbolSize !== undefined) this.data.maxSymbolSize = params.maxSymbolSize;
    if (params.area !== undefined) this.data.area = params.area;
  }

  public checkScreenSizeChange(): boolean {
    const currentWidth = this.hostContainer.clientWidth;
    const currentHeight = this.hostContainer.clientHeight;
    
    const widthChange = Math.abs(currentWidth - this.lastKnownWidth);
    const heightChange = Math.abs(currentHeight - this.lastKnownHeight);
    const significantChange = widthChange > 100 || heightChange > 100 || 
                             widthChange / this.lastKnownWidth > 0.1 || 
                             heightChange / this.lastKnownHeight > 0.1;
    
    if (significantChange) {
      const newScreenType = this.getScreenSizeType();
      
      if (newScreenType !== this.currentScreenSizeType) {
        this.currentScreenSizeType = newScreenType;
        this.applyResponsiveParameters(newScreenType);
        this.lastKnownWidth = currentWidth;
        this.lastKnownHeight = currentHeight;
        this.needsParticleRegeneration = true;
        return true;
      }
    }
    
    return false;
  }

  public regenerateParticles(): void {
    if (!this.needsParticleRegeneration) return;
    
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      const material = this.particles.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    }
    
    this.createText();
    
    this.needsParticleRegeneration = false;
  }
  
  public dispose() {
    this.unbindInteractionEvents();
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      const material = this.particles.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    }
    if (this.geometryCopy) this.geometryCopy.dispose();
    if (this.symbolsTexture) this.symbolsTexture.dispose();
    if (this.planeArea) {
      this.scene.remove(this.planeArea);
      this.planeArea.geometry.dispose();
      const material = this.planeArea.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) {
         material.forEach(m => m.dispose());
      } else {
        (material as THREE.Material).dispose();
      }
    }
  }

  public getAmount(): number { return this.data.amount; }
  public setAmount(amount: number): void { this.data.amount = Math.max(100, Math.floor(amount)); }
  public rebuildWithAmount(amount: number): void {
    this.setAmount(amount);
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      const material = this.particles.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) { material.forEach(m => m.dispose()); } else { material.dispose(); }
    }
    this.createText();
  }

  // --- Public metrics API ---
  public getMetrics() {
    const count = this.particles ? (this.particles.geometry as THREE.BufferGeometry).attributes.position.count : 0;
    // compute heat stats lazily
    let heatSum = 0; let heatMax = 0;
    for (let i = 0; i < this.heatLevels.length; i++) {
      const h = this.heatLevels[i];
      heatSum += h;
      if (h > heatMax) heatMax = h;
    }
    const avgHeat = this.heatLevels.length > 0 ? heatSum / this.heatLevels.length : 0;
    return {
      particleCount: count,
      activeSymbols: this.activeSymbolsCount,
      spawnRate: this.symbolSpawnRate, // per second
      avgHeat,
      maxHeat: heatMax
    };
  }
}