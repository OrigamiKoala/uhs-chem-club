/**
 * lanternfall-textures.js — Procedural PBR sets for Lanternfall, the aurora ice.
 *
 * Tallow is a bleached salt pan and Ligar is black stone at dusk; Lanternfall is
 * clear and snow-packed ice under a night sky, lit only by what the aurora and
 * the lanterns give it. Everything here is cold and pale, with the faint green
 * cast a sky of that colour leaves on a white surface, and never saturated: the
 * aurora is the only colour in the world.
 *
 * Maps come off ONE height field per surface (`heightToNormal`, `heightToAO`
 * and the roughness are all derived from the same field that drew the albedo),
 * so every crack registers with its own shadow and its own gloss: a crack is
 * darker because it is deep, rougher because it is filled with rime, and
 * occluded because it is a crack. Drawn independently, the same maps read as
 * plastic (pbr-kit.js, "A surface is convincing when its maps AGREE").
 *
 * Nothing in this file is emissive.
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

/**
 * Packed ice and snow crust: the ground of the walk. Wind-combed ridges
 * (sastrugi) run along one direction at two scales, a coarse network of
 * thermal cracks cuts across them, and the lows fill with snow while the
 * ridge crests are scoured down to clear, glossy ice.
 */
export function iceCrust(opts = {}) {
  const { size = texSize(512), seed = 5, snow = '#e8f2f6', ice = '#9cc3d6', deep = '#4f7f9c' } = opts;
  const S = size;
  const sd = hashStr(`ice${seed}`);

  const height = heightField(S, (u, v) => {
    // Sastrugi: noise stretched along the wind, so the ridges are long and low.
    const along = u * 3.0;
    const across = v * 22.0;
    const s1 = fbm(along * 6, across * 0.9, { octaves: 4, period: 18, seed: sd });
    const s2 = ridged(u * 7, v * 38, { octaves: 3, period: 14, seed: sd ^ 0x21 });
    let h = 0.5 + (s1 - 0.5) * 0.55 + (s2 - 0.5) * 0.16;
    // Thermal cracks: where two plates of ice meet, a thin dark groove.
    const w = worley(u * 7, v * 7, 7, sd ^ 0x77);
    h -= Math.max(0, 1 - w.border * 22) * 0.34;
    // Rime grit.
    h += (fbm(u * 80, v * 80, { octaves: 2, period: 80, seed: sd ^ 0x5a }) - 0.5) * 0.05;
    return h;
  });

  const hf = readHeight(height);
  const snowC = hexToRgb(snow);
  const iceC = hexToRgb(ice);
  const deepC = hexToRgb(deep);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];

    // Crest = clear ice scoured by the wind; trough = snow; crack = deep blue.
    const crest = clamp01((h - 0.52) * 4.5);
    const crack = clamp01((0.34 - h) * 6);
    let c = rgbLerp(snowC, iceC, crest * 0.8);
    c = rgbLerp(c, deepC, crack * 0.85);
    // The aurora's green on the white, very faintly, in patches.
    const tint = clamp01(fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x3c }) - 0.4) * 0.55;
    c = [c[0] * (1 - 0.05 * tint), Math.min(255, c[1] * (1 + 0.025 * tint)), c[2] * (1 - 0.01 * tint)];

    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;

    // Clear ice is glossy; snow is matte; a rime-filled crack is rough again.
    rough[i] = clamp01(0.82 - crest * 0.58 + crack * 0.2);
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.2 }),
    normalStrength: 2.2
  };
}

/** The frozen lake: dark, clear ice laid in plates, polished by wind and almost mirror smooth. */
export function lakeIce(opts = {}) {
  const { size = texSize(512), seed = 9, ice = '#1f3b4f', crack = '#9fc9dc' } = opts;
  const S = size;
  const sd = hashStr(`lake${seed}`);

  const height = heightField(S, (u, v) => {
    const big = worley(u * 5, v * 5, 5, sd);
    const small = worley(u * 15, v * 15, 15, sd ^ 0x13);
    let h = 0.62 + (fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x9 }) - 0.5) * 0.08;
    h -= Math.max(0, 1 - big.border * 40) * 0.22;
    h -= Math.max(0, 1 - small.border * 60) * 0.08;
    return h;
  });
  const hf = readHeight(height);
  const iceC = hexToRgb(ice);
  const crackC = hexToRgb(crack);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const h = hf.data[i];
    const crk = clamp01((0.56 - h) * 7);
    // Cracks in clear ice scatter light: pale, fine, and rough.
    const c = rgbLerp(iceC, crackC, crk * 0.75);
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
    rough[i] = clamp01(0.1 + crk * 0.55);
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height, roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.8 }),
    normalStrength: 1.2
  };
}

/** Wind-carved ice for the spires and the ridges: layered, bluer and clearer than the ground. */
export function carvedIce(opts = {}) {
  const { size = texSize(256), seed = 3, pale = '#c7e0ec', deep = '#5d8eac' } = opts;
  const S = size;
  const sd = hashStr(`carve${seed}`);
  const height = heightField(S, (u, v) => {
    const bands = Math.sin(v * 38 + fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd }) * 7) * 0.5 + 0.5;
    const flute = ridged(u * 14, v * 3, { octaves: 3, period: 14, seed: sd ^ 0x44 });
    return 0.5 + (bands - 0.5) * 0.22 + (flute - 0.5) * 0.28;
  });
  const hf = readHeight(height);
  const paleC = hexToRgb(pale), deepC = hexToRgb(deep);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const h = hf.data[i];
    const c = rgbLerp(deepC, paleC, clamp01((h - 0.3) * 1.9));
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
    rough[i] = clamp01(0.62 - h * 0.45);
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height, roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.0 }),
    normalStrength: 2.4
  };
}
