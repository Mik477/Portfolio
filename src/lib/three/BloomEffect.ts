// src/lib/three/BloomEffect.ts
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class BloomEffect {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    // MODIFIED: Camera type is now more generic to support Orthographic camera
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    
    public composer: EffectComposer;
    private renderPass: RenderPass;
    private bloomPass: UnrealBloomPass;
    private outputPass: OutputPass;

    // Bloom Parameters (shared default configuration)
    private bloomParams = {
        threshold: 0.4,
        strength: 0.15,
        radius: 0.1,
    };

    constructor(
        renderer: THREE.WebGLRenderer, 
        scene: THREE.Scene, 
        camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
        width: number, 
        height: number
    ) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(width, height);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 1. Render the original scene
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        // 2. Apply bloom
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            this.bloomParams.strength,
            this.bloomParams.radius,
            this.bloomParams.threshold
        );
        this.composer.addPass(this.bloomPass);
        
        // 3. Output the result (handles tone mapping and color space conversion)
        this.outputPass = new OutputPass();
        this.composer.addPass(this.outputPass);
    }

    public render(deltaTime: number): void {
        this.composer.render(deltaTime);
    }

    public setSize(width: number, height: number): void {
        this.composer.setSize(width, height);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    public updateParameters(params: { threshold?: number; strength?: number; radius?: number }): void {
        if (params.threshold !== undefined) this.bloomPass.threshold = params.threshold;
        if (params.strength !== undefined) this.bloomPass.strength = params.strength;
        if (params.radius !== undefined) this.bloomPass.radius = params.radius;
    }

    public dispose(): void {
        // EffectComposer automatically disposes its passes' render targets
        // if they were created internally by the composer or pass.
    }
}