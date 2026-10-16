/**
 * ember-textures.js — Procedural PBR sets for Ember Reach, the hydrothermal shelf.
 *
 * Tallow is a bleached salt pan, Ligar is black stone at dusk and Lanternfall
 * is ice under an aurora. Ember Reach is the ground a hot spring builds: pale
 * siliceous sinter laid down a film at a time by water that came up boiling,
 * cracked as it dried, beaded where spray landed on it, stained yellow by
 * sulphur round every vent and orange and brown by the mats that grow in the
 * runoff. Where the volcano has had the last word it is black glass and red
 * cinder instead.
 *
 * Maps come off ONE height field per surface (`heightToNormal`, `heightToAO`
 * and the roughness are all derived from the same field that drew the albedo),
 * so every crack registers with its own shadow and its own gloss, as in the
 * other worlds' texture sets.
 *
 * THE ONE EMISSIVE MAP IN THE PRODUCT'S GROUND is `lavaCrust`'s: molten rock is
 * incandescent, the one filament nature makes, and it is the lava lake far
 * below the rim, never a surface a player stands on. Everything else here is
 * hardware and stone and does not glow.
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

/** Write an RGB float triple per pixel into a canvas. */
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
 * Siliceous sinter: the ground of the walk. Thin layers laid down by flowing
 * water show as low micro-terraces whose lips run across the slope; a coarse
 * network of drying cracks cuts them into plates; spray has beaded the plate
 * tops into knobbly geyserite; fine grit lies in the lows. Cream on the crests,
 * grey in the cracks, never white: a sinter that has dried is chalky.
 */
export function sinterCrust(opts = {}) {
  const { size = texSize(512), seed = 7, crest = '#ddd4c2', body = '#b7ad9b', crack = '#6f6457' } = opts;
  const S = size;
  const sd = hashStr(`sinter${seed}`);

  const height = heightField(S, (u, v) => {
    // Micro-terraces: rimmed lips, wandering, a few per tile.
    const wander = fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x11 });
    const lip = (u * 5 + v * 1.4 + wander * 2.4) % 1;
    const terrace = Math.pow(lip, 3.2) * 0.2;
    // Drying cracks: plates with a thin dark groove between them.
    const w = worley(u * 6, v * 6, 6, sd ^ 0x31);
    const groove = Math.max(0, 1 - w.border * 18);
    // Geyserite beads on the plate tops.
    const b = worley(u * 38, v * 38, 38, sd ^ 0x53);
    const bead = Math.max(0, 0.42 - b.f1) * 1.1;
    let h = 0.5 + terrace + (fbm(u * 10, v * 10, { octaves: 4, period: 10, seed: sd }) - 0.5) * 0.24;
    h += bead * (1 - groove) * 0.32;
    h -= groove * 0.34;
    h += (fbm(u * 90, v * 90, { octaves: 2, period: 90, seed: sd ^ 0x77 }) - 0.5) * 0.04;
    return h;
  });

  const hf = readHeight(height);
  const crestC = hexToRgb(crest), bodyC = hexToRgb(body), crackC = hexToRgb(crack);
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const h = hf.data[i];
    const u = x / S, v = y / S;
    const t = clamp01((h - 0.38) * 2.4);
    let c = rgbLerp(bodyC, crestC, t);
    c = rgbLerp(c, crackC, clamp01((0.36 - h) * 6) * 0.9);
    // Faint mineral mottling: iron in some films, silica in others.
    const m = fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x9a });
    c = [c[0] * (0.97 + 0.06 * m), c[1] * (0.97 + 0.03 * m), c[2] * (0.98 - 0.04 * m)];
    // Chalky everywhere, a touch less so on the wet-looking low films.
    rough[i] = clamp01(0.86 - t * 0.08 + clamp01((0.36 - h) * 6) * 0.1);
    return c;
  });

  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.25 }),
    normalStrength: 2.4
  };
}

/**
 * Red and black cinder: the roads. Porous clinker crushed and rolled, with
 * oxidised red grains among the black and fines packed between the stones.
 */
export function cinderRoad(opts = {}) {
  const { size = texSize(512), seed = 3 } = opts;
  const S = size;
  const sd = hashStr(`cinder${seed}`);
  const height = heightField(S, (u, v) => {
    const a = worley(u * 22, v * 22, 22, sd);
    const b = worley(u * 55, v * 55, 55, sd ^ 0x2b);
    // Stones are round-topped; the fines between them sit low.
    let h = 0.35 + Math.max(0, 0.55 - a.f1) * 0.9;
    // Vesicles: the gas bubbles frozen into the cinder.
    h -= Math.max(0, 0.18 - b.f1) * 1.4;
    h += (fbm(u * 70, v * 70, { octaves: 2, period: 70, seed: sd ^ 0x5 }) - 0.5) * 0.08;
    return h;
  });
  const hf = readHeight(height);
  const black = hexToRgb('#2b2624'), red = hexToRgb('#6e3524'), fines = hexToRgb('#5a4d45');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const cell = worley(u * 22, v * 22, 22, sd);
    let c = rgbLerp(black, red, clamp01(cell.id * 2.2 - 1.2));
    c = rgbLerp(fines, c, clamp01((h - 0.32) * 4));
    rough[i] = clamp01(0.9 - (h - 0.4) * 0.15);
    return c;
  });
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.3 }),
    normalStrength: 2.6
  };
}

/**
 * Black glass and rope: the lava lobes. A flow that cooled fast enough to stay
 * glassy breaks into conchoidal faces, glossy where fresh and dulled grey where
 * the weather has had it; ropy wrinkles survive across the lobe tops.
 */
export function blackGlass(opts = {}) {
  const { size = texSize(512), seed = 11 } = opts;
  const S = size;
  const sd = hashStr(`glass${seed}`);
  const height = heightField(S, (u, v) => {
    const facets = worley(u * 7, v * 7, 7, sd);
    const rope = Math.sin((v * 26 + fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x3 }) * 9) * Math.PI) * 0.5 + 0.5;
    let h = 0.5 + facets.f1 * 0.3 - Math.max(0, 1 - facets.border * 26) * 0.22;
    h += rope * 0.1;
    h += (ridged(u * 16, v * 16, { octaves: 3, period: 16, seed: sd ^ 0x9 }) - 0.5) * 0.12;
    return h;
  });
  const hf = readHeight(height);
  const glass = hexToRgb('#17151a'), weathered = hexToRgb('#3f3a3b'), rust = hexToRgb('#4a2d22');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const dull = clamp01(fbm(u * 5, v * 5, { octaves: 4, period: 5, seed: sd ^ 0x44 }) * 1.8 - 0.55);
    let c = rgbLerp(glass, weathered, dull);
    c = rgbLerp(c, rust, clamp01(fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x71 }) - 0.62) * 1.5);
    rough[i] = clamp01(0.22 + dull * 0.62 + clamp01((0.4 - h) * 3) * 0.15);
    return c;
  });
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.1 }),
    normalStrength: 2.8
  };
}

/**
 * Sulphur crust round a vent: needles and blades of yellow crystal grown out
 * of the gas, white where it has been leached, orange where it has been
 * heated past melting and set again.
 */
export function sulphurCrust(opts = {}) {
  const { size = texSize(256), seed = 5 } = opts;
  const S = size;
  const sd = hashStr(`sulphur${seed}`);
  const height = heightField(S, (u, v) => {
    const n = ridged(u * 18, v * 18, { octaves: 4, period: 18, seed: sd });
    const c = worley(u * 26, v * 26, 26, sd ^ 0x7);
    return 0.4 + n * 0.35 + Math.max(0, 0.4 - c.f1) * 0.6;
  });
  const hf = readHeight(height);
  const yel = hexToRgb('#d8b532'), pale = hexToRgb('#efe3a2'), orange = hexToRgb('#c27a22'), white = hexToRgb('#e8e2cf');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    let c = rgbLerp(yel, pale, clamp01((h - 0.55) * 2.2));
    const m = fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x21 });
    c = rgbLerp(c, orange, clamp01(m - 0.62) * 2.0);
    c = rgbLerp(c, white, clamp01(0.36 - m) * 2.2);
    rough[i] = clamp01(0.55 + (1 - h) * 0.3);
    return c;
  });
  return {
    albedo, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 1.2 }),
    normalStrength: 2.6
  };
}

/**
 * Weathered concrete: the pads, the cellars and the plinths. Board marks from
 * the shuttering, aggregate where the surface has gone, and a yellow tide line
 * of sulphur where steam has condensed on it for years.
 */
export function ventConcrete(opts = {}) {
  const { size = texSize(512), seed = 9 } = opts;
  const S = size;
  const sd = hashStr(`concrete${seed}`);
  const height = heightField(S, (u, v) => {
    const board = Math.abs(((v * 8) % 1) - 0.5) < 0.02 ? -0.12 : 0;
    const agg = worley(u * 48, v * 48, 48, sd);
    let h = 0.55 + board + (fbm(u * 12, v * 12, { octaves: 4, period: 12, seed: sd ^ 0x3 }) - 0.5) * 0.12;
    h += Math.max(0, 0.3 - agg.f1) * 0.25;
    // Spalls.
    h -= Math.max(0, fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd ^ 0x8 }) - 0.7) * 0.6;
    return h;
  });
  const hf = readHeight(height);
  const grey = hexToRgb('#a29c92'), dark = hexToRgb('#6d675f'), stain = hexToRgb('#b49b56');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const u = x / S, v = y / S;
    const h = hf.data[i];
    let c = rgbLerp(dark, grey, clamp01((h - 0.38) * 3));
    c = rgbLerp(c, stain, clamp01(fbm(u * 2, v * 2, { octaves: 3, period: 2, seed: sd ^ 0x61 }) - 0.58) * 1.4);
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
 * The lava lake's skin: plates of black crust drifting on melt, the melt
 * showing in the seams between them. Returns the usual maps AND `emission`, a
 * colour map of the seams alone, which is the only emissive map in the world.
 */
export function lavaCrust(opts = {}) {
  const { size = texSize(512), seed = 13 } = opts;
  const S = size;
  const sd = hashStr(`lava${seed}`);
  const seam = new Float32Array(S * S);
  const height = heightField(S, (u, v) => {
    const big = worley(u * 5, v * 5, 5, sd);
    const small = worley(u * 13, v * 13, 13, sd ^ 0x19);
    const s = Math.max(Math.max(0, 1 - big.border * 9), Math.max(0, 1 - small.border * 16) * 0.55);
    seam[Math.min(S - 1, (v * S) | 0) * S + Math.min(S - 1, (u * S) | 0)] = s;
    return 0.55 - s * 0.4 + (fbm(u * 20, v * 20, { octaves: 3, period: 20, seed: sd ^ 0x2 }) - 0.5) * 0.12;
  });
  const crust = hexToRgb('#1c1716'), ash = hexToRgb('#3d3330');
  const rough = new Float32Array(S * S);
  const albedo = paint(S, (i, x, y) => {
    const s = seam[i];
    const u = x / S, v = y / S;
    const c = rgbLerp(crust, ash, clamp01(fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x4 }) - 0.35));
    rough[i] = clamp01(0.92 - s * 0.6);
    return rgbLerp(c, [60, 20, 8], s);
  });
  const hot = hexToRgb('#ffb347'), deep = hexToRgb('#c2410c');
  const emission = paint(S, i => {
    const s = seam[i];
    if (s <= 0.02) return [0, 0, 0];
    const c = rgbLerp(deep, hot, clamp01((s - 0.4) * 1.8));
    const k = Math.pow(s, 1.6);
    return [c[0] * k, c[1] * k, c[2] * k];
  });
  return {
    albedo, height, emission,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.8 }),
    normalStrength: 2.0
  };
}

/**
 * Ripples on hot water: a soft, isotropic chop with no crack in it. Only the
 * height is used (as a normal map that drifts), so the spring is a mirror that
 * moves.
 */
export function springRipple(opts = {}) {
  const { size = texSize(256), seed = 17 } = opts;
  const S = size;
  const sd = hashStr(`ripple${seed}`);
  const height = heightField(S, (u, v) =>
    0.5 + (fbm(u * 6, v * 6, { octaves: 4, period: 6, seed: sd }) - 0.5) * 0.6);
  const flat = paint(S, () => [255, 255, 255]);
  return { albedo: flat, height, normalStrength: 1.0 };
}
