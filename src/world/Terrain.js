import * as THREE from 'https://esm.sh/three@0.132.2';
import { fbm2 } from '../utils/Noise.js';
import { createGroundMaterial } from './GroundMaterial.js';

const DEFAULTS = {
    size: 400,
    segments: 200,
    heightScale: 14,
    noiseScale: 0.015,
    falloffPower: 2.5,
};

export class Terrain {
    constructor(options = {}) {
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { size, segments, heightScale, noiseScale, falloffPower } = this.options;

        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position;
        const halfSize = size / 2;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            const h = fbm2(x * noiseScale, z * noiseScale, {
                octaves: 5,
                lacunarity: 2.1,
                persistence: 0.5,
            });

            const nx = x / halfSize;
            const nz = z / halfSize;
            const dist = Math.min(1, Math.sqrt(nx * nx + nz * nz));
            const falloff = Math.pow(1 - dist, falloffPower);

            positions.setY(i, h * heightScale * falloff);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        // aoMap a besoin d'un 2e set d'UV
        geometry.setAttribute('uv2', geometry.attributes.uv);

        const material = createGroundMaterial(16);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.name = 'Terrain';
    }

    getHeightAt(x, z) {
        const { size, heightScale, noiseScale, falloffPower } = this.options;
        const halfSize = size / 2;

        const h = fbm2(x * noiseScale, z * noiseScale, {
            octaves: 5,
            lacunarity: 2.1,
            persistence: 0.5,
        });

        const nx = x / halfSize;
        const nz = z / halfSize;
        const dist = Math.min(1, Math.sqrt(nx * nx + nz * nz));
        const falloff = Math.pow(1 - dist, falloffPower);

        return h * heightScale * falloff;
    }

    getSize() {
        return this.options.size;
    }
}