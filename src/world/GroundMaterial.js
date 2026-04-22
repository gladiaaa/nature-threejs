import * as THREE from 'https://esm.sh/three@0.132.2';

const BASE = './assets/textures/ground';

export function createGroundMaterial(repeat = 16) {
    const loader = new THREE.TextureLoader();

    const color = loader.load(`${BASE}/color.jpg`);
    const normal = loader.load(`${BASE}/normal.jpg`);
    const roughness = loader.load(`${BASE}/roughness.jpg`);
    const ao = loader.load(`${BASE}/ao.jpg`);

    for (const tex of [color, normal, roughness, ao]) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat, repeat);
    }

    color.encoding = THREE.sRGBEncoding;

    return new THREE.MeshStandardMaterial({
        map: color,
        normalMap: normal,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughnessMap: roughness,
        roughness: 1.0,
        metalness: 0,
        aoMap: ao,
        aoMapIntensity: 1.2,
    });
}