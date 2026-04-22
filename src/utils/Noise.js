import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';

function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rng = mulberry32(1337);
const noise2D = createNoise2D(rng);

export function simplex2(x, y) {
    return noise2D(x, y);
}

export function fbm2(x, y, opts = {}) {
    const {
        octaves = 5,
        frequency = 1,
        amplitude = 1,
        lacunarity = 2,
        persistence = 0.5,
    } = opts;

    let freq = frequency;
    let amp = amplitude;
    let sum = 0;
    let norm = 0;

    for (let i = 0; i < octaves; i++) {
        sum += noise2D(x * freq, y * freq) * amp;
        norm += amp;
        freq *= lacunarity;
        amp *= persistence;
    }

    return sum / norm; 
}