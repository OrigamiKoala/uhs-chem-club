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
 * Wind-packed snow and glazed ice: the ground of the walk. Soft wind-swept
 * snowdrifts (sastrugi) and fine crystalline snow grain cover most of the
 * surface, with smoother wind-scoured glacier-blue ice peeking through on
 * high ridges. No cellular/mud-crack polygons.
 */
export function iceCrust(opts = {}) {
  const { size = texSize(512), seed = 5, snow = '#eef5f8', drift = '#d7e8f0', ice = '#a8cde0' } = opts;
  const S = size;
  const sd = hashStr(`ice${seed}`);

  const height = heightField(S, (u, v) => {
    // Broad soft wind-blown snowdrifts.
    const drift1 = fbm(u * 4, v * 10, { octaves: 4, period: 10, seed: sd });
    const drift2 = fbm(u * 10 + 1.7, v * 20, { octaves: 3, period: 20, seed: sd ^ 0x19 });
    // Gentle wind-combed ripples (sastrugi) without sharp dark crevices.
    const ripple = Math.sin((v * 14 + drift1 * 2.2) * Math.PI * 2) * 0.5 + 0.5;
    // Fine snow crystal grain.
    const grain = fbm(u * 72, v * 72, { octaves: 2, period: 72, seed: sd ^ 0x5a });
    return 0.5 + (drift1 - 0.5) * 0.42 + (drift2 - 0.5) * 0.16 + (ripple - 0.5) * 0.08 + (grain - 0.5) * 0.06;
  });

  const hf = readHeight(height);
  const snowC = hexToRgb(snow);
  const driftC = hexToRgb(drift);
  const iceC = hexToRgb(ice);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];

    // Soft snow in hollows, cool pale blue-white in shaded drifts, glazed ice on wind-scoured crests.
    const glaze = clamp01((h - 0.58) * 3.8);
    const hollow = clamp01((0.46 - h) * 3.2);
    let c = rgbLerp(snowC, driftC, hollow * 0.65);
    c = rgbLerp(c, iceC, glaze * 0.55);

    // Subtle crystalline sparkle / micro-variation in snow grain.
    const spark = fbm(u * 96, v * 96, { octaves: 1, period: 96, seed: sd ^ 0x83 });
    if (spark > 0.78) {
      const sp = (spark - 0.78) * 2.2;
      c = rgbLerp(c, [255, 255, 255], clamp01(sp * 0.6));
    }

    // Faint aurora sheen in patches.
    const tint = clamp01(fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x3c }) - 0.45) * 0.4;
    c = [c[0] * (1 - 0.04 * tint), Math.min(255, c[1] * (1 + 0.02 * tint)), c[2]];

    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;

    // Fresh snow is matte (0.88), wind-glazed ice crests are glossy (0.28), sparkle grains glint.
    rough[i] = clamp01(0.88 - glaze * 0.58 - (spark > 0.78 ? 0.35 : 0));
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.45 }),
    normalStrength: 1.15
  };
}

/** The frozen lake: dark, clear ice with sparse hairline pressure fractures and thin blown frost. */
export function lakeIce(opts = {}) {
  const { size = texSize(512), seed = 9, ice = '#1d3c52', frost = '#b9dce9' } = opts;
  const S = size;
  const sd = hashStr(`lake${seed}`);

  const height = heightField(S, (u, v) => {
    const warpU = u + (fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x31 }) - 0.5) * 0.14;
    const warpV = v + (fbm(u * 4 + 3.1, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x62 }) - 0.5) * 0.14;
    const line1 = ridged(warpU * 3, warpV * 3, { octaves: 2, period: 3, seed: sd });
    const frostDrift = fbm(u * 6, v * 14, { octaves: 3, period: 14, seed: sd ^ 0x9 });
    const hairline = clamp01((line1 - 0.86) * 7.5);
    return 0.58 + (frostDrift - 0.5) * 0.08 - hairline * 0.16;
  });
  const hf = readHeight(height);
  const iceC = hexToRgb(ice);
  const frostC = hexToRgb(frost);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const crk = clamp01((0.52 - h) * 8);
    const patch = clamp01((fbm(u * 5, v * 12, { octaves: 3, period: 12, seed: sd ^ 0x45 }) - 0.58) * 3.0);
    const blend = clamp01(crk * 0.72 + patch * 0.42);
    const c = rgbLerp(iceC, frostC, blend);
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
    rough[i] = clamp01(0.08 + crk * 0.45 + patch * 0.55);
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height, roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.45 }),
    normalStrength: 0.9
  };
}

/**
 * Glacier ice as it stands in a face: pale and nearly even (the firn bands and the blue are painted per vertex by the
 * builders, `ground.js` iceSection and `stations.js` glacierIce), worn into shallow melt scallops a hand or two
 * across, with a few hairline fractures and clouds of trapped air. Laid in world metres (`addWorldBoxUV`), so it is
 * never stretched along a face. The 2026-11-27 realism pass replaced the banded version (sine stripes that read as
 * cloth when a sheet's 0..1 uvs stretched them); the old generator is in `archive/2026-11-27/lanternfall-realism/`.
 */
export function carvedIce(opts = {}) {
  const { size = texSize(256), seed = 3, pale = '#dfecf2', deep = '#b3cddc' } = opts;
  const S = size;
  const sd = hashStr(`carve${seed}`);
  const height = heightField(S, (u, v) => {
    // Scallops: the cells of a Worley field, dished (each cell a shallow bowl, its rims standing).
    const cell = worley(u * 5, v * 5, 5, sd).f1;
    const scallop = Math.pow(Math.min(1, cell * 1.6), 0.8);
    const fine = fbm(u * 18, v * 18, { octaves: 3, period: 18, seed: sd ^ 0x21 });
    const crack = ridged(u * 3 + fine * 0.2, v * 3, { octaves: 2, period: 3, seed: sd ^ 0x44 });
    const hair = Math.max(0, (crack - 0.9) * 10);
    return 0.5 + (scallop - 0.5) * 0.3 + (fine - 0.5) * 0.12 - hair * 0.12;
  });
  const hf = readHeight(height);
  const paleC = hexToRgb(pale), deepC = hexToRgb(deep);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const h = hf.data[i];
    // Air in the ice: soft milky clouds, a little paler; the bowls of the scallops a little deeper in tone.
    const air = clamp01((fbm(x / S * 6, y / S * 6, { octaves: 3, period: 6, seed: sd ^ 0x77 }) - 0.5) * 2.4);
    let c = rgbLerp(deepC, paleC, clamp01(0.35 + (h - 0.5) * 1.6));
    c = rgbLerp(c, [236, 243, 246], air * 0.35);
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
    // Melted bowls are glazed; the rims and the air-clouded ice are rougher.
    rough[i] = clamp01(0.45 + (h - 0.5) * 0.6 + air * 0.2);
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height, roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.6 }),
    normalStrength: 1.4
  };
}

/**
 * A neutral grain for a surface whose colour comes from elsewhere (the material colour or the vertex paint): rock,
 * till, boards, snow. Mid-light grey with a mean of `mean`, so a photographed set graded to the same mean can take
 * its place without the tone moving (`public/textures/lanternfall/`, `texture-pack.js`); this is also the lower-tier
 * look. `kind` picks the relief: 'rock' (fractured), 'cobble' (rounded stones in fines), 'boards' (planks with grain,
 * running along v), 'snow' (soft, wind-packed).
 */
export function grainSurface(opts = {}) {
  const { size = texSize(256), seed = 1, kind = 'rock', mean = 0.62, contrast = 0.18 } = opts;
  const S = size;
  const sd = hashStr(`grain-${kind}-${seed}`);
  const boards = 6;
  const height = heightField(S, (u, v) => {
    if (kind === 'cobble') {
      const c = worley(u * 9, v * 9, 9, sd).f1;
      return 0.5 + (0.5 - Math.min(1, c * 1.8)) * 0.6 + (fbm(u * 30, v * 30, { octaves: 2, period: 30, seed: sd ^ 3 }) - 0.5) * 0.1;
    }
    if (kind === 'boards') {
      const b = u * boards, k = Math.floor(b), f = b - k;
      const gap = f < 0.035 || f > 0.965 ? -0.35 : 0;
      const grain = fbm(u * 60, v * 3 + k * 7.1, { octaves: 3, period: 3, seed: sd ^ k });
      return 0.55 + gap + (grain - 0.5) * 0.25;
    }
    if (kind === 'snow') {
      return 0.5 + (fbm(u * 6, v * 14, { octaves: 4, period: 14, seed: sd }) - 0.5) * 0.5 + (fbm(u * 40, v * 40, { octaves: 2, period: 40, seed: sd ^ 5 }) - 0.5) * 0.12;
    }
    const plates = ridged(u * 4, v * 4, { octaves: 4, period: 4, seed: sd });
    return 0.5 + (fbm(u * 8, v * 8, { octaves: 4, period: 8, seed: sd ^ 9 }) - 0.5) * 0.4 - Math.max(0, plates - 0.82) * 1.6;
  });
  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const h = hf.data[i];
    const mottle = fbm(x / S * 5, y / S * 5, { octaves: 3, period: 5, seed: sd ^ 0x31 });
    const val = clamp01(mean + (h - 0.5) * contrast * 2 + (mottle - 0.5) * contrast) * 255;
    img.data[i * 4] = val;
    img.data[i * 4 + 1] = val;
    img.data[i * 4 + 2] = val;
    img.data[i * 4 + 3] = 255;
    rough[i] = clamp01((kind === 'snow' ? 0.86 : 0.9) - (h - 0.5) * 0.2);
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height, roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 0.6 }),
    normalStrength: kind === 'snow' ? 0.9 : 1.6
  };
}
