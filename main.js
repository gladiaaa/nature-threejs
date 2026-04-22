
import { SceneManager } from './src/core/SceneManager.js';

const sceneManager = new SceneManager();
sceneManager.start();

window.__scene = sceneManager;
