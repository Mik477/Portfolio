// src/lib/three/heroParticleLogic.ts
import * as THREE from 'three';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { HeroBloomEffect } from './HeroBloomEffect';

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
  private bloomEffect!: HeroBloomEffect; 

  constructor(font: Font, particleTexture: THREE.Texture, container: HTMLElement) {
    this.font = font;
    this.particleTexture = particleTexture;
    this.container = container;
    
    if (!this.container) {
      console.error("HeroParticleLogic: Container not provided to Environment!");
      return;
    }
    
    this.clock = new THREE.Clock(); 

    this.scene = new THREE.Scene();
    this.createCamera();
    this.createRenderer();
    
    this.bloomEffect = new HeroBloomEffect(
        this.renderer, 
        this.scene, 
        this.camera, 
        this.container.clientWidth, 
        this.container.clientHeight
    );

    this.setup(); 
    this.bindWindowResize();

    if (this.renderer) {
        this.startAnimationLoop();
    }
  }

  public startAnimationLoop() {
    if (this.renderer && !this.animationLoopCallback) {
        this.animationLoopCallback = () => { this.render(); };
        this.renderer.setAnimationLoop(this.animationLoopCallback);
        console.log("HeroParticleLogic: Animation loop started.");
    }
  }

  public stopAnimationLoop() {
    if (this.renderer && this.animationLoopCallback) {
        this.renderer.setAnimationLoop(null);
        this.animationLoopCallback = null;
        console.log("HeroParticleLogic: Animation loop stopped.");
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
    const deltaTime = this.clock.getDelta();

    if (this.createParticles) {
      this.createParticles.render(); 
    }
    
    if (this.bloomEffect) {
      this.bloomEffect.render(deltaTime);
    } else if (this.renderer && this.scene && this.camera) { 
      this.renderer.render(this.scene, this.camera);
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
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (THREE.ColorManagement.enabled) { 
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else { 
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    this.container.appendChild(this.renderer.domElement);
  }
  public onWindowResize() {
    if (this.camera && this.renderer && this.container) {
      const newWidth = this.container.clientWidth;
      const newHeight = this.container.clientHeight;

      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newWidth, newHeight);
      
      if (this.bloomEffect) {
        this.bloomEffect.setSize(newWidth, newHeight);
      }
      
      // Check for screen size changes and regenerate particles if needed
      if (this.createParticles) {
        if (this.createParticles.checkScreenSizeChange()) {
          this.createParticles.regenerateParticles();
        }
      }
    }
  }

  public dispose() {
    console.log("HeroParticleLogic: Disposing Environment");
    this.stopAnimationLoop();
    this.unbindWindowResize();
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
  // maxCooldownTime: number; // REMOVED - Replaced by min/max duration
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
  // --- NEW Cooldown Parameters ---
  particleCooldownDurationMin: number;
  particleCooldownDurationMax: number;
  symbolCooldownSpeedMultiplier: number;  // --- END NEW Cooldown Parameters ---
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

  private matrixSymbols: string[];
  private matrixColors: { [key: string]: THREE.Color };
  private bloomSymbolColor: THREE.Color; 
  
  private particleStates: number[] = [];
  private heatLevels: number[] = [];
  private cooldownRates: number[] = [];
  private symbolIndicesAttributeValues: number[] = [];
  private fadeOutRates: number[] = [];

  private data: ParticleData;
  private symbolsTexture!: THREE.Texture;
  private planeArea!: THREE.Mesh; 
  public particles!: THREE.Points;
  private geometryCopy!: THREE.BufferGeometry;

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

  // These constants control the symbol color variation
  private readonly SYMBOL_HUE_SHIFT_RANGE = 0.03;           // Controls hue variation (green tint shifts)
  private readonly SYMBOL_LUMINANCE_REDUCTION_MAX = 0.08;  // Controls brightness variation
  private readonly SYMBOL_MIN_LUMINANCE_TARGET = 0.45;      // Minimum brightness to prevent too-dark symbols

  // Screen size breakpoints
  private readonly SCREEN_SIZES = {
    mobile: { maxWidth: 640 },
    tablet: { minWidth: 641, maxWidth: 1024 },
    laptop: { minWidth: 1025, maxWidth: 1440 },
    desktop: { minWidth: 1441, maxWidth: 1920 },
    large: { minWidth: 1921, maxWidth: 2560 },
    ultrawide: { minWidth: 2561 }
  };

  // Responsive particle parameters for different screen sizes
  private readonly RESPONSIVE_PARAMS: Record<ScreenSizeType, Partial<ParticleData>> = {
    mobile: {
      amount: 1200,
      particleSize: 1.0,
      textSize: 12,
      minSymbolSize: 7,
      maxSymbolSize: 11,
      area: 150
    },
    tablet: {
      amount: 1800,
      particleSize: 1.1,
      textSize: 14,
      minSymbolSize: 7,
      maxSymbolSize: 11,
      area: 200
    },
    laptop: {
      amount: 2200,
      particleSize: 1.2,
      textSize: 15,
      minSymbolSize: 6.5,
      maxSymbolSize: 11,
      area: 230
    },
    desktop: {
      amount: 2400,
      particleSize: 1.4,
      textSize: 16,
      minSymbolSize: 7,
      maxSymbolSize: 11,
      area: 250
    },
    large: {
      amount: 2700,
      particleSize: 1.55,
      textSize: 18,
      minSymbolSize: 8,
      maxSymbolSize: 11,
      area: 280
    },
    ultrawide: {
      amount: 2900,
      particleSize: 1.6,
      textSize: 20,
      minSymbolSize: 9,
      maxSymbolSize: 16,
      area: 300
    }
  };

  private symbolTextureRows: number = 6; // Add this property declaration

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

    // Base configuration (will be adjusted for screen size)
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
    
    // Track the container dimensions to detect significant changes
    this.lastKnownWidth = this.hostContainer.clientWidth;
    this.lastKnownHeight = this.hostContainer.clientHeight;
    
    // Determine initial screen size and apply responsive settings
    this.currentScreenSizeType = this.getScreenSizeType();
    this.applyResponsiveParameters(this.currentScreenSizeType);
    
    // Log the detected screen size and particle configuration
    console.log(`🖥️ Hero Particle Effect - Screen Size Detection:`);
    console.log(`   Screen dimensions: ${this.lastKnownWidth}x${this.lastKnownHeight}px`);
    console.log(`   Detected screen type: ${this.currentScreenSizeType.toUpperCase()}`);
    console.log(`   Particle configuration:`);
    console.log(`     • Particle count: ${this.data.amount}`);
    console.log(`     • Particle size: ${this.data.particleSize}`);
    console.log(`     • Text size: ${this.data.textSize}px`);
    console.log(`     • Symbol size range: ${this.data.minSymbolSize} - ${this.data.maxSymbolSize}`);
    console.log(`     • Effect area: ${this.data.area}`);
    
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    
    this.createMatrixSymbolsTexture();
    this.setupPlaneArea();
    this.createText();
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

  private initParticleStates(count: number) { 
    this.particleStates = new Array(count).fill(0);
    this.heatLevels = new Array(count).fill(0);
    this.cooldownRates = new Array(count);
    this.symbolIndicesAttributeValues = new Array(count);
    this.fadeOutRates = new Array(count);
    // Remove symbolSizesMultipliers array since we generate sizes dynamically
    
    for (let i = 0; i < count; i++) {
      this.symbolIndicesAttributeValues[i] = Math.floor(Math.random() * this.matrixSymbols.length);
      
      // --- MODIFIED Cooldown Rate Calculation ---
      const randomDuration = this.data.particleCooldownDurationMin + 
                             Math.random() * (this.data.particleCooldownDurationMax - this.data.particleCooldownDurationMin);
      this.cooldownRates[i] = 1 / Math.max(1, randomDuration); // Rate is 1/duration. Ensure duration > 0.
      // --- END MODIFIED ---

      this.fadeOutRates[i] = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
      // Remove pre-calculation of symbol sizes
    }
  }

  private createMatrixSymbolsTexture() {
    // Calculate required rows based on symbol count
    const cols = 8;
    const symbolSize = 64;
    const rows = Math.ceil(this.matrixSymbols.length / cols);
    
    const canvas = document.createElement('canvas');
    canvas.width = cols * symbolSize; 
    canvas.height = rows * symbolSize;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas with transparent background
    ctx.fillStyle = 'rgba(0,0,0,0)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Improved font rendering settings
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00FF00';
    
    // Enable better text rendering (remove invalid textRenderingOptimization)
    if (ctx.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    for (let i = 0; i < this.matrixSymbols.length; i++) {
      const col = i % cols; 
      const row = Math.floor(i / cols);
      const x = col * symbolSize + symbolSize / 2; 
      const y = row * symbolSize + symbolSize / 2;
      
      // Add slight padding to prevent edge clipping
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
    
    // Store the row count for the shader
    this.symbolTextureRows = rows;
    
    // Log texture info for debugging
    console.log(`Symbol texture created: ${cols}x${rows} grid (${this.matrixSymbols.length} symbols)`);
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
    const xMid = -0.5 * (tempShapeGeometry.boundingBox!.max.x - tempShapeGeometry.boundingBox!.min.x);
    const yMid = (tempShapeGeometry.boundingBox!.max.y - tempShapeGeometry.boundingBox!.min.y) / 2.85; 
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
        symbolRows: { value: this.symbolTextureRows } // Add dynamic row count uniform
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
  }

  private onMouseDown(event: MouseEvent) { this.updateMousePosition(event.clientX, event.clientY); this.isPressed = true; this.data.ease = .01; }
  private onMouseUp() { this.isPressed = false; this.data.ease = .05; }
  private onMouseMove(event: MouseEvent) { 
    if (!this.hasMouseMoved) this.hasMouseMoved = true; 
    this.updateMousePosition(event.clientX, event.clientY); 
  }
  private onTouchStart(event: TouchEvent) { if (event.touches.length > 0) { this.updateMousePosition(event.touches[0].clientX, event.touches[0].clientY); this.isPressed = true; this.data.ease = .01; this.hasMouseMoved = true; } event.preventDefault(); }
  private onTouchMove(event: TouchEvent) { if (event.touches.length > 0) { this.hasMouseMoved = true; this.updateMousePosition(event.touches[0].clientX, event.touches[0].clientY); } event.preventDefault(); }
  private onTouchEnd(event: TouchEvent) { this.isPressed = false; this.data.ease = .05; event.preventDefault(); }
  
  private updateMousePosition(clientX: number, clientY: number) {
    const rect = this.hostContainer.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getVariedSymbolColor(): THREE.Color {
    const variedColor = this.bloomSymbolColor.clone(); // Base color: (0.0, 0.95, 0.05)
    const hsl = { h: 0, s: 0, l: 0 };
    variedColor.getHSL(hsl); 

    // HUE VARIATION: Shifts the green tint slightly
    const hueOffset = (Math.random() - 0.5) * this.SYMBOL_HUE_SHIFT_RANGE;
    hsl.h += hueOffset;
    hsl.h = (hsl.h + 1.0) % 1.0; 

    // LUMINANCE VARIATION: Makes some symbols brighter/dimmer
    const luminanceReduction = Math.random() * this.SYMBOL_LUMINANCE_REDUCTION_MAX;
    hsl.l -= luminanceReduction;
    
    // Ensure minimum brightness
    hsl.l = Math.max(this.SYMBOL_MIN_LUMINANCE_TARGET, hsl.l);
    hsl.l = Math.min(1.0, hsl.l);

    variedColor.setHSL(hsl.h, hsl.s, hsl.l); 
    return variedColor;
  }

  public render() {
    if (!this.particles || !this.planeArea || !this.camera) return; 

    if (!this.hasMouseMoved && !this.isPressed) {
        if (this.particles && this.geometryCopy) {
            const pos = this.particles.geometry.attributes.position as THREE.BufferAttribute;
            const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
            let changed = false;
            for (let i = 0, l = pos.count; i < l; i++) {
                const initX = copyPos.getX(i); const initY = copyPos.getY(i); const initZ = copyPos.getZ(i);
                let px = pos.getX(i); let py = pos.getY(i); let pz = pos.getZ(i);
                const prevPx = px; const prevPy = py; const prevPz = pz;

                px += (initX - px) * this.data.ease; 
                py += (initY - py) * this.data.ease; 
                pz += (initZ - pz) * this.data.ease;
                pos.setXYZ(i, px, py, pz);
                if (px !== prevPx || py !== prevPy || pz !== prevPz) changed = true;
            }
            if (changed) pos.needsUpdate = true;
        }
        return; 
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.planeArea);

    let attributesNeedUpdate = false;

    if (intersects.length > 0) {
      const pos = this.particles.geometry.attributes.position as THREE.BufferAttribute;
      const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
      const colors = this.particles.geometry.attributes.customColor as THREE.BufferAttribute;
      const sizes = this.particles.geometry.attributes.size as THREE.BufferAttribute;
      const symbolStates = this.particles.geometry.attributes.symbolState as THREE.BufferAttribute;
      const symbolIndicesBuffer = this.particles.geometry.attributes.symbolIndex as THREE.BufferAttribute;

      const mx = intersects[0].point.x;
      const my = intersects[0].point.y;

      for (let i = 0, l = pos.count; i < l; i++) {
        const initX = copyPos.getX(i); const initY = copyPos.getY(i); const initZ = copyPos.getZ(i);
        let px = pos.getX(i); let py = pos.getY(i); let pz = pos.getZ(i);

        const dx = mx - px; const dy = my - py;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);
        const dSquared = Math.max(1e-5, dx * dx + dy * dy); 
        const f = -this.data.area / dSquared;

        if (this.isPressed) {
          const t = Math.atan2(dy, dx);
          px -= f * Math.cos(t); py -= f * Math.sin(t);
          this.heatLevels[i] = Math.min(this.heatLevels[i] + 0.1, 1.0);
          attributesNeedUpdate = true;
        } else if (mouseDistance < this.data.area) {
          const t = Math.atan2(dy, dx);
          px += f * Math.cos(t); py += f * Math.sin(t);
          attributesNeedUpdate = true;
          const distortion = Math.sqrt(Math.pow(px - initX, 2) + Math.pow(py - initY, 2));
          
          if (distortion > this.data.distortionThreshold) {
            this.heatLevels[i] = Math.min(this.heatLevels[i] + Math.min(distortion / 50, 0.1), 1.0);
            if (this.particleStates[i] === 0 && this.heatLevels[i] > this.data.symbolHeatRequirement) {
              if (Math.random() < this.getSymbolProbability(distortion)) {
                this.particleStates[i] = 1; 
                symbolStates.setX(i, 1.0);
                
                // FIXED: Generate random size and symbol index each time a particle becomes a symbol
                const randomSymbolSize = this.data.minSymbolSize + Math.random() * (this.data.maxSymbolSize - this.data.minSymbolSize);
                const randomSymbolIndex = Math.floor(Math.random() * this.matrixSymbols.length);
                
                sizes.setX(i, this.data.particleSize * randomSymbolSize);
                symbolIndicesBuffer.setX(i, randomSymbolIndex);
                
                const symbolColorToRender = this.getVariedSymbolColor();
                colors.setXYZ(i, symbolColorToRender.r, symbolColorToRender.g, symbolColorToRender.b);
                attributesNeedUpdate = true; 
              }
            }
          }
        }

        if (this.particleStates[i] === 1) { 
          const currentSize = sizes.getX(i);
          const newSize = Math.max(this.data.particleSize, currentSize - this.fadeOutRates[i]);
          if (currentSize !== newSize) {
             sizes.setX(i, newSize);
             attributesNeedUpdate = true;
          }
          // --- MODIFIED Symbol Cooldown ---
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - (this.cooldownRates[i] * this.data.symbolCooldownSpeedMultiplier));
          // --- END MODIFIED ---
          
          // FIXED: Use a small tolerance instead of exact comparison to handle floating point precision
          const fadeThreshold = this.data.particleSize + 0.01; // Small tolerance for floating point comparison
          if (newSize <= fadeThreshold) {
            this.particleStates[i] = 0; 
            symbolStates.setX(i, 0.0);
            sizes.setX(i, this.data.particleSize); 
            attributesNeedUpdate = true;
          }
        } else { 
          const matrixColor = this.getMatrixColor(this.heatLevels[i]);
          if (colors.getX(i) !== matrixColor.r || colors.getY(i) !== matrixColor.g || colors.getZ(i) !== matrixColor.b) {
            colors.setXYZ(i, matrixColor.r, matrixColor.g, matrixColor.b);
            attributesNeedUpdate = true;
          }
        }
        
        if (this.heatLevels[i] > 0 && this.particleStates[i] === 0) { // For normal particles
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - this.cooldownRates[i]);
        }

        const prevPx = px; const prevPy = py; const prevPz = pz;
        px += (initX - px) * this.data.ease; 
        py += (initY - py) * this.data.ease; 
        pz += (initZ - pz) * this.data.ease;
        
        if (px !== prevPx || py !== prevPy || pz !== prevPz) {
            pos.setXYZ(i, px, py, pz);
            attributesNeedUpdate = true;
        }
      }
    } else { 
        const pos = this.particles.geometry.attributes.position as THREE.BufferAttribute;
        const copyPos = this.geometryCopy.attributes.position as THREE.BufferAttribute;
        for (let i = 0, l = pos.count; i < l; i++) {
            const initX = copyPos.getX(i); const initY = copyPos.getY(i); const initZ = copyPos.getZ(i);
            let px = pos.getX(i); let py = pos.getY(i); let pz = pos.getZ(i);
            const prevPx = px; const prevPy = py; const prevPz = pz;
            px += (initX - px) * this.data.ease; 
            py += (initY - py) * this.data.ease; 
            pz += (initZ - pz) * this.data.ease;
            if (px !== prevPx || py !== prevPy || pz !== prevPz) {
                pos.setXYZ(i, px, py, pz);
                attributesNeedUpdate = true;
            }
        }
    }
    
    if (attributesNeedUpdate) {
        (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.particles.geometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
        (this.particles.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
        (this.particles.geometry.attributes.symbolState as THREE.BufferAttribute).needsUpdate = true;
        (this.particles.geometry.attributes.symbolIndex as THREE.BufferAttribute).needsUpdate = true;
    }
  }
  
  public resetParticleState() {
    if (!this.particles || !this.particles.geometry) return;
    
    const colors = this.particles.geometry.attributes.customColor as THREE.BufferAttribute;
    const sizes = this.particles.geometry.attributes.size as THREE.BufferAttribute;
    const symbolStates = this.particles.geometry.attributes.symbolState as THREE.BufferAttribute;
    const symbolIndicesBuffer = this.particles.geometry.attributes.symbolIndex as THREE.BufferAttribute;

    if (!colors || !sizes || !symbolStates || !symbolIndicesBuffer) return;

    const initialColor = this.matrixColors.white;

    for (let i = 0; i < colors.count; i++) {
      colors.setXYZ(i, initialColor.r, initialColor.g, initialColor.b); 
      this.particleStates[i] = 0; 
      this.heatLevels[i] = 0; 
      sizes.setX(i, this.data.particleSize); 
      symbolStates.setX(i, 0.0); 
      
      // Generate fresh random symbol indices
      this.symbolIndicesAttributeValues[i] = Math.floor(Math.random() * this.matrixSymbols.length);
      symbolIndicesBuffer.setX(i, this.symbolIndicesAttributeValues[i]);

      // Generate fresh random fade out rates
      this.fadeOutRates[i] = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
      // Don't pre-calculate symbol sizes anymore - they're generated when particles become symbols
    }
    colors.needsUpdate = true; sizes.needsUpdate = true; 
    symbolStates.needsUpdate = true; symbolIndicesBuffer.needsUpdate = true;
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
    
    // Apply the responsive parameters to the data object
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
    
    // Check if dimensions have changed significantly (more than 10% or 100px)
    const widthChange = Math.abs(currentWidth - this.lastKnownWidth);
    const heightChange = Math.abs(currentHeight - this.lastKnownHeight);
    const significantChange = widthChange > 100 || heightChange > 100 || 
                             widthChange / this.lastKnownWidth > 0.1 || 
                             heightChange / this.lastKnownHeight > 0.1;
    
    if (significantChange) {
      const newScreenType = this.getScreenSizeType();
      
      if (newScreenType !== this.currentScreenSizeType) {
        console.log(`🖥️ Screen size change detected: ${this.currentScreenSizeType} → ${newScreenType}`);
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
    
    console.log(`🔄 Regenerating particles for ${this.currentScreenSizeType} screen size:`);
    console.log(`   New particle count: ${this.data.amount}`);
    console.log(`   New particle size: ${this.data.particleSize}`);
    
    // Remove existing particles
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      const material = this.particles.material as THREE.Material;
      if (material) material.dispose();
    }
    
    // Recreate particles with new parameters
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
}