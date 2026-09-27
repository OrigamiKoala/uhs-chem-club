/**
 * terrain.js — the ground of Ligar, from the player's boots to the horizon.
 *
 * ONE HEIGHT FUNCTION, ONE MESH, as on Tallow and Erebus. The walk, the
 * benches, the landing solver and the Node checks all stand on exactly the
 * ground that is drawn. The mesh is one rectilinear grid, fine across the
 * walk and growing geometrically to an 880 m disc, with the excavation's
 * outline written into it as grid lines so the hole is cut along the pit's
 * own walls.
 *
 * THE SHAPE. Inside a hundred metres the quarried plateau is exactly what it
 * was — every site stands where it stood. Beyond it the ground does what a
 * flood-basalt province does: it climbs in TRAP BENCHES. Each flow that
 * poured out and cooled left a flat top and a cliff front, and erosion walked
 * the fronts back, so the country rises in steps, each cliff with a talus
 * apron at its foot, each bench cut back into embayments. In some bearings
 * the benches fall away and the plain runs out to the far country the sky
 * draws.
 *
 * WHAT THE GROUND SHADER DRAWS (per pixel, so it never repeats):
 *  - The column tops the plateau IS: an irregular polygon field a metre
 *    across, each stone at its own tone and its own slight tilt, bevelled at
 *    the rim, with dust packed into the joints — joints LIGHTER than the
 *    stone, which is what a dusty pavement looks like.
 *  - Rain standing in the hollows and in the joints, dead black and giving
 *    back the burning sky. Nothing sells dusk like water on dark stone.
 *  - Ash drifted into the low places, soft over the joints.
 *  - The scoria yard where the plant is, and the haul road's ruts through it.
 *  - On every steep face beyond the walk, the colonnade in section: vertical
 *    column ribs with the flow banding across them.
 */

import * as THREE from 'three';
import { noise2, fbm2, smoothstep, clamp } from '../erebus/noise.js';
import {
  ligarSkyUniforms, ligarHazeUniforms, LIGAR_FOG_PARS, LIGAR_FOG_APPLY, patchFogVertex
} from './atmosphere.js';

export const HORIZON_R = 880;

/** The bearing (atan2(z, x)) of the gap in the benches the volcano is seen through. */
const WINDOW_AZ = -0.62;

/** The working yard: loose scoria over the pavement where the plant stands. */
const YARD = { cx: 10, cz: 2, hx: 33, hz: 35 };

/**
 * The height field. `height(x, z)` is the surface before the cut (the pit is
 * the world's business, not the field's); `sample` also reports paint masks.
 *
 * @param {number} maxHeight the old plateau's relief scale (ligar.json terrain.maxHeight)
 */
export function makeLigarField(maxHeight = 6) {
  const tmp = { height: 0, yard: 0, ash: 0, wet: 0, tone: 0 };

  // The plateau, exactly as the world has always stood on it.
  function plateau(x, z, r) {
    const swell =
      Math.sin(x * 0.0112) * Math.cos(z * 0.0131) * 0.5 +
      Math.sin(x * 0.027 + 1.1) * 0.22 +
      Math.cos(z * 0.023 - 0.4) * 0.2;
    const shelf = Math.max(0, Math.sin(x * 0.007 + z * 0.005)) * 0.3;
    const out = Math.max(0, (r - 58) / 42);
    const rise = Math.min(1, out) * Math.min(1, out);
    const grain = Math.sin(x * 1.9) * Math.cos(z * 1.7) * 0.022;
    return (swell + shelf) * (maxHeight * 0.2) + rise * maxHeight * 0.78 + grain;
  }

  // One trap bench: a talus apron rising to a cliff at `edge`, `H` high. The
  // cliff is spread over nine metres, because the grid out there is four and
  // a half metres a cell and a narrower riser would draw as a sawtooth.
  function bench(r, edge, H) {
    const apron = Math.pow(smoothstep(edge - 32, edge - 5, r), 1.5) * 0.3;
    const cliff = smoothstep(edge - 6, edge + 3, r) * 0.7;
    return H * (apron + cliff);
  }

  function sample(x, z, s = tmp) {
    const r = Math.hypot(x, z);
    let h = plateau(x, z, Math.min(r, 100));
    if (r > 100) {
      const az = Math.atan2(z, x);
      const c = Math.cos(az), sn = Math.sin(az);
      const dW = Math.atan2(Math.sin(az - WINDOW_AZ), Math.cos(az - WINDOW_AZ));
      const open = 1 - 0.92 * (1 - smoothstep(0.45, 0.8, Math.abs(dW)));
      // Past the walk: the plain keeps rising gently to the first apron — and
      // in the window, sinks away instead.
      h += 6 * (1 - Math.exp(-(r - 100) / 30)) * (0.35 + 0.65 * open);
      h -= (1 - open) * Math.max(0, r - 130) * 0.03;
      // Embayments: each bench's front wanders in and out by tens of metres.
      const e1 = 166 + 16 * noise2(c * 2.1 + 3.3, sn * 2.1 - 1.2);
      const e2 = 262 + 30 * noise2(c * 2.8 - 7.1, sn * 2.8 + 4.4);
      // Sectors: in some bearings a bench has been eroded away entirely and
      // the plain runs out toward the far country the sky draws.
      // And to the north-east the benches are gone altogether: that is the
      // window the volcano and the rising moon are seen through.
      const k1 = smoothstep(-0.12, 0.12, noise2(c * 1.3 + 11.0, sn * 1.3)) * open;
      const k2 = smoothstep(-0.15, 0.1, noise2(c * 1.6 - 4.0, sn * 1.6 + 2.0)) * Math.max(k1, 0.35) * open;
      h += bench(r, e1, 15 + 5 * noise2(c * 4.0, sn * 4.0)) * k1;
      h += bench(r, e2, 19 + 6 * noise2(c * 3.0 + 2.0, sn * 3.0)) * k2;
      // Past the upper bench's rim the plateau falls gently away, so the rim
      // is the skyline and the far country (drawn in the sky) shows over it.
      const rimK = Math.max(k1, k2);
      h -= Math.max(0, r - (e2 + 35)) * 0.14 * rimK;
      // Ragged bench tops and the odd butte standing off a front.
      h += fbm2(x / 40, z / 40, 3) * 3.0 * smoothstep(110, 180, r) * (0.4 + 0.6 * open);
      // The rim of the world, tipped down under the haze.
      h -= 30 * smoothstep(HORIZON_R * 0.8, HORIZON_R, r);
    }

    // Paint masks.
    const yx = Math.abs(x - YARD.cx) / YARD.hx;
    const yz = Math.abs(z - YARD.cz) / YARD.hz;
    const edgeN = 0.18 * noise2(x * 0.09, z * 0.09);
    const yard = 1 - smoothstep(0.82, 1.0, Math.max(yx, yz) + edgeN);
    const ash = smoothstep(-0.05, 0.25, fbm2(x / 26 + 4.2, z / 26 - 1.3, 3)) * (1 - yard * 0.6);
    // Rain pools: in the walk only, where the ground is locally low.
    const lowN = fbm2(x / 13 - 2.2, z / 13 + 6.1, 3);
    const wet = smoothstep(0.16, 0.26, lowN) * (1 - smoothstep(90, 115, r));

    s.height = h;
    s.yard = yard;
    s.ash = ash;
    s.wet = clamp(wet, 0, 1);
    s.tone = 0.5 + fbm2(x / 35 + 9.1, z / 35, 3);
    return s;
  }

  return { sample, height: (x, z) => sample(x, z, tmp).height };
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
export function buildLigarTerrainGeometry(field, { step = 1.25, growth = 1.065, holes = [], inner = 112 } = {}) {
  const ex = [], ez = [];
  for (const h of holes) { ex.push(h.minX, h.maxX); ez.push(h.minZ, h.maxZ); }
  const ax = axis(inner, step, growth, HORIZON_R, ex);
  const az = axis(inner, step, growth, HORIZON_R, ez);
  const nx = ax.length, nz = az.length;
  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const mask = new Float32Array(nx * nz * 4);
  const s = { height: 0, yard: 0, ash: 0, wet: 0, tone: 0 };
  let k = 0;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      let x = ax[i], z = az[j];
      const r = Math.hypot(x, z);
      if (r > HORIZON_R) { x *= HORIZON_R / r; z *= HORIZON_R / r; }
      field.sample(x, z, s);
      pos[k * 3] = x; pos[k * 3 + 1] = s.height; pos[k * 3 + 2] = z;
      uv[k * 2] = x / 2.5; uv[k * 2 + 1] = z / 2.5;
      mask[k * 4] = s.yard; mask[k * 4 + 1] = s.ash; mask[k * 4 + 2] = s.wet; mask[k * 4 + 3] = s.tone;
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

/**
 * A flat patch of ground (the quarry floor) drawn with the SAME surface as the
 * plateau, so a puddle in the pit is the same water as a puddle on top.
 * `wetAt(x, z)` and `yard` paint it; `y(x, z)` is its height.
 */
export function buildFloorGeometry({ minX, maxX, minZ, maxZ, y, step = 0.8, wetAt = null, yard = 1 }) {
  const nx = Math.max(2, Math.ceil((maxX - minX) / step) + 1);
  const nz = Math.max(2, Math.ceil((maxZ - minZ) / step) + 1);
  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const mask = new Float32Array(nx * nz * 4);
  let k = 0;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = minX + (maxX - minX) * i / (nx - 1);
      const z = minZ + (maxZ - minZ) * j / (nz - 1);
      pos[k * 3] = x; pos[k * 3 + 1] = y(x, z); pos[k * 3 + 2] = z;
      uv[k * 2] = x / 2.5; uv[k * 2 + 1] = z / 2.5;
      mask[k * 4] = yard;
      mask[k * 4 + 1] = 0.25;
      mask[k * 4 + 2] = wetAt ? wetAt(x, z) : 0;
      mask[k * 4 + 3] = 0.45 + 0.3 * (0.5 + noise2(x * 0.1, z * 0.1));
      k++;
    }
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
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
/** Polylines per kind: each gets a bounding box the shader tests before its segments. */
export const MAX_TRACK_LINES = 8;

function segments(lines, max, reach) {
  const out = [];
  const boxes = [];
  const spans = [];
  for (const line of (lines || []).slice(0, MAX_TRACK_LINES)) {
    const first = out.length;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < line.length - 1 && out.length < max; i++) {
      out.push(new THREE.Vector4(line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]));
      for (const [x, z] of [line[i], line[i + 1]]) {
        x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z);
      }
    }
    if (out.length === first) continue;
    boxes.push(new THREE.Vector4(x0 - reach, z0 - reach, x1 + reach, z1 + reach));
    spans.push(new THREE.Vector2(first, out.length));
  }
  const lineN = boxes.length;
  while (out.length < max) out.push(new THREE.Vector4(1e5, 1e5, 1e5 + 1, 1e5));
  while (boxes.length < MAX_TRACK_LINES) boxes.push(new THREE.Vector4(1e5, 1e5, -1e5, -1e5));
  while (spans.length < MAX_TRACK_LINES) spans.push(new THREE.Vector2(0, 0));
  return { list: out, boxes, spans, lineN };
}

/**
 * The ground's surface.
 *
 * @param {object} o
 *   stone  — { map, normalMap, roughnessMap, aoMap }: the weathered top of a
 *            column, the micro-detail inside every polygon
 *   grit   — { map, normalMap, roughnessMap }: scoria, for the yard
 *   detail — a fine detail normal map
 *   macro  — a non-repeating variation map
 *   tracks — { ruts: [[[x,z],...],...] }
 */
export function createLigarTerrainMaterial({ stone, grit, detail, macro, tracks }) {
  const mat = new THREE.MeshStandardMaterial({
    map: stone.map,
    normalMap: stone.normalMap,
    roughnessMap: stone.roughnessMap,
    aoMap: stone.aoMap,
    aoMapIntensity: 0.8,
    roughness: 1.0,
    metalness: 0.0,
    normalScale: new THREE.Vector2(1.0, 1.0)
  });
  mat.userData.ligarAir = true;
  mat.userData.surfaceMaps = [stone.map, stone.normalMap, stone.roughnessMap, stone.aoMap,
    grit.map, grit.normalMap, grit.roughnessMap, detail, macro].filter(Boolean);

  const ruts = segments(tracks?.ruts, MAX_RUTS, 3.3);
  const uniforms = {
    uGritMap: { value: grit.map },
    uGritNormal: { value: grit.normalMap },
    uGritRough: { value: grit.roughnessMap },
    uDetail: { value: detail },
    uMacro: { value: macro },
    uRuts: { value: ruts.list },
    uRutBox: { value: ruts.boxes },
    uRutSpan: { value: ruts.spans },
    uRutLines: { value: ruts.lineN }
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, ligarSkyUniforms, ligarHazeUniforms);
    shader.vertexShader = patchFogVertex(shader.vertexShader)
      .replace('#include <common>', `#include <common>
        attribute vec4 aMask;
        varying vec4 vMask;
        varying vec3 vGW;
        varying vec3 vGN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vMask = aMask;
        vGW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vGN = normalize(mat3(modelMatrix) * objectNormal);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uGritMap;
        uniform sampler2D uGritNormal;
        uniform sampler2D uGritRough;
        uniform sampler2D uDetail;
        uniform sampler2D uMacro;
        uniform vec4 uRuts[${MAX_RUTS}];
        uniform vec4 uRutBox[${MAX_TRACK_LINES}];
        uniform vec2 uRutSpan[${MAX_TRACK_LINES}];
        uniform int uRutLines;
        varying vec4 vMask;
        varying vec3 vGW;
        varying vec3 vGN;
        float gCamD;
        float gJoint;
        float gRim;
        float gWet;
        float gYard;
        float gAsh;
        float gRut;
        float gCliff;
        vec2 gTilt;
        vec2 gRimDir;
        float gH1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        vec2 gH2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
        }
        float gN(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(gH1(i), gH1(i + vec2(1.0, 0.0)), f.x), mix(gH1(i + vec2(0.0, 1.0)), gH1(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        // The column tops: an irregular polygon field. Returns the distance to
        // the nearest joint in .x, the cell id in .yz, and in gRimDir the way
        // to that joint (for the bevel).
        vec3 gCells(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 mr = vec2(0.0), mg = vec2(0.0);
          float md = 8.0;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y));
            vec2 o = 0.15 + 0.7 * gH2(i + g);
            vec2 r = g + o - f;
            float d = dot(r, r);
            if (d < md) { md = d; mr = r; mg = g; }
          }
          float ed = 8.0;
          vec2 edir = vec2(0.0);
          // Sites are jittered within 0.15–0.85 of their cell, so the nearest
          // joint is always among the 3 x 3 round the winner.
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 g = mg + vec2(float(x), float(y));
            vec2 o = 0.15 + 0.7 * gH2(i + g);
            vec2 r = g + o - f;
            vec2 dd = r - mr;
            if (dot(dd, dd) > 1e-5) {
              float e = dot(0.5 * (mr + r), normalize(dd));
              if (e < ed) { ed = e; edir = normalize(dd); }
            }
          }
          gRimDir = edir;
          return vec3(ed, i + mg);
        }
        float gSeg(vec2 p, vec4 s, out float along, out float side) {
          vec2 a = s.xy, b = s.zw, ab = b - a;
          float L = max(length(ab), 1e-3);
          vec2 t = ab / L;
          vec2 ap = p - a;
          along = clamp(dot(ap, t), 0.0, L);
          side = dot(ap, vec2(-t.y, t.x));
          return length(ap - t * along);
        }`)
      .replace('#include <fog_pars_fragment>', `
        #ifdef USE_FOG
          ${LIGAR_FOG_PARS}
        #endif`)
      .replace('#include <map_fragment>', `
        gCamD = distance(cameraPosition, vGW);
        gYard = vMask.x;
        gAsh = vMask.y;
        gWet = vMask.z;
        float tone = vMask.w;
        vec3 Ng = normalize(vGN);
        gCliff = 1.0 - smoothstep(0.55, 0.8, Ng.y);
        float m1 = texture2D(uMacro, vGW.xz / 280.0).r;
        float m2 = texture2D(uMacro, vGW.xz / 41.0 + 0.37).r;
        float near = 1.0 - smoothstep(55.0, 140.0, gCamD);

        // THE COLUMN TOPS.
        // Past two hundred metres a stone is under a pixel and the pavement is
        // drawn as its average below, so the cell search is skipped there.
        float edge = 1.0;
        float cr = 0.5, cr2 = 0.0;
        gTilt = vec2(0.0);
        gRimDir = vec2(0.0);
        if (gCamD < 200.0) {
          vec3 cc = gCells(vGW.xz / 1.05);
          edge = cc.x * 1.05;
          vec2 cid = cc.yz;
          cr = gH1(cid * 1.37);
          cr2 = gH1(cid * 0.71 + 5.3);
          gTilt = (gH2(cid + 3.1) - 0.5) * 0.16;
        }
        // A stone sunk a little is where water and dust sit first.
        float sunk = step(0.72, cr2);
        gJoint = (1.0 - smoothstep(0.012, 0.035 + 0.03 * sunk, edge)) * near;
        gRim = (1.0 - smoothstep(0.03, 0.11, edge)) * near;

        vec3 stoneC = texture2D(map, vMapUv).rgb;
        stoneC *= 0.78 + 0.42 * cr;                          // every stone its own
        stoneC *= 0.85 + 0.3 * m1;
        stoneC = mix(stoneC, stoneC * vec3(1.12, 1.0, 0.86), smoothstep(0.55, 0.8, m2) * 0.4);
        // Weathered rims are paler: the edge dries first and catches dust.
        stoneC = mix(stoneC, stoneC * 1.35 + vec3(0.02, 0.016, 0.01), gRim * 0.35);
        // Lichen: orange and grey-green crusts on the stones nobody walks.
        float lich = smoothstep(0.62, 0.8, gN(vGW.xz * 0.7 + cr * 9.0)) * (1.0 - gYard) * near;
        vec3 lichC = mix(vec3(0.33, 0.13, 0.04), vec3(0.2, 0.21, 0.15), step(0.5, cr));
        stoneC = mix(stoneC, lichC, lich * 0.55 * smoothstep(0.1, 0.4, edge));
        // A film of dust over every stone (it is a quarry), and dust packed
        // into the joints, lighter than the stone it separates.
        vec3 dust = vec3(0.13, 0.105, 0.08) * (0.85 + 0.3 * m2);
        stoneC = mix(stoneC, dust, 0.22 + 0.2 * smoothstep(0.4, 0.8, m1));
        vec3 ground = mix(stoneC, dust, gJoint * 0.85);
        // Far off, the pavement is its average: joints merge into a brown field.
        vec3 avg = vec3(0.074, 0.062, 0.051) * (0.9 + 0.2 * m2);
        ground = mix(ground, avg, smoothstep(50.0, 220.0, gCamD) * 0.65);

        // Ash drifted into the low places.
        float ashN = gN(vGW.xz * 0.35) * 0.6 + gN(vGW.xz * 1.3) * 0.4;
        float ash = smoothstep(0.35, 0.75, gAsh + (ashN - 0.5) * 0.5);
        ground = mix(ground, vec3(0.12, 0.098, 0.078) * (0.85 + 0.3 * ashN), ash * 0.75);

        // The yard: loose scoria over everything.
        vec3 gritC = texture2D(uGritMap, vMapUv * 1.3).rgb;
        float yard = smoothstep(0.3, 0.7, gYard + (m2 - 0.5) * 0.4);
        ground = mix(ground, gritC * (0.9 + 0.2 * m1), yard);

        // The haul road: ruts through the scoria, and the crushed berm between.
        gRut = 0.0;
        float rutEdge = 0.0;
        for (int l = 0; l < ${MAX_TRACK_LINES}; l++) {
          if (l >= uRutLines) break;
          vec4 bb = uRutBox[l];
          if (vGW.x < bb.x || vGW.z < bb.y || vGW.x > bb.z || vGW.z > bb.w) continue;
          int s1i = int(uRutSpan[l].y);
          for (int i = int(uRutSpan[l].x); i < s1i; i++) {
            float along, side;
            float d = gSeg(vGW.xz, uRuts[i], along, side);
            if (d > 3.2) continue;
            float wob = (gN(vec2(along * 0.07, float(i) * 3.1)) - 0.5) * 0.9;
            float s1 = abs(abs(side + wob) - 1.25);
            float rut = 1.0 - smoothstep(0.14, 0.36, s1);
            gRut = max(gRut, rut);
            rutEdge = max(rutEdge, (1.0 - smoothstep(0.36, 0.7, s1)) * (1.0 - rut));
          }
        }
        ground = mix(ground, vec3(0.045, 0.038, 0.032), gRut * 0.8);
        ground = mix(ground, ground * 1.25, rutEdge * 0.3);
        // Water stands in a rut bottom.
        gWet = max(gWet, gRut * 0.55 * step(0.45, gN(vGW.xz * 0.25)));

        // Rain: the pools, and the joints that hold water beyond them.
        float pool = smoothstep(0.45, 0.75, gWet + (gN(vGW.xz * 0.9) - 0.5) * 0.35);
        float wetJ = gJoint * smoothstep(0.1, 0.4, gWet + 0.12 * sunk);
        gWet = clamp(max(pool, wetJ), 0.0, 1.0) * (1.0 - gCliff);
        // Damp stone round a pool is darker before it is wet.
        ground *= 1.0 - 0.35 * smoothstep(0.2, 0.55, vMask.z) * (1.0 - pool);
        ground = mix(ground, vec3(0.012, 0.011, 0.01), gWet * 0.9);

        // THE CLIFFS beyond the walk: the colonnade in section.
        if (gCliff > 0.01) {
          vec2 hzN = normalize(Ng.xz + 1e-4);
          float along = dot(vGW.xz, vec2(-hzN.y, hzN.x));
          float colId = floor(along / 1.6 + gN(vec2(vGW.y * 0.05, along * 0.1)) * 0.8);
          float colF = fract(along / 1.6 + gN(vec2(vGW.y * 0.05, along * 0.1)) * 0.8);
          float rib = smoothstep(0.0, 0.12, colF) * smoothstep(1.0, 0.88, colF);
          float band = gN(vec2(along * 0.02, vGW.y * 0.35));
          vec3 cliffC = vec3(0.05, 0.045, 0.04) * (0.7 + 0.6 * gH1(vec2(colId, 1.0))) * (0.6 + 0.5 * rib);
          cliffC *= 0.8 + 0.4 * band;
          // Iron weep down the face.
          cliffC = mix(cliffC, vec3(0.12, 0.05, 0.02), smoothstep(0.7, 0.9, gN(vec2(along * 0.4, vGW.y * 0.05))) * 0.4);
          ground = mix(ground, cliffC, gCliff);
        }
        vec4 sampledDiffuseColor = vec4(ground, 1.0);
        diffuseColor *= sampledDiffuseColor;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, texture2D(uGritRough, vRoughnessMapUv * 1.3).g, smoothstep(0.3, 0.7, gYard));
        roughnessFactor = mix(roughnessFactor, 0.97, gJoint * (1.0 - gWet));
        roughnessFactor = mix(roughnessFactor, 0.04, gWet);`)
      .replace('#include <normal_fragment_maps>', `
        #ifdef USE_NORMALMAP_TANGENTSPACE
          vec3 mapN = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
          vec3 gN2 = texture2D(uGritNormal, vNormalMapUv * 1.3).xyz * 2.0 - 1.0;
          mapN.xy = mix(mapN.xy, gN2.xy * 1.2, smoothstep(0.3, 0.7, gYard));
          vec3 detN = texture2D(uDetail, vNormalMapUv * 3.1).xyz * 2.0 - 1.0;
          mapN.xy += detN.xy * 0.3 * (1.0 - smoothstep(4.0, 18.0, gCamD));
          // Each column top at its own slight tilt, and the rim rolling off
          // toward the joint: the bevel is what catches a sun this low.
          float stoneK = (1.0 - smoothstep(0.3, 0.7, gYard)) * (1.0 - gCliff);
          mapN.xy += gTilt * stoneK;
          mapN.xy += gRimDir * gRim * 0.9 * stoneK;
          mapN.xy *= normalScale * (1.0 - gWet) * (1.0 - 0.75 * smoothstep(30.0, 160.0, gCamD));
          normal = normalize(tbn * mapN);
        #endif
      `)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        // The joint is a crack: light does not get to the bottom of it.
        reflectedLight.indirectDiffuse *= 1.0 - gJoint * 0.5 * (1.0 - gWet);
      `)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          {
            vec3 gV = normalize(vGW - cameraPosition);
            // Standing water is a mirror of the burning sky.
            if (gWet > 0.01) {
              vec3 rd = reflect(gV, vec3(0.0, 1.0, 0.0));
              rd.y = max(rd.y, 0.0008);
              float ripple = (gN(vGW.xz * 3.0 + uLTime * 0.7) - 0.5) * 0.012 * (1.0 - smoothstep(10.0, 60.0, gCamD));
              rd.x += ripple; rd.z -= ripple;
              float fres = 0.03 + 0.97 * pow(1.0 - max(-gV.y, 0.0), 5.0);
              vec3 refl = lgSky(normalize(rd)) * 0.92;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, lgOut(refl), gWet * clamp(fres * 1.05 + 0.18, 0.0, 0.95));
            }
          }
          ${LIGAR_FOG_APPLY}
        #endif`);
  };
  mat.customProgramCacheKey = () => 'ligar-terrain-v1';
  return mat;
}
