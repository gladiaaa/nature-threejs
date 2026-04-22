import * as THREE from 'https://esm.sh/three@0.132.2';
import { fbm2 } from '../utils/Noise.js';

const DEFAULTS = {
    size: 400,          // largeur et profondeur en unités world
    segments: 200,      // subdivisions par côté → 200*200*2 = 80000 triangles
    heightScale: 14,    // amplitude max du relief
    noiseScale: 0.015,  // fréquence du bruit (plus petit = collines plus larges)
    falloffPower: 2.5,  // agressivité du falloff sur les bords (plus = plus abrupt)
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

            // Hauteur brute par FBM
            const h = fbm2(x * noiseScale, z * noiseScale, {
                octaves: 5,
                lacunarity: 2.1,
                persistence: 0.5,
            });

            const nx = x / halfSize;
            const nz = z / halfSize;
            const dist = Math.min(1, Math.sqrt(nx * nx + nz * nz));
            const falloff = Math.pow(1 - dist, falloffPower);

            const height = h * heightScale * falloff;
            positions.setY(i, height);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0x3a5a40,
            wireframe: true,
            flatShading: false,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.name = 'Terrain';
        this._geometry = geometry;
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