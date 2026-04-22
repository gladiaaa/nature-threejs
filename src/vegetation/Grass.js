import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { makeCrossPlaneGeometry } from '../utils/CrossPlanes.js';

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

        const geometry = makeCrossPlaneGeometry(bladeWidth, bladeHeight, 2);

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
        this.mesh.receiveShadow = true;

        const positions = scatterOnTerrain(this.terrain, count, {
            edgeMargin: 0.88,
            minHeight: -2,
        });

        const dummy = new THREE.Object3D();
        for (let i = 0; i < positions.length; i++) {
            dummy.position.copy(positions[i]);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const s = scaleMin + Math.random() * (scaleMax - scaleMin);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}