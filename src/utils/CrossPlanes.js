import * as THREE from 'https://esm.sh/three@0.132.2';

// assemble N plans qui se croisent autour de l'axe Y
// pivot en bas pour que le mesh soit posé sur le sol
export function makeCrossPlaneGeometry(width, height, planeCount = 2) {
    const planes = [];
    for (let i = 0; i < planeCount; i++) {
        const g = new THREE.PlaneGeometry(width, height);
        g.translate(0, height / 2, 0);
        g.rotateY((Math.PI / planeCount) * i);
        planes.push(g);
    }
    return mergeGeometries(planes);
}

// merge manuel pour éviter d'importer BufferGeometryUtils
function mergeGeometries(geometries) {
    const posArrays = [];
    const uvArrays = [];
    const normArrays = [];
    const indexArrays = [];

    let totalPos = 0, totalUv = 0, totalNorm = 0, totalIdx = 0, vertexOffset = 0;
    const offsets = [];

    for (const g of geometries) {
        const p = g.attributes.position.array;
        const u = g.attributes.uv.array;
        const n = g.attributes.normal.array;
        const idx = g.index.array;
        posArrays.push(p);  totalPos += p.length;
        uvArrays.push(u);   totalUv += u.length;
        normArrays.push(n); totalNorm += n.length;
        indexArrays.push(idx);
        offsets.push(vertexOffset);
        totalIdx += idx.length;
        vertexOffset += p.length / 3;
    }

    const positions = new Float32Array(totalPos);
    const uvs = new Float32Array(totalUv);
    const normals = new Float32Array(totalNorm);
    const indices = new Uint16Array(totalIdx);

    let posOff = 0, uvOff = 0, normOff = 0, idxOff = 0;
    for (let i = 0; i < geometries.length; i++) {
        positions.set(posArrays[i], posOff); posOff += posArrays[i].length;
        uvs.set(uvArrays[i], uvOff);         uvOff += uvArrays[i].length;
        normals.set(normArrays[i], normOff); normOff += normArrays[i].length;
        const vOff = offsets[i];
        for (let j = 0; j < indexArrays[i].length; j++) {
            indices[idxOff + j] = indexArrays[i][j] + vOff;
        }
        idxOff += indexArrays[i].length;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
}