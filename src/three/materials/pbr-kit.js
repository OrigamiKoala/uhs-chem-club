/**
 * pbr-kit.js — The procedural surface and greeble toolkit the whole ship,
 * both worlds and every bench are built out of.
 *
 * WHY THIS EXISTS
 * Three places (the Avalon, Erebus, Tallow) were each growing their own copy of
 * "make a metal", "make a bolt", "make a weld". They drifted, and drift is what
 * makes a world read as several worlds. This file is the one set of surfaces and
 * the one set of small parts, so a bolt on the ship is the same bolt as a bolt on
 * the flat, ground down by a different amount of weather.
 *
 * THE RULE THAT DRIVES EVERY GENERATOR HERE
 * A surface is convincing when its maps AGREE. Albedo, normal, roughness and
 * ambient occlusion all come off the same height field in every generator below:
 * a scratch is lighter in the albedo *because* it is raised in the height, less
 * rough *because* it is scoured, and unoccluded *because* it stands proud. Draw
 * those four independently and the eye reads plastic, every time, no matter how
 * many octaves of noise went in.
 *
 * TILING
 * All noise here runs on a wrapped integer lattice with an explicit period, so
 * every map tiles exactly. A ground plane that seams every four metres is the
 * other classic tell, and it is not possible with these primitives.
 *
 * COST
 * These are per-pixel JavaScript loops. They run once, at world build, and every
 * result is cached by key in `SURFACE_CACHE` — asking twice for the same plate
 * costs nothing the second time. Sizes are tier-aware via `texSize()`.
 *
 * WHAT IS NOT HERE
 * Emission. Nothing in this file glows. Lit things are lamps, and lamps are built
 * as geometry with a light inside them (CLAUDE.md §4.2). A "glow map" is how a
 * surface stops being hardware.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tierAtLeast } from '../tier.js';

/* ==========================================================================
   0. DETERMINISM
   The same seed gives the same rivet in the same place on every machine and
   every reload. Nothing in these worlds is randomised at runtime.
   ========================================================================== */

export function makeRng(seed) {
  let a = (typeof seed === 'string' ? hashStr(seed) : seed) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* ==========================================================================
   1. TILING NOISE
   Value noise and Worley on a wrapped lattice. `period` is in lattice cells;
   sampling x in [0, period) covers exactly one tile.
   ========================================================================== */

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

/** Hash a wrapped lattice point to [0,1). */
function latticeHash(ix, iy, period, seed) {
  const x = ((ix % period) + period) % period;
  const y = ((iy % period) + period) % period;
  let h = seed ^ 0x9e3779b9;
  h = Math.imul(h ^ x, 0x85ebca6b);
  h = Math.imul(h ^ y, 0xc2b2ae35);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** One octave of tiling value noise. */
export function valueNoise(x, y, period, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = latticeHash(ix, iy, period, seed);
  const b = latticeHash(ix + 1, iy, period, seed);
  const c = latticeHash(ix, iy + 1, period, seed);
  const d = latticeHash(ix + 1, iy + 1, period, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

/**
 * Fractal Brownian motion, tiling. `period` doubles with each octave so every
 * octave wraps on the same tile boundary.
 */
export function fbm(x, y, {
  octaves = 5, period = 8, seed = 1, gain = 0.5, lacunarity = 2
} = {}) {
  let sum = 0, amp = 1, norm = 0, p = period, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * f, y * f, p, seed + o * 1013) * amp;
    norm += amp;
    amp *= gain;
    f *= lacunarity;
    p = Math.round(p * lacunarity);
  }
  return sum / norm;
}

/**
 * Ridged noise: |2n-1| inverted. This is what makes a crack network or a
 * mountain edge rather than a cloud.
 */
export function ridged(x, y, opts = {}) {
  const n = fbm(x, y, opts);
  return 1 - Math.abs(n * 2 - 1);
}

/**
 * Tiling Worley. Returns the two nearest feature distances and the winning
 * cell id. `f2 - f1` is the classic cell-border field: desiccation cracks,
 * paving joints, the boundaries between salt polygons.
 */
export function worley(x, y, period, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let f1 = Infinity, f2 = Infinity, id = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = ix + ox, cy = iy + oy;
      const jx = latticeHash(cx, cy, period, seed);
      const jy = latticeHash(cx, cy, period, seed ^ 0x51ed);
      const px = cx + jx, py = cy + jy;
      const d = Math.hypot(px - x, py - y);
      if (d < f1) { f2 = f1; f1 = d; id = latticeHash(cx, cy, period, seed ^ 0x2f1b); }
      else if (d < f2) { f2 = d; }
    }
  }
  return { f1, f2, id, border: f2 - f1 };
}

/* ==========================================================================
   2. CANVAS PRIMITIVES
   ========================================================================== */

export function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Texture resolution for the current tier. One knob, used by every generator. */
export function texSize(base = 512) {
  return tierAtLeast('T4') ? base : Math.max(128, base >> 1);
}

/**
 * Build a greyscale height canvas from a per-pixel function.
 * `fn(u, v, x, y)` takes normalised coordinates and returns 0..1.
 */
export function heightField(size, fn) {
  const c = canvas2d(size, size);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = Math.max(0, Math.min(1, fn(x / size, y / size, x, y)));
      const b = (v * 255) | 0;
      const i = (y * size + x) * 4;
      d[i] = b; d[i + 1] = b; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Read a height canvas into a Float32Array once, so passes below are cheap. */
export function readHeight(c) {
  const { width: w, height: h } = c;
  const src = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = src[i * 4] / 255;
  return { data: out, w, h };
}

/** Write a Float32Array field back out as a greyscale canvas. */
export function writeField({ data, w, h }) {
  const c = canvas2d(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < data.length; i++) {
    const b = Math.max(0, Math.min(255, (data[i] * 255) | 0));
    d[i * 4] = b; d[i * 4 + 1] = b; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Sobel a height field into a tangent-space normal map, wrapping at the edges
 * so the normal tiles with the albedo that came off the same field.
 */
export function heightToNormal(heightCanvas, strength = 2.2) {
  const { data, w, h } = readHeight(heightCanvas);
  const at = (x, y) => data[(((y % h) + h) % h) * w + (((x % w) + w) % w)];

  const out = canvas2d(w, h);
  const octx = out.getContext('2d', { willReadFrequently: true });
  const img = octx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      let nx = -dx * strength, ny = -dy * strength;
      const len = Math.hypot(nx, ny, 1) || 1;
      const i = (y * w + x) * 4;
      d[i] = ((nx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/**
 * Cavity ambient occlusion from height: how far below its own neighbourhood a
 * pixel sits. This is the map that makes a panel gap read as a gap rather than
 * a dark line painted on a flat sheet, and it is the cheapest realism in the
 * whole kit.
 */
export function heightToAO(heightCanvas, { radius = 6, strength = 1.0 } = {}) {
  // HALF RESOLUTION, DELIBERATELY. Cavity occlusion is a low-frequency signal —
  // it describes where a surface is shadowed by its own shape, not where its
  // grain is — and sixteen taps per pixel at 512 is the single most expensive
  // pass in this file. Computing it at 256 and letting the sampler interpolate
  // is visually identical and four times cheaper, which is most of the
  // difference between a world that builds in three seconds and one that does
  // not stall when the player walks into it.
  const src = readHeight(heightCanvas);
  const half = canvas2d(src.w >> 1, src.h >> 1);
  {
    const ctx = half.getContext('2d', { willReadFrequently: true });
    const img = ctx.createImageData(half.width, half.height);
    for (let y = 0; y < half.height; y++) {
      for (let x = 0; x < half.width; x++) {
        const v = src.data[(y * 2) * src.w + x * 2];
        const i = (y * half.width + x) * 4;
        const b = (v * 255) | 0;
        img.data[i] = b; img.data[i + 1] = b; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  radius = Math.max(2, radius >> 1);
  const { data, w, h } = readHeight(half);
  const at = (x, y) => data[(((y % h) + h) % h) * w + (((x % w) + w) % w)];
  const out = new Float32Array(w * h);

  // Eight-tap horizon estimate at two radii — enough to separate a groove from
  // a pit without paying for a full hemisphere march.
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      let occ = 0;
      for (const [dx, dy] of dirs) {
        const a = at(x + dx * radius, y + dy * radius);
        const b = at(x + dx * (radius >> 1), y + dy * (radius >> 1));
        occ += Math.max(0, a - c) + Math.max(0, b - c) * 1.4;
      }
      out[y * w + x] = Math.max(0, 1 - (occ / dirs.length) * 2.6 * strength);
    }
  }
  return writeField({ data: out, w, h });
}

/**
 * Roughness from height plus an optional wear mask. High ground is scoured by
 * hands and weather and goes smoother; hollows pack with dust and go matte.
 */
export function heightToRoughness(heightCanvas, { lo = 0.42, hi = 0.96, wear = null } = {}) {
  const { data, w, h } = readHeight(heightCanvas);
  const wearData = wear ? readHeight(wear).data : null;
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) {
    let r = hi - (hi - lo) * data[i];
    if (wearData) r -= wearData[i] * 0.3;   // worn metal is polished, not matte
    out[i] = Math.max(0.04, Math.min(1, r));
  }
  return writeField({ data: out, w, h });
}

/** Box-blur a canvas in place-ish (returns a new canvas). Used to soften masks. */
export function blur(src, radius = 2) {
  const { data, w, h } = readHeight(src);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const at = (arr, x, y) => arr[(((y % h) + h) % h) * w + (((x % w) + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -radius; k <= radius; k++) { s += at(data, x + k, y); n++; }
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -radius; k <= radius; k++) { s += at(tmp, x, y + k); n++; }
      out[y * w + x] = s / n;
    }
  }
  return writeField({ data: out, w, h });
}

/* ==========================================================================
   3. TEXTURE ASSEMBLY
   ========================================================================== */

function asTexture(c, { srgb = false, repeat = 1, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (Array.isArray(repeat)) t.repeat.set(repeat[0], repeat[1]);
  else t.repeat.set(repeat, repeat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  return t;
}

export const asColorTexture = (c, repeat) => asTexture(c, { srgb: true, repeat });
export const asDataTexture = (c, repeat) => asTexture(c, { srgb: false, repeat });

/**
 * `aoMap` samples the SECOND uv set. Every geometry that wants ambient occlusion
 * has to say so, and forgetting is a silent no-op that costs a texture fetch for
 * nothing — so this is the one call that turns it on.
 */
export function enableAO(geometry) {
  if (geometry && geometry.attributes.uv && !geometry.attributes.uv1) {
    geometry.setAttribute('uv1', geometry.attributes.uv);
  }
  return geometry;
}

/**
 * Assemble a standard material from a surface description. Every map that is
 * present is wired with the right colour space and the same repeat, so the four
 * maps stay registered with each other.
 */
export function buildMaterial(surface, extra = {}) {
  // `repeat` is a texture property, not a material one. Spreading it through
  // to the constructor makes three warn on every surface in the world, and the
  // warning is right: it would silently do nothing.
  const { repeat: repeatOpt, ...materialOpts } = extra;
  const repeat = repeatOpt ?? surface.repeat ?? 1;
  const mat = new THREE.MeshStandardMaterial({
    map: surface.albedo ? asColorTexture(surface.albedo, repeat) : null,
    normalMap: surface.height ? asDataTexture(heightToNormal(surface.height, surface.normalStrength ?? 2.0), repeat) : null,
    roughnessMap: surface.roughness ? asDataTexture(surface.roughness, repeat) : null,
    metalnessMap: surface.metalness ? asDataTexture(surface.metalness, repeat) : null,
    aoMap: surface.ao ? asDataTexture(surface.ao, repeat) : null,
    roughness: materialOpts.roughness ?? 1.0,
    metalness: materialOpts.metalness ?? (surface.metalness ? 1.0 : 0.0),
    ...materialOpts
  });
  if (surface.normalScale) mat.normalScale = new THREE.Vector2(surface.normalScale, surface.normalScale);
  mat.userData.surfaceMaps = [
    mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap
  ].filter(Boolean);
  return mat;
}

/** Cache of finished materials, keyed by their description. */
const SURFACE_CACHE = new Map();

/** Build once, share everywhere. `key` must describe every input that matters. */
export function cachedMaterial(key, factory) {
  if (SURFACE_CACHE.has(key)) return SURFACE_CACHE.get(key);
  const m = factory();
  SURFACE_CACHE.set(key, m);
  return m;
}

/** Free every cached material and its maps. Called on a full stage teardown. */
export function disposeSurfaceCache() {
  for (const mat of SURFACE_CACHE.values()) {
    for (const t of mat.userData.surfaceMaps || []) t.dispose();
    mat.dispose();
  }
  SURFACE_CACHE.clear();
}

/* ==========================================================================
   4. SURFACE GENERATORS
   Each returns { albedo, height, roughness, metalness, ao } canvases.
   ========================================================================== */

function rgbLerp(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function hexToRgb(hex) {
  const h = typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex;
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

/**
 * Painted, weathered metal plate — the single most-used surface in the product.
 *
 * Construction, in the order the real object acquired it:
 *   1. rolled steel, with a faint directional mill grain
 *   2. a panel grid pressed into it, with gaps and a chamfer at every edge
 *   3. rivet lines along the seams
 *   4. paint, sprayed on and now chalked and sun-faded
 *   5. wear: paint gone at the high edges, bare metal showing through
 *   6. rust blooms where water stood, streaked downward by forty years of it
 *
 * `opts.weather` 0..1 scales steps 5 and 6 — the ship interior sits low, the
 * Tallow refinery sits high, and that one number is most of the difference
 * between "in service" and "abandoned".
 */
export function platedMetal(opts = {}) {
  const {
    size = texSize(512),
    paint = '#8b8272',
    metal = '#6a6358',
    rust = '#7a4526',
    panels = 3,
    seed = 11,
    weather = 0.5,
    rivets = true,
    grain = 0.5
  } = opts;

  const S = size;
  const rngSeed = hashStr(`${paint}${metal}${panels}${seed}`);

  /* --- height: mill grain + panel gaps + rivets + dents --- */
  const height = heightField(S, (u, v, x, y) => {
    let hgt = 0.62;

    // Rolled mill grain: fine, strongly anisotropic, almost invisible alone but
    // it is what catches a grazing light and says "sheet" instead of "plane".
    hgt += (fbm(u * 96, v * 6, { octaves: 2, period: 96, seed: rngSeed }) - 0.5) * 0.05 * grain;

    // Panel grid. Each panel is a slightly different thickness, so the gaps
    // catch light unevenly the way real shimmed plate does.
    const pu = u * panels, pv = v * panels;
    const fu = pu - Math.floor(pu), fv = pv - Math.floor(pv);
    const gap = 0.018;
    const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
    if (edge < gap) {
      hgt -= 0.34 * (1 - edge / gap);            // the gap itself
    } else if (edge < gap * 2.4) {
      hgt += 0.05 * (1 - (edge - gap) / (gap * 1.4)); // the rolled-over chamfer
    }
    hgt += (latticeHash(Math.floor(pu), Math.floor(pv), panels, rngSeed) - 0.5) * 0.03;

    // Rivet lines, set in from every panel edge.
    if (rivets) {
      const pitch = 0.085;
      for (const [cu, cv] of [[fu, fv], [fv, fu]]) {
        const inset = 0.045;
        if (Math.abs(cu - inset) < 0.02 || Math.abs(cu - (1 - inset)) < 0.02) {
          const t = cv / pitch;
          const dr = Math.hypot((cu - (cu < 0.5 ? inset : 1 - inset)) / 0.02, (t - Math.round(t)) * 2);
          if (dr < 1) hgt += 0.20 * Math.cos(dr * Math.PI * 0.5);
        }
      }
    }

    // Dents and impact scars: low-frequency, sparse, always concave.
    const dent = worley(u * 5, v * 5, 5, rngSeed ^ 0x7f);
    if (dent.f1 < 0.16) hgt -= (0.16 - dent.f1) * 0.5 * weather;

    return hgt;
  });

  const hf = readHeight(height);

  /*
   * WEAR AND RUST ARE COMPUTED AT HALF RESOLUTION.
   *
   * Both are broad, soft fields — where the paint has gone and where the water
   * stood — and both are blurred immediately afterwards anyway. Evaluating
   * twenty octaves of noise per pixel at full resolution for a signal that is
   * then deliberately softened is paying four times over for nothing. The
   * height field, which carries the rivets and the panel gaps, stays full.
   */
  const H = S >> 1;
  const wearField = new Float32Array(H * H);
  const rustField = new Float32Array(H * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < H; x++) {
      const u = x / H, v = y / H;
      const i = y * H + x;
      const hAt = hf.data[(y * 2) * S + x * 2];

      const proud = Math.max(0, hAt - 0.66) * 3.4;
      const patch = fbm(u * 7, v * 7, { octaves: 4, period: 7, seed: rngSeed ^ 0x99 });
      const scratch = Math.pow(Math.max(0, ridged(u * 40, v * 3.5, { octaves: 2, period: 40, seed: rngSeed ^ 0x3c })), 5);
      wearField[i] = Math.min(1, (proud * 0.9 + Math.max(0, patch - 0.58) * 2.2 + scratch * 0.8) * weather * 1.5);

      const bloom = fbm(u * 4.5, v * 4.5, { octaves: 5, period: 5, seed: rngSeed ^ 0x2a1 });
      // Streaks run with gravity: sampled far more finely across than down.
      const streak = fbm(u * 34, v * 2.2, { octaves: 3, period: 34, seed: rngSeed ^ 0x51 });
      const source = Math.max(0, bloom - 0.60) * 3.0;
      const run = Math.max(0, streak - 0.52) * 1.5 * Math.max(0, bloom - 0.46) * 2.2;
      rustField[i] = Math.min(1, (source + run * 0.75) * weather);
    }
  }
  const wearMap = readHeight(blur(writeField({ data: wearField, w: H, h: H }), 1)).data;
  const rustMap = readHeight(blur(writeField({ data: rustField, w: H, h: H }), 1)).data;
  /** Sample a half-resolution field from a full-resolution pixel index. */
  const halfAt = (field, x, y) => field[(y >> 1) * H + (x >> 1)];

  /* --- assemble albedo, roughness and metalness from those three fields --- */
  const paintRgb = hexToRgb(paint);
  const metalRgb = hexToRgb(metal);
  const rustRgb = hexToRgb(rust);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d', { willReadFrequently: true });
  const aimg = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const metalness = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;

    // Paint chalks unevenly: a slow mottle over the base colour.
    const chalk = fbm(u * 9, v * 9, { octaves: 3, period: 9, seed: rngSeed ^ 0x7ab });
    let c = rgbLerp(paintRgb, [paintRgb[0] * 1.13, paintRgb[1] * 1.12, paintRgb[2] * 1.1],
      (chalk - 0.5) * 0.9 + 0.5);

    // Bare metal where the paint has gone.
    const w = halfAt(wearMap, x, y);
    c = rgbLerp(c, metalRgb, Math.min(1, w));

    // Rust over the top of both — it grows on the bare metal, so it is applied last.
    const r = halfAt(rustMap, x, y) * (0.45 + w * 0.55);
    c = rgbLerp(c, rustRgb, Math.min(0.92, r));

    // Grime settles into every hollow, on everything.
    const dirt = Math.max(0, 0.66 - hf.data[i]) * 1.5;
    c = rgbLerp(c, [c[0] * 0.62, c[1] * 0.6, c[2] * 0.56], Math.min(0.75, dirt));

    aimg.data[i * 4] = Math.min(255, c[0]);
    aimg.data[i * 4 + 1] = Math.min(255, c[1]);
    aimg.data[i * 4 + 2] = Math.min(255, c[2]);
    aimg.data[i * 4 + 3] = 255;

    // Paint is matte; worn metal is polished by hands; rust is the roughest
    // thing on the object. All three, in that order.
    rough[i] = Math.max(0.08, Math.min(1,
      0.82 - w * 0.42 + r * 0.30 + dirt * 0.12
    ));
    // Only bare metal and mild rust are metallic. Paint is a dielectric, and
    // painting the whole plate metallic is why so much sci-fi looks like foil.
    metalness[i] = Math.max(0, Math.min(1, w * 0.95 - r * 0.55));
  }
  actx.putImageData(aimg, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    metalness: writeField({ data: metalness, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.1 }),
    normalStrength: 2.0
  };
}

/**
 * Salt hardpan — the ground of Tallow.
 *
 * A dry lakebed is a Worley cell field: the crust dries, shrinks and tears along
 * cell boundaries, and the plates between curl upward at their edges. Two Worley
 * scales are layered (big plates, small plates inside them) because a real pan
 * cracks again inside each polygon as it dries further.
 */
export function saltHardpan(opts = {}) {
  const { size = texSize(512), seed = 7, pale = '#cfc6ae', deep = '#8d846f', bloom = '#e9e2cf' } = opts;
  const S = size;
  const sd = hashStr(`salt${seed}`);

  const height = heightField(S, (u, v) => {
    const big = worley(u * 9, v * 9, 9, sd);
    const small = worley(u * 26, v * 26, 26, sd ^ 0x31);

    // Plate surface: gently domed, because each polygon curls up at its rim.
    let hgt = 0.56 + Math.min(big.f1, 0.34) * 0.5;

    // The cracks themselves. f2-f1 is zero exactly on a cell wall.
    const crackBig = Math.max(0, 1 - big.border * 14);
    const crackSmall = Math.max(0, 1 - small.border * 26);
    hgt -= crackBig * 0.40;
    hgt -= crackSmall * 0.13;

    // Curled lips either side of the big cracks: the crust tears and lifts.
    hgt += Math.max(0, 1 - Math.abs(big.border - 0.055) * 26) * 0.085;

    // Fine grit drifted over everything.
    hgt += (fbm(u * 60, v * 60, { octaves: 3, period: 60, seed: sd ^ 0x8a }) - 0.5) * 0.06;
    return hgt;
  });

  const hf = readHeight(height);
  const paleRgb = hexToRgb(pale);
  const deepRgb = hexToRgb(deep);
  const bloomRgb = hexToRgb(bloom);

  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];

    // Height is the colour: the depth of a crack is how dark it is.
    let c = rgbLerp(deepRgb, paleRgb, Math.min(1, Math.max(0, (h - 0.24) / 0.5)));

    // Salt blooms white along the ridges where brine wicked up and evaporated.
    const bl = Math.max(0, h - 0.74) * 4 * fbm(u * 15, v * 15, { octaves: 3, period: 15, seed: sd ^ 0x5f });
    c = rgbLerp(c, bloomRgb, Math.min(0.85, bl));

    // Patches of wind-blown sand over the crust, warmer and duller.
    const sand = Math.max(0, fbm(u * 3.4, v * 3.4, { octaves: 4, period: 4, seed: sd ^ 0xaa }) - 0.55) * 2.6;
    c = rgbLerp(c, [c[0] * 1.02, c[1] * 0.95, c[2] * 0.82], Math.min(0.7, sand));

    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;

    // Salt bloom is chalk — the roughest thing here. Packed grit in the cracks
    // is very slightly less so.
    rough[i] = Math.max(0.5, Math.min(1, 0.88 + bl * 0.1 - Math.max(0, 0.4 - h) * 0.2));
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.35 }),
    normalStrength: 2.6
  };
}

/**
 * Non-slip deck grating / treadplate. Teardrop raised pattern, worn flat along
 * the line people actually walk.
 */
export function treadPlate(opts = {}) {
  const { size = texSize(512), base = '#6d6557', seed = 3, weather = 0.5 } = opts;
  const S = size;
  const sd = hashStr(`tread${seed}`);

  const height = heightField(S, (u, v) => {
    let h = 0.45;
    // Two opposed families of raised bars, the classic durbar pattern.
    const cell = 0.125;
    for (const rot of [0.6, -0.6]) {
      const ru = u * Math.cos(rot) - v * Math.sin(rot);
      const rv = u * Math.sin(rot) + v * Math.cos(rot);
      const bu = ((ru / cell) % 1 + 1) % 1;
      const bv = ((rv / (cell * 2)) % 1 + 1) % 1;
      if (bv < 0.42 && bu > 0.18 && bu < 0.82) {
        const capX = 1 - Math.abs(bu - 0.5) / 0.32;
        const capY = 1 - Math.abs(bv - 0.21) / 0.21;
        h += 0.34 * Math.min(1, capX) * Math.min(1, capY);
      }
    }
    h += (fbm(u * 70, v * 70, { octaves: 2, period: 70, seed: sd }) - 0.5) * 0.05;
    // The walked line: a broad band where the pattern is ground away.
    const path = Math.max(0, 1 - Math.abs(v - 0.5) * 3.6) * weather;
    h = h - Math.max(0, h - 0.45) * path * 0.75;
    return h;
  });

  const hf = readHeight(height);
  const baseRgb = hexToRgb(base);
  const alb = canvas2d(S, S);
  const ctx = alb.getContext('2d');
  const img = ctx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const metalness = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const proud = Math.max(0, h - 0.5) * 2.4;
    const grime = fbm(u * 8, v * 8, { octaves: 4, period: 8, seed: sd ^ 0x4d });

    let c = rgbLerp(
      [baseRgb[0] * 0.66, baseRgb[1] * 0.64, baseRgb[2] * 0.6],
      [baseRgb[0] * 1.2, baseRgb[1] * 1.18, baseRgb[2] * 1.14],
      Math.min(1, proud)
    );
    c = rgbLerp(c, [c[0] * 0.7, c[1] * 0.68, c[2] * 0.64], Math.max(0, grime - 0.5) * 1.4);

    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;

    rough[i] = Math.max(0.2, 0.86 - proud * 0.45 + Math.max(0, grime - 0.5) * 0.2);
    metalness[i] = 0.55 + proud * 0.35;
  }
  ctx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    metalness: writeField({ data: metalness, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.2 }),
    normalStrength: 2.4
  };
}

/**
 * Wind-worked desert sand — the floor of the Charge Gardens basin.
 *
 * Not the same surface as Tallow's pan and not built the same way. A salt flat
 * is a cracked crust; a sand basin is a RIPPLE FIELD, and ripples are the whole
 * read: regular crests perpendicular to the wind, drifting slowly in wavelength,
 * with the coarse grains stranded on the crests and the fines in the troughs.
 * That grain sorting is why a real dune surface changes colour between crest
 * and trough, and it is drawn here rather than tinted in.
 *
 * Scattered over it: the lag gravel and small stones that the wind could not
 * lift, which are what give the eye a size to measure the ripples against.
 */
export function desertSand(opts = {}) {
  const {
    size = texSize(512), seed = 9,
    light = '#b89468', shade = '#6b5236', stone = '#5d5347'
  } = opts;
  const S = size;
  const sd = hashStr(`sand${seed}`);
  const lightRgb = hexToRgb(light);
  const shadeRgb = hexToRgb(shade);
  const stoneRgb = hexToRgb(stone);

  // Stones are placed once and read by both passes, so a pebble's colour and
  // its bump are the same pebble.
  const stones = [];
  const srand = makeRng(sd ^ 0x4417);
  for (let i = 0; i < 90; i++) {
    stones.push({
      x: srand(), y: srand(),
      r: 0.004 + srand() * 0.013,
      h: 0.2 + srand() * 0.45
    });
  }
  /*
   * The stones go into a wrapped 12 x 12 bucket grid before anything samples
   * them. Ninety stones tested against every pixel of two full passes is
   * forty-seven million distance computations and was most of what this world
   * cost to build; bucketed, a lookup touches one or two.
   */
  const GRID = 12;
  const buckets = Array.from({ length: GRID * GRID }, () => []);
  const wrapCell = n => ((n % GRID) + GRID) % GRID;
  for (const st of stones) {
    // A stone is registered in every cell its radius can reach, so a lookup
    // never has to read a neighbour.
    const cx = Math.floor(st.x * GRID);
    const cy = Math.floor(st.y * GRID);
    const reach = Math.ceil(st.r * GRID);
    for (let j = -reach; j <= reach; j++) {
      for (let i = -reach; i <= reach; i++) {
        buckets[wrapCell(cy + j) * GRID + wrapCell(cx + i)].push(st);
      }
    }
  }

  const stoneAt = (u, v) => {
    const cell = buckets[wrapCell(Math.floor(v * GRID)) * GRID + wrapCell(Math.floor(u * GRID))];
    let best = 0;
    for (const st of cell) {
      // Wrapped distance, so a stone on the seam appears on both sides of it.
      let dx = Math.abs(u - st.x); dx = Math.min(dx, 1 - dx);
      let dy = Math.abs(v - st.y); dy = Math.min(dy, 1 - dy);
      const d = Math.hypot(dx, dy);
      if (d < st.r) best = Math.max(best, st.h * Math.sqrt(1 - (d / st.r) ** 2));
    }
    return best;
  };

  const height = heightField(S, (u, v) => {
    // The ripple field. Wavelength and direction both wander, or the crests
    // read as corduroy rather than as sand.
    const drift = fbm(u * 2.2, v * 2.2, { octaves: 3, period: 3, seed: sd }) - 0.5;
    const phase = (u * Math.cos(0.42) + v * Math.sin(0.42)) * 30 + drift * 5.5;
    // Asymmetric: a ripple has a long windward slope and a short slip face.
    const t = phase - Math.floor(phase);
    const ripple = t < 0.72 ? (t / 0.72) : (1 - (t - 0.72) / 0.28);

    let h = 0.42 + ripple * 0.22;
    // Long dune swell under the ripples.
    h += (fbm(u * 1.6, v * 1.6, { octaves: 4, period: 2, seed: sd ^ 0x71 }) - 0.5) * 0.28;
    // Grain.
    h += (fbm(u * 80, v * 80, { octaves: 2, period: 80, seed: sd ^ 0x13 }) - 0.5) * 0.05;
    h += stoneAt(u, v) * 0.3;
    return h;
  });

  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const ctx = alb.getContext('2d');
  const img = ctx.createImageData(S, S);
  const rough = new Float32Array(S * S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];

    // Grain sorting: coarse pale sand stranded on the crests, fine dark sand
    // in the troughs. This is the thing that makes a ripple field read.
    let c = rgbLerp(shadeRgb, lightRgb, Math.min(1, Math.max(0, (h - 0.3) / 0.45)));

    const st = stoneAt(u, v);
    if (st > 0.01) c = rgbLerp(c, stoneRgb, Math.min(0.9, st * 2.2));

    // Patches of darker, damper, more compacted ground.
    const patch = Math.max(0, fbm(u * 5, v * 5, { octaves: 4, period: 5, seed: sd ^ 0xbc }) - 0.58) * 2.4;
    c = rgbLerp(c, [c[0] * 0.72, c[1] * 0.7, c[2] * 0.66], Math.min(0.6, patch));

    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;

    // Loose sand is very rough; a wind-polished stone is not.
    rough[i] = st > 0.05 ? Math.max(0.35, 0.72 - st * 0.35) : Math.min(1, 0.93 + patch * 0.05);
  }
  ctx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.0 }),
    normalStrength: 2.2
  };
}

/**
 * Stratified sedimentary rock, for the cut face of the excavation and the
 * outcrops on both worlds. Horizontal bedding, broken by faults.
 */
export function sedimentaryRock(opts = {}) {
  const { size = texSize(512), seed = 5, warm = '#9a8a72', cool = '#6f6554' } = opts;
  const S = size;
  const sd = hashStr(`rock${seed}`);

  const height = heightField(S, (u, v) => {
    // Faulting displaces the beds sideways before they are drawn, which is what
    // stops horizontal banding from reading as wallpaper.
    const fault = fbm(u * 2.4, v * 0.7, { octaves: 3, period: 3, seed: sd ^ 0x1f }) * 0.12;
    const bed = (v + fault) * 22;
    const layer = Math.abs((bed % 1) - 0.5) * 2;
    let h = 0.5 + layer * 0.16;
    h += (fbm(u * 12, v * 30, { octaves: 5, period: 12, seed: sd }) - 0.5) * 0.4;
    // Spall: chunks that have fallen out of the face.
    const sp = worley(u * 7, v * 7, 7, sd ^ 0x62);
    if (sp.f1 < 0.12) h -= (0.12 - sp.f1) * 1.6;
    return h;
  });

  const hf = readHeight(height);
  const warmRgb = hexToRgb(warm);
  const coolRgb = hexToRgb(cool);
  const alb = canvas2d(S, S);
  const ctx = alb.getContext('2d');
  const img = ctx.createImageData(S, S);

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const fault = fbm(u * 2.4, v * 0.7, { octaves: 3, period: 3, seed: sd ^ 0x1f }) * 0.12;
    // Each bed gets its own colour, drawn from its own index rather than from
    // the height, so two adjacent beds can differ sharply at their contact.
    const bedIdx = Math.floor((v + fault) * 22);
    const bedTint = latticeHash(0, bedIdx, 22, sd ^ 0x77);
    let c = rgbLerp(coolRgb, warmRgb, bedTint * 0.85 + hf.data[i] * 0.2);
    const dust = Math.max(0, 0.45 - hf.data[i]) * 1.4;
    c = rgbLerp(c, [c[0] * 0.66, c[1] * 0.64, c[2] * 0.6], Math.min(0.7, dust));
    img.data[i * 4] = Math.min(255, c[0]);
    img.data[i * 4 + 1] = Math.min(255, c[1]);
    img.data[i * 4 + 2] = Math.min(255, c[2]);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: heightToRoughness(height, { lo: 0.78, hi: 1.0 }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.3 }),
    normalStrength: 2.8
  };
}

/* ==========================================================================
   5. GREEBLES
   The small parts. A hull is believable because of what is bolted to it, not
   because of its shape, and these are the things that get bolted to it.

   Every builder returns a Group whose origin is where it attaches, so a caller
   positions the attachment point and never has to reason about the part's bulk.
   Geometry is SHARED through `geoCache` — a hundred bolts are a hundred meshes
   over one geometry, which is what keeps the draw cost in the material rather
   than in the memory.
   ========================================================================== */

const geoCache = new Map();
function geo(key, factory) {
  if (!geoCache.has(key)) geoCache.set(key, factory());
  return geoCache.get(key);
}

/** Free every shared greeble geometry. Paired with `disposeSurfaceCache`. */
export function disposeGreebleCache() {
  for (const g of geoCache.values()) g.dispose();
  geoCache.clear();
}

/**
 * A ring of hex bolt heads around a circular flange, baked into ONE geometry.
 *
 * Merged rather than instanced, deliberately. At twenty-four bolts instancing
 * saves nothing measurable, and an `InstancedMesh` cannot be folded into the
 * whole-prop merge below — so a prop carrying five bolt rings would cost five
 * draw calls forever. Merged, the bolts disappear into the prop's own mesh and
 * cost nothing at all.
 */
export function boltRing(radius, count, material, { size = 0.035, axis = 'y' } = {}) {
  const base = geo(`bolt${size}`, () => new THREE.CylinderGeometry(size, size * 1.06, size * 0.75, 6));
  const parts = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    if (axis === 'y') {
      pos.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      q.identity();
    } else {
      pos.set(0, Math.sin(a) * radius, Math.cos(a) * radius);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    }
    m.compose(pos, q, scl);
    parts.push(base.clone().applyMatrix4(m));
  }
  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  const mesh = new THREE.Mesh(merged, material);
  mesh.userData.ownGeometry = merged;
  return mesh;
}

/**
 * A straight run of bolts along a line — the seam fastening on a flat plate.
 * `from` and `to` are local, and the heads sit on the +`normalAxis` face.
 */
export function boltLine(from, to, count, material, { size = 0.028, normalAxis = 'z' } = {}) {
  const base = geo(`bolt${size}`, () => new THREE.CylinderGeometry(size, size * 1.06, size * 0.75, 6));
  const parts = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scl = new THREE.Vector3(1, 1, 1);
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const p = new THREE.Vector3();
  if (normalAxis === 'z') q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  else if (normalAxis === 'x') q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  for (let i = 0; i < count; i++) {
    p.lerpVectors(a, b, count === 1 ? 0.5 : i / (count - 1));
    m.compose(p, q, scl);
    parts.push(base.clone().applyMatrix4(m));
  }
  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  for (const pt of parts) pt.dispose();
  const mesh = new THREE.Mesh(merged, material);
  mesh.userData.ownGeometry = merged;
  return mesh;
}

/**
 * A weld bead: a lumpy tube along a seam. Real welds are not smooth, and a
 * perfectly cylindrical one is worse than none at all.
 */
export function weldBead(length, material, { radius = 0.018, seed = 1 } = {}) {
  const segs = Math.max(8, Math.round(length * 24));
  const g = new THREE.CylinderGeometry(radius, radius, length, 7, segs);
  const pos = g.attributes.position;
  const rand = makeRng(seed);
  const ripple = [];
  for (let i = 0; i <= segs; i++) ripple.push(0.72 + rand() * 0.55);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y / length + 0.5) * segs;
    const k = ripple[Math.min(segs, Math.round(t))];
    v.x *= k; v.z *= k;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material);
  mesh.userData.ownGeometry = g;
  return mesh;
}

/**
 * A hanging cable, drawn on a real catenary rather than a straight line. Slack
 * cable is one of the strongest cues that a place was built by hand and then
 * left alone, which is the whole brief.
 */
export function cableRun(from, to, material, { sag = 0.35, radius = 0.018, segments = 18 } = {}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    // cosh-shaped droop, normalised so the ends stay pinned.
    const k = 2.2;
    const drop = (Math.cosh((t - 0.5) * k) - Math.cosh(k * 0.5)) / (1 - Math.cosh(k * 0.5));
    p.y -= (1 - drop) * sag;
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, segments, radius, 6, false);
  const mesh = new THREE.Mesh(g, material);
  mesh.userData.ownGeometry = g;
  return mesh;
}

/**
 * A pipe elbow run: straight legs joined by real torus bends. Mitring a pipe
 * with two cylinders leaves a visible notch at every corner.
 */
export function pipeRun(points, material, { radius = 0.09, bend = 0.3 } = {}) {
  const g = new THREE.Group();
  const pts = points.map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', bend);
  const tube = new THREE.TubeGeometry(curve, Math.max(12, pts.length * 10), radius, 10, false);
  const mesh = new THREE.Mesh(tube, material);
  mesh.userData.ownGeometry = tube;
  g.add(mesh);
  return g;
}

/** A bolted pipe flange: two collars and a ring of bolts between them. */
export function pipeFlange(radius, material, boltMat = material) {
  const g = new THREE.Group();
  const collar = new THREE.Mesh(
    geo(`flange${radius.toFixed(3)}`, () => new THREE.CylinderGeometry(radius * 1.5, radius * 1.5, radius * 0.34, 16)),
    material
  );
  g.add(collar);
  g.add(boltRing(radius * 1.2, 8, boltMat, { size: radius * 0.16 }));
  return g;
}

/**
 * A stencilled placard — the painted rectangle with a code on it that every
 * industrial object carries. Drawn as a canvas decal so the paint can be worn.
 *
 * NOTE: placard text is set by the caller and is never player-facing copy in the
 * CLAUDE.md sense — it is a serial or a designator, part of the surface.
 */
export function placard(text, { w = 0.42, h = 0.16, fg = '#1d1a16', bg = '#b9ab8c' } = {}) {
  const W = 256, H = Math.round(256 * (h / w));
  const c = canvas2d(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.round(H * 0.56)}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), W / 2, H / 2 + H * 0.04);
  // Chip the paint: scratches taken back out of the placard.
  const rand = makeRng(hashStr(text));
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.12 + rand() * 0.4;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 9, 1 + rand() * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.92, metalness: 0.0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.ownGeometry = mesh.geometry;
  mesh.userData.ownMaterial = mat;
  mesh.userData.ownTexture = tex;
  return mesh;
}

/** Diagonal hazard striping on a plane — the yellow-black edge of a drop. */
export function hazardStripe(w, h, { pitch = 0.12, warm = '#b08a2c', dark = '#2a2520' } = {}) {
  const W = 256, H = Math.max(16, Math.round(256 * (h / w)));
  const c = canvas2d(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = dark;
  const step = Math.max(6, Math.round(W * pitch));
  ctx.save();
  for (let x = -H; x < W + H; x += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + step, 0);
    ctx.lineTo(x + step + H, H); ctx.lineTo(x + H, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // Wear: the stripe is the most walked-on paint on any structure.
  const rand = makeRng(0x5aa1);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 160; i++) {
    ctx.globalAlpha = 0.1 + rand() * 0.5;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 12, 1 + rand() * 3);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.9, metalness: 0.05,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.ownGeometry = mesh.geometry;
  mesh.userData.ownMaterial = mat;
  mesh.userData.ownTexture = tex;
  return mesh;
}

/** An analogue dial: bezel, face, needle. The needle is returned so it can move. */
export function dialGauge(radius, faceMat, frameMat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    geo(`dialbody${radius.toFixed(3)}`, () => new THREE.CylinderGeometry(radius, radius * 1.04, radius * 0.5, 20)),
    frameMat
  );
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const face = new THREE.Mesh(
    geo(`dialface${radius.toFixed(3)}`, () => new THREE.CircleGeometry(radius * 0.86, 20)),
    faceMat
  );
  face.position.z = radius * 0.26;
  g.add(face);
  const needle = new THREE.Mesh(
    geo(`needle${radius.toFixed(3)}`, () => new THREE.BoxGeometry(radius * 0.06, radius * 0.7, radius * 0.03)),
    frameMat
  );
  needle.position.set(0, radius * 0.3, radius * 0.29);
  g.add(needle);
  g.add(boltRing(radius * 1.0, 4, frameMat, { size: radius * 0.1 }));
  g.userData.needle = needle;
  return g;
}

/**
 * A caged sodium luminaire — the only lit thing allowed in these worlds besides
 * indicators. Housing, warm diffuser, guard bars and one point light.
 */
export function luminaire(material, { intensity = 5.2, distance = 13, color = 0xffd9a0 } = {}) {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(
    geo('lumHousing', () => new THREE.BoxGeometry(0.62, 0.16, 0.34)), material
  );
  g.add(housing);
  const diffuser = new THREE.Mesh(
    geo('lumDiffuser', () => new THREE.BoxGeometry(0.5, 0.04, 0.24)),
    new THREE.MeshStandardMaterial({
      color: 0xffe0ae, emissive: color, emissiveIntensity: 1.5, roughness: 0.6
    })
  );
  diffuser.position.y = -0.09;
  diffuser.userData.ownMaterial = diffuser.material;
  g.add(diffuser);
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(
      geo('lumBar', () => new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6)), material
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(-0.2 + i * 0.1, -0.12, 0);
    g.add(bar);
  }
  const light = new THREE.PointLight(color, intensity, distance, 1.6);
  light.position.y = -0.2;
  g.add(light);
  g.userData.light = light;
  g.userData.diffuser = diffuser;
  return g;
}

/** Recursively dispose the geometries/materials a greeble said it owns. */
export function disposeGreeble(obj) {
  obj.traverse(o => {
    if (o.userData?.ownGeometry) o.userData.ownGeometry.dispose();
    if (o.userData?.ownMaterial) o.userData.ownMaterial.dispose();
    if (o.userData?.ownTexture) o.userData.ownTexture.dispose();
  });
}

/* ==========================================================================
   6. SHADER PATCHES
   ========================================================================== */

/**
 * Blend a second, much higher-frequency normal map into a material.
 *
 * THE PROBLEM. A 240 m salt pan drawn with one tiling texture repeats roughly
 * every eight metres. From standing height that reads as a printed pattern, and
 * no amount of extra octaves inside the tile fixes it — the eye is seeing the
 * REPEAT, not the noise. Two fixes are usually combined: break the repeat with
 * a macro variation, and add a detail layer whose own repeat is far too fine to
 * be resolved as a pattern at all.
 *
 * This is the second. The detail normal is sampled at `scale` times the base
 * rate and added to the surface normal, so a player looking at their feet sees
 * grit, and a player looking at the horizon sees none of it — which is exactly
 * how a real surface behaves under a lens.
 *
 * Implemented as a shader patch rather than a second mesh because it costs one
 * texture fetch and no draw calls.
 */
export function addDetailNormal(material, detailTexture, { scale = 9, strength = 0.55 } = {}) {
  material.onBeforeCompile = shader => {
    shader.uniforms.detailMap = { value: detailTexture };
    shader.uniforms.detailScale = { value: scale };
    shader.uniforms.detailStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform sampler2D detailMap;
         uniform float detailScale;
         uniform float detailStrength;
         void main() {`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           // Whiteout blend: add the tangent-space xy and keep z, which
           // preserves the base surface's shape instead of averaging it away.
           vec3 detail = texture2D(detailMap, vMapUv * detailScale).xyz * 2.0 - 1.0;
           normal = normalize(vec3(
             normal.xy + detail.xy * detailStrength,
             normal.z
           ));
         }`
      );
  };
  // Two materials that differ only in a patch would otherwise share one compiled
  // program and one of them would silently get the other's uniforms.
  material.customProgramCacheKey = () => `detailNormal:${scale}:${strength}`;
  return material;
}

/**
 * Break a large tiled surface with a macro variation sampled across the whole
 * mesh: a slow drift in tint and roughness that has no repeat at all, because
 * it is sampled in raw UV rather than in the tiled UV.
 *
 * Used with `addDetailNormal` this is the pair that makes a 240 m pan stop
 * reading as wallpaper: detail below the repeat, variation above it.
 */
export function addMacroVariation(material, macroTexture, { strength = 0.35, roughShift = 0.18 } = {}) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    if (prev) prev(shader);
    shader.uniforms.macroMap = { value: macroTexture };
    shader.uniforms.macroStrength = { value: strength };
    shader.uniforms.macroRough = { value: roughShift };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform sampler2D macroMap;
         uniform float macroStrength;
         uniform float macroRough;
         varying vec2 vMacroUv;
         void main() {`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float macro = texture2D(macroMap, vMacroUv).r;
         diffuseColor.rgb *= mix(1.0 - macroStrength, 1.0 + macroStrength, macro);`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(roughnessFactor + (macro - 0.5) * macroRough, 0.04, 1.0);`
      );
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying vec2 vMacroUv;\nvoid main() {')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMacroUv = uv;');
  };
  const key = material.customProgramCacheKey;
  material.customProgramCacheKey = () =>
    `${key ? key() : ''}|macro:${strength}:${roughShift}`;
  return material;
}


/* ==========================================================================
   7. DRAW-CALL BUDGET
   ========================================================================== */

/**
 * Bake a prop into one mesh per material.
 *
 * WHY THIS IS NOT OPTIONAL. Detail costs draw calls, and draw calls are the
 * budget this product actually spends: a pylon with a bolted base, a guyed
 * mast, an insulator stack and a service hatch is forty meshes, and there are
 * twenty pylons. Four hundred extra draw calls is the difference between 60 fps
 * and a slideshow, and it would make "make it more detailed" and "hold the
 * frame rate" genuinely opposed.
 *
 * They are not opposed, because a prop that never moves internally does not
 * need forty meshes — it needs forty geometries baked into one buffer per
 * material. That is what this does, once, at build time.
 *
 * Anything that has to stay addressable — a lamp whose colour changes, a needle
 * that sweeps, a panel that hides — marks itself `userData.noMerge = true` and
 * is left exactly where it is.
 *
 * @param {THREE.Object3D} group the prop, already assembled in local space
 * @returns {THREE.Group} the same group, with its static meshes replaced
 */
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();   // material -> geometries in the group's frame
  const doomed = [];
  const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();

  /** `noMerge` protects a whole subtree, not just the node it is set on. */
  const isProtected = o => {
    let n = o;
    while (n && n !== group.parent) {
      if (n.userData?.noMerge) return true;
      n = n.parent;
    }
    return false;
  };

  group.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (isProtected(o)) return;
    if (Array.isArray(o.material)) return;          // multi-material: leave it
    if (o.material?.transparent) return;            // decals draw in their own pass
    if (!o.geometry?.attributes?.position) return;

    const key = o.material;
    if (!buckets.has(key)) buckets.set(key, { geos: [], cast: false, receive: false });
    const bucket = buckets.get(key);

    const g = o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
    // Merging needs every input to carry the same attributes; a geometry
    // missing uv or normal would silently poison the whole batch.
    if (!g.attributes.uv) {
      const n = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
    bucket.geos.push(g);
    bucket.cast = bucket.cast || o.castShadow;
    bucket.receive = bucket.receive || o.receiveShadow;
    doomed.push(o);
  });

  /*
   * Keep a record of where the parts WERE, in the group's own frame.
   *
   * Baking a prop into one mesh also bakes its bounding box into one box, and
   * a 26 m pipe bridge reduced to a single 26 m box would report a collision
   * with everything that stands anywhere near it. The physics check reads this
   * list instead, so merging buys draw calls without costing precision.
   */
  const partBoxes = group.userData.partBoxes || [];
  for (const o of doomed) {
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (!b.isEmpty() && isFinite(b.min.x)) {
      b.applyMatrix4(inverse);
      partBoxes.push(b);
    }
    o.parent?.remove(o);
  }
  group.userData.partBoxes = partBoxes;

  for (const [material, bucket] of buckets) {
    if (!bucket.geos.length) continue;
    const merged = BufferGeometryUtils.mergeGeometries(bucket.geos, false);
    for (const g of bucket.geos) g.dispose();
    if (!merged) continue;
    if (merged.attributes.uv) merged.setAttribute('uv1', merged.attributes.uv);
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    mesh.userData.ownGeometry = merged;
    group.add(mesh);
  }
  return group;
}

/* ==========================================================================
   8. MAPS FROM AN EXISTING ALBEDO
   ========================================================================== */

/**
 * Derive a normal, roughness and occlusion set from a painted albedo image.
 *
 * THE SHIP'S PLATE IS ART, NOT NOISE. `/art/durasteel_plate.jpg` is a real
 * tiling durasteel sheet — panels, bolt rings, scratches, rust streaks, stencil
 * text — and it is the authority for what the Avalon looks like. Replacing it
 * with a procedural plate would be throwing away the reference to make the
 * pipeline tidier.
 *
 * But an albedo on its own is a photograph of metal glued to a flat plane. It
 * had a procedurally generated normal map bolted beside it that was drawn from
 * a completely different source, so the bumps did not line up with the bolts and
 * the light never agreed with the picture. That disagreement is the thing the
 * eye notices.
 *
 * So the maps are taken FROM the image. Height is a HIGH-PASS of luminance —
 * local brightness minus its own blur — which is the crucial detail: a bolt head
 * is bright against the plate immediately around it and becomes a bump, while a
 * whole panel being darker than its neighbour is not a metre-deep pit. A plain
 * luminance-to-height conversion gets that backwards and embosses the artwork.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image the loaded albedo
 * @param {{size?: number, strength?: number, rough?: [number, number]}} opts
 */
export function mapsFromAlbedo(image, { size = 512, strength = 2.4, rough = [0.42, 0.92] } = {}) {
  const src = canvas2d(size, size);
  const sctx = src.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(image, 0, 0, size, size);
  const px = sctx.getImageData(0, 0, size, size).data;

  // Perceptual luminance, not a channel average: a rust streak and a scratch
  // differ mostly in hue, and averaging loses the scratch.
  const lum = new Float32Array(size * size);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = (px[i * 4] * 0.2126 + px[i * 4 + 1] * 0.7152 + px[i * 4 + 2] * 0.0722) / 255;
  }
  const lumCanvas = writeField({ data: lum, w: size, h: size });
  const lowPass = readHeight(blur(lumCanvas, Math.max(2, size >> 6))).data;

  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i++) {
    // Centre on 0.5 so flat plate is flat and the high pass swings both ways.
    height[i] = Math.max(0, Math.min(1, 0.5 + (lum[i] - lowPass[i]) * 2.6));
  }
  const heightCanvas = writeField({ data: height, w: size, h: size });

  // Roughness follows the ORIGINAL luminance, not the high pass: worn metal is
  // bright because it is polished, and grime is dark because it is matte.
  const roughness = new Float32Array(size * size);
  for (let i = 0; i < roughness.length; i++) {
    roughness[i] = rough[1] - (rough[1] - rough[0]) * Math.pow(lum[i], 0.8);
  }

  return {
    height: heightCanvas,
    normal: heightToNormal(heightCanvas, strength),
    roughness: writeField({ data: roughness, w: size, h: size }),
    ao: heightToAO(heightCanvas, { radius: Math.max(3, size >> 7), strength: 0.8 })
  };
}

/**
 * Load an albedo, derive its maps, and wire the lot onto a live material.
 *
 * Asynchronous by nature — the ship is standing before the texture arrives —
 * so the material is usable immediately and simply gets better a moment later.
 * A failure leaves whatever the material already had, which is why the caller
 * always builds a procedural surface first.
 */
export function dressMaterialFromAlbedo(material, url, {
  repeat = 2, size = 512, strength = 2.4, normalScale = 1.0, onReady = null
} = {}) {
  new THREE.TextureLoader().load(url, tex => {
    const img = tex.image;
    if (!img) return;
    try {
      const maps = mapsFromAlbedo(img, { size, strength });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;

      material.map = tex;
      material.normalMap = asDataTexture(maps.normal, repeat);
      material.roughnessMap = asDataTexture(maps.roughness, repeat);
      material.aoMap = asDataTexture(maps.ao, repeat);
      material.normalScale.set(normalScale, normalScale);
      material.needsUpdate = true;
      material.userData.surfaceMaps = [
        tex, material.normalMap, material.roughnessMap, material.aoMap
      ];
      onReady?.(material);
    } catch (err) {
      // A tainted or undecodable image must not take the ship's walls with it.
      console.warn(`Could not derive maps from ${url}:`, err);
    }
  });
}
