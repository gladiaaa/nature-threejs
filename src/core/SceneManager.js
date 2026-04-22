import * as THREE from 'https://esm.sh/three@0.132.2';
import { OrbitControls } from 'https://esm.sh/three@0.132.2/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    constructor() {
        this.clock = new THREE.Clock();
        this.updatables = [];

        this._initRenderer();
        this._initScene();
        this._initCamera();
        this._initControls();
        this._bindEvents();
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        document.body.appendChild(this.renderer.domElement);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        // Fond temporaire — sera remplacé par la skybox au commit 5
        this.scene.background = new THREE.Color(0x0a0e27);
    }

    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(30, 25, 40);
        this.camera.lookAt(0, 0, 0);
    }

    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI * 0.495; // évite de passer sous le sol
    }

    _bindEvents() {
        window.addEventListener('resize', this._onResize.bind(this));
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    add(module) {
        if (module.mesh) this.scene.add(module.mesh);
        if (module.group) this.scene.add(module.group);
        if (typeof module.update === 'function') this.updatables.push(module);
    }

    start() {
        this._animate();
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        const delta = this.clock.getDelta();

        this.controls.update();
        for (const module of this.updatables) {
            module.update(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
