import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { makeCrossPlaneGeometry } from '../utils/CrossPlanes.js';
import { plantVertex, plantFragment } from '../shaders/plantTint.js';

// 5 variants : chacun a sa silhouette, sa taille et sa palette
const VARIANTS = [
    {
        file: 'alpha1.png',
        count: 120,
        width: 2.4,
        height: 3.0,
        colorBase: 0x1a3020,
        colorTip: 0x4a7a3a,
    },
    {
        file: 'alpha2.png',
        count: 150,
        width: 1.6,
        height: 1.4,
        colorBase: 0x223828,
        colorTip: 0x5a8040,
    },
    {
        file: 'alpha3.png',
        count: 100,
        width: 1.2,
        height: 1.2,
        colorBase: 0x3a3060,
        colorTip: 0xa090c8,  // fleur violet pâle
    },
    {
        file: 'alpha4.png',
        count: 150,
        width: 1.8,
        height: 1.6,
        colorBase: 0x1e3022,
        colorTip: 0x5a7a48,
    },
    {
        file: 'alpha5.png',
        count: 80,
        width: 1.8,
        height: 2.6,
        colorBase: 0x2a3828,
        colorTip: 0xc0a870,  // fleur jaune/beige
    },
];

export class Plants {
    constructor(terrain, options = {}) {
        this.terrain = terrain;
        this.meshes = [];
        this.group = new THREE.Group();
        this.group.name = 'Plants';

        this._build();
    }

    _build() {
        const loader = new THREE.TextureLoader();

        for (const v of VARIANTS) {
            const geometry = makeCrossPlaneGeometry(v.width, v.height, 2);
            const texture = loader.load(`./assets/textures/plants/${v.file}`);
            texture.encoding = THREE.sRGBEncoding;

            const material = new THREE.ShaderMaterial({
                vertexShader: plantVertex,
                fragmentShader: plantFragment,
                uniforms: {
                    uTexture: { value: texture },
                    uColorBase: { value: new THREE.Color(v.colorBase) },
                    uColorTip: { value: new THREE.Color(v.colorTip) },
                    uFogColor: { value: new THREE.Color(0x060c1a) },
                    uFogDensity: { value: 0.018 },
                },
                side: THREE.DoubleSide,
                transparent: false,
            });

            const mesh = new THREE.InstancedMesh(geometry, material, v.count);
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;

            const positions = scatterOnTerrain(this.terrain, v.count, {
                edgeMargin: 0.86,
                minHeight: -1,
            });

            const dummy = new THREE.Object3D();
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i].clone();
                p.y -= 0.1;
                dummy.position.copy(p);
                dummy.rotation.y = Math.random() * Math.PI * 2;
                const s = 0.7 + Math.random() * 0.6;
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;

            this.group.add(mesh);
            this.meshes.push(mesh);
        }
    }
}