import { SceneManager } from './src/core/SceneManager.js';
import { Terrain } from './src/world/Terrain.js';
import { Skybox } from './src/world/Skybox.js';
import { Grass } from './src/vegetation/Grass.js';
import { Lighting } from './src/world/Lighting.js';
import { addNightFog } from './src/world/Fog.js';

const sceneManager = new SceneManager();

const terrain = new Terrain();
sceneManager.add(terrain);

const skybox = new Skybox();
sceneManager.add(skybox);

const grass = new Grass(terrain);
sceneManager.add(grass);

const lighting = new Lighting(terrain.getSize());
sceneManager.add(lighting);

addNightFog(sceneManager.scene);

sceneManager.start();

window.__scene = sceneManager;
window.__terrain = terrain;