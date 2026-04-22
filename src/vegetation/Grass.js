import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { makeCrossPlaneGeometry } from '../utils/CrossPlanes.js';
import { grassVertex, grassFragment } from '../shaders/grassWind.js';

const DEFAULTS = {
    count: 15000,
    bladeWidth: 1.2,
    bladeHeight: 1.5,
    scaleMin: 0.7,
    scaleMax: 1.4,
    windStrength: 0.35,
};

export class Grass {
    constructor(terrain, options = {}) {
        this.terrain = terrain;
        this.options = { ...DEFAULTS, ...options };
        this._build();
    }

    _build() {
        const { count, bladeWidth, bladeHeight, scaleMin, scaleMax, windStrength } = this.options;

        const geometry = makeCrossPlaneGeometry(bladeWidth, bladeHeight, 2);

        const texture = new THREE.TextureLoader().load('./assets/textures/grass/grass.png');
        texture.encoding = THREE.sRGBEncoding;

        this.material = new THREE.ShaderMaterial({
            vertexShader: grassVertex,
            fragmentShader: grassFragment,
            uniforms: {
                uTime: { value: 0 },
                uWindStrength: { value: windStrength },
                uTexture: { value: texture },
                uColorBase: { value: new THREE.Color(0x1a3020) },
                uColorTip: { value: new THREE.Color(0x6a9050) },
                uFogColor: { value: new THREE.Color(0x0a1428) },
                uFogDensity: { value: 0.012 },
            },
            side: THREE.DoubleSide,
            transparent: false, // discard dans le shader gère la découpe
        });

        this.mesh = new THREE.InstancedMesh(geometry, this.material, count);
        this.mesh.name = 'Grass';
        this.mesh.receiveShadow = true;
        // frustum culling désactivé : sinon on perd les brins déplacés par le vent en bord d'écran
        this.mesh.frustumCulled = false;

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

    update(delta) {
        this.material.uniforms.uTime.value += delta;
    }
}