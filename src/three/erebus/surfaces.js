/**
 * surfaces.js — Painted hull plate for things that stood in a desert, and the
 * dust that settles on everything.
 *
 * WHY NOT `platedMetal`. The ship's plate is weathered by WATER: rust blooms
 * and runs downward in long streaks, which is right for a hull that has sweated
 * through forty years of condensation and wrong for a lander on a dry moon,
 * where it reads as wood grain. A desert does three other things to paint, and
 * this generator does those:
 *
 *   - the sun BLEACHES it, unevenly, in broad soft patches;
 *   - the sand SCOURS it, chipping it off the seams and edges in small flakes
 *     down to a darker primer and then to bright bare metal;
 *   - the dust SETTLES in every seam and rivet line and lies in a film over the
 *     rest.
 *
 * As everywhere in pbr-kit, every map comes off one height field, so a chip is
 * a dent, a dent is rough, and a seam is dark because it is deep.
 *
 * `addDustCover` is the other half: a patch on any standard material that lays
 * sand over whatever faces up, in world space, so the top of a hull is dusty and
 * its flanks are not — the single cue that says the thing has been sitting here.
 */

import * as THREE from 'three';
import {
  canvas2d, heightField, readHeight, writeField, heightToAO, fbm, worley, makeRng, hashStr,
  buildMaterial, texSize
} from '../materials/pbr-kit.js';

/**
 * A smooth periodic field sampled on an n x n grid and read back bilinearly.
 * Low-frequency noise does not need a sample per pixel, and this is most of
 * what these textures cost to build.
 */
function lowField(n, fn) {
  const g = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) g[j * n + i] = fn(i / n, j / n);
  return (u, v) => {
    const x = u * n - 0.5, y = v * n - 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const i0 = ((x0 % n) + n) % n, i1 = (i0 + 1) % n;
    const j0 = ((y0 % n) + n) % n, j1 = (j0 + 1) % n;
    const a = g[j0 * n + i0], b = g[j0 * n + i1], c = g[j1 * n + i0], d = g[j1 * n + i1];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
}

function rgb(hex) {
  const h = parseInt(hex.replace('#', ''), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * @param {object} o
 *   size, seed
 *   paint, primer, metal, dust  — sRGB hex
 *   rows, cols    — panel grid (rows are staggered, like real plating)
 *   wear 0…1      — how far the sand has scoured it
 */
export function hullPlate(o = {}) {
  const {
    size = 512, seed = 1, paint = '#a39479', primer = '#5b5048', metal = '#8d887f', dust = '#c9ab85',
    rows = 4, cols = 3, wear = 0.6
  } = o;
  const S = size;
  const sd = hashStr(`hull${seed}`);
  const rand = makeRng(sd);
  // Row heights vary; each row's seams are offset from the last.
  const rowEdges = [0];
  for (let i = 1; i < rows; i++) rowEdges.push(i / rows + (rand() - 0.5) * 0.08 / rows);
  rowEdges.push(1);
  const rowOffset = rowEdges.map(() => rand());

  const seamInfo = (u, v) => {
    let r = 0;
    while (r < rows - 1 && v > rowEdges[r + 1]) r++;
    const v0 = rowEdges[r], v1 = rowEdges[r + 1];
    const dv = Math.min(v - v0, v1 - v);
    const uu = (u * cols + rowOffset[r]) % 1;
    const du = Math.min(uu, 1 - uu) / cols;
    return { d: Math.min(dv, du), dv, du, uu, row: r, vv: (v - v0) / (v1 - v0) };
  };

  const chipN = lowField(256, (u, v) => fbm(u * 24, v * 24, { octaves: 4, period: 24, seed: sd ^ 0x3c }));
  const expo = lowField(48, (u, v) => fbm(u * 3, v * 3, { octaves: 3, period: 3, seed: sd ^ 0x9 }));
  const bleachF = lowField(64, (u, v) => fbm(u * 2.5, v * 2.5, { octaves: 4, period: 3, seed: sd ^ 0x21 }));
  const filmF = lowField(96, (u, v) => fbm(u * 6, v * 6, { octaves: 3, period: 6, seed: sd ^ 0x77 }));
  const streakF = lowField(256, (u, v) => fbm(u * 30, v * 4, { octaves: 2, period: 30, seed: sd ^ 0x13 }));
  const chipAt = (u, v, edge) => {
    const n = chipN(u, v);
    const w = worley(u * 40, v * 40, 40, sd ^ 0x71);
    // Chips cluster on seams and on the high, exposed panels.
    const exposure = Math.max(0, 1 - edge * 38) * 0.6 + 0.4 * expo(u, v);
    const k = n * 0.7 + (1 - Math.min(1, w.f1 * 2.2)) * 0.3;
    return Math.max(0, (k + exposure * 0.5) - (1.18 - wear * 0.45));
  };
  const chips = new Float32Array(S * S);
  const seams = new Array(S * S);

  const height = heightField(S, (u, v, px, py) => {
    const s = seamInfo(u, v);
    const pi = (py | 0) * S + (px | 0);
    seams[pi] = s;
    let h = 0.62;
    // Seams: a pressed groove either side of a lap joint.
    h -= Math.max(0, 1 - s.d * S / 3.2) * 0.34;
    // Rivets: every ~1/28 along each seam, a few pixels in from it.
    const pitch = 1 / 28;
    const onH = Math.abs(s.dv - 7 / S) < 3 / S;
    const onV = Math.abs(s.du - 7 / S) < 3 / S;
    if (onH) {
      const t = (u / pitch) % 1;
      const r = Math.hypot((t - 0.5) * pitch * S, (s.dv - 7 / S) * S);
      if (r < 2.6) h += (1 - r / 2.6) * 0.16;
    }
    if (onV) {
      const t = (v / pitch) % 1;
      const r = Math.hypot((t - 0.5) * pitch * S, (s.du - 7 / S) * S);
      if (r < 2.6) h += (1 - r / 2.6) * 0.16;
    }
    // A slight oil-can in each panel.
    h += Math.sin(s.vv * Math.PI) * 0.03;
    // Paint is a layer: where it has chipped, the surface steps down.
    const c = chipAt(u, v, s.d);
    chips[pi] = c;
    h -= Math.min(0.08, c * 0.5);
    h += (fbm(u * 70, v * 70, { octaves: 1, period: 70, seed: sd ^ 0x55 }) - 0.5) * 0.02;
    return h;
  });

  const hf = readHeight(height);
  const P = rgb(paint), Pr = rgb(primer), M = rgb(metal), D = rgb(dust);
  const alb = canvas2d(S, S);
  const ctx = alb.getContext('2d');
  const img = ctx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const metal01 = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const s = seams[i];
    // Paint, bleached in broad soft patches and a shade different per panel.
    const bleach = bleachF(u, v);
    const panelTint = (((Math.sin((s.row * 131 + Math.floor(u * cols + rowOffset[s.row])) * 12.9898 + sd) * 43758.5453) % 1 + 1) % 1 - 0.5) * 0.08;
    let c = P.map(ch => ch * (0.92 + bleach * 0.2 + panelTint));
    c = mix3(c, [c[0] * 1.08 + 8, c[1] * 1.06 + 6, c[2] * 1.02 + 4], Math.max(0, bleach - 0.55) * 1.5);
    // Chips: primer first, bare metal where it went deeper.
    const ch = chips[i];
    let r = 0.66 + (bleach - 0.5) * 0.1, m = 0.0;
    if (ch > 0) {
      c = mix3(c, Pr, Math.min(1, ch * 9));
      r = 0.8;
      if (ch > 0.09) { c = mix3(c, M, Math.min(1, (ch - 0.09) * 12)); r = 0.42; m = 0.85; }
    }
    // Dust in the seams and round the rivets, and a film over everything.
    const deep = Math.max(0, 0.6 - hf.data[i]) * 3.2;
    const film = filmF(u, v);
    c = mix3(c, D, Math.min(0.85, deep * 0.9 + Math.max(0, film - 0.5) * 0.6));
    // Short dust shadows downwind of each rivet row, not long rain streaks.
    const streak = streakF(u, v);
    c = mix3(c, D, Math.max(0, streak - 0.62) * 0.8);
    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;
    rough[i] = Math.min(1, r + deep * 0.3 + Math.max(0, film - 0.5) * 0.3);
    metal01[i] = m * (1 - Math.min(1, deep));
  }
  ctx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    metalness: writeField({ data: metal01, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.2 }),
    normalStrength: 2.4
  };
}

/**
 * Lay sand over whatever faces up. `amount` 0…1; `color` linear.
 * Chains any existing onBeforeCompile.
 */
export function addDustCover(mat, { amount = 0.7, color = new THREE.Color('#c7a67e'), sharp = [0.45, 0.85], film = 0.1 } = {}) {
  const prev = mat.onBeforeCompile;
  // Read the key NOW: three's default key is the source of onBeforeCompile,
  // which is about to be replaced.
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  const uniforms = { uDustAmt: { value: amount }, uDustCol: { value: color }, uDustFilm: { value: film } };
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uDustAmt;
        uniform float uDustFilm;
        uniform vec3 uDustCol;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 dWN = (vec4(normal, 0.0) * viewMatrix).xyz;
          float dUp = smoothstep(${sharp[0].toFixed(2)}, ${sharp[1].toFixed(2)}, dWN.y);
          float d = clamp(max(dUp * uDustAmt, uDustFilm), 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, uDustCol, d);
          roughnessFactor = mix(roughnessFactor, 1.0, d);
          metalnessFactor = mix(metalnessFactor, 0.0, d);
        }`);
  };
  const key = `${prevKey}|dust${sharp.join(',')}`;
  mat.customProgramCacheKey = () => key;
  return mat;
}

/**
 * Wind-rippled sand, seen from a standing height.
 *
 * Ripples are a few centimetres high and a hand's width apart, and they are
 * NOT corrugation: crests wander, split and rejoin (Y-junctions where two
 * trains meet), fade out where the surface is armoured, and carry a faint dark
 * line of heavy mineral grains in each trough. The crest lines run across the
 * wind (`fu`, `fv` are integer frequencies, so the tile still wraps). The
 * relief lives in the normal map; the albedo keeps only the mineral lines, the
 * grit and the odd pebble, which is what sand actually looks like underfoot.
 */
export function duneSand(o = {}) {
  const {
    size = 1024, seed = 5, fu = 35, fv = 16,
    base = '#cdae88', dark = '#8e7056', pebble = '#6d5f52'
  } = o;
  const S = size;
  const sd = hashStr(`dune${seed}`);
  const B = rgb(base), Dk = rgb(dark), Pb = rgb(pebble);

  // Low-frequency fields, sampled once per pixel and shared by both passes.
  const wA = lowField(128, (u, v) => fbm(u * 3, v * 3, { octaves: 4, period: 3, seed: sd ^ 0x11 }) * 2.4);
  const wB = lowField(192, (u, v) => fbm(u * 9, v * 9, { octaves: 2, period: 9, seed: sd ^ 0x22 }) * 0.45);
  const aF = lowField(64, (u, v) => fbm(u * 2, v * 2, { octaves: 3, period: 2, seed: sd ^ 0x33 }));
  const jF = lowField(96, (u, v) => fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x44 }));
  const warpA = new Float32Array(S * S), warpB = new Float32Array(S * S);
  const ampF = new Float32Array(S * S), junc = new Float32Array(S * S);
  const peb = new Float32Array(S * S), tr = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    warpA[i] = wA(u, v);
    warpB[i] = wB(u, v);
    ampF[i] = aF(u, v);
    junc[i] = jF(u, v);
  }
  // Pebbles: few, of mixed sizes, and not all round — stamped straight into
  // the field (wrapping at the edges) rather than searched for per pixel.
  const prand = makeRng(sd ^ 0x55);
  const nPeb = 95;
  for (let k = 0; k < nPeb; k++) {
    const cx = prand() * S, cy = prand() * S;
    const rad = (0.003 + Math.pow(prand(), 2.5) * 0.009) * S;
    const sx = 0.7 + prand() * 0.6, rot = prand() * Math.PI;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const R = Math.ceil(rad * 1.4);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const ex = (dx * cr + dy * sr) / sx, ey = (-dx * sr + dy * cr) * sx;
        const d = Math.hypot(ex, ey) / rad;
        if (d >= 1) continue;
        const px = (((Math.round(cx) + dx) % S) + S) % S, py = (((Math.round(cy) + dy) % S) + S) % S;
        peb[py * S + px] = Math.max(peb[py * S + px], Math.sqrt(1 - d * d));
      }
    }
  }
  const grain = lowField(512, (u, v) => fbm(u * 96, v * 96, { octaves: 2, period: 96, seed: sd ^ 0x66 }));
  const profile = t => (t < 0.68 ? t / 0.68 : (1 - t) / 0.32);
  const height = heightField(S, (u, v, x, y) => {
    const i = (y | 0) * S + (x | 0);
    const w = warpA[i] + warpB[i];
    const p1 = u * fu + v * fv + w;
    const p2 = u * (fu + 2) + v * (fv - 1) + w * 1.08 + 0.37;
    const t1 = p1 - Math.floor(p1), t2 = p2 - Math.floor(p2);
    const k = Math.min(1, Math.max(0, (junc[i] - 0.42) * 5));
    let r = profile(t1) * (1 - k) + profile(t2) * k;
    r = r * r * (3 - 2 * r);
    tr[i] = (1 - k) * t1 + k * t2;
    const amp = 0.35 + 0.65 * Math.min(1, Math.max(0, (ampF[i] - 0.3) * 2.2));
    let h = 0.45 + r * 0.16 * amp;
    h += (grain(u, v) - 0.5) * 0.035;
    h += peb[i] * 0.12;
    return h;
  });

  const alb = canvas2d(S, S);
  const ctx = alb.getContext('2d');
  const img = ctx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    // Heavy minerals settle at the foot of each lee face: a thin dark line.
    const t = tr[i];
    const line = Math.max(0, 1 - Math.abs(t - 0.93) * 16) * (0.3 + 0.7 * ampF[i]);
    const grit = grain(u * 2 + 0.3, v * 2 + 0.1);
    let c = B.map(ch => ch * (0.94 + (grit - 0.5) * 0.16));
    c = mix3(c, Dk, line * 0.32);
    c = mix3(c, Pb, Math.min(1, peb[i] * 1.6));
    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;
    rough[i] = peb[i] > 0.05 ? 0.62 : 0.96;
  }
  ctx.putImageData(img, 0, 0);
  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 8), strength: 0.8 }),
    normalStrength: 3.2
  };
}


/* ---------------------------------------------------------- shared plate */

const HULL_SETS = new Map();

/**
 * One painted-plate texture set per wear grade, generated once and shared by
 * everything made of plate — the lander, the pylons, the derelict, the wreck on
 * the horizon — each tinted by its material colour. Generating a plate is the
 * most expensive thing this world does, and four copies of it differing only
 * in hue bought nothing the tint does not.
 */
function hullSet(grade) {
  if (!HULL_SETS.has(grade)) {
    const heavy = grade === 'heavy';
    const surf = hullPlate({
      paint: '#cdc4b4', primer: '#6d645a', metal: '#a39d93', dust: '#d6bd9b',
      rows: heavy ? 3 : 4, cols: heavy ? 2 : 3, wear: heavy ? 1.0 : 0.6,
      seed: heavy ? 71 : 91, size: texSize(heavy ? 256 : 512)
    });
    HULL_SETS.set(grade, buildMaterial(surf, { repeat: 1 }));
  }
  return HULL_SETS.get(grade);
}

/**
 * A plate material: the shared maps, a tint, and dust on whatever faces up.
 * `repeat` is honoured by scaling the geometry's UVs at the call site, not the
 * shared textures.
 */
export function hullMaterial({ tint = '#ffffff', grade = 'light', dust = 0.55, sharp, film, side } = {}) {
  const set = hullSet(grade);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(tint),
    map: set.map, normalMap: set.normalMap, roughnessMap: set.roughnessMap,
    metalnessMap: set.metalnessMap, aoMap: set.aoMap,
    roughness: 1.0, metalness: 1.0, aoMapIntensity: 0.9,
    normalScale: new THREE.Vector2(0.9, 0.9)
  });
  if (side !== undefined) mat.side = side;
  return addDustCover(mat, { amount: dust, ...(sharp ? { sharp } : {}), ...(film !== undefined ? { film } : {}) });
}
