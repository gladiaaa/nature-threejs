import * as THREE from 'https://esm.sh/three@0.132.2';
import { scatterOnTerrain } from '../utils/Scatter.js';
import { tryLoadGLTF } from '../loaders/AssetManager.js';
import { generateImpostor } from '../effects/Impostor.js';

const DEFAULTS = {
    count: 200,
    scaleMin: 0.8,
    scaleMax: 1.5,
    highDist: 40,
    midDist: 100,
};

export class Trees {
    constructor(terrain, renderer, options = {}) {
        this.terrain = terrain;
        this.renderer = renderer;
        this.options = { ...DEFAULTS, ...options };
        this.group = new THREE.Group();
        this.group.name = 'Trees';
    }

    async init() {
        const baseTree = await this._loadOrBuildTree();
        const midTree = this._makeMid(baseTree);
        const impostor = this._makeImpostor(baseTree);

        this._scatterLODs(baseTree, midTree, impostor);
    }

    async _loadOrBuildTree() {
        const gltf = await tryLoadGLTF('./assets/models/tree.glb');
        if (gltf) {
            const tree = gltf.scene;
            this._applyVertexColors(tree);
            return tree;
        }
        return this._buildProceduralTree();
    }

    // le GLB est une seule mesh sans matériau : on colore par hauteur
    // (tronc marron en bas, feuillage vert en haut)
    _applyVertexColors(tree) {
        tree.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = true;
            o.receiveShadow = true;

            const geo = o.geometry;
            const pos = geo.attributes.position;
            const count = pos.count;
            const colors = new Float32Array(count * 3);

            // bbox pour normaliser la hauteur
            geo.computeBoundingBox();
            const minY = geo.boundingBox.min.y;
            const maxY = geo.boundingBox.max.y;
            const range = maxY - minY;

            // seuil à 30% = transition tronc/feuillage
            const threshold = 0.3;

            const trunkColor = new THREE.Color(0x3a2818);
            const leafColor = new THREE.Color(0x2d5a1b);
            const leafLight = new THREE.Color(0x3f7a28);

            for (let i = 0; i < count; i++) {
                const y = pos.getY(i);
                const t = (y - minY) / range;

                let c;
                if (t < threshold) {
                    c = trunkColor;
                } else {
                    // petit gradient sur le feuillage pour plus de vie
                    const lt = (t - threshold) / (1 - threshold);
                    c = leafColor.clone().lerp(leafLight, lt * 0.4);
                }
                colors[i * 3] = c.r;
                colors[i * 3 + 1] = c.g;
                colors[i * 3 + 2] = c.b;
            }

            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            o.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.9,
                metalness: 0,
                flatShading: false,
            });
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
        const { count, scaleMin, scaleMax, highDist, midDist } = this.options;

        const positions = scatterOnTerrain(this.terrain, count, {
            edgeMargin: 0.85,
            minHeight: 0,
        });

        for (const p of positions) {
            const lod = new THREE.LOD();
            lod.position.copy(p);
            lod.position.y -= 0.2;

            const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
            const rotY = Math.random() * Math.PI * 2;

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