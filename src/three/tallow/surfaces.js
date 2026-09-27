/**
 * surfaces.js — what Tallow is made of: the crust, the piled salt, the rock of
 * the islands, and the salt that has crept up everything standing on the flat.
 *
 * THE CRUST IS POLYGONS, NOT CRACKS. A salt pan that floods and dries does not
 * crack open like mud; it grows. Brine wicks up along the joints between
 * polygons and evaporates there, so the borders stand PROUD as ridges of white
 * crystal a few centimetres high, and the plates between them are lower,
 * greyer, finer-grained and a little damp. `saltCrust` draws exactly that, and
 * every map (colour, height, roughness, occlusion) comes off one height field.
 *
 * NOTHING STANDS ON A SALT PAN FOR FORTY YEARS AND STAYS CLEAN. `applySaltWeather`
 * patches a prop's material so salt crusts its foot (reading the real ground
 * height under every pixel from a small height texture), settles on whatever
 * faces up, and leaves horizontal tide lines where brine stood and dried. It is
 * the single change that most makes the plant look like it belongs to the
 * ground it is standing on rather than having been set down on it.
 */

import * as THREE from 'three';
import {
  heightField, readHeight, writeField, heightToAO, canvas2d, worley, fbm, hashStr
} from '../materials/pbr-kit.js';
import { STRATA_Y0, STRATA_SPAN } from '../erebus/rocks.js';
import { rng } from '../erebus/noise.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];

/**
 * The salt-polygon crust. One tile carries `cells` polygons across; the
 * terrain shader samples it at two scales so the repeat is never the thing the
 * eye finds.
 */
export function saltCrust({ size = 512, seed = 3, cells = 5 } = {}) {
  const S = size;
  const sd = hashStr(`crust${seed}`);
  const border = new Float32Array(S * S);

  const height = heightField(S, (u, v, x, y) => {
    const big = worley(u * cells, v * cells, cells, sd);
    const sub = worley(u * cells * 3, v * cells * 3, cells * 3, sd ^ 0x71);
    // Jitter the ridge line so it is hand-grown, not ruled.
    const wob = (fbm(u * 40, v * 40, { octaves: 3, period: 40, seed: sd ^ 0x13 }) - 0.5) * 0.05;
    const b = big.border + wob;
    border[y * S + x] = b;
    // The ridge: a crystal wall standing proud of the plates on either side.
    const ridge = Math.exp(-Math.pow(b / 0.045, 2)) * 0.34 + Math.exp(-Math.pow(b / 0.11, 2)) * 0.12;
    // The plate: dishes very slightly toward its middle, as it sags drying.
    let h = 0.42 - Math.min(big.f1, 0.6) * 0.06 + ridge;
    // Faint second-generation ridges inside the big plates.
    h += Math.exp(-Math.pow(sub.border / 0.03, 2)) * 0.05;
    // Crystal grain.
    h += (fbm(u * 150, v * 150, { octaves: 2, period: 150, seed: sd ^ 0x5a }) - 0.5) * 0.07;
    h += (fbm(u * 38, v * 38, { octaves: 3, period: 38, seed: sd ^ 0x77 }) - 0.5) * 0.05;
    return h;
  });

  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);

  const plate = hex(0xbdb4a2);     // the grey, finer plate between ridges
  const plateDamp = hex(0xa39a88);
  const ridgeC = hex(0xf1ece2);    // the crystal walls: the whitest thing here
  const grit = hex(0xb0a38a);      // blown grit caught along the ridge's foot

  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const b = border[i];
    const h = hf.data[i];
    const ridge = Math.exp(-Math.pow(b / 0.06, 2));
    const foot = Math.exp(-Math.pow((b - 0.08) / 0.03, 2));
    const damp = clamp01((fbm(u * 6, v * 6, { octaves: 4, period: 6, seed: sd ^ 0x21 }) - 0.45) * 2.2);
    let c = mix3(plate, plateDamp, damp * 0.7);
    c = mix3(c, grit, foot * 0.35);
    c = mix3(c, ridgeC, clamp01(ridge * 1.15));
    const k = 0.93 + (h - 0.45) * 0.35;
    img.data[i * 4] = Math.min(255, c[0] * k);
    img.data[i * 4 + 1] = Math.min(255, c[1] * k);
    img.data[i * 4 + 2] = Math.min(255, c[2] * k);
    img.data[i * 4 + 3] = 255;
    // Crystal is chalk-rough; a damp plate has a faint sheen.
    rough[i] = clamp01(0.9 - damp * 0.28 + ridge * 0.1);
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb,
    height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.1 }),
    normalStrength: 2.4
  };
}

/** Piled, granular salt: stockpiles and the drifts against things. */
export function saltGrain({ size = 256, seed = 5 } = {}) {
  const S = size;
  const sd = hashStr(`grain${seed}`);
  const height = heightField(S, (u, v) => {
    const clod = worley(u * 14, v * 14, 14, sd);
    let h = 0.5 + (0.25 - Math.min(clod.f1, 0.5)) * 0.35;
    h += (fbm(u * 90, v * 90, { octaves: 2, period: 90, seed: sd ^ 0x3 }) - 0.5) * 0.3;
    h += (fbm(u * 8, v * 8, { octaves: 3, period: 8, seed: sd ^ 0x9 }) - 0.5) * 0.2;
    return h;
  });
  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d');
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const a = hex(0xe6e0d4), b = hex(0xc9bfac);
  for (let i = 0; i < S * S; i++) {
    const h = hf.data[i];
    const c = mix3(b, a, clamp01((h - 0.3) * 1.6));
    img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    rough[i] = 0.92;
  }
  actx.putImageData(img, 0, 0);
  return {
    albedo: alb, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: 3, strength: 0.9 }),
    normalStrength: 1.8
  };
}

/**
 * Tallow's beds, on the same altitude axis as `rocks.js` so its rock shader can
 * read them: pale limestone and grey tuff, a rust marker, a dark basalt sill.
 */
export function createTallowStrataTexture() {
  const N = 1024;
  const data = new Uint8Array(N * 4);
  const r = rng(0x5a17);
  const PAL = [
    [0.66, 0.62, 0.56], [0.72, 0.68, 0.61], [0.61, 0.57, 0.52], [0.69, 0.63, 0.54],
    [0.78, 0.74, 0.67],             // pale limestone marker
    [0.60, 0.44, 0.34],             // rust marker
    [0.36, 0.34, 0.33]              // basalt sill
  ];
  let y = 0;
  const beds = [];
  while (y < N) {
    const thick = Math.round(4 + Math.pow(r(), 1.3) * 28);
    const roll = r();
    const idx = roll < 0.8 ? Math.floor(r() * 4) : roll < 0.9 ? 4 : roll < 0.96 ? 5 : 6;
    const j = 0.94 + r() * 0.1;
    beds.push({ y0: y, y1: y + thick, c: PAL[idx].map(v => v * j) });
    y += thick;
  }
  for (let i = 0; i < N; i++) {
    const b = beds.find(bb => i < bb.y1);
    const t = (i - b.y0) / (b.y1 - b.y0);
    const k = 0.9 + 0.12 * t;
    data[i * 4] = Math.min(255, b.c[0] * k * 255);
    data[i * 4 + 1] = Math.min(255, b.c[1] * k * 255);
    data[i * 4 + 2] = Math.min(255, b.c[2] * k * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 1, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  tex.userData.strataY0 = STRATA_Y0;
  tex.userData.strataSpan = STRATA_SPAN;
  return tex;
}

/** The extent of the ground-height texture the salt shader reads. */
export const GROUND_HALF = 130;

/**
 * The walking surface under every point of the plant, baked to a small texture
 * so a fragment shader can ask how far above the ground it is. Eight bits over
 * eight metres is three centimetres, finer than the salt line it draws.
 */
export function createGroundHeightTexture(heightAt, { n = 256, half = GROUND_HALF } = {}) {
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + (i + 0.5) / n * half * 2;
      const z = -half + (j + 0.5) / n * half * 2;
      const h = heightAt(x, z);
      const e = Math.round(clamp01((h + 6) / 8) * 255);
      const k = (j * n + i) * 4;
      data[k] = e; data[k + 1] = e; data[k + 2] = e; data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const SALT_NOISE = /* glsl */ `
  float sH(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.231); }
  float sN(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(sH(i), sH(i + vec2(1.0, 0.0)), f.x), mix(sH(i + vec2(0.0, 1.0)), sH(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float sF(vec2 p) { return 0.55 * sN(p) + 0.3 * sN(p * 2.3 + 7.1) + 0.15 * sN(p * 5.1 - 3.7); }
`;

/**
 * Crust a prop's material with salt.
 *
 * @param {THREE.Material} mat a MeshStandardMaterial (anything else is left alone)
 * @param {{ ground: THREE.Texture, creep?: number, top?: number, tide?: number }} o
 *   creep — how high the crust climbs (metres at full noise); top — salt on
 *   up-facing surfaces; tide — the dried brine lines above the crust.
 */
export function applySaltWeather(mat, { ground, creep = 0.55, top = 0.45, tide = 0.3 } = {}) {
  if (!mat || !mat.isMeshStandardMaterial || mat.userData.tallowSalt) return;
  if (mat.transparent || mat.userData.noSalt) return;
  mat.userData.tallowSalt = true;
  const uniforms = {
    uSGround: { value: ground },
    uSHalf: { value: GROUND_HALF },
    uSCreep: { value: creep },
    uSTop: { value: top },
    uSTide: { value: tide }
  };
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vSW;
        varying vec3 vSN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 sp = vec4(transformed, 1.0);
          vec3 sn = objectNormal;
          #ifdef USE_INSTANCING
            sp = instanceMatrix * sp;
            sn = mat3(instanceMatrix) * sn;
          #endif
          vSW = (modelMatrix * sp).xyz;
          vSN = normalize(mat3(modelMatrix) * sn);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uSGround;
        uniform float uSHalf;
        uniform float uSCreep;
        uniform float uSTop;
        uniform float uSTide;
        varying vec3 vSW;
        varying vec3 vSN;
        float sSalt = 0.0;
        ${SALT_NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 gUv = (vSW.xz + uSHalf) / (2.0 * uSHalf);
          float g = texture2D(uSGround, gUv).r * 8.0 - 6.0;
          float above = vSW.y - g;
          vec3 N = normalize(vSN);
          float n1 = sF(vSW.xz * 2.7 + vSW.y * 1.9);
          float n2 = sF(vec2(vSW.x + vSW.z, vSW.y * 0.4) * 0.8);
          // The crust climbs higher on the windward side and in sheltered corners.
          float line = uSCreep * (0.35 + 0.9 * n2);
          float creep = 1.0 - smoothstep(line * 0.45, line, above + (n1 - 0.5) * 0.14);
          creep *= smoothstep(-2.5, -0.2, above + 2.0);
          // Salt settles on whatever faces up, patchily.
          float up = smoothstep(0.62, 0.95, N.y) * uSTop * smoothstep(0.35, 0.75, n1 + (n2 - 0.5) * 0.4);
          // Dried brine lines: thin horizontal bands just above the crust.
          float tidePh = above * 19.0 + n2 * 2.5;
          float tideL = smoothstep(0.86, 0.98, sin(tidePh)) * (1.0 - smoothstep(line, line + 1.1, above));
          tideL *= uSTide * smoothstep(0.0, 0.15, above) * (1.0 - abs(N.y));
          sSalt = clamp(max(creep, up) + tideL, 0.0, 1.0);
          vec3 saltC = vec3(0.68, 0.65, 0.59) * (0.9 + 0.16 * n1);   // linear
          // A dirty grey band at the very foot, where the crust holds grit.
          saltC = mix(saltC * vec3(0.8, 0.77, 0.72), saltC, smoothstep(0.0, 0.12, above));
          diffuseColor.rgb = mix(diffuseColor.rgb, saltC, sSalt);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.96, sSalt);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, sSalt);`);
  };
  const key = `${prevKey}|tallow-salt:${creep}:${top}:${tide}`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}
