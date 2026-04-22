import * as THREE from 'https://esm.sh/three@0.132.2';

export function addNightFog(scene) {
    scene.fog = new THREE.FogExp2(0x0a1428, 0.012);
}