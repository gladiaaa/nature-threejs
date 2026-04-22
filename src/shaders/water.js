export const waterVertex = /* glsl */`
    uniform float uTime;
    uniform vec2 uRipples[6];  // positions xz des points d'émission
    uniform float uRippleStarts[6]; // quand chaque onde a commencé

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vRipple;

    // onde circulaire qui se propage depuis un centre
    float ripple(vec2 p, vec2 center, float startTime, float currentTime) {
        float age = currentTime - startTime;
        if (age < 0.0 || age > 6.0) return 0.0;

        float dist = distance(p, center);
        float radius = age * 4.0; // vitesse de propagation
        float thickness = 1.5;

        // onde localisée autour du front qui s'étale
        float wave = smoothstep(thickness, 0.0, abs(dist - radius));
        // atténuation avec l'âge
        float fade = 1.0 - age / 6.0;
        // sin pour l'ondulation elle-même (2-3 crêtes visibles)
        float osc = sin((dist - radius) * 3.0) * 0.5 + 0.5;

        return wave * fade * osc;
    }

    void main() {
        vec3 pos = position;
        vec2 p = pos.xz;

        float h = 0.0;
        for (int i = 0; i < 6; i++) {
            h += ripple(p, uRipples[i], uRippleStarts[i], uTime) * 0.15;
        }

        // micro-frisson global très léger (mare jamais totalement immobile)
        h += sin(p.x * 0.4 + uTime * 0.6) * sin(p.y * 0.5 + uTime * 0.4) * 0.015;

        pos.y += h;
        vRipple = h;

        // normale approchée : dérivée approximative en finite difference
        // (on calcule h à p+dx et p+dz)
        float eps = 0.5;
        float hx = 0.0;
        float hz = 0.0;
        for (int i = 0; i < 6; i++) {
            hx += ripple(p + vec2(eps, 0.0), uRipples[i], uRippleStarts[i], uTime) * 0.15;
            hz += ripple(p + vec2(0.0, eps), uRipples[i], uRippleStarts[i], uTime) * 0.15;
        }
        vec3 tangent = normalize(vec3(eps, hx - h, 0.0));
        vec3 bitangent = normalize(vec3(0.0, hz - h, eps));
        vNormal = normalize(cross(bitangent, tangent));

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
    varying float vRipple;

    void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 n = normalize(vNormal);

        // Fresnel fort : en surface plate, la lumière rebondit beaucoup sur l'eau
        float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 4.0);

        // couleur de base : eau très sombre avec petites variations sur les ondes
        vec3 baseCol = mix(uColorDeep, uColorShallow, vRipple * 4.0 + 0.5);

        // reflet de la lune bien marqué (mare = miroir)
        vec3 halfVec = normalize(uMoonDir + viewDir);
        float spec = pow(max(dot(n, halfVec), 0.0), 80.0);
        vec3 specCol = uMoonColor * spec * 2.5;

        // sky reflection : on reflète un bleu-gris nuit clair
        vec3 skyReflect = mix(uColorShallow, uMoonColor * 0.5, 0.6);

        vec3 col = mix(baseCol, skyReflect, fresnel * 0.8) + specCol;

        // fog
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 0.96);
    }
`;