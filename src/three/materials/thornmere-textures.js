/**
 * thornmere-textures.js — Procedural PBR sets for Thornmere, the tar swamps.
 *
 * Same contract as the other worlds' sets: each function takes `{ size, seed }` and returns `{ albedo, height, roughness, ao,
 * normalStrength }` canvases for `buildMaterial`. Maps come off one height field.
 *
 *   crackedPitch  the ground: hardened pitch broken into plates, pale so the terrain's own vertex colours tint it
 *   ribbedBark    the bark of the great stumps: deep vertical furrows, plates between them
 */

import { texSize, heightField, readHeight, writeField, canvas2d, heightToAO, fbm, worley, hashStr } from './pbr-kit.js';

const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = v => Math.max(0, Math.min(1, v));

function paint(S, fn) {
  const c = canvas2d(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const rgb = fn(i, i % S, (i / S) | 0);
    for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.max(0, Math.min(255, rgb[k]));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function surface(S, height, colour, { aoRadius = 6, aoStrength = 1.2, normalStrength = 2.4 } = {}) {
  const hf = readHeight(height);
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => colour(hf.data[i], x / S, y / S, (r) => { rough[i] = clamp01(r); }));
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, aoRadius), strength: aoStrength }),
    normalStrength
  };
}

/** Hardened pitch: plates a hand wide to a stride wide, cracks between them, a little grit. Pale: the terrain's colours tint it. */
export function crackedPitch(opts = {}) {
  const { size = texSize(512), seed = 23 } = opts;
  const S = size;
  const sd = hashStr(`crackedpitch${seed}`);
  const height = heightField(S, (u, v) => {
    const big = worley(u * 5, v * 5, 5, sd);
    const small = worley(u * 14, v * 14, 14, sd ^ 9);
    const grain = fbm(u * 30, v * 30, { octaves: 3, period: 30, seed: sd ^ 5 });
    return 0.25 + Math.min(1, big.border * 4.0) * 0.4 + Math.min(1, small.border * 3.0) * 0.18 + (grain - 0.5) * 0.14;
  });
  const [crack, plate, bloom] = [hex('#4a4640'), hex('#c9c2b4'), hex('#e6dfd0')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(crack, plate, clamp01((h - 0.3) * 2.4));
    c = mix(c, bloom, clamp01(fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x71 }) - 0.55) * 1.2 * clamp01((h - 0.45) * 3));
    rough(0.55 + h * 0.4);
    return c;
  }, { normalStrength: 2.8 });
}

/** Bark: furrows running up the trunk, plates of bark between them, lichen in the furrows. */
export function ribbedBark(opts = {}) {
  const { size = texSize(512), seed = 7, tint = ['#1c1814', '#5a4a3a', '#7a6a52'] } = opts;
  const S = size;
  const sd = hashStr(`ribbedbark${seed}`);
  const height = heightField(S, (u, v) => {
    const wob = fbm(u * 3, v * 2, { octaves: 2, period: 3, seed: sd }) * 0.12;
    const rib = Math.abs(Math.sin((u + wob) * Math.PI * 9));
    const plate = worley(u * 9, v * 3, 9, sd ^ 3);
    const grain = fbm(u * 40, v * 8, { octaves: 3, period: 8, seed: sd ^ 5 });
    return 0.15 + Math.pow(rib, 0.6) * 0.5 + Math.min(1, plate.border * 3) * 0.2 + (grain - 0.5) * 0.15;
  });
  const [furrow, body, ridge] = tint.map(hex);
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(furrow, body, clamp01((h - 0.2) * 2.2));
    c = mix(c, ridge, clamp01((h - 0.7) * 3));
    rough(0.92 - h * 0.1);
    return c;
  }, { normalStrength: 3.2, aoStrength: 1.5 });
}
