import * as THREE from 'https://esm.sh/three@0.132.2';

export class Lighting {
    constructor(terrainSize = 400) {
        this.group = new THREE.Group();
        this.group.name = 'Lighting';

        // lune : directionnelle froide bleutée
        const moon = new THREE.DirectionalLight(0x8ab4ff, 1.2);
        moon.position.set(-80, 120, 60);
        moon.castShadow = true;
        moon.shadow.mapSize.set(2048, 2048);

        const s = terrainSize / 2;
        moon.shadow.camera.left = -s;
        moon.shadow.camera.right = s;
        moon.shadow.camera.top = s;
        moon.shadow.camera.bottom = -s;
        moon.shadow.camera.near = 10;
        moon.shadow.camera.far = 400;
        moon.shadow.bias = -0.0005;


        const hemi = new THREE.HemisphereLight(0x3a4a7a, 0x0a1020, 0.35);

        // ambient léger pour éviter le noir total
        const ambient = new THREE.AmbientLight(0x1a2040, 0.2);

        this.moon = moon;
        this.group.add(moon, hemi, ambient);
    }
}