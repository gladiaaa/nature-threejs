export const plantVertex = /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
        vUv = uv;
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        worldPos = modelMatrix * worldPos;
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const plantFragment = /* glsl */`
    uniform sampler2D uTexture;
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
        vec4 tex = texture2D(uTexture, vUv);
        // noir = fond, blanc = plante : on utilise la luminance pour découper
        float mask = (tex.r + tex.g + tex.b) / 3.0;
        if (mask < 0.3) discard;

        // gradient base sombre → pointe plus claire
        vec3 col = mix(uColorBase, uColorTip, vUv.y);

        // fog exp cohérent avec la scène
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 1.0);
    }
`;