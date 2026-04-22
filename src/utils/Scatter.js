import * as THREE from 'https://esm.sh/three@0.132.2';

// distribue des positions aléatoires sur le terrain
// retourne des Vector3 avec y = hauteur du terrain
export function scatterOnTerrain(terrain, count, options = {}) {
    const { edgeMargin = 0.9, minHeight = -Infinity, maxHeight = Infinity } = options;
    const size = terrain.getSize();
    const half = (size / 2) * edgeMargin;

    const positions = [];
    let tries = 0;
    const maxTries = count * 4;

    while (positions.length < count && tries < maxTries) {
        tries++;
        const x = (Math.random() * 2 - 1) * half;
        const z = (Math.random() * 2 - 1) * half;
        const y = terrain.getHeightAt(x, z);

        if (y < minHeight || y > maxHeight) continue;
        positions.push(new THREE.Vector3(x, y, z));
    }

    return positions;
}