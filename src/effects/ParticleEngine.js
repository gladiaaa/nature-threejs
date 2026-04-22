import * as THREE from 'https://esm.sh/three@0.132.2';

const DEFAULTS = {
    count: 400,
    bounds: { x: 180, y: 15, z: 180 },
    heightMin: 2,
    heightMax: 18,
    speed: 0.6,
    size: 1.2,
    color: 0xfff4a3,
    texture: './assets/textures/particles/firefly.png',
};

export class ParticleEngine {
    constructor(options = {}) {
        this.options = { ...DEFAULTS, ...options };

        this._elapsed = 0;
        this._build();
    }

    _build() {
        const { count, bounds, heightMin, heightMax, size, color, texture } = this.options;

        const positions = new Float32Array(count * 3);
        const seeds = new Float32Array(count);       
        const phases = new Float32Array(count);      
        const alphas = new Float32Array(count);     

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * bounds.x;
            positions[i * 3 + 1] = heightMin + Math.random() * (heightMax - heightMin);
            positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
            seeds[i] = Math.random() * 1000;
            phases[i] = Math.random() * Math.PI * 2;
            alphas[i] = Math.random();
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

        this._seeds = seeds;
        this._phases = phases;
        this._basePositions = positions.slice();

        const tex = new THREE.TextureLoader().load(texture);

        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uColor: { value: new THREE.Color(color) },
                uSize: { value: size },
            },
            vertexShader: /* glsl */`
                attribute float aAlpha;
                varying float vAlpha;
                uniform float uSize;

                void main() {
                    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPos;
                    // taille qui dépend de la distance (shrink avec la profondeur)
                    gl_PointSize = uSize * 300.0 / -mvPos.z;
                    vAlpha = aAlpha;
                }
            `,
            fragmentShader: /* glsl */`
                uniform sampler2D uTexture;
                uniform vec3 uColor;
                varying float vAlpha;

                void main() {
                    vec4 tex = texture2D(uTexture, gl_PointCoord);
                    gl_FragColor = vec4(uColor, tex.a * vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.name = 'Fireflies';
        this.mesh.frustumCulled = false;
    }

    update(delta) {
        this._elapsed += delta;

        const { count, bounds, heightMin, heightMax, speed } = this.options;
        const pos = this.geometry.attributes.position.array;
        const alpha = this.geometry.attributes.aAlpha.array;
        const t = this._elapsed;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const seed = this._seeds[i];

            
            pos[i3] = this._basePositions[i3] + Math.sin(t * speed + seed) * 3;
            pos[i3 + 1] = this._basePositions[i3 + 1] + Math.sin(t * speed * 0.7 + seed * 1.3) * 1.5;
            pos[i3 + 2] = this._basePositions[i3 + 2] + Math.cos(t * speed * 0.8 + seed * 0.5) * 3;

            
            this._basePositions[i3] += Math.sin(t * 0.1 + seed) * delta * 0.8;
            this._basePositions[i3 + 2] += Math.cos(t * 0.1 + seed) * delta * 0.8;

            
            if (Math.abs(this._basePositions[i3]) > bounds.x / 2) {
                this._basePositions[i3] = -Math.sign(this._basePositions[i3]) * bounds.x / 2;
            }
            if (Math.abs(this._basePositions[i3 + 2]) > bounds.z / 2) {
                this._basePositions[i3 + 2] = -Math.sign(this._basePositions[i3 + 2]) * bounds.z / 2;
            }
            if (this._basePositions[i3 + 1] < heightMin || this._basePositions[i3 + 1] > heightMax) {
                this._basePositions[i3 + 1] = heightMin + Math.random() * (heightMax - heightMin);
            }

           
            const blink = Math.sin(t * 2.5 + this._phases[i]) * 0.5 + 0.5;
            alpha[i] = 0.2 + blink * 0.8;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.aAlpha.needsUpdate = true;
    }
}