/**
 * noise.js — Small, fast, deterministic noise for building Erebus in plain JS.
 *
 * The ground is sampled a hundred thousand times while it is built and again
 * every frame by the walk, so this is plain gradient noise over a fixed
 * permutation table: no allocation, no tiling period (the basin is not a
 * texture and must never repeat), and the same answer in the browser and in
 * Node, which is what lets `verify:ship` and `verify:voyage` stand on the same
 * ground the player does.
 */

function buildPerm(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = (seed >>> 0) || 1;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

const PERM = buildPerm(0x5eb05);
const GX = new Float32Array(256);
const GY = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const a = (i / 256) * Math.PI * 2 + 0.37;
  GX[i] = Math.cos(a);
  GY[i] = Math.sin(a);
}

const fade = t => t * t * t * (t * (t * 6 - 15) + 10);

/** 2D gradient noise, roughly -0.7…0.7, smooth, non-repeating at any scale used here. */
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const aa = PERM[PERM[X] + Y], ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y], bb = PERM[PERM[X + 1] + Y + 1];
  const n00 = GX[aa] * xf + GY[aa] * yf;
  const n10 = GX[ba] * (xf - 1) + GY[ba] * yf;
  const n01 = GX[ab] * xf + GY[ab] * (yf - 1);
  const n11 = GX[bb] * (xf - 1) + GY[bb] * (yf - 1);
  const u = fade(xf), v = fade(yf);
  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return nx0 + (nx1 - nx0) * v;
}

/** Fractal sum, normalised to roughly -0.5…0.5. */
export function fbm2(x, y, octaves = 4, lacunarity = 2.03, gain = 0.5) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x, y);
    norm += amp;
    // Rotate a little every octave so the lattice never lines up with itself.
    const nx = x * 0.8 - y * 0.6, ny = x * 0.6 + y * 0.8;
    x = nx * lacunarity + 17.3;
    y = ny * lacunarity + 9.1;
    amp *= gain;
  }
  return (sum / norm) * 0.7;
}

/** Ridged fractal, 0…1, sharp crests — for rock and dune crests. */
export function ridged2(x, y, octaves = 4) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise2(x, y) * 1.4);
    sum += amp * n * n;
    norm += amp;
    const nx = x * 0.8 - y * 0.6, ny = x * 0.6 + y * 0.8;
    x = nx * 2.1 + 5.7;
    y = ny * 2.1 + 3.3;
    amp *= 0.5;
  }
  return sum / norm;
}

/** A seeded uniform generator, 0…1. */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
