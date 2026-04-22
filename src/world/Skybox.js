import * as THREE from 'https://esm.sh/three@0.132.2';
import { skyVertex, skyFragment } from '../shaders/sky.js';

export class Skybox {
    constructor() {
        const geometry = new THREE.SphereGeometry(1000, 32, 32);

        this.material = new THREE.ShaderMaterial({
            vertexShader: skyVertex,
            fragmentShader: skyFragment,
            uniforms: {
                uTime: { value: 0 },
                uColorHorizon: { value: new THREE.Color(0x1a1f3a) },
                uColorZenith: { value: new THREE.Color(0x05060f) },
            },
            side: THREE.BackSide,
            depthWrite: false,
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.name = 'Skybox';
    }

    update(delta) {
        this.material.uniforms.uTime.value += delta;
    }
}