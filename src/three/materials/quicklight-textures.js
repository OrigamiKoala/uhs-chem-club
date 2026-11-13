/**
 * quicklight-textures.js — Procedural PBR sets for Quicklight, the storm-belt refinery.
 *
 * Same contract as the other worlds' sets (brinewire-textures.js): each function takes `{ size, seed }` and returns
 * `{ albedo, height, roughness, ao, normalStrength }` canvases for `buildMaterial`. Maps come off one height field.
 *
 *   stormBasalt   the ground: dark basalt in blocky plates with pale dust in the cracks
 *   catwalkPlate  the plated walkways and the roads: diamond-grid steel with a worn amber edge stripe
 *   pourConcrete  poured footings and plinths with panel joints and tie-holes
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

/** The ground: dark basalt in blocky plates, a pale dust in the cracks. */
export function stormBasalt(opts = {}) {
  const { size = texSize(512), seed = 41 } = opts;
  const S = size;
  const sd = hashStr(`stormbasalt${seed}`);
  const height = heightField(S, (u, v) => {
    const plate = worley(u * 9, v * 9, 9, sd);
    const grain = fbm(u * 28, v * 28, { octaves: 4, period: 28, seed: sd ^ 5 });
    return 0.3 + Math.min(1, plate.border * 3.0) * 0.38 + (grain - 0.5) * 0.2;
  });
  const [crack, rock, dust] = [hex('#262b33'), hex('#4a515c'), hex('#7b7f86')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(crack, rock, clamp01((h - 0.28) * 2.2));
    c = mix(c, dust, clamp01(fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x71 }) - 0.55) * 1.3 * clamp01((h - 0.4) * 3));
    rough(0.95 - (1 - h) * 0.15);
    return c;
  });
}

/** Walkway plate: a raised diamond grid on steel, with an amber stripe worn along each edge. */
export function catwalkPlate(opts = {}) {
  const { size = texSize(512), seed = 11 } = opts;
  const S = size;
  const sd = hashStr(`catwalk${seed}`);
  const height = heightField(S, (u, v) => {
    const du = (u * 8) % 1, dv = (v * 16) % 1;
    const diamond = 1 - Math.min(1, (Math.abs(du - 0.5) + Math.abs(dv - 0.5)) * 2.2);
    return 0.35 + 0.35 * clamp01(diamond * 1.6) + (fbm(u * 24, v * 24, { octaves: 3, period: 24, seed: sd }) - 0.5) * 0.1;
  });
  const [lo, hi, amber] = [hex('#2d323b'), hex('#5d6672'), hex('#c98d2a')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(lo, hi, clamp01((h - 0.3) * 1.8));
    const edge = Math.min(u, 1 - u);
    if (edge < 0.05 && edge > 0.025) c = mix(c, amber, 0.55 * (0.6 + 0.4 * fbm(u * 40, v * 40, { octaves: 2, period: 40, seed: sd ^ 3 })));
    rough(0.62 + (1 - h) * 0.2);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.2 });
}

/** Poured concrete: shuttering panels with joints and tie-holes, stained pale grey. */
export function pourConcrete(opts = {}) {
  const { size = texSize(512), seed = 17 } = opts;
  const S = size;
  const sd = hashStr(`qlpour${seed}`);
  const PANELS = 4;
  const height = heightField(S, (u, v) => {
    const fu = (u * PANELS) % 1, fv = (v * PANELS) % 1;
    const joint = Math.min(fu, 1 - fu, fv, 1 - fv);
    const edge = clamp01(joint * 30);
    const tie = Math.hypot((fu - 0.5) * 2, (fv - 0.5) * 2) < 0.08 ? -0.25 : 0;
    return 0.42 + 0.3 * edge + tie + (fbm(u * 30, v * 30, { octaves: 4, period: 30, seed: sd }) - 0.5) * 0.18;
  });
  const [lo, hi] = [hex('#52565e'), hex('#8a8e96')];
  return surface(S, height, (h, u, v, rough) => {
    const c = mix(lo, hi, clamp01((h - 0.25) * 1.7));
    rough(0.9 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}
