export const waterVertex = /* glsl */`
    uniform float uTime;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;

    
    float wave(vec2 p, vec2 dir, float freq, float speed, float amp) {
        return sin(dot(p, dir) * freq + uTime * speed) * amp;
    }

    void main() {
        vec3 pos = position;
        vec2 p = pos.xz;

        float h = 0.0;
        h += wave(p, vec2(1.0, 0.3), 0.15, 1.2, 0.25);
        h += wave(p, vec2(-0.5, 0.8), 0.22, 1.6, 0.18);
        h += wave(p, vec2(0.7, -0.6), 0.35, 2.0, 0.10);
        h += wave(p, vec2(-0.3, -0.9), 0.55, 2.4, 0.05);

        pos.y += h;
        vWaveHeight = h;

        
        float dx =
            cos(dot(p, vec2(1.0, 0.3)) * 0.15 + uTime * 1.2) * 0.15 * 0.25 +
            cos(dot(p, vec2(-0.5, 0.8)) * 0.22 + uTime * 1.6) * -0.11 +
            cos(dot(p, vec2(0.7, -0.6)) * 0.35 + uTime * 2.0) * 0.245;
        float dz =
            cos(dot(p, vec2(1.0, 0.3)) * 0.15 + uTime * 1.2) * 0.0375 +
            cos(dot(p, vec2(-0.5, 0.8)) * 0.22 + uTime * 1.6) * 0.176 +
            cos(dot(p, vec2(0.7, -0.6)) * 0.35 + uTime * 2.0) * -0.21;
        vNormal = normalize(vec3(-dx, 1.0, -dz));

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const waterFragment = /* glsl */`
    uniform float uTime;
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    uniform vec3 uMoonDir;
    uniform vec3 uMoonColor;
    uniform vec3 uFogColor;
    uniform float uFogDensity;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;

    void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 n = normalize(vNormal);

       
        float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 3.0);

        
        vec3 baseCol = mix(uColorDeep, uColorShallow, vWaveHeight * 0.5 + 0.5);

       
        vec3 halfVec = normalize(uMoonDir + viewDir);
        float spec = pow(max(dot(n, halfVec), 0.0), 64.0);
        vec3 specCol = uMoonColor * spec * 1.5;

       
        vec3 reflectCol = mix(uColorShallow, uMoonColor * 0.6, fresnel);

        vec3 col = mix(baseCol, reflectCol, fresnel * 0.7) + specCol;

  
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 0.92);
    }
`;