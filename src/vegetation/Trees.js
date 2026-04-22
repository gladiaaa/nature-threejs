import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { tryLoadGLTF } from '../loaders/AssetManager.js';
import { generateImpostor } from '../effects/Impostor.js';

const DEFAULTS = {
    count: 400,
    scaleMin: 0.8,
    scaleMax: 1.5,
    highDist: 40,
    midDist: 100,
    groundBias: 0.8, 
};

const TEX_PATH = './assets/textures/trees';

export class Trees {
    constructor(terrain, renderer, options = {}) {
        this.terrain = terrain;
        this.renderer = renderer;
        this.options = { ...DEFAULTS, ...options };
        this.group = new THREE.Group();
        this.group.name = 'Trees';
        this.pivotOffset = 0;

        this._loadTextures();
    }

    _loadTextures() {
        const loader = new THREE.TextureLoader();

        this.colorMap = loader.load(`${TEX_PATH}/color.png`);
        this.colorMap.encoding = THREE.sRGBEncoding;
        this.colorMap.flipY = false;

        this.normalMap = loader.load(`${TEX_PATH}/normal.jpg`);
        this.normalMap.flipY = false;

        this.rmaoMap = loader.load(`${TEX_PATH}/rmao.jpg`);
        this.rmaoMap.flipY = false;
    }

    async init() {
        const baseTree = await this._loadOrBuildTree();
        const box = new THREE.Box3().setFromObject(baseTree);
        this.pivotOffset = box.min.y;
        console.log('[Trees] pivot offset:', this.pivotOffset, 'bbox:', box.min.y, 'to', box.max.y);

        const midTree = this._makeMid(baseTree);
        const impostor = this._makeImpostor(baseTree);

        this._scatterLODs(baseTree, midTree, impostor);
    }

    async _loadOrBuildTree() {
        const gltf = await tryLoadGLTF('./assets/models/tree.glb');
        if (gltf) {
            const tree = gltf.scene;
            this._applyPBRMaterial(tree);
            return tree;
        }
        return this._buildProceduralTree();
    }

    _applyPBRMaterial(tree) {
        const material = new THREE.MeshStandardMaterial({
            map: this.colorMap,
            normalMap: this.normalMap,
            roughnessMap: this.rmaoMap,
            aoMap: this.rmaoMap,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
        });

        tree.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = true;
            o.receiveShadow = true;
            o.material = material;

            if (o.geometry && o.geometry.attributes.uv && !o.geometry.attributes.uv2) {
                o.geometry.setAttribute('uv2', o.geometry.attributes.uv);
            }
        });
    }

    _buildProceduralTree() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.95 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2a, roughness: 0.9 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 4, 8), trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        group.add(trunk);

        const sizes = [
            { r: 2.8, h: 3, y: 3.8 },
            { r: 2.2, h: 2.8, y: 5.2 },
            { r: 1.5, h: 2.4, y: 6.6 },
        ];
        for (const s of sizes) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(s.r, s.h, 8), leafMat);
            cone.position.y = s.y;
            cone.castShadow = true;
            group.add(cone);
        }
        return group;
    }

    _makeMid(baseTree) {
        const mid = baseTree.clone(true);
        mid.traverse((o) => {
            if (o.isMesh) o.castShadow = false;
        });
        return mid;
    }

    _makeImpostor(baseTree) {
        const { texture, width, height } = generateImpostor(this.renderer, baseTree, 512);

        const geo = new THREE.PlaneGeometry(width, height);
        geo.translate(0, height / 2, 0);

        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.3,
            side: THREE.DoubleSide,
            fog: true,
        });

        const sprite = new THREE.Mesh(geo, mat);
        sprite.onBeforeRender = (renderer, scene, camera) => {
            const dx = camera.position.x - sprite.position.x;
            const dz = camera.position.z - sprite.position.z;
            sprite.rotation.y = Math.atan2(dx, dz);
        };
        return sprite;
    }

    _scatterLODs(highMesh, midMesh, impostorMesh) {
        const { count, scaleMin, scaleMax, highDist, midDist, groundBias } = this.options;

        const positions = scatterOnTerrain(this.terrain, count, {
            edgeMargin: 0.85,
            minHeight: 0,
        });

        for (const p of positions) {
            const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
            const rotY = Math.random() * Math.PI * 2;

            const lod = new THREE.LOD();
            lod.position.set(
                p.x,
                p.y - this.pivotOffset * scale - groundBias,
                p.z
            );

            const high = highMesh.clone(true);
            high.scale.setScalar(scale);
            high.rotation.y = rotY;
            lod.addLevel(high, 0);

            const mid = midMesh.clone(true);
            mid.scale.setScalar(scale);
            mid.rotation.y = rotY;
            lod.addLevel(mid, highDist);

            const imp = impostorMesh.clone();
            imp.scale.setScalar(scale);
            imp.onBeforeRender = impostorMesh.onBeforeRender;
            lod.addLevel(imp, midDist);

            this.group.add(lod);
        }
    }
}