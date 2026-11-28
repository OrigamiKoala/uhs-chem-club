/**
 * verdigris-textures.js — Procedural PBR sets for Verdigris, the acid marsh.
 *
 * The marsh is black water over silt, olive peat banks, and the flooded fortress's own surfaces: grey-green masonry,
 * timber boards furred with algae, and copper cladding gone to green patina. Maps come off ONE height field per
 * surface, as in the other worlds' sets. Nothing here is emissive: only the work lamps are lit in this world.
 *
 *   peatMud     the ground: wet olive peat, trodden into clumps with dark water in the hollows
 *   boardwalk   the planked walks and the court: boards laid across the line of travel, nailed, green where the damp sits
 *   marshWater  a pool's surface: a slow low swell with a finer skin, dark green-black
 *   fortStone   poured and cut masonry with joints, stained green below
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

/** The ground: wet olive peat in clumps, dark where water stands between them. */
export function peatMud(opts = {}) {
  const { size = texSize(512), seed = 31 } = opts;
  const S = size;
  const sd = hashStr(`peat${seed}`);
  const height = heightField(S, (u, v) => {
    const clump = worley(u * 14, v * 14, 14, sd);
    const lump = fbm(u * 30, v * 30, { octaves: 4, period: 30, seed: sd ^ 7 });
    return 0.35 + Math.min(1, clump.border * 2.4) * 0.35 + (lump - 0.5) * 0.3;
  });
  const [wet, peat, moss] = [hex('#3d4636'), hex('#76795a'), hex('#8a9a62')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(wet, peat, clamp01((h - 0.3) * 2.2));
    c = mix(c, moss, clamp01(fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x71 }) - 0.55) * 1.6);
    rough(0.95 - (1 - h) * 0.25);
    return c;
  }, { aoRadius: S >> 6, aoStrength: 1.2, normalStrength: 2.8 });
}

/**
 * Boards laid across the line of travel. The ribbon's `u` runs across the walk and `v` along it at one tile per four
 * metres, so twenty boards to the tile are twenty centimetres each, with a dark gap, two nails at each end, and the
 * grain running across. Algae greens the low boards and the edges.
 */
export function boardwalk(opts = {}) {
  const { size = texSize(512), seed = 5 } = opts;
  const S = size;
  const sd = hashStr(`board${seed}`);
  const BOARDS = 20;
  const height = heightField(S, (u, v) => {
    const b = v * BOARDS;
    const id = Math.floor(b);
    const f = b - id;
    const gap = Math.min(f, 1 - f);
    const edge = clamp01(gap * 26);
    const cup = 0.06 * (0.5 - Math.abs(u - 0.5)) * (((id * 7919) % 5) / 5 + 0.4);
    const grain = fbm(u * 2.5, v * 90, { octaves: 3, period: 90, seed: sd ^ (id * 13) }) - 0.5;
    let h = 0.55 * edge + 0.28 + cup + grain * 0.14;
    // Nail heads: two near each end of a board.
    for (const nu of [0.07, 0.93]) {
      const d = Math.hypot((u - nu) * S, (f - 0.5) * (S / BOARDS));
      if (d < 3) h += 0.12 * (1 - d / 3);
    }
    return h;
  });
  const [dark, tone, pale, algae] = [hex('#2c2a22'), hex('#6b5c45'), hex('#948668'), hex('#5c7a58')];
  return surface(S, height, (h, u, v, rough) => {
    const id = Math.floor(v * BOARDS);
    const shade = ((id * 2654435761) >>> 0) % 100 / 100;
    let c = mix(tone, pale, clamp01(shade * 0.7 + (h - 0.4)));
    c = mix(dark, c, clamp01(h * 2.2));
    const damp = clamp01(fbm(u * 3, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x44 }) - 0.45) * 1.8 + (1 - Math.min(u, 1 - u) * 6 > 0 ? (1 - Math.min(u, 1 - u) * 6) * 0.5 : 0);
    c = mix(c, algae, clamp01(damp) * 0.6);
    rough(0.9 - h * 0.12);
    return c;
  }, { aoRadius: S >> 7, aoStrength: 1.4, normalStrength: 2.6 });
}

/** A pool's surface: a slow low swell with a finer skin, tiled; the world slides it across the pools. */
export function marshWater(opts = {}) {
  const { size = texSize(256), seed = 9 } = opts;
  const S = size;
  const sd = hashStr(`marsh${seed}`);
  const height = heightField(S, (u, v) => {
    const swell = fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd });
    const skin = fbm(u * 18, v * 18, { octaves: 2, period: 18, seed: sd ^ 0x33 });
    return 0.5 + (swell - 0.5) * 0.5 + (skin - 0.5) * 0.25;
  });
  const [deep, shallow] = [hex('#26382f'), hex('#56715e')];
  return surface(S, height, (h, u, v, rough) => {
    rough(0.1 + (1 - h) * 0.06);
    return mix(deep, shallow, clamp01((h - 0.3) * 1.8));
  }, { aoRadius: 3, aoStrength: 0.2, normalStrength: 1.6 });
}

/** Fortress masonry: coursed blocks with joints, weathered grey-green, stained dark where the water wicks up. */
export function fortStone(opts = {}) {
  const { size = texSize(512), seed = 7 } = opts;
  const S = size;
  const sd = hashStr(`fort${seed}`);
  const COURSES = 8;
  const height = heightField(S, (u, v) => {
    const row = Math.floor(v * COURSES);
    const col = (u * 4 + (row % 2) * 0.5);
    const fu = col - Math.floor(col), fv = v * COURSES - row;
    const joint = Math.min(fu, 1 - fu, fv * 2.2, (1 - fv) * 2.2);
    const edge = clamp01(joint * 16);
    return 0.2 + 0.5 * edge + (fbm(u * 24, v * 24, { octaves: 4, period: 24, seed: sd }) - 0.5) * 0.22;
  });
  const [lo, hi, stain] = [hex('#585f58'), hex('#8e978b'), hex('#3b5247')];
  return surface(S, height, (h, u, v, rough) => {
    const row = Math.floor(v * COURSES);
    const col = Math.floor(u * 4 + (row % 2) * 0.5);
    const block = (((row * 31 + col * 17) * 2654435761) >>> 0) % 100 / 100;
    let c = mix(lo, hi, clamp01((h - 0.25) * 1.6 + block * 0.25 - 0.1));
    c = mix(c, stain, clamp01(fbm(u * 4, v * 3, { octaves: 3, period: 4, seed: sd ^ 0x71 }) - 0.5) * 1.5);
    rough(0.9 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.2 });
}
