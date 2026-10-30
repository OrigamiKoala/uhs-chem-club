/**
 * mirrowen-textures.js — Procedural PBR sets for Mirrowen, the tidal shelf.
 *
 * Tallow is a salt pan, Ligar black stone, Lanternfall ice under an aurora and Ember Reach the
 * sinter a hot spring lays down. Mirrowen is a working harbour on a shelf of the sea: shingle
 * and frost between the quays, rolled concrete under the lamps, grey-green water in the
 * canals, and the crystal ice the Fifth froze them with: white where it is thick, blue where
 * it is clear, cut by long cracks.
 *
 * Every set is derived from ONE height field (`heightToNormal`, `heightToAO` and the
 * roughness all read the field that drew the albedo), so every crack registers with its own
 * shadow and its own gloss, as in the other worlds' texture sets. Nothing here is emissive:
 * the only lit things in the world are lamps.
 */

import {
  texSize, heightField, readHeight, writeField, canvas2d, heightToAO, fbm, worley, ridged, hashStr
} from './pbr-kit.js';

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbLerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const clamp01 = v => Math.max(0, Math.min(1, v));

/** Write an RGB triple per pixel into a canvas. */
function paint(S, fn) {
  const c = canvas2d(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const rgb = fn(i, i % S, (i / S) | 0);
    img.data[i * 4] = Math.max(0, Math.min(255, rgb[0]));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, rgb[1]));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, rgb[2]));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Frost shingle: the ground of the shelf. Rounded stones the tide has sorted, packed in
 * fines, with a rime of frost on the crests and wet dark in the lows.
 */
export function frostShingle(opts = {}) {
  const { size = texSize(512), seed = 7, crest = '#d6dcde', body = '#a3adb0', low = '#5f6a6e' } = opts;
  const S = size;
  const sd = hashStr(`shingle${seed}`);

  const height = heightField(S, (u, v) => {
    const a = worley(u * 14, v * 14, 14, sd);
    const b = worley(u * 36, v * 36, 36, sd ^ 0x2b);
    // Stones are round-topped; the fines between them sit low.
    let h = 0.34 + Math.max(0, 0.56 - a.f1) * 0.62 + Math.max(0, 0.4 - b.f1) * 0.18;
    h -= Math.max(0, 1 - a.border * 10) * 0.12;
    h += (fbm(u * 8, v * 8, { octaves: 4, period: 8, seed: sd ^ 0x11 }) - 0.5) * 0.14;
    h += (fbm(u * 80, v * 80, { octaves: 2, period: 80, seed: sd ^ 0x77 }) - 0.5) * 0.04;
    return h;
  });

  const hf = readHeight(height);
  const crestC = hexToRgb(crest), bodyC = hexToRgb(body), lowC = hexToRgb(low);
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const h = hf.data[i];
    const u = x / S, v = y / S;
    const cell = worley(u * 14, v * 14, 14, sd);
    let c = rgbLerp(lowC, bodyC, clamp01((h - 0.3) * 4));
    // Each stone has its own grey: slate, granite, a few pale ones.
    c = rgbLerp(c, [c[0] * 0.82, c[1] * 0.86, c[2] * 0.9], clamp01(cell.id * 2 - 0.4) * 0.5);
    // Frost on whatever stands up.
    const frost = clamp01((h - 0.52) * 3.2) * (0.6 + 0.4 * fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x9a }));
    c = rgbLerp(c, crestC, frost);
    rough[i] = clamp01(0.88 - frost * 0.16 - clamp01((0.34 - h) * 5) * 0.3);
    return c;
  });

  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.2 }),
    normalStrength: 2.6
  };
}

/**
 * Quay paving: rolled concrete slabs laid in courses, a joint between each, salt-stained and
 * worn paler where the wheels go. The roads, and (under another name) the plant's concrete.
 */
export function quayPaving(opts = {}) {
  const { size = texSize(512), seed = 3, slab = '#8e9694', worn = '#a9b0ae', joint = '#454c4c' } = opts;
  const S = size;
  const sd = hashStr(`paving${seed}`);
  const COURSES = 4, SLABS = 3;
  const height = heightField(S, (u, v) => {
    const row = Math.floor(v * COURSES);
    const uu = (u * SLABS + (row % 2) * 0.5) % 1;
    const vv = (v * COURSES) % 1;
    const edge = Math.min(uu, 1 - uu, vv, 1 - vv);
    const j = Math.max(0, 1 - edge * 38);
    let h = 0.56 - j * 0.34;
    h += (fbm(u * 10, v * 10, { octaves: 4, period: 10, seed: sd }) - 0.5) * 0.12;
    const agg = worley(u * 46, v * 46, 46, sd ^ 0x31);
    h += Math.max(0, 0.3 - agg.f1) * 0.16;
    h -= Math.max(0, fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x8 }) - 0.72) * 0.7;
    return h;
  });
  const hf = readHeight(height);
  const slabC = hexToRgb(slab), wornC = hexToRgb(worn), jointC = hexToRgb(joint), salt = hexToRgb('#c3c9c6');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    let c = rgbLerp(jointC, slabC, clamp01((h - 0.3) * 3.4));
    c = rgbLerp(c, wornC, clamp01(fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x61 }) - 0.5) * 1.1);
    c = rgbLerp(c, salt, clamp01(fbm(u * 7, v * 7, { octaves: 3, period: 7, seed: sd ^ 0x44 }) - 0.64) * 1.6);
    rough[i] = 0.9;
    return c;
  });
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 1.0 }),
    normalStrength: 1.8
  };
}

/**
 * Crystal ice: long clear blades fused into a white mass, the cracks that ran through it as
 * it froze, and bubbles caught in the white. Glossy where it is clear, matte where it is
 * frosted over.
 */
export function crystalIce(opts = {}) {
  const { size = texSize(512), seed = 21 } = opts;
  const S = size;
  const sd = hashStr(`ice${seed}`);
  const height = heightField(S, (u, v) => {
    const facets = worley(u * 5, v * 5, 5, sd);
    const blade = ridged(u * 9 + v * 3, v * 9, { octaves: 3, period: 9, seed: sd ^ 0x9 });
    const crack = Math.max(0, 1 - facets.border * 16);
    let h = 0.56 + facets.f1 * 0.14 + (blade - 0.5) * 0.1 - crack * 0.24;
    h += (fbm(u * 40, v * 40, { octaves: 2, period: 40, seed: sd ^ 0x13 }) - 0.5) * 0.04;
    return h;
  });
  const hf = readHeight(height);
  const clear = hexToRgb('#a9cfe3'), mid = hexToRgb('#d4e8f2'), white = hexToRgb('#f1f7fa'), deep = hexToRgb('#6f9fbb');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const milk = clamp01(fbm(u * 4, v * 4, { octaves: 4, period: 4, seed: sd ^ 0x44 }) * 1.7 - 0.5);
    let c = rgbLerp(clear, mid, milk);
    c = rgbLerp(c, white, clamp01(milk - 0.55) * 2.2);
    c = rgbLerp(c, deep, clamp01((0.4 - h) * 5) * 0.7);
    rough[i] = clamp01(0.12 + milk * 0.5 + clamp01((0.4 - h) * 4) * 0.2);
    return c;
  });
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.9 }),
    normalStrength: 2.0
  };
}

/**
 * Ripples on cold water: a soft, low chop with no crack in it. Only the height is used (as a
 * normal map that drifts), so the canal is a mirror that moves.
 */
export function canalRipple(opts = {}) {
  const { size = texSize(256), seed = 17 } = opts;
  const S = size;
  const sd = hashStr(`ripple${seed}`);
  const height = heightField(S, (u, v) =>
    0.5 + (fbm(u * 7, v * 7, { octaves: 4, period: 7, seed: sd }) - 0.5) * 0.55);
  const flat = paint(S, () => [255, 255, 255]);
  return { albedo: flat, height, normalStrength: 1.0 };
}
