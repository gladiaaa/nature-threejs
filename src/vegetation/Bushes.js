import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { makeCrossPlaneGeometry } from '../utils/CrossPlanes.js';

const DEFAULTS = {
    count: 300,
    width: 3,
    height: 2.5,
    scaleMin: 0.6,
    scaleMax: 1.3,
};

export class Bushes {
    constructor(terrain, options = {}) {
        this.terrain = terrain;
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { count, width, height, scaleMin, scaleMax } = this.options;

        const geometry = makeCrossPlaneGeometry(width, height, 3);

        const texture = new THREE.TextureLoader().load('./assets/textures/bushes/bush.png');
        texture.encoding = THREE.sRGBEncoding;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.85,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.name = 'Bushes';
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        const positions = scatterOnTerrain(this.terrain, count, {
            edgeMargin: 0.85,
            minHeight: -1,
        });

        const dummy = new THREE.Object3D();
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i].clone();
            p.y -= 0.15;
            dummy.position.copy(p);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const s = scaleMin + Math.random() * (scaleMax - scaleMin);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}