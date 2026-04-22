import * as THREE from 'https://esm.sh/three@0.132.2';
import { GLTFLoader } from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const texLoader = new THREE.TextureLoader();

const cache = new Map();

export function loadGLTF(url) {
    if (cache.has(url)) return cache.get(url);
    const promise = new Promise((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
    });
    cache.set(url, promise);
    return promise;
}

export function loadTexture(url) {
    if (cache.has(url)) return cache.get(url);
    const tex = texLoader.load(url);
    cache.set(url, tex);
    return tex;
}


export async function tryLoadGLTF(url) {
    try {
        return await loadGLTF(url);
    } catch (err) {
        console.warn(`[AssetManager] Could not load ${url}:`, err);
        return null;
    }
}