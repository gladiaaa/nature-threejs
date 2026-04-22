import * as THREE from 'https://esm.sh/three@0.132.2';
import { EffectComposer } from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/UnrealBloomPass.js';

const DEFAULTS = {
    strength: 0.8,
    radius: 0.8,
    threshold: 0.3,
};

export class PostProcessing {
    constructor(renderer, scene, camera, options = {}) {
        this.renderer = renderer;
        const opts = { ...DEFAULTS, ...options };

        this.composer = new EffectComposer(renderer);

        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            opts.strength,
            opts.radius,
            opts.threshold
        );
        this.composer.addPass(this.bloomPass);

        this._setSize();
        window.addEventListener('resize', this._setSize.bind(this));
    }

    _setSize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.composer.render();
    }
}