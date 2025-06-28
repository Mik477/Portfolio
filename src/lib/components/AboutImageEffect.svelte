<!-- src/lib/components/AboutImageEffect.svelte -->
<script context="module" lang="ts">
  export type AboutImageEffectInstance = {
    onEnterSection: () => void;
    onLeaveSection: () => void;
  };
</script>

<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { gsap } from 'gsap';
  import { BloomEffect } from '$lib/three/BloomEffect';

  export let imageUrl: string;
  export let fadeInDelay: number = 250;
  export let effectStartDelay: number = 400; 

  let mainContainer: HTMLDivElement;
  let imageElement: HTMLImageElement;
  let particleOverlayElement: HTMLDivElement;

  let effectInstance: DigitalDecayEffect | null = null;
  let isInitialized = false;
  let fadeInTimeoutId: number | undefined;
  let effectStartTimeoutId: number | undefined;

  // --- Component API ---

  export async function onEnterSection() {
    if (!isInitialized) {
      await initialize();
    }
    
    if (effectInstance) {
      clearTimeout(fadeInTimeoutId);
      clearTimeout(effectStartTimeoutId);
      
      fadeInTimeoutId = window.setTimeout(() => {
        gsap.to(mainContainer, { autoAlpha: 1, duration: 1.2, ease: 'power2.inOut' });
      }, fadeInDelay);
      
      effectStartTimeoutId = window.setTimeout(() => {
        if (effectInstance) {
          effectInstance.start();
        }
      }, fadeInDelay + effectStartDelay);
    }
  }

  export function onLeaveSection() {
    clearTimeout(fadeInTimeoutId);
    clearTimeout(effectStartTimeoutId);
    if (effectInstance) {
      effectInstance.beginLeaveAnimation();
      gsap.killTweensOf(mainContainer);
      gsap.set(mainContainer, { autoAlpha: 0 });
    }
  }
  
  // --- Lifecycle & Initialization ---

  async function initialize() {
    await tick();
    if (!particleOverlayElement || !imageElement || isInitialized) return;
    effectInstance = new DigitalDecayEffect(particleOverlayElement, imageElement);
    isInitialized = true;
  }

  onMount(() => {
    // Initialization remains deferred.
  });

  onDestroy(() => {
    clearTimeout(fadeInTimeoutId);
    clearTimeout(effectStartTimeoutId);
    if (effectInstance) {
      effectInstance.dispose();
      effectInstance = null;
    }
  });

  // --- DigitalDecayEffect Class with Tunable Parameters ---

  interface GridCell { state: number; timer: number; opacity: number; }
  interface Particle { index: number; active: boolean; originalPos: THREE.Vector2; amplitude: number; timeOffset: number; speed: number; lifetime: number; age: number; size: number; color: THREE.Color; symbolIndex: number; gridCellIndex: number; lastSymbolChange: number; symbolChangeInterval: number; }

  class DigitalDecayEffect {
    private overlayContainer: HTMLElement;
    private image: HTMLImageElement;
    private clock: THREE.Clock | null = null;
    private animationFrameId: number | null = null;
    
    private width = 0;
    private height = 0;
    private scene!: THREE.Scene;
    private camera!: THREE.OrthographicCamera;
    private renderer!: THREE.WebGLRenderer;
    private bloomEffect!: BloomEffect;

    // =================================================================
    // --- EFFECT PARAMETERS (grouped for easy tuning) ---
    // =================================================================

    // --- Grid & Spawning ---
    private readonly CELL_SIZE = 9; // Size of the grid cells that spawn particles.
    private readonly BASE_CHANCE = 0.003; // Max probability of a cell decaying per frame.
    private readonly PROBABILITY_DECAY_FACTOR = 9; // How quickly the spawn chance falls off from left to right. Higher = more concentrated on the left.
    private readonly SPAWN_AREA_WIDTH = 0.5; // Percentage of the image width (from the left) where particles can spawn.
    private readonly REGENERATION_TIME = 1.5; // Seconds a grid cell waits after its particle dies before it can decay again.
    private readonly ONSET_DURATION = 4.0; // Seconds over which the spawn chance ramps up from 0 to BASE_CHANCE.

    // --- Particle Behavior ---
    private readonly MAX_ACTIVE_PARTICLES = 2000;
    private readonly PARTICLE_LIFETIME = { min: 4, max: 8 }; // Seconds a particle lives.
    private readonly PARTICLE_SPEED = 0.25; // Base horizontal travel speed.
    private readonly PARTICLE_SPEED_VARIATION = 0.5; // Randomness in speed (e.g., 0.5 = +/- 50%).
    private readonly AMPLITUDE = { min: 90, max: 210 }; // Horizontal distance a particle travels.
    private readonly SYMBOL_CHANGE_INTERVAL = 1.5; // Base time in seconds between a particle changing its symbol.
    private readonly SYMBOL_CHANGE_VARIATION = 0.8; // Randomness in symbol change timing.

    // --- Appearance & Colors ---
    private readonly PARTICLE_FADE_IN_DURATION = 0.4; // Seconds for a particle to fade in.
    private readonly PARTICLE_FADEOUT_DURATION = 0.3; // Seconds for a particle to fade out at the end of its life.
    private readonly PARTICLE_BASE_OPACITY = 0.9;
    private readonly BLACKOUT_FADE_DURATION = 0.35; // Seconds for the black squares to fade in/out.
    private readonly SYMBOLS = [ '日', '〇', 'ハ', 'ミ', 'ヒ', 'ウ', 'シ', 'ナ', 'モ', 'サ', 'ワ', 'ツ', 'オ', 'リ', 'ア', 'ホ', 'テ', 'マ', 'ケ', 'メ', 'エ', 'カ', 'キ', 'ム', 'ユ', 'ラ', 'セ', 'ネ', 'ヲ', 'イ', 'ク', 'コ', 'ソ', 'タ', 'チ', 'ト', 'ノ', 'フ', 'ヘ', 'ヤ', 'ヨ', 'ル', 'レ', 'ロ', '∆', 'δ', 'ε', 'ζ', 'η', 'θ', '∃', '∄', '∅', 'Д' ];
    private readonly SYMBOL_COLORS = [ new THREE.Color(0.0, 0.95, 0.05), new THREE.Color(0.0, 1.0, 0.0), new THREE.Color(0.3, 1.0, 0.3) ];
    private readonly BLACKOUT_COLOR = new THREE.Color('#09090b');
    
    // =================================================================

    private STATE = { IDLE: 0, ACTIVE: 1, REGENERATING: 2 };
    private isFadingOut = false;
    private fadeOutTimer = 0;
    private onsetTimer = 0; // Timer for the soft onset effect.
    private readonly SHUTDOWN_CLEANUP_DELAY = 1.0;

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
        if (this.image.complete && this.image.naturalHeight !== 0) {
            this.onImageLoaded();
        } else {
            this.image.onload = () => this.onImageLoaded();
        }
    }

    private onImageLoaded(): void {
        this.setupScene();
        this.bloomEffect = new BloomEffect(this.renderer, this.scene, this.camera, this.width, this.height);
        this.createSymbolTexture();
        this.createBlackoutMesh();
        this.createParticleSystem();
        this.setupGrid();
        window.addEventListener('resize', this.boundOnWindowResize);
    }
    
    private animate(): void {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        if (!this.clock || !this.imageRect) return;
        const deltaTime = this.clock.getDelta();
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

    private onWindowResize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.left = -this.width / 2; this.camera.right = this.width / 2;
        this.camera.top = this.height / 2; this.camera.bottom = -this.height / 2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        if (this.bloomEffect) {
            this.bloomEffect.setSize(this.width, this.height);
        }
        this.setupGrid();
    }
    
    public dispose(): void {
      this.stop();
      window.removeEventListener('resize', this.boundOnWindowResize);
      if (this.bloomEffect) this.bloomEffect.dispose();
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
      if (this.symbolsTexture) this.symbolsTexture.dispose();
      if (this.renderer) {
          this.renderer.dispose();
          if (this.renderer.domElement.parentElement) {
              this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
          }
      }
    }

    public start(): void {
        if (this.animationFrameId === null) {
            this.onWindowResize(); 
            this.fullReset();
            this.clock = new THREE.Clock();
            this.animate();
        }
    }
    
    public stop(): void { if (this.animationFrameId !== null) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; this.clock = null; } }
    public beginLeaveAnimation(): void { if (!this.isFadingOut) { this.isFadingOut = true; this.fadeOutTimer = 0; this.resetBlackoutGrid(); } }
    private createParticleSystem(): void { const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.MAX_ACTIVE_PARTICLES * 3), 3)); geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(new Float32Array(this.MAX_ACTIVE_PARTICLES * 3), 3)); geometry.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(this.MAX_ACTIVE_PARTICLES), 1)); geometry.setAttribute('symbolIndex', new THREE.Float32BufferAttribute(new Float32Array(this.MAX_ACTIVE_PARTICLES), 1)); geometry.setAttribute('particleOpacity', new THREE.Float32BufferAttribute(new Float32Array(this.MAX_ACTIVE_PARTICLES), 1)); const material = new THREE.ShaderMaterial({ uniforms: { symbolsTexture: { value: this.symbolsTexture }, globalOpacity: { value: 1.0 }, }, vertexShader: ` attribute float size; attribute vec3 customColor; attribute float symbolIndex; attribute float particleOpacity; varying vec3 vColor; varying float vSymbolIndex; varying float vOpacity; void main() { vColor = customColor; vSymbolIndex = symbolIndex; vOpacity = particleOpacity; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size; gl_Position = projectionMatrix * mvPosition; } `, fragmentShader: ` uniform sampler2D symbolsTexture; uniform float globalOpacity; varying vec3 vColor; varying float vSymbolIndex; varying float vOpacity; void main() { float symbolsPerRow = 8.0; float totalRows = ${Math.ceil(this.SYMBOLS.length / 8)}.0; vec2 symbolCoord = gl_PointCoord; symbolCoord.x = (symbolCoord.x + mod(vSymbolIndex, symbolsPerRow)) / symbolsPerRow; symbolCoord.y = (symbolCoord.y + floor(vSymbolIndex / symbolsPerRow)) / totalRows; vec4 tex = texture2D(symbolsTexture, symbolCoord); if (tex.a < 0.3) discard; gl_FragColor = vec4(vColor, tex.a * vOpacity * ${this.PARTICLE_BASE_OPACITY} * globalOpacity); } `, blending: THREE.AdditiveBlending, depthTest: false, transparent: true }); this.particleSystem = new THREE.Points(geometry, material); this.scene.add(this.particleSystem); const symbolIndices = (geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array; for (let i = 0; i < this.MAX_ACTIVE_PARTICLES; i++) { symbolIndices[i] = Math.floor(Math.random() * this.SYMBOLS.length); } (geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true; for (let i = 0; i < this.MAX_ACTIVE_PARTICLES; i++) { this.particles.pool.push({ index: i, active: false, originalPos: new THREE.Vector2(), amplitude: 0, timeOffset: 0, speed: 0, lifetime: 0, age: 0, size: 0, color: new THREE.Color(), symbolIndex: 0, gridCellIndex: -1, lastSymbolChange: 0, symbolChangeInterval: 0 }); } }
    
    private fullReset(): void {
        this.isFadingOut = false;
        this.fadeOutTimer = 0;
        this.onsetTimer = 0; // Reset the soft onset timer here.
        if(this.particleSystem) { this.particleSystem.material.uniforms.globalOpacity.value = 1.0; }
        this.resetBlackoutGrid();
        this.resetAllParticles();
    }

    private resetBlackoutGrid(): void { if (!this.blackoutMesh) return; for (const cell of this.grid.cells) { cell.state = this.STATE.IDLE; cell.timer = 0; cell.opacity = 0; } this.blackoutMesh.count = 0; this.blackoutMesh.instanceMatrix.needsUpdate = true; (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).needsUpdate = true; }
    private resetAllParticles(): void { if (!this.particleSystem) return; const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array; this.particles.active.forEach(p => { p.active = false; positions[p.index * 3 + 1] = -99999; this.particles.pool.push(p); }); this.particles.active.clear(); (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true; }
    private setupScene(): void { this.width = window.innerWidth; this.height = window.innerHeight; this.scene = new THREE.Scene(); this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 1, 1000); this.camera.position.z = 100; this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(window.devicePixelRatio); this.renderer.setSize(this.width, this.height); this.overlayContainer.appendChild(this.renderer.domElement); }
    private getSymbolColor(): THREE.Color { return this.SYMBOL_COLORS[Math.floor(Math.random() * this.SYMBOL_COLORS.length)]; }
    private createSymbolTexture(): void { const symbolsPerRow = 8, symbolSize = 64; const rows = Math.ceil(this.SYMBOLS.length / symbolsPerRow); const canvas = document.createElement('canvas'); canvas.width = symbolsPerRow * symbolSize; canvas.height = rows * symbolSize; const ctx = canvas.getContext('2d')!; ctx.font = `bold ${symbolSize * 0.8}px monospace`; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 0; i < this.SYMBOLS.length; i++) { const x = (i % symbolsPerRow) * symbolSize + symbolSize / 2; const y = Math.floor(i / symbolsPerRow) * symbolSize + symbolSize / 2; ctx.fillText(this.SYMBOLS[i], x, y); } this.symbolsTexture = new THREE.CanvasTexture(canvas); }
    private createBlackoutMesh(): void { const quadGeom = new THREE.PlaneGeometry(this.CELL_SIZE, this.CELL_SIZE); quadGeom.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(new Float32Array(200 * 200), 1)); const material = new THREE.ShaderMaterial({ uniforms: { color: { value: this.BLACKOUT_COLOR } }, vertexShader: ` attribute float instanceOpacity; varying float vOpacity; void main() { vOpacity = instanceOpacity; gl_Position = projectionMatrix * instanceMatrix * modelViewMatrix * vec4(position, 1.0); } `, fragmentShader: ` uniform vec3 color; varying float vOpacity; void main() { gl_FragColor = vec4(color, vOpacity); } `, transparent: true, }); this.blackoutMesh = new THREE.InstancedMesh(quadGeom, material, 150 * 200); this.scene.add(this.blackoutMesh); }
    private setupGrid(): void { this.imageRect = this.image.getBoundingClientRect(); if (!this.imageRect.width) return; this.grid.cols = Math.floor(this.imageRect.width / this.CELL_SIZE); this.grid.rows = Math.floor(this.imageRect.height / this.CELL_SIZE); this.grid.cells = []; for (let i = 0; i < this.grid.cols * this.grid.rows; i++) { this.grid.cells.push({ state: this.STATE.IDLE, timer: 0, opacity: 0 }); } }
    
    private updateGrid(deltaTime: number): void {
        if (this.particles.active.size >= this.MAX_ACTIVE_PARTICLES) return;
        
        // Update the onset timer and calculate the spawn chance multiplier.
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
                    // Apply the onsetMultiplier to the probability calculation.
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

    private spawnParticleForCell(cellIndex: number): void { if (this.particles.pool.length === 0 || !this.imageRect) return; const particle = this.particles.pool.pop()!; particle.active = true; particle.gridCellIndex = cellIndex; const col = cellIndex % this.grid.cols; const row = Math.floor(cellIndex / this.grid.cols); const xOnImage = col * this.CELL_SIZE + this.CELL_SIZE / 2; const yOnImage = row * this.CELL_SIZE + this.CELL_SIZE / 2; const x = this.imageRect.left + xOnImage - this.width / 2; const y = -(this.imageRect.top + yOnImage) + this.height / 2; particle.originalPos.set(x, y); const speedVariation = (Math.random() * 2 - 1) * this.PARTICLE_SPEED_VARIATION; particle.speed = this.PARTICLE_SPEED * (1 + speedVariation); particle.amplitude = this.AMPLITUDE.min + Math.random() * (this.AMPLITUDE.max - this.AMPLITUDE.min); particle.timeOffset = Math.random() * Math.PI * 2; particle.lifetime = this.PARTICLE_LIFETIME.min + Math.random() * (this.PARTICLE_LIFETIME.max - this.PARTICLE_LIFETIME.min); particle.age = 0; particle.size = this.CELL_SIZE * (1 + 1.1 * Math.random()); particle.symbolIndex = Math.floor(Math.random() * this.SYMBOLS.length); particle.color.copy(this.getSymbolColor()); particle.lastSymbolChange = 0; const variation = 1 + (Math.random() * 2 - 1) * this.SYMBOL_CHANGE_VARIATION; particle.symbolChangeInterval = this.SYMBOL_CHANGE_INTERVAL * variation; this.particles.active.set(particle.index, particle); }
    private updateParticles(deltaTime: number): void { const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array; const opacities = (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).array as Float32Array; const colors = (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).array as Float32Array; const sizes = (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).array as Float32Array; const symbolIndices = (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).array as Float32Array; let needsUpdate = false; this.particles.active.forEach(p => { p.age += deltaTime; if (p.age >= p.lifetime && !this.isFadingOut) { this.grid.cells[p.gridCellIndex].state = this.STATE.REGENERATING; p.active = false; this.particles.active.delete(p.index); this.particles.pool.push(p); positions[p.index * 3 + 1] = -99999; opacities[p.index] = 0; needsUpdate = true; return; } if (p.age < this.PARTICLE_FADE_IN_DURATION) { opacities[p.index] = p.age / this.PARTICLE_FADE_IN_DURATION; } else if (p.age > p.lifetime - this.PARTICLE_FADEOUT_DURATION && !this.isFadingOut) { opacities[p.index] = (p.lifetime - p.age) / this.PARTICLE_FADEOUT_DURATION; } else { opacities[p.index] = 1.0; } p.lastSymbolChange += deltaTime; if(p.lastSymbolChange > p.symbolChangeInterval) { symbolIndices[p.index] = Math.floor(Math.random() * this.SYMBOLS.length); p.lastSymbolChange = 0; } const offsetX = -p.age * p.speed * p.amplitude; const offsetY = Math.sin(p.age * 1.5 + p.timeOffset) * 10; positions[p.index * 3] = p.originalPos.x + offsetX; positions[p.index * 3 + 1] = p.originalPos.y + offsetY; positions[p.index * 3 + 2] = 1; p.color.toArray(colors, p.index * 3); sizes[p.index] = p.size; needsUpdate = true; }); if (needsUpdate) { (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true; (this.particleSystem.geometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true; (this.particleSystem.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true; (this.particleSystem.geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true; (this.particleSystem.geometry.attributes.particleOpacity as THREE.BufferAttribute).needsUpdate = true; } }
    private updateBlackout(): void { if (!this.imageRect) return; const dummy = new THREE.Object3D(); const opacities = (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).array as Float32Array; let instanceIdx = 0; for (let i = 0; i < this.grid.cells.length; i++) { if (this.grid.cells[i].opacity > 0) { const col = i % this.grid.cols; const row = Math.floor(i / this.grid.cols); const xOnImage = col * this.CELL_SIZE + this.CELL_SIZE / 2; const yOnImage = row * this.CELL_SIZE + this.CELL_SIZE / 2; const x = this.imageRect.left + xOnImage - this.width / 2; const y = -(this.imageRect.top + yOnImage) + this.height / 2; dummy.position.set(x, y, 0); dummy.updateMatrix(); this.blackoutMesh.setMatrixAt(instanceIdx, dummy.matrix); opacities[instanceIdx] = this.grid.cells[i].opacity; instanceIdx++; } } this.blackoutMesh.count = instanceIdx; this.blackoutMesh.instanceMatrix.needsUpdate = true; (this.blackoutMesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute).needsUpdate = true; }
  }
</script>

<div class="main-container" bind:this={mainContainer}>
  <div class="image-pane">
    <img src={imageUrl} alt="Profile" bind:this={imageElement}/>
  </div>
</div>

<div class="particle-overlay" bind:this={particleOverlayElement}></div>

<style>
  .main-container { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; justify-content: flex-end; align-items: center; visibility: hidden; opacity: 0; }
  .image-pane { position: relative; height: 100%; flex-shrink: 0; display: flex; justify-content: flex-end; align-items: center; }
  .image-pane img { height: 100vh; width: auto; display: block; object-fit: cover; }
  .particle-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2; pointer-events: none; }
</style>