/**
 * kettle-textures.js — Procedural PBR sets for Kettle, the foundry works on the soda flat.
 *
 * The flat is a dry soda lake: a white crust of sodium carbonate that has cracked into plates and
 * blistered where the damp rose through it, stained buff and amber where the works' dust has
 * settled. The works stand on it: slag roads of crushed black clinker with white fines worked in,
 * and concrete slabs poured under each machine, cracked at the joints and streaked with rust.
 *
 * Maps come off ONE height field per surface (normal, AO and roughness are derived from the field
 * that drew the albedo), as in the other worlds' texture sets. Nothing here is emissive: only the
 * work lamps are lit in this world.
 */

import {
  texSize, heightField, readHeight, writeField, canvas2d, heightToAO, fbm, worley, hashStr
} from './pbr-kit.js';

const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = v => Math.max(0, Math.min(1, v));

/** Paint a canvas from a per-pixel colour function. */
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

/** The common tail of a surface: the albedo painter reads the height field and writes roughness as it goes. */
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

/**
 * Soda crust: the ground of the flat. Plates split by drying cracks, their edges curled up;
 * blisters where gas pushed through; a pale bloom of fresh efflorescence on the crests and
 * buff dust in the cracks. White but never clean: it is a salt that has been rained on.
 */
export function sodaCrust(opts = {}) {
  const { size = texSize(512), seed = 21, crest = '#e6e1d4', body = '#cfc8b6', crack = '#8d8470' } = opts;
  const S = size;
  const sd = hashStr(`soda${seed}`);
  const height = heightField(S, (u, v) => {
    const w = worley(u * 7, v * 7, 7, sd);
    const groove = Math.max(0, 1 - w.border * 16);
    const curl = Math.max(0, 0.3 - w.border) * 0.9;
    const blister = Math.max(0, 0.32 - worley(u * 30, v * 30, 30, sd ^ 0x51).f1) * 0.9;
    let h = 0.5 + curl * 0.3 + blister * 0.3 - groove * 0.36;
    h += (fbm(u * 12, v * 12, { octaves: 4, period: 12, seed: sd }) - 0.5) * 0.2;
    return h;
  });
  const [c0, c1, c2] = [hex(crest), hex(body), hex(crack)];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(c1, c0, clamp01((h - 0.4) * 2.2));
    c = mix(c, c2, clamp01((0.38 - h) * 5) * 0.85);
    const stain = fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x9a });
    c = mix(c, [196, 170, 124], clamp01(stain - 0.55) * 1.1);
    rough(0.9 - (h - 0.4) * 0.12);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.2 });
}

/** Slag road: crushed black clinker, white fines worked in by the wheels, a worn centre. */
export function slagRoad(opts = {}) {
  const { size = texSize(512), seed = 3 } = opts;
  const S = size;
  const sd = hashStr(`slag${seed}`);
  const height = heightField(S, (u, v) => {
    const a = worley(u * 24, v * 24, 24, sd);
    let h = 0.36 + Math.max(0, 0.55 - a.f1) * 0.85;
    h -= Math.max(0, 0.16 - worley(u * 60, v * 60, 60, sd ^ 0x2b).f1) * 1.2;
    return h + (fbm(u * 70, v * 70, { octaves: 2, period: 70, seed: sd ^ 5 }) - 0.5) * 0.08;
  });
  const [dark, grey, fines] = [hex('#2c2a28'), hex('#4b4642'), hex('#b3ab9a')];
  return surface(S, height, (h, u, v, rough) => {
    const cell = worley(u * 24, v * 24, 24, sd);
    let c = mix(dark, grey, clamp01(cell.id * 2 - 0.6));
    c = mix(fines, c, clamp01((h - 0.3) * 4.5));
    rough(0.92 - (h - 0.4) * 0.15);
    return c;
  }, { aoRadius: S >> 7, aoStrength: 1.3, normalStrength: 2.6 });
}

/** Poured slab: cast concrete with a trowelled face, an expansion joint each way and rust run from the plant. */
export function slabConcrete(opts = {}) {
  const { size = texSize(512), seed = 7 } = opts;
  const S = size;
  const sd = hashStr(`slab${seed}`);
  const height = heightField(S, (u, v) => {
    const joint = Math.max(0, 1 - Math.min(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 90);
    const crack = Math.max(0, 1 - worley(u * 3, v * 3, 3, sd).border * 40) * 0.5;
    return 0.58 - joint * 0.4 - crack * 0.3 + (fbm(u * 22, v * 22, { octaves: 4, period: 22, seed: sd }) - 0.5) * 0.14;
  });
  const [lo, hi, rust] = [hex('#7a766d'), hex('#a39e92'), hex('#7a5638')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(lo, hi, clamp01((h - 0.35) * 2.2));
    c = mix(c, rust, clamp01(fbm(u * 2, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x71 }) - 0.6) * 1.3);
    rough(0.88 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}
