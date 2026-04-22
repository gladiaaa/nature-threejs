import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';

const DEFAULTS = {
    count: 15000,
    bladeWidth: 1.2,
    bladeHeight: 1.5,
    scaleMin: 0.7,
    scaleMax: 1.4,
};

export class Grass {
    constructor(terrain, options = {}) {
        this.terrain = terrain;
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { count, bladeWidth, bladeHeight, scaleMin, scaleMax } = this.options;

        // plans croisés : 2 quads perpendiculaires mergés en une seule géométrie
        const geometry = this._makeCrossPlaneGeometry(bladeWidth, bladeHeight);

        const texture = new THREE.TextureLoader().load('./assets/textures/grass/grass.png');
        texture.encoding = THREE.sRGBEncoding;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.3,
            side: THREE.DoubleSide,
            roughness: 0.9,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.name = 'Grass';
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = true;

        const positions = scatterOnTerrain(this.terrain, count, {
            edgeMargin: 0.88,
            minHeight: -2, // pas d'herbe sous l'eau (pour le commit 8)
        });

        const dummy = new THREE.Object3D();
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            dummy.position.copy(p);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const s = scaleMin + Math.random() * (scaleMax - scaleMin);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    // 2 quads qui se croisent à 90°, ancrés en bas (pivot au pied)
    _makeCrossPlaneGeometry(w, h) {
        const g1 = new THREE.PlaneGeometry(w, h);
        g1.translate(0, h / 2, 0);
        const g2 = g1.clone();
        g2.rotateY(Math.PI / 2);

        // merge manuel pour rester compatible sans BufferGeometryUtils
        const merged = new THREE.BufferGeometry();
        const pos1 = g1.attributes.position.array;
        const pos2 = g2.attributes.position.array;
        const uv1 = g1.attributes.uv.array;
        const uv2 = g2.attributes.uv.array;
        const norm1 = g1.attributes.normal.array;
        const norm2 = g2.attributes.normal.array;
        const idx1 = g1.index.array;
        const idx2 = g2.index.array;

        const positions = new Float32Array(pos1.length + pos2.length);
        positions.set(pos1, 0);
        positions.set(pos2, pos1.length);

        const uvs = new Float32Array(uv1.length + uv2.length);
        uvs.set(uv1, 0);
        uvs.set(uv2, uv1.length);

        const normals = new Float32Array(norm1.length + norm2.length);
        normals.set(norm1, 0);
        normals.set(norm2, norm1.length);

        const offset = pos1.length / 3;
        const indices = new Uint16Array(idx1.length + idx2.length);
        indices.set(idx1, 0);
        for (let i = 0; i < idx2.length; i++) indices[idx1.length + i] = idx2[i] + offset;

        merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        merged.setIndex(new THREE.BufferAttribute(indices, 1));

        return merged;
    }
}