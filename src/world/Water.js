import * as THREE from 'https://esm.sh/three@0.132.2';
import { waterVertex, waterFragment } from '../shaders/water.js';

const DEFAULTS = {
    size: 90,
    segments: 80,
    y: -1.2,
    position: new THREE.Vector3(0, 0, 0),
};

export class Water {
    constructor(options = {}) {
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { size, segments, y, position } = this.options;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        this.material = new THREE.ShaderMaterial({
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            uniforms: {
                uTime: { value: 0 },
                uColorDeep: { value: new THREE.Color(0x0a1428) },
                uColorShallow: { value: new THREE.Color(0x1e3a5f) },
                uMoonDir: { value: new THREE.Vector3(-80, 120, 60).normalize() },
                uMoonColor: { value: new THREE.Color(0x8ab4ff) },
                uFogColor: { value: new THREE.Color(0x0a1428) },
                uFogDensity: { value: 0.012 },
            },
            transparent: true,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(position);
        this.mesh.position.y = y;
        this.mesh.name = 'Water';
    }

    update(delta) {
        this.material.uniforms.uTime.value += delta;
    }
}