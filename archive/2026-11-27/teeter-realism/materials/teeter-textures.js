/**
 * teeter-textures.js — Procedural PBR sets for Teeter, the salt pans.
 *
 * The pans are shallow brine over a floor of white salt crust, and between them the dikes are packed grey
 * clay, trodden flat and dusted white where the spray has dried (the terrain's vertex colours carry that). The crust is Tallow's own `saltHardpan`
 * (a dry lakebed's polygons) in a whiter palette; this file holds what Teeter needs besides it: the
 * causeway's grit, the poured slabs and the ripple of the brine. Maps come off ONE height field per surface, as in the other worlds'
 * sets. Nothing here is emissive: only the work lamps are lit in this world.
 */

import {
  texSize, heightField, readHeight, writeField, canvas2d, heightToAO, fbm, worley, hashStr, saltHardpan
} from './pbr-kit.js';

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

/** The floor of a pan: Tallow's salt hardpan in a whiter palette, plates split by drying cracks. */
export function panCrust(opts = {}) {
  const { size = texSize(512), seed = 31 } = opts;
  return saltHardpan({ size, seed, pale: '#ddd9cb', deep: '#aaa391', bloom: '#faf8ef' });
}

/** The causeway's surface: crushed shell and grit laid on the clay, worn to a pale track down the middle. */
export function causeway(opts = {}) {
  const { size = texSize(512), seed = 3 } = opts;
  const S = size;
  const sd = hashStr(`cause${seed}`);
  const height = heightField(S, (u, v) => {
    const a = worley(u * 26, v * 26, 26, sd);
    let h = 0.38 + Math.max(0, 0.5 - a.f1) * 0.8;
    h -= Math.max(0, 0.15 - worley(u * 64, v * 64, 64, sd ^ 0x2b).f1) * 1.0;
    return h + (fbm(u * 70, v * 70, { octaves: 2, period: 70, seed: sd ^ 5 }) - 0.5) * 0.08;
  });
  const [dark, mid, shell] = [hex('#6d675d'), hex('#9b9484'), hex('#e0dccd')];
  return surface(S, height, (h, u, v, rough) => {
    const cell = worley(u * 26, v * 26, 26, sd);
    let c = mix(dark, mid, clamp01(cell.id * 2 - 0.5));
    c = mix(c, shell, clamp01((h - 0.42) * 3.2) * 0.8);
    rough(0.9 - (h - 0.4) * 0.15);
    return c;
  }, { aoRadius: S >> 7, aoStrength: 1.3, normalStrength: 2.6 });
}

/** Brine ripple: a slow low swell with a finer skin, tiled; the world slides it across the pan. */
export function brineRipple(opts = {}) {
  const { size = texSize(256), seed = 9 } = opts;
  const S = size;
  const sd = hashStr(`brine${seed}`);
  const height = heightField(S, (u, v) => {
    const swell = fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd });
    const skin = fbm(u * 18, v * 18, { octaves: 2, period: 18, seed: sd ^ 0x33 });
    return 0.5 + (swell - 0.5) * 0.5 + (skin - 0.5) * 0.25;
  });
  const [deep, shallow] = [hex('#6f8d8c'), hex('#9bb2ac')];
  return surface(S, height, (h, u, v, rough) => {
    rough(0.1 + (1 - h) * 0.06);
    return mix(deep, shallow, clamp01((h - 0.3) * 1.8));
  }, { aoRadius: 3, aoStrength: 0.2, normalStrength: 1.6 });
}

/** Poured slab: cast concrete with an expansion joint each way, salt-bloomed at the edges. */
export function saltSlab(opts = {}) {
  const { size = texSize(512), seed = 7 } = opts;
  const S = size;
  const sd = hashStr(`tslab${seed}`);
  const height = heightField(S, (u, v) => {
    const joint = Math.max(0, 1 - Math.min(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 90);
    const crack = Math.max(0, 1 - worley(u * 3, v * 3, 3, sd).border * 40) * 0.5;
    return 0.58 - joint * 0.4 - crack * 0.3 + (fbm(u * 22, v * 22, { octaves: 4, period: 22, seed: sd }) - 0.5) * 0.14;
  });
  const [lo, hi, salt] = [hex('#86847b'), hex('#b3b0a3'), hex('#e6e3d6')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(lo, hi, clamp01((h - 0.35) * 2.2));
    c = mix(c, salt, clamp01(fbm(u * 3, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x71 }) - 0.58) * 1.4);
    rough(0.88 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}
