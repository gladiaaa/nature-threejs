import * as THREE from 'https://esm.sh/three@0.132.2';

export function addNightFog(scene) {
    scene.fog = new THREE.FogExp2(0x060c1a, 0.018);
}