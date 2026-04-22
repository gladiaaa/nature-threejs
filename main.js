import { SceneManager } from './src/core/SceneManager.js';
import { PostProcessing } from './src/core/PostProcessing.js';
import { Terrain } from './src/world/Terrain.js';
import { Skybox } from './src/world/Skybox.js';
import { Grass } from './src/vegetation/Grass.js';
import { Bushes } from './src/vegetation/Bushes.js';
import { Trees } from './src/vegetation/Trees.js';
import { Water } from './src/world/Water.js';
import { Lighting } from './src/world/Lighting.js';
import { addNightFog } from './src/world/Fog.js';
import { ParticleEngine } from './src/effects/ParticleEngine.js';

const sceneManager = new SceneManager();

const terrain = new Terrain();
sceneManager.add(terrain);

const skybox = new Skybox();
sceneManager.add(skybox);

const grass = new Grass(terrain);
sceneManager.add(grass);

const bushes = new Bushes(terrain);
sceneManager.add(bushes);

const trees = new Trees(terrain, sceneManager.renderer);
await trees.init();
sceneManager.add(trees);

const water = new Water();
sceneManager.add(water);

const fireflies = new ParticleEngine();
sceneManager.add(fireflies);

const lighting = new Lighting(terrain.getSize());
sceneManager.add(lighting);

addNightFog(sceneManager.scene);

// post-processing bloom
const post = new PostProcessing(
    sceneManager.renderer,
    sceneManager.scene,
    sceneManager.camera
);
sceneManager.setRenderFn(() => post.render());

sceneManager.start();

window.__scene = sceneManager;
window.__terrain = terrain;
window.__post = post;