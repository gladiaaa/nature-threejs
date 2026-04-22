import * as THREE from 'https://esm.sh/three@0.132.2';

export function generateImpostor(renderer, sourceMesh, size = 512) {
    const box = new THREE.Box3().setFromObject(sourceMesh);
    const dims = new THREE.Vector3();
    box.getSize(dims);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const width = Math.max(dims.x, dims.z);
    const height = dims.y;

    const target = new THREE.WebGLRenderTarget(size, size, {
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        encoding: THREE.sRGBEncoding,
    });

    const cam = new THREE.OrthographicCamera(
        -width / 2, width / 2,
        height / 2, -height / 2,
        0.1, 1000
    );

    const scene = new THREE.Scene();
    scene.fog = null;
    scene.background = null;

    const clone = sourceMesh.clone(true);
    clone.position.sub(center);
    clone.position.y += height / 2;
    scene.add(clone);

    cam.position.set(0, height / 2, Math.max(width, height) * 2);
    cam.lookAt(0, height / 2, 0);

    // éclairage doux pour préserver les couleurs vraies des matériaux
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.4);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    const prevTarget = renderer.getRenderTarget();
    const prevClearAlpha = renderer.getClearAlpha();
    const prevClearColor = new THREE.Color();
    renderer.getClearColor(prevClearColor);

    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, cam);

    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevClearColor, prevClearAlpha);

    return {
        texture: target.texture,
        width,
        height,
    };
}