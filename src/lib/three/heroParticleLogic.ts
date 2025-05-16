// src/lib/three/heroParticleLogic.ts
import * as THREE from 'three';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';

// Shaders taken directly from the provided particles.js
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

varying vec3 vColor;
varying float vSymbolState;
varying float vSymbolIndex;
varying float vVariability;

void main() {
  if(vSymbolState < 0.5) {
    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
  } 
  else {
    const float symbolsPerRow = 8.0;
    float symbolIndexVal = vSymbolIndex;
    
    float columnIndex = mod(symbolIndexVal, symbolsPerRow);
    float rowIndex = floor(symbolIndexVal / symbolsPerRow);
    
    vec2 symbolCoord = gl_PointCoord;
    symbolCoord.x = (symbolCoord.x + columnIndex) / symbolsPerRow;
    symbolCoord.y = (symbolCoord.y + rowIndex) / 6.0;
    
    vec4 symbolColor = texture2D(symbolsTexture, symbolCoord);
    
    if(symbolColor.a < 0.3) discard;
    
    gl_FragColor = vec4(vColor, symbolColor.a);
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

  constructor(font: Font, particleTexture: THREE.Texture, container: HTMLElement) {
    this.font = font;
    this.particleTexture = particleTexture;
    this.container = container;
    
    if (!this.container) {
      console.error("HeroParticleLogic: Container not provided to Environment!");
      return;
    }
    
    this.scene = new THREE.Scene();
    this.createCamera();
    this.createRenderer();
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
    if (this.createParticles) {
      this.createParticles.render(); // This is where interaction logic happens
    }
    if (this.renderer && this.scene && this.camera) {
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
    this.camera.position.set(0, 0, 100); // As per original particles.js
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
    }
    
    this.container.appendChild(this.renderer.domElement);
  }

  public onWindowResize() {
    if (this.camera && this.renderer && this.container) {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      // CreateParticles might also need to know about resize if its planeArea depends on it dynamically
      // However, the original setup sizes planeArea once in setup.
    }
  }

  public dispose() {
    console.log("HeroParticleLogic: Disposing Environment");
    this.stopAnimationLoop();
    this.unbindWindowResize();
    if (this.createParticles) {
      this.createParticles.dispose();
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
                    obj.material.dispose();
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
  particleColor: number; 
  textSize: number;
  area: number;
  ease: number;
  distortionThreshold: number;
  maxCooldownTime: number;
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
}

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
  
  private particleStates: number[] = [];
  private heatLevels: number[] = [];
  private cooldownRates: number[] = [];
  private symbolIndicesAttributeValues: number[] = [];
  private fadeOutRates: number[] = [];
  private symbolSizesMultipliers: number[] = [];

  private data: ParticleData;
  private symbolsTexture!: THREE.Texture;
  private planeArea!: THREE.Mesh; // The invisible plane for raycasting
  public particles!: THREE.Points;
  private geometryCopy!: THREE.BufferGeometry;

  // Bound event handlers for proper `this` context
  private boundOnMouseDown: (event: MouseEvent) => void;
  private boundOnMouseMove: (event: MouseEvent) => void;
  private boundOnMouseUp: (event: MouseEvent) => void;
  private boundOnTouchStart: (event: TouchEvent) => void;
  private boundOnTouchMove: (event: TouchEvent) => void;
  private boundOnTouchEnd: (event: TouchEvent) => void;

  constructor(scene: THREE.Scene, font: Font, particleImg: THREE.Texture, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, hostContainer: HTMLElement) {
    this.scene = scene;
    this.font = font;
    this.particleImg = particleImg;
    this.camera = camera;
    this.renderer = renderer; 
    this.hostContainer = hostContainer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(1e5, 1e5); // Initialize way off-screen

    this.matrixSymbols = [ // From original particles.js
      '日', '〇', 'ﾊ', 'ﾐ', 'ﾋ', 'ｰ', 'ｳ', 'ｼ', 'ﾅ', 'ﾓ', 'ﾆ', 'ｻ', 'ﾜ',
      'ﾂ', 'ｵ', 'ﾘ', 'ｱ', 'ﾎ', 'ﾃ', 'ﾏ', 'ｹ', 'ﾒ', 'ｴ', 'ｶ', 'ｷ', 'ﾑ', 
      'ﾕ', 'ﾗ', 'ｾ', 'ﾈ', 'ｦ', 'ｲ', 'ｸ', 'ｺ', 'ｿ', 'ﾀ', 'ﾁ', 'ﾄ', 'ﾉ', 'ﾌ', 'ﾍ', 'ﾏ', 'ﾔ', 'ﾖ', 'ﾙ', 'ﾚ', 'ﾛ',
      '0', '1', '7', '9', '∆', '×', '≠', '≡', '∞'
    ];
    
    this.matrixColors = { // From original particles.js
      white: new THREE.Color(1.0, 1.0, 1.0),
      lightGreen: new THREE.Color(0.7, 1.0, 0.7),
      mediumGreen: new THREE.Color(0.4, 1.0, 0.6),
      brightGreen: new THREE.Color(0.0, 223/255, 115/255),
      midGreen: new THREE.Color(0.0, 198/255, 102/255),
      darkGreen: new THREE.Color(0.0, 173/255, 89/255)
    };

    this.data = { // From original particles.js
      text: "Hi, I'm\nMiká",
      amount: 2000,
      particleSize: 1,
      particleColor: 0xffffff,
      textSize: 16,
      area: 250, // Radius of mouse influence
      ease: .05, // Spring-back ease
      distortionThreshold: 12,
      maxCooldownTime: 180,
      minFadeOutRate: 0.09,
      maxFadeOutRate: 0.12,
      minSymbolSize: 7,
      maxSymbolSize: 12,
      symbolMinThreshold: 13,
      symbolMidThreshold: 20,
      symbolMaxThreshold: 40,
      symbolMinProb: 0.001,
      symbolMaxProb: 0.15,
      symbolHeatRequirement: 0.4
    };
    
    // Bind event handlers to `this` instance
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
    
    this.createMatrixSymbolsTexture();
    this.setupPlaneArea(); // Setup interaction plane first
    this.createText(); // Then text particles
    // Event listeners are bound by Svelte component calling public bindInteractionEvents
  }

  private getMatrixColor(heatLevel: number): THREE.Color { /* ... same as before ... */ 
    if (heatLevel <= 0.05) return this.matrixColors.white;
    if (heatLevel <= 0.2) return this.matrixColors.lightGreen;
    if (heatLevel <= 0.4) return this.matrixColors.mediumGreen;
    if (heatLevel <= 0.6) return this.matrixColors.brightGreen;
    if (heatLevel <= 0.8) return this.matrixColors.midGreen;
    return this.matrixColors.darkGreen;
  }
  private getSymbolProbability(distortion: number): number { /* ... same as before ... */ 
    const { symbolMinThreshold, symbolMidThreshold, symbolMaxThreshold, symbolMinProb, symbolMaxProb } = this.data;
    if (distortion < symbolMinThreshold) return 0;
    if (distortion >= symbolMaxThreshold) return 1;
    if (distortion < symbolMidThreshold) {
      const ratio = (distortion - symbolMinThreshold) / (symbolMidThreshold - symbolMinThreshold);
      return symbolMinProb + (symbolMaxProb / 10) * Math.pow(ratio, 3);
    } else {
      const ratio = (distortion - symbolMidThreshold) / (symbolMaxThreshold - symbolMidThreshold);
      return (symbolMaxProb / 10) + 
             (symbolMaxProb - symbolMaxProb / 10) * Math.pow(ratio, 1.5);
    }
  }
  private initParticleStates(count: number) { /* ... same as before ... */ 
    this.particleStates = new Array(count).fill(0);
    this.heatLevels = new Array(count).fill(0);
    this.cooldownRates = new Array(count);
    this.symbolIndicesAttributeValues = new Array(count);
    this.fadeOutRates = new Array(count);
    this.symbolSizesMultipliers = new Array(count);
    
    for (let i = 0; i < count; i++) {
      this.symbolIndicesAttributeValues[i] = Math.floor(Math.random() * this.matrixSymbols.length);
      this.cooldownRates[i] = 1 / (this.data.maxCooldownTime * (0.5 + Math.random() * 0.5));
      this.fadeOutRates[i] = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
      this.symbolSizesMultipliers[i] = this.data.minSymbolSize + Math.random() * (this.data.maxSymbolSize - this.data.minSymbolSize);
    }
  }
  private createMatrixSymbolsTexture() { /* ... same as before ... */
    const rows = 6; const cols = 8; const symbolSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = cols * symbolSize; canvas.height = rows * symbolSize;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,canvas.width, canvas.height);
    for (let i = 0; i < this.matrixSymbols.length; i++) {
      const col = i % cols; const row = Math.floor(i / cols);
      const x = col * symbolSize; const y = row * symbolSize;
      ctx.fillStyle = '#00df73'; ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.matrixSymbols[i], x + symbolSize/2, y + symbolSize/2);
    }
    this.symbolsTexture = new THREE.Texture(canvas);
    this.symbolsTexture.needsUpdate = true;
  }

  // Renamed from 'setup' to be more specific
  private setupPlaneArea() {
    // This plane is at z=0 relative to camera's view direction for particles at z=0 from origin
    // If particles are at a different z, this plane should match that depth.
    // The camera is at z=100, looking at origin. Particles are at z=0 by default.
    // So, the plane should be at z=0 in world space for interaction.
    const planeZ = 0; // Matches default particle Z position
    const planeWidth = this.visibleWidthAtZDepth(planeZ, this.camera);
    const planeHeight = this.visibleHeightAtZDepth(planeZ, this.camera);

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({ 
        // color: 0xff0000, // For debugging plane visibility
        // opacity: 0.5, // For debugging plane visibility
        transparent: true, 
        opacity: 0, // Make it invisible
        depthWrite: false // Good for invisible interaction planes
    });
    this.planeArea = new THREE.Mesh(geometry, material);
    this.planeArea.position.z = planeZ; // Position it correctly
    this.planeArea.visible = true; // It must be 'visible' to the raycaster, even if opacity is 0
    this.scene.add(this.planeArea);
    console.log("HeroParticleLogic: Interaction planeArea setup at z=", planeZ, " W:", planeWidth, "H:", planeHeight);
  }

  private createText() { /* ... same as before, ensuring point distribution is robust ... */
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

    allPaths.forEach(path => {
      const pathLength = path.getLength();
      const numPointsForThisPath = Math.max(10, Math.floor((pathLength / totalLength) * this.data.amount));
      const points = path.getSpacedPoints(numPointsForThisPath);
      
      points.forEach(p => { // Use p for position
        thePoints.push(new THREE.Vector3(p.x, p.y, 0)); // Particles at z=0
        colorsArr.push(1, 1, 1); 
        sizesArr.push(this.data.particleSize); // Use configured particleSize
        symbolStatesArr.push(0); 
        symbolIndicesArrForAttribute.push(Math.floor(Math.random() * this.matrixSymbols.length));
        variabilitiesArr.push(Math.random());
      });
    });
    
    // Ensure attribute arrays match the final point count if there were discrepancies
    const finalPointCount = thePoints.length;
    if (colorsArr.length / 3 !== finalPointCount) colorsArr.length = finalPointCount * 3;
    if (sizesArr.length !== finalPointCount) sizesArr.length = finalPointCount;
    if (symbolStatesArr.length !== finalPointCount) symbolStatesArr.length = finalPointCount;
    if (symbolIndicesArrForAttribute.length !== finalPointCount) symbolIndicesArrForAttribute.length = finalPointCount;
    if (variabilitiesArr.length !== finalPointCount) variabilitiesArr.length = finalPointCount;


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
        symbolsTexture: { value: this.symbolsTexture }
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      blending: THREE.AdditiveBlending,
      depthTest: false, 
      transparent: true, 
    });

    this.particles = new THREE.Points(geoParticles, particleMaterial);
    this.scene.add(this.particles);
    this.geometryCopy = new THREE.BufferGeometry().copy(this.particles.geometry);
    this.initParticleStates(thePoints.length);
    console.log("HeroParticleLogic: Particles created:", thePoints.length);
   }

  public bindInteractionEvents() {
    console.log("HeroParticleLogic: Binding interaction events.");
    this.hostContainer.addEventListener('mousedown', this.boundOnMouseDown);
    this.hostContainer.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('mouseup', this.boundOnMouseUp); // Mouseup can occur outside the container

    this.hostContainer.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    this.hostContainer.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    this.hostContainer.addEventListener('touchend', this.boundOnTouchEnd, { passive: false });
  }

  public unbindInteractionEvents() {
    console.log("HeroParticleLogic: Unbinding interaction events.");
    this.hostContainer.removeEventListener('mousedown', this.boundOnMouseDown);
    this.hostContainer.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);

    this.hostContainer.removeEventListener('touchstart', this.boundOnTouchStart);
    this.hostContainer.removeEventListener('touchmove', this.boundOnTouchMove);
    this.hostContainer.removeEventListener('touchend', this.boundOnTouchEnd);
  }

  private onMouseDown(event: MouseEvent) { this.updateMousePosition(event.clientX, event.clientY); this.isPressed = true; this.data.ease = .01; }
  private onMouseUp() { this.isPressed = false; this.data.ease = .05; }
  private onMouseMove(event: MouseEvent) { 
    if (!this.hasMouseMoved) {
        console.log("HeroParticleLogic: First mouse move detected.");
        this.hasMouseMoved = true; 
    }
    this.updateMousePosition(event.clientX, event.clientY); 
  }
  private onTouchStart(event: TouchEvent) { if (event.touches.length > 0) { this.updateMousePosition(event.touches[0].clientX, event.touches[0].clientY); this.isPressed = true; this.data.ease = .01; this.hasMouseMoved = true; /* Treat touch as mouse move for activation */ } event.preventDefault(); }
  private onTouchMove(event: TouchEvent) { if (event.touches.length > 0) { this.hasMouseMoved = true; this.updateMousePosition(event.touches[0].clientX, event.touches[0].clientY); } event.preventDefault(); }
  private onTouchEnd(event: TouchEvent) { this.isPressed = false; this.data.ease = .05; event.preventDefault(); }
  
  private updateMousePosition(clientX: number, clientY: number) {
    const rect = this.hostContainer.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    // console.log("Mouse NDC:", this.mouse.x, this.mouse.y); // For debugging
  }

  public render() {
    if (!this.particles || !this.planeArea || !this.camera) return; // Essential objects guard

    // Interaction logic only runs if mouse has moved OR button is pressed
    if (!this.hasMouseMoved && !this.isPressed) {
        // Spring back even if no interaction, but only if particles exist
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

    // Keep a flag to update attributes only if changes occurred
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
      // console.log("Intersection point (world):", mx, my); // For debugging

      for (let i = 0, l = pos.count; i < l; i++) {
        const initX = copyPos.getX(i); const initY = copyPos.getY(i); const initZ = copyPos.getZ(i);
        let px = pos.getX(i); let py = pos.getY(i); let pz = pos.getZ(i);

        const dx = mx - px; const dy = my - py;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);
        const dSquared = Math.max(1e-5, dx * dx + dy * dy); // Avoid division by zero
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
                this.particleStates[i] = 1; symbolStates.setX(i, 1.0);
                sizes.setX(i, this.data.particleSize * this.symbolSizesMultipliers[i]);
                symbolIndicesBuffer.setX(i, Math.floor(Math.random() * this.matrixSymbols.length));
              }
            }
          }
        }

        // State-based visual changes
        if (this.particleStates[i] === 1) { 
          const darkGreen = this.matrixColors.darkGreen;
          if (colors.getX(i) !== darkGreen.r || colors.getY(i) !== darkGreen.g || colors.getZ(i) !== darkGreen.b) {
             colors.setXYZ(i, darkGreen.r, darkGreen.g, darkGreen.b);
             attributesNeedUpdate = true;
          }
          const newSize = Math.max(this.data.particleSize, sizes.getX(i) - this.fadeOutRates[i]);
          if (sizes.getX(i) !== newSize) {
             sizes.setX(i, newSize);
             attributesNeedUpdate = true;
          }
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - (this.cooldownRates[i] * 3));
          if (sizes.getX(i) <= this.data.particleSize) {
            this.particleStates[i] = 0; symbolStates.setX(i, 0.0);
            sizes.setX(i, this.data.particleSize); // Reset to base size
            attributesNeedUpdate = true;
          }
        } else { 
          const matrixColor = this.getMatrixColor(this.heatLevels[i]);
          if (colors.getX(i) !== matrixColor.r || colors.getY(i) !== matrixColor.g || colors.getZ(i) !== matrixColor.b) {
            colors.setXYZ(i, matrixColor.r, matrixColor.g, matrixColor.b);
            attributesNeedUpdate = true;
          }
        }
        
        if (this.heatLevels[i] > 0) {
          this.heatLevels[i] = Math.max(0, this.heatLevels[i] - this.cooldownRates[i]);
          // If heat changed, color might change, so flag update
          attributesNeedUpdate = true; 
        }

        // Spring back to original position
        const prevPx = px; const prevPy = py; const prevPz = pz;
        px += (initX - px) * this.data.ease; 
        py += (initY - py) * this.data.ease; 
        pz += (initZ - pz) * this.data.ease;
        
        if (px !== prevPx || py !== prevPy || pz !== prevPz) {
            pos.setXYZ(i, px, py, pz);
            attributesNeedUpdate = true;
        }
      }
    } else { // No intersection, but mouse has moved or is pressed - ensure particles spring back
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
  
  public resetParticleState() { /* ... same as before ... */ 
    if (!this.particles || !this.particles.geometry) {
        console.warn("HeroParticleLogic: Attempted to reset state but particles not ready.");
        return;
    }
    const colors = this.particles.geometry.attributes.customColor as THREE.BufferAttribute;
    const sizes = this.particles.geometry.attributes.size as THREE.BufferAttribute;
    const symbolStates = this.particles.geometry.attributes.symbolState as THREE.BufferAttribute;
    const symbolIndicesBuffer = this.particles.geometry.attributes.symbolIndex as THREE.BufferAttribute;

    if (!colors || !sizes || !symbolStates || !symbolIndicesBuffer) {
        console.warn("HeroParticleLogic: Attempted to reset state but attributes missing.");
        return;
    }

    for (let i = 0; i < colors.count; i++) {
      colors.setXYZ(i, 1.0, 1.0, 1.0); 
      this.particleStates[i] = 0; 
      this.heatLevels[i] = 0; 
      sizes.setX(i, this.data.particleSize); 
      symbolStates.setX(i, 0.0); 
      
      this.symbolIndicesAttributeValues[i] = Math.floor(Math.random() * this.matrixSymbols.length);
      symbolIndicesBuffer.setX(i, this.symbolIndicesAttributeValues[i]);

      this.fadeOutRates[i] = this.data.minFadeOutRate + Math.random() * (this.data.maxFadeOutRate - this.data.minFadeOutRate);
      this.symbolSizesMultipliers[i] = this.data.minSymbolSize + Math.random() * (this.data.maxSymbolSize - this.data.minSymbolSize);
    }
    colors.needsUpdate = true; sizes.needsUpdate = true; 
    symbolStates.needsUpdate = true; symbolIndicesBuffer.needsUpdate = true;
    
    console.log("HeroParticleLogic: Particle system state reset.");
  }

  private visibleHeightAtZDepth(depth: number, camera: THREE.PerspectiveCamera): number { /* ... same as before ... */ 
    const cameraOffset = camera.position.z;
    const relativeDepth = depth - cameraOffset; 
    const vFOV = camera.fov * Math.PI / 180; 
    return 2 * Math.tan(vFOV / 2) * Math.abs(relativeDepth);
  }
  private visibleWidthAtZDepth(depth: number, camera: THREE.PerspectiveCamera): number { /* ... same as before ... */ 
    return this.visibleHeightAtZDepth(depth, camera) * camera.aspect;
  }
  
  public dispose() { /* ... same as before ... */ 
    console.log("HeroParticleLogic: Disposing CreateParticles");
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
        material.dispose();
      }
    }
  }
}