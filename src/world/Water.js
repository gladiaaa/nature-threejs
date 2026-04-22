import * as THREE from 'https://esm.sh/three@0.132.2';
import { waterVertex, waterFragment } from '../shaders/water.js';

const DEFAULTS = {
    size: 90,
    segments: 100,
    y: -1.2,
    position: new THREE.Vector3(0, 0, 0),
    rippleInterval: 1.2, // une nouvelle onde toutes les X secondes
    rippleCount: 6,
};

export class Water {
    constructor(options = {}) {
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { size, segments, y, position, rippleCount } = this.options;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        // buffers d'ondes : positions xz + timestamp de naissance
        this._ripples = [];
        const initialPositions = [];
        const initialStarts = [];
        for (let i = 0; i < rippleCount; i++) {
            initialPositions.push(new THREE.Vector2(
                (Math.random() - 0.5) * size,
                (Math.random() - 0.5) * size
            ));
            // on décale les naissances dans le passé pour un rendu déjà vivant au démarrage
            initialStarts.push(-Math.random() * 6);
            this._ripples.push({ pos: initialPositions[i], start: initialStarts[i] });
        }

        this.material = new THREE.ShaderMaterial({
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            uniforms: {
                uTime: { value: 0 },
                uRipples: { value: initialPositions },
                uRippleStarts: { value: initialStarts },
                uColorDeep: { value: new THREE.Color(0x030814) },
                uColorShallow: { value: new THREE.Color(0x0e2038) },
                uMoonDir: { value: new THREE.Vector3(-80, 120, 60).normalize() },
                uMoonColor: { value: new THREE.Color(0x9ec2ff) },
                uFogColor: { value: new THREE.Color(0x060c1a) },
                uFogDensity: { value: 0.018 },
            },
            transparent: true,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(position);
        this.mesh.position.y = y;
        this.mesh.name = 'Water';

        this._time = 0;
        this._nextSpawn = this.options.rippleInterval;
        this._spawnIndex = 0;
    }

    update(delta) {
        this._time += delta;
        this.material.uniforms.uTime.value = this._time;

        // spawn périodique d'une nouvelle onde sur l'index le plus ancien
        if (this._time >= this._nextSpawn) {
            const { size } = this.options;
            const idx = this._spawnIndex % this._ripples.length;
            const ripple = this._ripples[idx];
            ripple.pos.set(
                (Math.random() - 0.5) * size * 0.9,
                (Math.random() - 0.5) * size * 0.9
            );
            ripple.start = this._time;

            // on met à jour les uniforms arrays
            this.material.uniforms.uRipples.value[idx].copy(ripple.pos);
            this.material.uniforms.uRippleStarts.value[idx] = ripple.start;

            this._spawnIndex++;
            this._nextSpawn = this._time + this.options.rippleInterval;
        }
    }
}