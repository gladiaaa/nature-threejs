import * as THREE from 'https://esm.sh/three@0.132.2';

const DEFAULTS = {
    heroCount: 15,
    color: 0xfff08a,
    intensity: 2.5,
    distance: 18,
    decay: 1.8,
};


export class HeroFireflies {
    constructor(particleEngine, options = {}) {
        this.particles = particleEngine;
        this.options = { ...DEFAULTS, ...options };
        this.group = new THREE.Group();
        this.group.name = 'HeroFireflies';

        this._build();
    }

    _build() {
        const { heroCount, color, intensity, distance, decay } = this.options;
        const total = this.particles.options.count;
        this.heroIndices = [];
        for (let i = 0; i < heroCount; i++) {
            this.heroIndices.push(Math.floor((i / heroCount) * total));
        }

        this.lights = this.heroIndices.map(() => {
            const light = new THREE.PointLight(color, intensity, distance, decay);
            this.group.add(light);
            return light;
        });
    }

    update() {
        const pos = this.particles.geometry.attributes.position.array;
        const alpha = this.particles.geometry.attributes.aAlpha.array;

        for (let i = 0; i < this.heroIndices.length; i++) {
            const idx = this.heroIndices[i];
            const light = this.lights[i];

            light.position.set(
                pos[idx * 3],
                pos[idx * 3 + 1],
                pos[idx * 3 + 2]
            );
            
            light.intensity = this.options.intensity * alpha[idx];
        }
    }
}