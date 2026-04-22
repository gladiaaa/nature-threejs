import * as THREE from 'https://esm.sh/three@0.132.2';
import { SceneManager } from './src/core/SceneManager.js';
import { Terrain } from './src/world/Terrain.js';
import { Skybox } from './src/world/Skybox.js';

const sceneManager = new SceneManager();

const terrain = new Terrain();
sceneManager.add(terrain);

const skybox = new Skybox();
sceneManager.add(skybox);

// lumière temporaire
const tempLight = new THREE.DirectionalLight(0xffffff, 1);
tempLight.position.set(50, 100, 50);
sceneManager.scene.add(tempLight);
sceneManager.scene.add(new THREE.AmbientLight(0x404060, 0.5));

sceneManager.start();

window.__scene = sceneManager;
window.__terrain = terrain;