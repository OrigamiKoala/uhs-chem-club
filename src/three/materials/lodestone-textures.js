/**
 * lodestone-textures.js — Procedural PBR sets for Lodestone, the iron canyon.
 *
 * Same contract as the other worlds' sets (brinewire-textures.js): each function takes `{ size, seed }` and returns
 * `{ albedo, height, roughness, ao, normalStrength }` canvases for `buildMaterial`. Maps come off one height field.
 *
 *   canyonGravel  the canyon floor: rust-red gravel over dark ironstone, with black magnetite grains
 *   haulRoad      the haul road: packed grey-brown grit with wheel ruts along it
 *   depotConcrete poured footings and plinths with panel joints and tie-holes, stained with rust
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

/** The ground: ironstone plates under rust-red gravel. */
export function canyonGravel(opts = {}) {
  const { size = texSize(512), seed = 41 } = opts;
  const S = size;
  const sd = hashStr(`canyongravel${seed}`);
  const height = heightField(S, (u, v) => {
    const plate = worley(u * 9, v * 9, 9, sd);
    const grain = fbm(u * 28, v * 28, { octaves: 4, period: 28, seed: sd ^ 5 });
    return 0.3 + Math.min(1, plate.border * 3.0) * 0.38 + (grain - 0.5) * 0.2;
  });
  const [crack, rock, dust] = [hex('#2a201c'), hex('#6a4636'), hex('#9a6a4c')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(crack, rock, clamp01((h - 0.28) * 2.2));
    c = mix(c, dust, clamp01(fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x71 }) - 0.55) * 1.3 * clamp01((h - 0.4) * 3));
    rough(0.95 - (1 - h) * 0.15);
    return c;
  });
}

/** The haul road: packed grit with two wheel ruts running along it. */
export function haulRoad(opts = {}) {
  const { size = texSize(512), seed = 11 } = opts;
  const S = size;
  const sd = hashStr(`haulroad${seed}`);
  const height = heightField(S, (u, v) => {
    const rut = Math.min(Math.abs(u - 0.3), Math.abs(u - 0.7));
    return 0.5 - 0.18 * Math.max(0, 1 - rut * 14) + (fbm(u * 26, v * 26, { octaves: 4, period: 26, seed: sd }) - 0.5) * 0.3;
  });
  const [lo, hi] = [hex('#3a302a'), hex('#76675a')];
  return surface(S, height, (h, u, v, rough) => {
    const c = mix(lo, hi, clamp01((h - 0.2) * 1.6));
    rough(0.92 - h * 0.08);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}

/** Poured concrete: shuttering panels with joints and tie-holes, stained pale grey. */
export function depotConcrete(opts = {}) {
  const { size = texSize(512), seed = 17 } = opts;
  const S = size;
  const sd = hashStr(`lspour${seed}`);
  const PANELS = 4;
  const height = heightField(S, (u, v) => {
    const fu = (u * PANELS) % 1, fv = (v * PANELS) % 1;
    const joint = Math.min(fu, 1 - fu, fv, 1 - fv);
    const edge = clamp01(joint * 30);
    const tie = Math.hypot((fu - 0.5) * 2, (fv - 0.5) * 2) < 0.08 ? -0.25 : 0;
    return 0.42 + 0.3 * edge + tie + (fbm(u * 30, v * 30, { octaves: 4, period: 30, seed: sd }) - 0.5) * 0.18;
  });
  const [lo, hi] = [hex('#5a504a'), hex('#8e8378')];
  return surface(S, height, (h, u, v, rough) => {
    const c = mix(lo, hi, clamp01((h - 0.25) * 1.7));
    rough(0.9 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}
