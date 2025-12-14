<!-- src/lib/components/sections/ContactEffect.svelte -->
<script context="module" lang="ts">
  // Public instance API for the orchestrator to call.
  export type ContactEffectInstance = {
    initializeEffect: (signal?: AbortSignal) => Promise<void>;
    onEnterSection: () => void;
    onLeaveSection: () => void;
    onTransitionComplete: () => void;
    onUnload: () => void;
  };
</script>

<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
  import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
  import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
  import { gsap } from 'gsap';
  import { prefersReducedMotion as prm } from '$lib/stores/renderProfile';
  import type { ShaderMaterial } from 'three';

  let container: HTMLDivElement;
  let effectInstance: RaymarchingEffect | null = null;
  let isInitialized = false;
  let initPromise: Promise<void> | null = null;

  // -----------------------------
  // Animation Lifecycle API
  // -----------------------------
  export async function initializeEffect(signal?: AbortSignal): Promise<void> {
    if (isInitialized) return;
    if (signal?.aborted) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      await tick();
      if (!container) return;
      if (signal?.aborted) return;

      const instance = new RaymarchingEffect(container);
      try {
        await instance.init(signal);
      } catch (e) {
        // Abort (or init failure): ensure we leave no partial resources behind.
        instance.dispose();
        if (signal?.aborted) return;
        throw e;
      }

      if (signal?.aborted) {
        instance.dispose();
        return;
      }

      effectInstance = instance;
      isInitialized = true;
    })().finally(() => {
      initPromise = null;
    });

    return initPromise;
  }

  export function onEnterSection(): void {
    if (!container) return;
    gsap.set(container, { autoAlpha: 0 });
  }

  export function onTransitionComplete(): void {
    if ($prm) return;
    if (effectInstance) {
      effectInstance.neutralizeState(0);
      effectInstance.startAnimationLoop();
      gsap.to(container, { autoAlpha: 1, duration: 1.2, ease: 'power2.inOut' });
    }
  }

  export function onLeaveSection(): void {
    if (!container) return;
    gsap.killTweensOf(container);

    if (effectInstance) {
      effectInstance.neutralizeState(0.45);
    }

    gsap.to(container, {
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => {
        if (effectInstance) {
          effectInstance.stopAnimationLoop();
        }
        gsap.set(container, { autoAlpha: 0 });
      }
    });
  }

  export function onUnload(): void {
    if (container) {
      gsap.killTweensOf(container);
    }

    if (effectInstance) {
      effectInstance.dispose();
      effectInstance = null;
    }
    isInitialized = false;
    initPromise = null;
  }

  onMount(() => {
    // Initialization deferred to the animation lifecycle API.
  });

  onDestroy(() => {
    onUnload();
  });

  // Runtime reaction to reduced-motion preference
  $: if ($prm) {
    if (effectInstance) effectInstance.stopAnimationLoop();
    if (container) {
      gsap.killTweensOf(container);
      gsap.set(container, { autoAlpha: 0 });
    }
  }

  // -----------------------------
  // RaymarchingEffect class
  // -----------------------------
  class RaymarchingEffect {
    private container: HTMLElement;

    // ThreeJS core
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.OrthographicCamera;
    private material!: ShaderMaterial;
    private quad!: THREE.Mesh;

    // Post-processing
    private bloomComposer!: EffectComposer;
    private finalComposer!: EffectComposer;
    private bloomPass!: UnrealBloomPass;

    private renderTarget: THREE.WebGLRenderTarget | null = null;
    private bloomRenderTarget: THREE.WebGLRenderTarget | null = null;
    private finalPassMaterial: THREE.ShaderMaterial | null = null;

    // Animation & input
    private clock: THREE.Clock;
    private animationFrameId: number | null = null;
    private isLooping = false;
    private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: (e: TouchEvent) => void;
    private boundOnResize: () => void;
    private mousePos = new THREE.Vector2(0.5, 0.5);   // smoothed pointer (for shader)
    private targetMouse = new THREE.Vector2(0.5, 0.5); // raw pointer target

    // ----- PARAMETERS (grouped & commented for easy tuning) -----
    // Visual / lighting defaults (moody)
    private readonly AMBIENT_INTENSITY = 0.05;
    private readonly DIFFUSE_INTENSITY = 0.4;
    private readonly SPECULAR_INTENSITY = 2.0;
    private readonly SPECULAR_POWER = 8.0;
    private readonly FRESNEL_POWER = 1.0;
    private readonly CONTRAST = 1.2;
    private readonly FOG_DENSITY = 0.15;

    // Motion & spheres
    private SPHERE_COUNT = 6; // 4 for max performance
    private readonly MAX_SPHERES = 12; // keep consistent with shader define
    private readonly BLEND_SMOOTHNESS = 0.35;
    private readonly ANIMATION_SPEED = 0.9;
    private readonly CAMERA_DISTANCE = 3.0;
    private readonly MOVEMENT_PATTERN = 0;
    private readonly MOVEMENT_SPEED = 0.9;
    private readonly MOVEMENT_SCALE = 1.0;
    private readonly INDIVIDUAL_ROTATION = true;
    private readonly MOUSE_PROXIMITY_EFFECT = true;
    private readonly MOUSE_SMOOTHNESS = 0.12; // how quickly mousePos lerps to targetMouse

    // Movement smoothing / inertia (frame-rate independent)
    private readonly SCALE_SMOOTHING_RATE = 4.0;   // higher = faster response, lower = heavier inertia
    private readonly POSITION_SMOOTHING_RATE = 9.0;

    // Movement extents
    private readonly MIN_MOVEMENT_SCALE_ON_HOVER = 0.1;
    private readonly MAX_MOVEMENT_SCALE_ON_HOVER = 1.6;

    // LOD / Perf tuning
    private baseMaxSteps = 80;
    private minMaxSteps = 28;
    private pixelRatioCap = 2;
    private reducedPixelRatio = 1.0;

    // CPU -> GPU sphere buffer (x, y, z, radius) for each sphere
    private sphereData: Float32Array;
    private sphereParams: Array<{
      speed: number;
      radius: number;
      orbitBase: number;
      phase: number;
      rotOffset: number;
      pos: THREE.Vector3;        // current smoothed position
      targetPos: THREE.Vector3;  // instantaneous target position
    }>;

    // internal smoothing state
    private smoothedScale = this.MOVEMENT_SCALE;

    // Internal state
    private isDisposed = false;

    private internalScale = 1.0; // dynamic internal resolution scale (1.0 = up to 1440p cap)
    private readonly MAX_INTERNAL_DIM = 1440; // 1440p cap (applies to larger viewport dimension)

    // frame time tracking for performance scaling
    private frameTimes: number[] = [];
    private readonly FRAME_WINDOW = 40; // number of frames for moving average
    private readonly TARGET_FRAME_MS = 16.6; // 60fps budget
    private readonly HIGH_THRESHOLD = 19.5; // trigger downscale if avg above
    private readonly LOW_THRESHOLD = 14.0;  // trigger upscale if avg below
    private readonly SCALE_FLOOR = 0.6;
    private readonly SCALE_CEIL = 1.0;
    private scaleCooldown = 0; // frames until next allowed scale change
    private readonly SCALE_COOLDOWN_FRAMES = 45;

    // sphere count tiering
    private sphereTierCooldown = 0;
    private readonly SPHERE_TIER_COOLDOWN_FRAMES = 240; // 4s at 60fps
    private readonly SPHERE_TIERS = [6,4,3]; // descending complexity

    constructor(container: HTMLElement) {
      this.container = container;
      this.clock = new THREE.Clock();
      this.boundOnMouseMove = this.onMouseMove.bind(this);
  this.boundOnMouseDown = this.onMouseDown.bind(this);
  this.boundOnTouchStart = this.onTouchStart.bind(this);
  this.boundOnTouchMove = this.onTouchMove.bind(this);
  this.boundOnTouchEnd = this.onTouchEnd.bind(this);
      this.boundOnResize = this.onWindowResize.bind(this);

      // prepare typed arrays and params
      this.sphereData = new Float32Array(this.MAX_SPHERES * 4);
      this.sphereParams = [];
      for (let i = 0; i < this.MAX_SPHERES; i++) {
        this.sphereParams.push({
          speed: 0.55 + i * 0.12,
          radius: 0.12 + (i % 3) * 0.06,
          orbitBase: 0.45 + (i % 5) * 0.14,
          phase: i * Math.PI * 0.21,
          rotOffset: Math.random() * Math.PI * 2,
          pos: new THREE.Vector3(),
          targetPos: new THREE.Vector3()
        });
      }
    }

    // init is async because we dynamically import the shader source.
    public async init(signal?: AbortSignal): Promise<void> {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      this.camera.position.z = 1;

      this.setupRenderer();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const frag = await this.loadShaderWithFallback();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      this.setupMaterial(frag);

      const geometry = new THREE.PlaneGeometry(2, 2);
      this.quad = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.quad);

      this.setupPostProcessing();
      this.onWindowResize(); // sync sizes and uniforms

      // warm GPU/state
      try { this.finalComposer.render(); } catch (e) { /* noop */ }

      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  window.addEventListener('mousemove', this.boundOnMouseMove, { passive: true });
  // Mouse click locks the position as well (desktop parity with tap)
  window.addEventListener('mousedown', this.boundOnMouseDown, { passive: true });
  // Touch support: react continuously while dragging a finger
  window.addEventListener('touchstart', this.boundOnTouchStart, { passive: true });
  window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
  window.addEventListener('touchend', this.boundOnTouchEnd, { passive: true });
  window.addEventListener('touchcancel', this.boundOnTouchEnd, { passive: true });
      window.addEventListener('resize', this.boundOnResize);
    }

    // Load the optimized shader (legacy fallback removed).
    private async loadShaderWithFallback(): Promise<string> {
      const mod = await import('$lib/three/contactRaymarching_optimized.glsl?raw');
      return (mod && (mod.default ?? mod)) as string;
    }

    private setupRenderer(): void {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      // compute capped size
      const cssW = this.container.clientWidth;
      const cssH = this.container.clientHeight;
      const scale = this.internalScale;
      const aspect = cssW / Math.max(1, cssH);
      let targetW = cssW;
      let targetH = cssH;
      // cap the larger dimension at MAX_INTERNAL_DIM while preserving aspect
      if (cssW >= cssH) {
        if (cssW > this.MAX_INTERNAL_DIM) {
          targetW = this.MAX_INTERNAL_DIM;
          targetH = Math.round(targetW / aspect);
        }
      } else {
        if (cssH > this.MAX_INTERNAL_DIM) {
          targetH = this.MAX_INTERNAL_DIM;
          targetW = Math.round(targetH * aspect);
        }
      }
      targetW = Math.max(1, Math.round(targetW * scale));
      targetH = Math.max(1, Math.round(targetH * scale));
      const effectivePixelRatio = Math.min(window.devicePixelRatio || 1, this.pixelRatioCap);
      this.renderer.setPixelRatio(1); // keep manual scaling control via target sizes
      this.renderer.setSize(targetW, targetH, false);
      this.renderer.setClearColor(0x000000, 0);
      try {
        // Prefer modern SRGBColorSpace constant.
        // @ts-ignore
        this.renderer.outputColorSpace = (THREE as any).SRGBColorSpace;
      } catch (e) { /* ignore */ }
      this.container.appendChild(this.renderer.domElement);
      // ensure canvas stretches to container while content rendered at lower res
      const canvas = this.renderer.domElement;
      // Accessibility: canvas is decorative; hide from AT
      try {
        canvas.setAttribute('aria-hidden', 'true');
        canvas.setAttribute('role', 'presentation');
        canvas.setAttribute('tabindex', '-1');
      } catch {}
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.style.objectFit = 'contain';
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
    }

    private setupMaterial(fragmentShaderCode: string): void {
      const initialSteps = this.computeAdaptiveMaxSteps(this.SPHERE_COUNT);
      const sphereUniformArray = this.sphereData;

      // Uniforms: keep names compatible with optimized shader.
      const uniforms: Record<string, any> = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight) },
        uSphereCount: { value: this.SPHERE_COUNT },

        // Lighting / look
        uAmbientIntensity: { value: this.AMBIENT_INTENSITY },
        uDiffuseIntensity: { value: this.DIFFUSE_INTENSITY },
        uSpecularIntensity: { value: this.SPECULAR_INTENSITY },
        uSpecularPower: { value: this.SPECULAR_POWER },
        uFresnelPower: { value: this.FRESNEL_POWER },
        uContrast: { value: this.CONTRAST },

        // Colors & lights
        uBackgroundColor: { value: new THREE.Color(0x050505) },
        uSphereColor: { value: new THREE.Color(0x000000) }, // dark spheres by default
        uLightColor: { value: new THREE.Color(0xffffff) },
        uLightPosition: { value: new THREE.Vector3(1.0, 1.0, 1.0) },

        // Blend / smoothing
        uSmoothness: { value: this.BLEND_SMOOTHNESS },

        // Fog & camera
        uFogDensity: { value: this.FOG_DENSITY },
        uCameraDistance: { value: this.CAMERA_DISTANCE },

        // Movement & interaction (kept for CPU-driven motion)
        uAnimationSpeed: { value: this.ANIMATION_SPEED },
        uMovementPattern: { value: this.MOVEMENT_PATTERN },
        uMovementSpeed: { value: this.MOVEMENT_SPEED },
        uMovementScale: { value: this.MOVEMENT_SCALE },
        uIndividualRotation: { value: this.INDIVIDUAL_ROTATION },
        uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseProximityEffect: { value: this.MOUSE_PROXIMITY_EFFECT },
        uMinMovementScale: { value: this.MIN_MOVEMENT_SCALE_ON_HOVER },
        uMaxMovementScale: { value: this.MAX_MOVEMENT_SCALE_ON_HOVER },

        // Packed sphere data (x, y, z, r)
        uSpheres: { value: sphereUniformArray },

        // runtime step control
        uMaxSteps: { value: initialSteps }
      };

      this.material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          out vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: fragmentShaderCode,
        glslVersion: THREE.GLSL3,
        transparent: true
      }) as ShaderMaterial;

      // compile-time defines for shader array sizes & step bounds (keeps in sync with JS)
      this.material.defines = this.material.defines || {};
      this.material.defines.MAX_SPHERES = String(this.MAX_SPHERES);
      this.material.defines.MAX_STEPS = String(initialSteps);
      // tunable shadow steps (compile-time). If you change, shader recompile required.
      this.material.defines.SHADOW_STEPS = String(16);
      this.material.needsUpdate = true;

      // keep typed-array reference for uSpheres (no heavy allocation at runtime)
      this.material.uniforms.uSpheres.value = sphereUniformArray;
    }

    private setupPostProcessing(): void {
      const cssW = this.container.clientWidth;
      const cssH = this.container.clientHeight;
      const aspect = cssW / Math.max(1, cssH);
      // compute internal target size consistent with renderer (reuse resize logic subset)
      let baseW = cssW >= cssH ? Math.min(cssW, this.MAX_INTERNAL_DIM) : Math.round(Math.min(cssH, this.MAX_INTERNAL_DIM) * aspect);
      let baseH = cssW >= cssH ? Math.round(baseW / aspect) : Math.min(cssH, this.MAX_INTERNAL_DIM);
      baseW = Math.max(1, Math.round(baseW * this.internalScale));
      baseH = Math.max(1, Math.round(baseH * this.internalScale));

      const halfW = Math.max(1, Math.round(baseW * 0.5));
      const halfH = Math.max(1, Math.round(baseH * 0.5));

      this.renderTarget = new THREE.WebGLRenderTarget(baseW, baseH, { format: THREE.RGBAFormat });
      this.bloomRenderTarget = new THREE.WebGLRenderTarget(halfW, halfH, { format: THREE.RGBAFormat });

      const renderScene = new RenderPass(this.scene, this.camera);
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(halfW, halfH), 0.30, 0.5, 0.20);

      this.bloomComposer = new EffectComposer(this.renderer, this.bloomRenderTarget);
      this.bloomComposer.renderToScreen = false;
      this.bloomComposer.addPass(renderScene);
      this.bloomComposer.addPass(this.bloomPass);

      this.finalComposer = new EffectComposer(this.renderer, this.renderTarget);
      this.finalComposer.addPass(renderScene);

      // Compose bloom + base while preserving transparency (apply bloom only where base has alpha)
      this.finalPassMaterial = new THREE.ShaderMaterial({
          uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: this.bloomRenderTarget.texture }
          },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
              vec4 baseColor = texture2D(baseTexture, vUv);
              vec4 bloomColor = texture2D(bloomTexture, vUv);
              // preserve transparency: blend bloom only where base exists
              gl_FragColor = vec4(baseColor.rgb + bloomColor.rgb * baseColor.a, baseColor.a);
            }
          `,
          transparent: true,
          depthWrite: false
        });

      const finalPass = new ShaderPass(this.finalPassMaterial, "baseTexture");

      const fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.material.uniforms['resolution'].value.set(1 / this.container.clientWidth, 1 / this.container.clientHeight);
      const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

      this.finalComposer.addPass(finalPass);
      this.finalComposer.addPass(fxaaPass);
      this.finalComposer.addPass(gammaCorrectionPass);

      // hook up finalPass baseTexture to composer target (if available)
      finalPass.uniforms.baseTexture.value = this.finalComposer.renderTarget2?.texture ?? null;
    }

    // Public controls
    public startAnimationLoop(): void {
      if (this.isLooping) return;
      this.isLooping = true;
      this.clock.start();
      this.animate();
    }

    public stopAnimationLoop(): void {
      if (!this.isLooping) return;
      this.isLooping = false;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.clock.stop();
    }

    // Smoothly reset interactive state (mouse) and clock
    public neutralizeState(duration = 0.6): void {
      gsap.killTweensOf(this.targetMouse);
      gsap.to(this.targetMouse, {
        x: 0.5,
        y: 0.5,
        duration,
        ease: 'power2.out'
      });
      // reset clock to avoid abrupt jumps in procedural movement
      this.clock = new THREE.Clock();
    }

    // core animate loop
    private animate(): void {
      if (!this.isLooping || this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(() => this.animate());
      this.render();
    }

    // primary render path: update CPU sphere buffer, uniforms, run composer
    private render(): void {
      // compute delta (frame-rate independent smoothing)
      const dt = Math.min(0.05, this.clock.getDelta()); // clamp dt to avoid spikes
      const frameMs = dt * 1000.0;
      // performance tracking (dynamic scaling)
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length > this.FRAME_WINDOW) this.frameTimes.shift();
      if (this.scaleCooldown > 0) this.scaleCooldown--;
      if (this.frameTimes.length === this.FRAME_WINDOW && this.scaleCooldown === 0) {
        const avg = this.frameTimes.reduce((a,b)=>a+b,0) / this.frameTimes.length;
        let changed = false;
        if (avg > this.HIGH_THRESHOLD && this.internalScale > this.SCALE_FLOOR) {
          this.internalScale = Math.max(this.SCALE_FLOOR, +(this.internalScale - 0.1).toFixed(2));
          changed = true;
        } else if (avg < this.LOW_THRESHOLD && this.internalScale < this.SCALE_CEIL) {
          this.internalScale = Math.min(this.SCALE_CEIL, +(this.internalScale + 0.1).toFixed(2));
          changed = true;
        }
        if (changed) {
          this.scaleCooldown = this.SCALE_COOLDOWN_FRAMES;
          this.onWindowResize();
        }
        this.adjustSphereTier(avg); // <-- NEW TIERING LOGIC CALL
      }
      const elapsed = this.clock.getElapsedTime() * this.ANIMATION_SPEED;
      // Smooth mouse target -> smoothed mouse for shader
      this.mousePos.x += (this.targetMouse.x - this.mousePos.x) * (1.0 - Math.exp(-this.MOUSE_SMOOTHNESS * 60.0 * dt));
      this.mousePos.y += (this.targetMouse.y - this.mousePos.y) * (1.0 - Math.exp(-this.MOUSE_SMOOTHNESS * 60.0 * dt));

      if (this.material && this.material.uniforms) {
        this.material.uniforms.uTime.value = elapsed;
        const mp: THREE.Vector2 = this.material.uniforms.uMousePosition.value as THREE.Vector2;
        if (mp) { mp.x = this.mousePos.x; mp.y = this.mousePos.y; }

        this.material.uniforms.uSphereCount.value = Math.min(this.SPHERE_COUNT, this.MAX_SPHERES);
        this.material.uniforms.uResolution.value.set(this.container.clientWidth, this.container.clientHeight);
      }

      // update sphere positions (CPU) using smoothedScale and per-sphere lerp
      this.updateSphereData(elapsed, dt);

      // render (bloom composer + final composer pipeline)
      try {
        if (this.bloomComposer) this.bloomComposer.render();
        if (this.finalComposer) this.finalComposer.render();
        else this.renderer.render(this.scene, this.camera);
      } catch (e) {
        console.warn('ContactEffect: render exception', e);
      }
    }

    // CPU-side sphere motion (fast), writes into this.sphereData
    private updateSphereData(t: number, dt: number): void {
      // 1) compute immediate targetScale based on mouse distance from center
      let targetScale = this.MOVEMENT_SCALE;
      if (this.MOUSE_PROXIMITY_EFFECT) {
        const dx = this.targetMouse.x - 0.5;
        const dy = this.targetMouse.y - 0.5;
        let distToCenter = Math.hypot(dx, dy) * 2.0;
        distToCenter = Math.min(Math.max(distToCenter, 0.0), 1.0);
        // IMPORTANT: inverted mapping — farther pointer => LARGER orbit
        targetScale = this.MIN_MOVEMENT_SCALE_ON_HOVER + (this.MAX_MOVEMENT_SCALE_ON_HOVER - this.MIN_MOVEMENT_SCALE_ON_HOVER) * distToCenter;
      }

      // 2) smooth overall scale (frame-rate independent)
      const scaleAlpha = 1.0 - Math.exp(-this.SCALE_SMOOTHING_RATE * dt);
      this.smoothedScale += (targetScale - this.smoothedScale) * scaleAlpha;

      // 3) per-sphere compute instantaneous target position using smoothedScale,
      //    then smooth each sphere's position toward its target via lerp using POSITION_SMOOTHING_RATE
      const posAlpha = 1.0 - Math.exp(-this.POSITION_SMOOTHING_RATE * dt);
      const count = Math.min(this.SPHERE_COUNT, this.MAX_SPHERES);
      let idx = 0;

      for (let i = 0; i < this.MAX_SPHERES; i++) {
        if (i < count) {
          const sp = this.sphereParams[i];
          const speed = sp.speed;
          const radius = sp.radius;
          const orbit = sp.orbitBase * this.smoothedScale;
          const phase = sp.phase;

          // compute raw target (same movement patterns as before)
          let tx = 0, ty = 0, tz = 0;
          if (this.MOVEMENT_PATTERN === 0) {
            tx = Math.sin(t * speed + phase) * orbit;
            ty = Math.cos(t * (speed * 0.72) + phase * 1.2) * (orbit * 0.55);
            tz = Math.sin(t * (speed * 0.48) + phase * 0.9) * (orbit * 0.9);
          } else if (this.MOVEMENT_PATTERN === 1) {
            const wave = Math.sin(t * 0.5) * 0.5;
            tx = Math.sin(t * 0.2 + i * 0.5) * orbit;
            ty = Math.sin(t * 0.3 + i * 0.7 + wave) * orbit * 0.5;
            tz = Math.cos(t * 0.4 + i * 0.6) * orbit * 0.7;
          } else if (this.MOVEMENT_PATTERN === 2) {
            tx = Math.sin(t * speed * 1.1 + Math.sin(t * 0.4) * 2.0) * orbit;
            ty = Math.cos(t * speed * 0.9 + Math.sin(t * 0.5) * 1.5) * orbit * 0.8;
            tz = Math.sin(t * speed * 0.7 + Math.sin(t * 0.6) * 1.8) * orbit * 0.6;
          } else {
            const pulse = (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.5 + 0.5;
            tx = Math.sin(t * speed + phase) * orbit * pulse;
            ty = Math.cos(t * (speed * 0.7) + phase * 1.3) * (orbit * 0.6) * pulse;
            tz = Math.sin(t * (speed * 0.5) + phase * 0.9) * (orbit * 0.8) * pulse;
          }

          // optional local rotation
          if (this.INDIVIDUAL_ROTATION) {
            const rs = t * (0.15 + i * 0.04) + sp.rotOffset;
            const c = Math.cos(rs);
            const s = Math.sin(rs);
            const rx = tx * c + tz * s;
            const rz = -tx * s + tz * c;
            tx = rx; tz = rz;
          }

          // set instantaneous target and lerp current pos toward it
          sp.targetPos.set(tx, ty, tz);
          sp.pos.lerp(sp.targetPos, posAlpha);

          // pack into sphereData typed array
          this.sphereData[idx++] = sp.pos.x;
          this.sphereData[idx++] = sp.pos.y;
          this.sphereData[idx++] = sp.pos.z;
          this.sphereData[idx++] = sp.radius;
        } else {
          // unused slot marker
          this.sphereData[idx++] = 0;
          this.sphereData[idx++] = 0;
          this.sphereData[idx++] = 0;
          this.sphereData[idx++] = -9999.0;
        }
      }

      // push to GPU uniform (no allocation)
      if (this.material?.uniforms?.uSpheres) {
        this.material.uniforms.uSpheres.value = this.sphereData;
      }

      // Update uMaxSteps adaptively if desired (optionally throttle recompile)
      const newSteps = this.computeAdaptiveMaxSteps(this.SPHERE_COUNT);
      if (this.material) {
        // runtime uniform (fast)
        if (this.material.uniforms.uMaxSteps) this.material.uniforms.uMaxSteps.value = newSteps;
        // update define (rare) if different
        if (String(this.material.defines?.MAX_STEPS) !== String(newSteps)) {
          this.material.defines = this.material.defines || {};
          this.material.defines.MAX_STEPS = String(newSteps);
          this.material.needsUpdate = true;
        }
      }
    }

    // compute adaptive max steps based on sphere count to reduce raymarch cost
    private computeAdaptiveMaxSteps(sphereCount: number): number {
      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
      const reduction = Math.floor((sphereCount / this.MAX_SPHERES) * (this.baseMaxSteps - this.minMaxSteps));
      let steps = this.baseMaxSteps - reduction;
      // additional scaling reduction when internalScale < 1
      if (this.internalScale < 0.95) {
        const scaleFactor = 0.5 + 0.5 * this.internalScale; // at 0.6 => 0.8, at 1.0 =>1.0
        steps = Math.round(steps * scaleFactor);
      }
      return clamp(steps, this.minMaxSteps, this.baseMaxSteps);
    }

    // Interaction
    private onMouseMove(e: MouseEvent) {
      const rect = this.container.getBoundingClientRect();
  const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const ny = 1.0 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)); // match shader Y orientation
      this.targetMouse.x = nx;
      this.targetMouse.y = ny;

      // quick immediate update to uniform for snappy feel
      if (this.material && this.material.uniforms && this.material.uniforms.uMousePosition) {
        const mp: THREE.Vector2 = this.material.uniforms.uMousePosition.value as THREE.Vector2;
        if (mp) {
          mp.x = this.targetMouse.x;
          mp.y = this.targetMouse.y;
        }
      }
    }

    private onMouseDown(e: MouseEvent) {
      const rect = this.container.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const ny = 1.0 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      this.targetMouse.set(nx, ny);
      const mp: THREE.Vector2 | undefined = this.material?.uniforms?.uMousePosition?.value as THREE.Vector2 | undefined;
      if (mp) { mp.set(this.targetMouse.x, this.targetMouse.y); }
    }

    // Touch handlers to support dragging on mobile/tablet
    private onTouchStart(e: TouchEvent) {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = this.container.getBoundingClientRect();
  const nx = Math.min(1, Math.max(0, (t.clientX - rect.left) / rect.width));
  const ny = 1.0 - Math.min(1, Math.max(0, (t.clientY - rect.top) / rect.height));
      this.targetMouse.set(nx, ny);
      // immediate uniform push
      const mp: THREE.Vector2 | undefined = this.material?.uniforms?.uMousePosition?.value as THREE.Vector2 | undefined;
      if (mp) { mp.set(this.targetMouse.x, this.targetMouse.y); }
    }

    private onTouchMove(e: TouchEvent) {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = this.container.getBoundingClientRect();
  const nx = Math.min(1, Math.max(0, (t.clientX - rect.left) / rect.width));
  const ny = 1.0 - Math.min(1, Math.max(0, (t.clientY - rect.top) / rect.height));
      this.targetMouse.set(nx, ny);
      // immediate uniform push for responsiveness during drag
      const mp: THREE.Vector2 | undefined = this.material?.uniforms?.uMousePosition?.value as THREE.Vector2 | undefined;
      if (mp) { mp.set(this.targetMouse.x, this.targetMouse.y); }
    }

    private onTouchEnd(_e: TouchEvent) {
  // Hold last position on touch release (no automatic recenter)
  // A new tap/drag will move and re-lock the position.
    }

    // Resize handling and LOD adjustments
    private onWindowResize(): void {
      if (!this.renderer) return;
      const cssW = this.container.clientWidth;
      const cssH = this.container.clientHeight;
      const aspect = cssW / Math.max(1, cssH);
      let targetW = cssW;
      let targetH = cssH;
      if (cssW >= cssH) {
        if (cssW > this.MAX_INTERNAL_DIM) {
          targetW = this.MAX_INTERNAL_DIM;
          targetH = Math.round(targetW / aspect);
        }
      } else {
        if (cssH > this.MAX_INTERNAL_DIM) {
          targetH = this.MAX_INTERNAL_DIM;
          targetW = Math.round(targetH * aspect);
        }
      }
      targetW = Math.max(1, Math.round(targetW * this.internalScale));
      targetH = Math.max(1, Math.round(targetH * this.internalScale));
      this.renderer.setSize(targetW, targetH, false);
      const canvas = this.renderer.domElement;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      // update composers if present
      if (this.bloomComposer) this.bloomComposer.setSize(targetW, targetH);
      if (this.finalComposer) this.finalComposer.setSize(targetW, targetH);
      const fxaaPass = (this.finalComposer?.passes || []).find((p: any) => p?.material?.uniforms?.resolution) as ShaderPass | undefined;
      if (fxaaPass) {
        fxaaPass.material.uniforms['resolution'].value.set(1 / targetW, 1 / targetH);
      }
      if (this.material?.uniforms?.uResolution) {
        (this.material.uniforms.uResolution.value as THREE.Vector2).set(targetW, targetH);
      }
      const newSteps = this.computeAdaptiveMaxSteps(this.SPHERE_COUNT);
      if (this.material) {
        if (this.material.uniforms.uMaxSteps) this.material.uniforms.uMaxSteps.value = newSteps;
        if (String(this.material.defines?.MAX_STEPS) !== String(newSteps)) {
          this.material.defines = this.material.defines || {};
          this.material.defines.MAX_STEPS = String(newSteps);
          this.material.needsUpdate = true;
        }
      }
    }

    public setSphereCount(count: number): void {
      this.SPHERE_COUNT = Math.max(0, Math.min(count, this.MAX_SPHERES));
      if (this.material?.uniforms?.uSphereCount) this.material.uniforms.uSphereCount.value = this.SPHERE_COUNT;
      this.onWindowResize();
    }

    private adjustSphereTier(avgFrameMs: number) {
      if (this.sphereTierCooldown > 0) { this.sphereTierCooldown--; return; }
      if (this.internalScale > this.SCALE_FLOOR + 0.001) return; // only when already at scale floor
      if (avgFrameMs > this.HIGH_THRESHOLD + 1.5) {
        // reduce complexity
        for (let i = 0; i < this.SPHERE_TIERS.length; i++) {
          if (this.SPHERE_COUNT > this.SPHERE_TIERS[i]) {
            this.setSphereCount(this.SPHERE_TIERS[i]);
            this.sphereTierCooldown = this.SPHERE_TIER_COOLDOWN_FRAMES;
            break;
          }
        }
      } else if (avgFrameMs < this.LOW_THRESHOLD - 1.0) {
        // restore complexity upward
        for (let i = this.SPHERE_TIERS.length - 1; i >= 0; i--) {
          if (this.SPHERE_COUNT < this.SPHERE_TIERS[i]) {
            this.setSphereCount(this.SPHERE_TIERS[i]);
            this.sphereTierCooldown = this.SPHERE_TIER_COOLDOWN_FRAMES;
            break;
          }
        }
      }
    }

    // Dispose and clean everything
    public dispose(): void {
      this.isDisposed = true;
      this.stopAnimationLoop();
      try { gsap.killTweensOf(this.targetMouse); } catch {}
      window.removeEventListener('mousemove', this.boundOnMouseMove);
  window.removeEventListener('mousedown', this.boundOnMouseDown as any);
  window.removeEventListener('touchstart', this.boundOnTouchStart as any);
  window.removeEventListener('touchmove', this.boundOnTouchMove as any);
  window.removeEventListener('touchend', this.boundOnTouchEnd as any);
  window.removeEventListener('touchcancel', this.boundOnTouchEnd as any);
      window.removeEventListener('resize', this.boundOnResize);

      try {
        if (this.quad) {
          this.quad.geometry?.dispose();
          (this.quad.material as THREE.Material)?.dispose();
          this.scene.remove(this.quad);
        }
      } catch (e) { /* ignore */ }

      try {
        (this.bloomComposer as any)?.dispose?.();
        (this.finalComposer as any)?.dispose?.();
      } catch (e) { /* ignore */ }

      try {
        this.finalPassMaterial?.dispose();
        this.finalPassMaterial = null;
      } catch (e) { /* ignore */ }

      try {
        this.bloomPass?.dispose?.();
      } catch (e) { /* ignore */ }

      try {
        this.bloomRenderTarget?.dispose();
        this.bloomRenderTarget = null;
        this.renderTarget?.dispose();
        this.renderTarget = null;
      } catch (e) { /* ignore */ }

      try {
        if (this.renderer) {
          this.renderer.forceContextLoss();
          const canvas = this.renderer.domElement;
          if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
          // @ts-ignore
          this.renderer.domElement = null;
          // @ts-ignore
          this.renderer.context = null;
          // @ts-ignore
          this.renderer = null;
        }
      } catch (e) { /* ignore */ }
    }
  }
</script>

<!-- container for the canvas. The effect creates and appends the canvas internally -->
<div class="contact-effect-container" bind:this={container} aria-hidden="true" role="presentation"></div>

<style>
  .contact-effect-container {
    position: absolute;
    inset: 0;
    z-index: 0;
    visibility: hidden; /* orchestrator toggles via gsap autoAlpha */
    opacity: 0;
    pointer-events: none;
  }
  /* ensure canvas fills parent */
  /* Use :global(canvas) because the canvas element is created dynamically in JS and doesn't get the Svelte scoping attribute. */
  .contact-effect-container :global(canvas) {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
