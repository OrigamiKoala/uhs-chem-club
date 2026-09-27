/**
 * terrain.js — the ground of Tallow, from the player's boots to the horizon.
 *
 * ONE HEIGHT FUNCTION, ONE MESH. The pan is analytic, so the walk, the benches,
 * the landing solver and the Node checks all stand on exactly the ground that
 * is drawn. The mesh is one rectilinear grid: 1.25 m across the walked square,
 * each step a little longer than the last out to an 880 m disc whose rim tips
 * down under the haze, so the ground has no edge anywhere a player can see.
 * The excavation's outline is written INTO the grid as extra grid lines, so the
 * hole the pit sits in is cut along the pit's own walls rather than along
 * whatever triangles happened to straddle them.
 *
 * WHAT A SALT PAN ACTUALLY LOOKS LIKE, and what the ground shader draws:
 *  - Dead flat. The relief across the whole walk is a few decimetres.
 *  - Polygons of crystal ridges (surfaces.js), sampled at two scales so the
 *    tile never repeats where the eye can find it.
 *  - Damp patches where brine sits just under the crust: darker, finer, with a
 *    faint sheen toward the sun.
 *  - Mirror flats further out: a centimetre of standing brine that reflects the
 *    sky and the ranges exactly. They are dead level by construction.
 *  - Vehicle ruts that have broken the white skin and show the rust-red mud
 *    beneath, and the trodden paths between the benches. Both are drawn per
 *    pixel from the polylines in `tallow.json`, so they are as sharp at the
 *    player's feet as they are faithful at a hundred metres.
 *  - A mirage on the far pan: past a few hundred metres, at grazing angles,
 *    the ground gives back the sky above the horizon, trembling.
 */

import * as THREE from 'three';
import { noise2, fbm2, ridged2, smoothstep, clamp } from '../erebus/noise.js';
import {
  tallowSkyUniforms, tallowHazeUniforms, TALLOW_FOG_PARS, TALLOW_FOG_APPLY, patchFogVertex
} from './atmosphere.js';

export const HORIZON_R = 880;
/** The brine that stands on the mirror flats sits at exactly this height. */
export const WATER_Y = -0.12;

/**
 * The height field. `height(x, z)` is the surface of the pan (the pit is the
 * world's business, not the field's); `sample` also reports the paint masks.
 */
export function makeTallowField() {
  const tmp = { height: 0, rock: 0, wet: 0, damp: 0, tone: 0 };

  function sample(x, z, s = tmp) {
    const r = Math.hypot(x, z);

    // The flat: a long, faint swell and the lightest grain. A salt pan is as
    // level as water because, every wet season, it WAS water.
    let h = Math.sin(x * 0.0135) * Math.cos(z * 0.0119) * 0.16
      + Math.sin(x * 0.031 + 1.7) * 0.06
      + Math.cos(z * 0.027 - 0.6) * 0.05
      + fbm2(x * 0.045, z * 0.045, 3) * 0.12;

    // Far out the pan rises into an eroded shore: a bajada in some bearings,
    // open salt running to the sky in others.
    const az = Math.atan2(z, x);
    const sector = smoothstep(-0.02, 0.18, noise2(Math.cos(az) * 1.6 + 4.1, Math.sin(az) * 1.6 - 2.3));
    const shore = smoothstep(380, 720, r) * sector;
    if (shore > 0) {
      const ridge = ridged2(x / 150 + 3.3, z / 150 - 1.9, 5);
      h += shore * (6 + 42 * Math.pow(ridge, 1.8) + 10 * fbm2(x / 60, z / 60, 3));
    }

    // Mirror flats: standing brine, only beyond the plant. Dead level.
    const wetN = fbm2(x / 95 + 3.1, z / 95 - 7.3, 4);
    let wet = smoothstep(0.08, 0.16, wetN) * smoothstep(135, 185, r) * (1 - smoothstep(0.05, 0.3, shore));
    wet = clamp(wet, 0, 1);
    h = h + (Math.min(h, WATER_Y) - h) * wet;

    // Damp crust inside the walk: brine just below the skin.
    const damp = smoothstep(0.1, 0.22, fbm2(x / 22 - 5.5, z / 22 + 2.2, 3)) * (1 - wet);

    // Rim of the world, tipped down under the haze.
    h -= 40 * smoothstep(HORIZON_R * 0.86, HORIZON_R, r);

    s.height = h;
    s.rock = shore > 0 ? smoothstep(0.1, 0.5, shore) : 0;
    s.wet = wet;
    s.damp = damp;
    s.tone = 0.5 + fbm2(x / 40 + 9.1, z / 40, 3);
    return s;
  }

  return {
    sample,
    height: (x, z) => sample(x, z, tmp).height
  };
}

/** A grid axis: uniform across the walk, growing to the horizon, with `extra` lines forced in. */
function axis(inner, step, growth, outer, extra = []) {
  const pos = [];
  for (let v = -inner; v <= inner + 1e-6; v += step) pos.push(+v.toFixed(4));
  for (const e of extra) if (Math.abs(e) < inner) pos.push(e);
  pos.sort((a, b) => a - b);
  const core = pos.filter((v, i) => i === 0 || v - pos[i - 1] > 0.05);
  let d = step, v = inner;
  const tail = [];
  while (v < outer) {
    d *= growth;
    v += d;
    tail.push(Math.min(v, outer * 1.45));
  }
  return [...tail.map(x => -x).reverse(), ...core, ...tail];
}

/**
 * The ground mesh, with the excavation cut out along its own outline.
 * `holes` is a list of { minX, maxX, minZ, maxZ } rectangles.
 */
export function buildTallowTerrainGeometry(field, { step = 1.25, growth = 1.07, holes = [], tile = 6 } = {}) {
  const ex = [], ez = [];
  for (const h of holes) { ex.push(h.minX, h.maxX); ez.push(h.minZ, h.maxZ); }
  const ax = axis(112, step, growth, HORIZON_R, ex);
  const az = axis(112, step, growth, HORIZON_R, ez);
  const nx = ax.length, nz = az.length;
  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const mask = new Float32Array(nx * nz * 4);
  const s = { height: 0, rock: 0, wet: 0, damp: 0, tone: 0 };
  let k = 0;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      let x = ax[i], z = az[j];
      const r = Math.hypot(x, z);
      if (r > HORIZON_R) { x *= HORIZON_R / r; z *= HORIZON_R / r; }
      field.sample(x, z, s);
      pos[k * 3] = x; pos[k * 3 + 1] = s.height; pos[k * 3 + 2] = z;
      uv[k * 2] = x / tile; uv[k * 2 + 1] = z / tile;
      mask[k * 4] = s.rock; mask[k * 4 + 1] = s.wet; mask[k * 4 + 2] = s.damp; mask[k * 4 + 3] = s.tone;
      k++;
    }
  }
  const inHole = (x, z) => holes.some(h => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ);
  const idx = [];
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const cx = (ax[i] + ax[i + 1]) / 2, cz = (az[j] + az[j + 1]) / 2;
      if (inHole(cx, cz)) continue;
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aMask', new THREE.BufferAttribute(mask, 4));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const MAX_RUTS = 24;
const MAX_PATHS = 16;

/** Polylines to segments: [ax, az, bx, bz] each. */
function segments(lines, max) {
  const out = [];
  for (const line of lines || []) {
    for (let i = 0; i < line.length - 1; i++) {
      out.push(new THREE.Vector4(line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]));
    }
  }
  if (out.length > max) out.length = max;
  const n = out.length;
  while (out.length < max) out.push(new THREE.Vector4(1e5, 1e5, 1e5 + 1, 1e5));
  return { list: out, n };
}

/**
 * The ground's surface.
 *
 * @param {object} o
 *   crust  — buildMaterial-style set { map, normalMap, roughnessMap, aoMap }
 *   grit   — a fine detail normal map
 *   macro  — a non-repeating variation map
 *   strata — rock bed colours by altitude (for the shore)
 *   tracks — { ruts: [[[x,z],...],...], paths: [...] }
 */
export function createTallowTerrainMaterial({ crust, grit, macro, strata, tracks }) {
  const mat = new THREE.MeshStandardMaterial({
    map: crust.map,
    normalMap: crust.normalMap,
    roughnessMap: crust.roughnessMap,
    aoMap: crust.aoMap,
    aoMapIntensity: 0.85,
    roughness: 1.0,
    metalness: 0.0,
    normalScale: new THREE.Vector2(1.0, 1.0)
  });
  // It finishes itself in the same air as everything else; never patch it twice.
  mat.userData.tallowAir = true;
  mat.userData.surfaceMaps = [crust.map, crust.normalMap, crust.roughnessMap, crust.aoMap, grit, macro, strata].filter(Boolean);

  const ruts = segments(tracks?.ruts, MAX_RUTS);
  const paths = segments(tracks?.paths, MAX_PATHS);
  const uniforms = {
    uGrit: { value: grit },
    uMacro: { value: macro },
    uStrata: { value: strata },
    uRuts: { value: ruts.list },
    uRutN: { value: ruts.n },
    uPaths: { value: paths.list },
    uPathN: { value: paths.n }
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, tallowSkyUniforms, tallowHazeUniforms);
    shader.vertexShader = patchFogVertex(shader.vertexShader)
      .replace('#include <common>', `#include <common>
        attribute vec4 aMask;
        varying vec4 vMask;
        varying vec3 vTW;
        varying vec3 vTN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vMask = aMask;
        vTW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTN = normalize(mat3(modelMatrix) * objectNormal);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uGrit;
        uniform sampler2D uMacro;
        uniform sampler2D uStrata;
        uniform vec4 uRuts[${MAX_RUTS}];
        uniform int uRutN;
        uniform vec4 uPaths[${MAX_PATHS}];
        uniform int uPathN;
        varying vec4 vMask;
        varying vec3 vTW;
        varying vec3 vTN;
        float gCamD;
        float gRut;
        float gRutEdge;
        float gPath;
        float gWet;
        float gDamp;
        float gRock;
        float gSeg(vec2 p, vec4 s, out float along, out float side) {
          vec2 a = s.xy, b = s.zw, ab = b - a;
          float L = max(length(ab), 1e-3);
          vec2 t = ab / L;
          vec2 ap = p - a;
          along = clamp(dot(ap, t), 0.0, L);
          side = dot(ap, vec2(-t.y, t.x));
          return length(ap - t * along);
        }
        float gH(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float gN(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y);
        }`)
      .replace('#include <fog_pars_fragment>', `
        #ifdef USE_FOG
          ${TALLOW_FOG_PARS}
        #endif`)
      .replace('#include <map_fragment>', `
        gCamD = distance(cameraPosition, vTW);
        gWet = vMask.y;
        gDamp = vMask.z;
        gRock = vMask.x;
        float m1 = texture2D(uMacro, vTW.xz / 310.0).r;
        float m2 = texture2D(uMacro, vTW.xz / 47.0 + 0.37).r;
        // Two scales of one crust, rotated against each other.
        vec2 uvB = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.37 + vec2(0.31, 0.57);
        vec3 cA = texture2D(map, vMapUv).rgb;
        vec3 cB = texture2D(map, uvB).rgb;
        vec3 ground = mix(cA, cB, 0.25 + 0.35 * smoothstep(0.35, 0.7, m2));
        // Far off, the crust is its average: the ridges merge into a white field.
        vec3 avg = vec3(0.60, 0.575, 0.52);   // linear: the crust's mean
        ground = mix(ground, avg * (0.95 + 0.1 * m2), smoothstep(60.0, 260.0, gCamD) * 0.7);
        ground *= 0.9 + 0.2 * m1;
        ground = mix(ground, ground * vec3(1.03, 0.99, 0.93), smoothstep(0.55, 0.8, m2) * 0.5);

        // Damp: greyer and darker where brine sits under the skin.
        ground = mix(ground, ground * vec3(0.78, 0.77, 0.76), gDamp * 0.7);

        // Tracks and paths, near the plant only.
        gRut = 0.0; gRutEdge = 0.0; gPath = 0.0;
        if (abs(vTW.x) < 330.0 && abs(vTW.z) < 330.0) {
          for (int i = 0; i < ${MAX_RUTS}; i++) {
            if (i >= uRutN) break;
            float along, side;
            float d = gSeg(vTW.xz, uRuts[i], along, side);
            if (d > 3.2) continue;
            // Wheels wander; so do the ruts they leave.
            float wob = (gN(vec2(along * 0.07, float(i) * 3.1)) - 0.5) * 0.9;
            float s1 = abs(abs(side + wob) - 1.2);
            float s2 = abs(abs(side + wob * 0.6 + 0.45) - 1.25);
            float rut = max(1.0 - smoothstep(0.12, 0.34, s1), 0.55 * (1.0 - smoothstep(0.1, 0.26, s2)));
            float brk = smoothstep(0.25, 0.6, gN(vec2(along * 0.6, side * 3.0 + float(i))));
            gRut = max(gRut, rut * (0.55 + 0.45 * brk));
            gRutEdge = max(gRutEdge, (1.0 - smoothstep(0.34, 0.6, s1)) * (1.0 - rut));
          }
          for (int i = 0; i < ${MAX_PATHS}; i++) {
            if (i >= uPathN) break;
            float along, side;
            float d = gSeg(vTW.xz, uPaths[i], along, side);
            float wob = (gN(vec2(along * 0.11, float(i) * 1.7)) - 0.5) * 0.5;
            gPath = max(gPath, 1.0 - smoothstep(0.35, 0.8, abs(side + wob)));
          }
        }
        // The skin broken: rust-red mud under the salt, wet and dark in the rut bottom.
        vec3 mud = vec3(0.19, 0.082, 0.048) * (0.8 + 0.3 * gN(vTW.xz * 3.0));
        ground = mix(ground, mud, gRut * 0.85);
        // Crushed crust thrown up either side of a rut: whiter, chalkier.
        ground = mix(ground, vec3(0.70, 0.67, 0.61), gRutEdge * 0.35);
        // Trodden: the ridges flattened into a grey, faintly pink track.
        ground = mix(ground, ground * vec3(0.84, 0.8, 0.78), gPath * 0.55);

        // Mirror flats: under the brine the crust is dark and drowned.
        ground = mix(ground, vec3(0.15, 0.14, 0.125), gWet * 0.8);

        // The shore: bedded rock by altitude, salt drifted over its flats.
        if (gRock > 0.002) {
          vec3 bed = texture2D(uStrata, vec2(0.5, (vTW.y + 40.0) / 256.0 + m1 * 0.02)).rgb;
          bed *= 0.8 + 0.3 * m2;
          float steep = 1.0 - clamp(normalize(vTN).y, 0.0, 1.0);
          ground = mix(ground, bed, gRock * smoothstep(0.02, 0.2, steep + gRock * 0.08));
        }
        vec4 sampledDiffuseColor = vec4(ground, 1.0);
        diffuseColor *= sampledDiffuseColor;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.5, gDamp * 0.6);
        roughnessFactor = mix(roughnessFactor, 0.62, gRut * 0.7);
        roughnessFactor = mix(roughnessFactor, 0.4, gWet);`)
      .replace('#include <normal_fragment_maps>', `
        #ifdef USE_NORMALMAP_TANGENTSPACE
          vec3 mapN = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
          vec3 mapN2 = texture2D(normalMap, mat2(0.8, -0.6, 0.6, 0.8) * vNormalMapUv * 0.37 + vec2(0.31, 0.57)).xyz * 2.0 - 1.0;
          mapN.xy = mix(mapN.xy, mapN2.xy, 0.3);
          vec3 gritN = texture2D(uGrit, vNormalMapUv * 7.3).xyz * 2.0 - 1.0;
          mapN.xy += gritN.xy * 0.35 * (1.0 - smoothstep(4.0, 20.0, gCamD));
          float flatK = max(gWet, max(gPath * 0.7, gRut * 0.5));
          mapN.xy *= normalScale * (1.0 - flatK) * (1.0 - 0.8 * smoothstep(30.0, 180.0, gCamD));
          normal = normalize(tbn * mapN);
        #endif
      `)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          {
            vec3 gV = normalize(vTW - cameraPosition);
            // Standing brine is a mirror: the sky and the ranges, given back.
            if (gWet > 0.01) {
              vec3 rd = reflect(gV, vec3(0.0, 1.0, 0.0));
              rd.y = max(rd.y, 0.0005);
              float fres = 0.05 + 0.95 * pow(1.0 - max(-gV.y, 0.0), 5.0);
              float shiver = (gN(vTW.xz * 0.8 + uTTime * 0.4) - 0.5) * 0.004;
              rd.y += shiver;
              vec3 refl = tlSky(normalize(rd)) * vec3(0.93, 0.92, 0.9);
              gl_FragColor.rgb = mix(gl_FragColor.rgb, tlOut(refl), gWet * clamp(fres * 1.1 + 0.25, 0.0, 0.92));
            }
            // Mirage over the far pan: the low sky, trembling on the ground.
            float grazing = 1.0 - smoothstep(0.004, 0.035, -gV.y);
            float mir = smoothstep(240.0, 620.0, gCamD) * grazing * (1.0 - gRock) * 0.75;
            if (mir > 0.001) {
              vec3 md = vec3(gV.x, abs(gV.y) + 0.002 + (gN(vec2(vTW.x * 0.05, uTTime * 1.3)) - 0.5) * 0.004, gV.z);
              gl_FragColor.rgb = mix(gl_FragColor.rgb, tlOut(tlSky(normalize(md))), mir);
            }
          }
          ${TALLOW_FOG_APPLY}
        #endif`);
  };
  mat.customProgramCacheKey = () => 'tallow-terrain-v1';
  return mat;
}
