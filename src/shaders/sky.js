// gradient de nuit + étoiles procédurales
export const skyVertex = /* glsl */`
    varying vec3 vWorldPos;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const skyFragment = /* glsl */`
    varying vec3 vWorldPos;
    uniform float uTime;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorZenith;

    // hash pseudo-random
    float hash(vec2 p) {
        p = fract(p * vec2(443.897, 441.423));
        p += dot(p, p.yx + 19.19);
        return fract((p.x + p.y) * p.x);
    }

    // champ d'étoiles : points rares et brillants
    float stars(vec3 dir, float density, float brightness) {
        vec2 uv = vec2(atan(dir.z, dir.x), asin(dir.y));
        uv *= 80.0;
        vec2 id = floor(uv);
        vec2 gv = fract(uv) - 0.5;

        float h = hash(id);
        if (h < 1.0 - density) return 0.0;

        vec2 offset = vec2(hash(id + 1.3), hash(id + 7.7)) - 0.5;
        float d = length(gv - offset * 0.5);
        float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + h * 50.0);
        return smoothstep(0.05, 0.0, d) * brightness * twinkle;
    }

    void main() {
        vec3 dir = normalize(vWorldPos);

        // gradient vertical : horizon -> zenith
        float t = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uColorHorizon, uColorZenith, pow(t, 1.5));

        // deux couches d'étoiles pour plus de densité
        float s = stars(dir, 0.02, 1.0) + stars(dir, 0.005, 1.5);
        col += vec3(s);

        gl_FragColor = vec4(col, 1.0);
    }
`;