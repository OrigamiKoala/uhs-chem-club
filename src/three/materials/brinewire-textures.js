/**
 * brinewire-textures.js — Procedural PBR sets for Brinewire, the copper marsh.
 *
 * The marsh is a salt flat: grey-ochre mud cracked into plates and crusted white at every pool's lip, brine the colour of
 * weak tea over a slate floor, bleached boards, and the grid's own concrete with rust running down it from every bolt. Maps
 * come off ONE height field per surface, as in the other worlds' sets. Nothing here is emissive: only the work lamps are lit.
 *
 *   saltMud     the ground: dry cracked mud in plates, salt on the high edges
 *   saltBoard   the planked walks and the court: boards across the line of travel, nailed, bleached by salt
 *   brineWater  a pool's surface: a slow low swell with a fine skin, dark teal
 *   pourConcrete  poured footings and plinths with panel joints, tie-holes and rust runs
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

/** The ground: dry grey-ochre mud cracked into plates, the crack dark and the plate edges pale with salt. */
export function saltMud(opts = {}) {
  const { size = texSize(512), seed = 31 } = opts;
  const S = size;
  const sd = hashStr(`saltmud${seed}`);
  const height = heightField(S, (u, v) => {
    const plate = worley(u * 11, v * 11, 11, sd);
    const lump = fbm(u * 26, v * 26, { octaves: 4, period: 26, seed: sd ^ 7 });
    return 0.3 + Math.min(1, plate.border * 3.0) * 0.4 + (lump - 0.5) * 0.22;
  });
  const [crack, mud, salt] = [hex('#4a4640'), hex('#8c8472'), hex('#d8d2c2')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(crack, mud, clamp01((h - 0.28) * 2.4));
    c = mix(c, salt, clamp01(fbm(u * 7, v * 7, { octaves: 3, period: 7, seed: sd ^ 0x71 }) - 0.5) * 1.4 * clamp01((h - 0.4) * 3));
    rough(0.93 - (1 - h) * 0.2);
    return c;
  }, { aoRadius: S >> 6, aoStrength: 1.2, normalStrength: 2.8 });
}

/**
 * Boards laid across the line of travel. The ribbon's `u` runs across the walk and `v` along it at one tile per four
 * metres, so twenty boards to the tile are twenty centimetres each, with a dark gap, two nails at each end, and the
 * grain running across. Salt bleaches the high boards and the edges grey-white.
 */
export function saltBoard(opts = {}) {
  const { size = texSize(512), seed = 5 } = opts;
  const S = size;
  const sd = hashStr(`saltboard${seed}`);
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
    for (const nu of [0.07, 0.93]) {
      const d = Math.hypot((u - nu) * S, (f - 0.5) * (S / BOARDS));
      if (d < 3) h += 0.12 * (1 - d / 3);
    }
    return h;
  });
  const [dark, tone, pale, bleach] = [hex('#2a2926'), hex('#7a6c55'), hex('#a39881'), hex('#cfcabb')];
  return surface(S, height, (h, u, v, rough) => {
    const id = Math.floor(v * BOARDS);
    const shade = ((id * 2654435761) >>> 0) % 100 / 100;
    let c = mix(tone, pale, clamp01(shade * 0.7 + (h - 0.4)));
    c = mix(dark, c, clamp01(h * 2.2));
    const salt = clamp01(fbm(u * 3, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x44 }) - 0.42) * 1.6;
    c = mix(c, bleach, clamp01(salt) * 0.55);
    rough(0.9 - h * 0.12);
    return c;
  }, { aoRadius: S >> 7, aoStrength: 1.4, normalStrength: 2.6 });
}

/** A pool's surface: a slow low swell with a finer skin, tiled; the world slides it across the pools. */
export function brineWater(opts = {}) {
  const { size = texSize(256), seed = 9 } = opts;
  const S = size;
  const sd = hashStr(`brine${seed}`);
  const height = heightField(S, (u, v) => {
    const swell = fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd });
    const skin = fbm(u * 18, v * 18, { octaves: 2, period: 18, seed: sd ^ 0x33 });
    return 0.5 + (swell - 0.5) * 0.5 + (skin - 0.5) * 0.25;
  });
  const [deep, shallow] = [hex('#1f3b45'), hex('#4f7d80')];
  return surface(S, height, (h, u, v, rough) => {
    rough(0.1 + (1 - h) * 0.06);
    return mix(deep, shallow, clamp01((h - 0.3) * 1.8));
  }, { aoRadius: 3, aoStrength: 0.2, normalStrength: 1.6 });
}

/** Poured concrete: shuttering panels with joints and tie-holes, stained rust-brown below every joint. */
export function pourConcrete(opts = {}) {
  const { size = texSize(512), seed = 7 } = opts;
  const S = size;
  const sd = hashStr(`pour${seed}`);
  const PANELS = 4;
  const height = heightField(S, (u, v) => {
    const fu = (u * PANELS) % 1, fv = (v * PANELS) % 1;
    const joint = Math.min(fu, 1 - fu, fv, 1 - fv);
    const edge = clamp01(joint * 30);
    const tie = Math.hypot((fu - 0.5) * 2, (fv - 0.5) * 2) < 0.08 ? -0.25 : 0;
    return 0.42 + 0.3 * edge + tie + (fbm(u * 30, v * 30, { octaves: 4, period: 30, seed: sd }) - 0.5) * 0.18;
  });
  const [lo, hi, rust] = [hex('#6e6c66'), hex('#a8a59a'), hex('#8a5230')];
  return surface(S, height, (h, u, v, rough) => {
    let c = mix(lo, hi, clamp01((h - 0.25) * 1.7));
    const run = clamp01(fbm(u * 14, v * 2.2, { octaves: 3, period: 14, seed: sd ^ 0x71 }) - 0.52) * 1.9 * (1 - ((v * PANELS) % 1) * 0.6);
    c = mix(c, rust, clamp01(run) * 0.6);
    rough(0.92 - h * 0.1);
    return c;
  }, { aoRadius: S >> 6, normalStrength: 2.0 });
}
