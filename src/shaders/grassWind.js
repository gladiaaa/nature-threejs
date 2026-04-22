export const grassVertex = /* glsl */`
    uniform float uTime;
    uniform float uWindStrength;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // hash pour un noise rapide
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
        vUv = uv;

        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        worldPos = modelMatrix * worldPos;

        // intensité du vent : 0 à la base du brin, 1 à la pointe
        float bendFactor = pow(uv.y, 2.0);

        // noise basé sur la position world + temps → chaque brin bouge différemment
        float wind = noise(worldPos.xz * 0.3 + vec2(uTime * 0.8, uTime * 0.5));
        wind = wind * 2.0 - 1.0;

        // petit shake rapide en plus pour du grain
        float shake = sin(uTime * 4.0 + worldPos.x * 0.5 + worldPos.z * 0.3) * 0.1;

        worldPos.x += (wind + shake) * bendFactor * uWindStrength;
        worldPos.z += (wind * 0.5 + shake) * bendFactor * uWindStrength * 0.7;

        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const grassFragment = /* glsl */`
    uniform sampler2D uTexture;
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
        vec4 tex = texture2D(uTexture, vUv);
        if (tex.a < 0.3) discard;

        // gradient base sombre → pointe claire (fake lighting vertical)
        vec3 gradient = mix(uColorBase, uColorTip, vUv.y);
        vec3 col = tex.rgb * gradient;

        // fog exponentiel cohérent avec la scène
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 1.0);
    }
`;