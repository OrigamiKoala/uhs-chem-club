/**
 * cover.js — Under a roof: the sun and the sky taken out of a covered space, for any world.
 *
 * WHY. On a phone there is no shadow map, so the sun and the sky's fill would light the inside of a
 * roofed room as if it stood in the open. The COVER MASK is a small table of boxes (the air of each
 * roofed space): a fragment inside one has the sun, the sky's hemisphere and the environment taken
 * away, with a short falloff outside each so a doorway is dim rather than cut. What is left inside is
 * lamps (the world's `LampPool`) and nothing else. It is baked once: the boxes are uniforms, never
 * recomputed per frame.
 *
 * WHERE IT CAME FROM. Ligar's workings (`ligar/atmosphere.js`: `ligarCover`, `setLigarCover`). Its
 * lighting chunks are lifted here unchanged (`coverLightChunks`), and Ligar builds its own from them, so
 * its shader is the text it was. `makeCover` is the same test for a world on STOCK materials and
 * `THREE.Fog` (the template worlds), with three things Ligar never needed, each opt-in:
 *
 *   sky        a box may keep a fraction of the sky's fill (`sky: 0.2`): a tall hall is dim, not black
 *   push       the test is made a little way in FRONT of the surface (along its normal), so the outside
 *              face of a building's wall, which lies on a covered box's own plane, stays in the sun
 *   openings   rectangles the sun really comes through (a roof slot, a window, a doorway): a covered
 *              fragment the sun reaches through one keeps its sun. That is a light shaft with no
 *              shadow map, and it lands where the sun's direction says it lands.
 *
 * USE
 *   const cover = makeCover({ sun: SUN_DIR, boxes, openings });
 *   cover.applyTo(scene);            // once the world is built; again for materials made later
 *
 * A box is `{ min: [x, y, z], max: [x, y, z], sky? }` (`lib/workings.js` `coverBoxes()` makes them).
 * An opening is `{ axis: 'x' | 'y' | 'z', at, lo: [u, v], hi: [u, v], reach: { min, max } }`: a
 * rectangle in the plane `axis = at`, its two spans given in the order of the remaining axes (x before y
 * before z), and the box its light may land in (so a shaft never lights the far side of a wall).
 */

import * as THREE from 'three';

/**
 * The lighting chunks with the sun scaled out of a covered fragment and the sky's fill (hemisphere and
 * environment) scaled away after them. Lamps are point lights and are left alone. Returned as strings to
 * replace `#include <lights_fragment_begin>` and `#include <lights_fragment_end>`.
 *
 * @param {{ declare: string, sun: string, sky: string }} glsl `declare` is GLSL run once before any light
 *   is summed; `sun` and `sky` are float expressions in 0..1, how much of each to take away.
 */
export function coverLightChunks({ declare, sun, sky }) {
  const begin = THREE.ShaderChunk.lights_fragment_begin
    .replace('IncidentLight directLight;', `IncidentLight directLight;
      ${declare}`)
    .replace('getDirectionalLightInfo( directionalLight, directLight );', `getDirectionalLightInfo( directionalLight, directLight );
        directLight.color *= 1.0 - ${sun};`);
  const end = THREE.ShaderChunk.lights_fragment_end + `
    reflectedLight.indirectDiffuse *= 1.0 - ${sky};
    reflectedLight.indirectSpecular *= 1.0 - ${sky};`;
  return { begin, end };
}

/** How many boxes and openings one mask holds. Fixed: they size the shader's arrays. */
export const COVER_BOXES = 24;
export const COVER_OPENINGS = 8;

const AXIS = { x: 0, y: 1, z: 2 };

/**
 * A cover mask for a world on stock materials.
 * @param {{ sun: THREE.Vector3, boxes?: object[], openings?: object[], fall?: number, push?: number, soft?: number }} opts
 *   `sun` points TOWARD the sun. `fall` is the falloff outside a box (m), `push` how far in front of a
 *   surface the test is made (m), `soft` the width of an opening's edge (m).
 */
export function makeCover({ sun, boxes = [], openings = [], fall = 0.5, push = 0.6, soft = 0.35 } = {}) {
  const v3 = n => Array.from({ length: n }, () => new THREE.Vector3());
  const v4 = n => Array.from({ length: n }, () => new THREE.Vector4());
  const uniforms = {
    uCvLo: { value: v3(COVER_BOXES) },
    uCvHi: { value: v3(COVER_BOXES) },
    uCvSky: { value: new Array(COVER_BOXES).fill(0) },
    uCvBoundLo: { value: new THREE.Vector3() },
    uCvBoundHi: { value: new THREE.Vector3() },
    uCvFall: { value: fall },
    uCvPush: { value: push },
    uCvSoft: { value: soft },
    uCvSun: { value: (sun || new THREE.Vector3(0, 1, 0)).clone().normalize() },
    uCvOpenA: { value: v4(COVER_OPENINGS) },     // axis, plane, -, on
    uCvOpenR: { value: v4(COVER_OPENINGS) },     // lo.u, lo.v, hi.u, hi.v
    uCvOpenLo: { value: v3(COVER_OPENINGS) },    // where its light may land
    uCvOpenHi: { value: v3(COVER_OPENINGS) }
  };

  function set(nextBoxes, nextOpenings = []) {
    if (nextBoxes.length > COVER_BOXES) throw new Error(`${nextBoxes.length} roofed spaces; the cover mask holds ${COVER_BOXES}`);
    if (nextOpenings.length > COVER_OPENINGS) throw new Error(`${nextOpenings.length} openings; the cover mask holds ${COVER_OPENINGS}`);
    const U = uniforms;
    U.uCvBoundLo.value.setScalar(1e6);
    U.uCvBoundHi.value.setScalar(-1e6);
    for (let i = 0; i < COVER_BOXES; i++) {
      const b = nextBoxes[i];
      if (b) { U.uCvLo.value[i].set(...b.min); U.uCvHi.value[i].set(...b.max); } else { U.uCvLo.value[i].setScalar(1e6); U.uCvHi.value[i].setScalar(-1e6); }
      U.uCvSky.value[i] = b?.sky ?? 0;
      if (b) { U.uCvBoundLo.value.min(U.uCvLo.value[i]); U.uCvBoundHi.value.max(U.uCvHi.value[i]); }
    }
    if (nextBoxes.length) {
      U.uCvBoundLo.value.subScalar(U.uCvFall.value + U.uCvPush.value);
      U.uCvBoundHi.value.addScalar(U.uCvFall.value + U.uCvPush.value);
    }
    for (let j = 0; j < COVER_OPENINGS; j++) {
      const o = nextOpenings[j];
      if (!o) { U.uCvOpenA.value[j].set(0, 0, 0, 0); continue; }
      U.uCvOpenA.value[j].set(AXIS[o.axis], o.at, 0, 1);
      U.uCvOpenR.value[j].set(o.lo[0], o.lo[1], o.hi[0], o.hi[1]);
      U.uCvOpenLo.value[j].set(...o.reach.min);
      U.uCvOpenHi.value[j].set(...o.reach.max);
    }
    state.boxes = nextBoxes;
    state.openings = nextOpenings;
  }

  const PARS = /* glsl */ `
    uniform vec3 uCvLo[${COVER_BOXES}];
    uniform vec3 uCvHi[${COVER_BOXES}];
    uniform float uCvSky[${COVER_BOXES}];
    uniform vec3 uCvBoundLo;
    uniform vec3 uCvBoundHi;
    uniform float uCvFall;
    uniform float uCvPush;
    uniform float uCvSoft;
    uniform vec3 uCvSun;
    uniform vec4 uCvOpenA[${COVER_OPENINGS}];
    uniform vec4 uCvOpenR[${COVER_OPENINGS}];
    uniform vec3 uCvOpenLo[${COVER_OPENINGS}];
    uniform vec3 uCvOpenHi[${COVER_OPENINGS}];
    varying vec3 vCoverWorld;
    // x: how much of the sun to take away, y: how much of the sky. 0 in the open.
    vec2 worldCover(vec3 p) {
      if (any(lessThan(p, uCvBoundLo)) || any(greaterThan(p, uCvBoundHi))) return vec2(0.0);
      float c = 0.0;
      float keep = 0.0;
      for (int i = 0; i < ${COVER_BOXES}; i++) {
        vec3 d = max(max(uCvLo[i] - p, p - uCvHi[i]), 0.0);
        float k = 1.0 - smoothstep(0.0, uCvFall, length(d));
        if (k > c) { c = k; keep = uCvSky[i]; }
      }
      if (c <= 0.0) return vec2(0.0);
      float shaft = 0.0;
      for (int j = 0; j < ${COVER_OPENINGS}; j++) {
        if (uCvOpenA[j].w < 0.5) continue;
        if (any(lessThan(p, uCvOpenLo[j])) || any(greaterThan(p, uCvOpenHi[j]))) continue;
        int ax = int(uCvOpenA[j].x + 0.5);
        float along = ax == 0 ? uCvSun.x : (ax == 1 ? uCvSun.y : uCvSun.z);
        float from = ax == 0 ? p.x : (ax == 1 ? p.y : p.z);
        if (abs(along) < 1e-4) continue;
        float t = (uCvOpenA[j].y - from) / along;
        if (t <= 0.0) continue;
        vec3 q = p + uCvSun * t;
        vec2 uv = ax == 0 ? q.yz : (ax == 1 ? q.xz : q.xy);
        vec2 e = min(uv - uCvOpenR[j].xy, uCvOpenR[j].zw - uv);
        shaft = max(shaft, smoothstep(0.0, uCvSoft, min(e.x, e.y)));
      }
      return vec2(c * (1.0 - shaft), c * (1.0 - keep));
    }
  `;

  const chunks = () => coverLightChunks({
    declare: 'vec2 cvK = worldCover(vCoverWorld + inverseTransformDirection(geometryNormal, viewMatrix) * uCvPush);',
    sun: 'cvK.x',
    sky: 'cvK.y'
  });

  /** Put the mask on one material. Chains an existing `onBeforeCompile`; skips what has no lights to take away. */
  function apply(mat) {
    if (!mat || mat.userData.worldCover || mat.isShaderMaterial || mat.isMeshBasicMaterial || mat.isSpriteMaterial || mat.isPointsMaterial || mat.isLineBasicMaterial) return false;
    if (!(mat.isMeshStandardMaterial || mat.isMeshLambertMaterial || mat.isMeshPhongMaterial)) return false;
    mat.userData.worldCover = true;
    const prev = mat.onBeforeCompile;
    const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
    mat.onBeforeCompile = (shader, renderer) => {
      prev?.call(mat, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          varying vec3 vCoverWorld;`)
        .replace('#include <project_vertex>', `#include <project_vertex>
          {
            vec4 cvP = vec4(transformed, 1.0);
            #ifdef USE_BATCHING
              cvP = batchingMatrix * cvP;
            #endif
            #ifdef USE_INSTANCING
              cvP = instanceMatrix * cvP;
            #endif
            vCoverWorld = (modelMatrix * cvP).xyz;
          }`);
      const lit = chunks();
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>
          ${PARS}`)
        .replace('#include <lights_fragment_begin>', lit.begin)
        .replace('#include <lights_fragment_end>', lit.end);
    };
    const key = `${prevKey}|world-cover`;
    mat.customProgramCacheKey = () => key;
    mat.needsUpdate = true;
    return true;
  }

  const seen = new WeakSet();
  /** Put the mask on every material under `root` that has not had it. Cheap to call again for late arrivals. */
  function applyTo(root) {
    let n = 0;
    root.traverse(o => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if (apply(m)) n++;
      }
    });
    return n;
  }

  /**
   * The same test in plain JS, for the Node checks: `{ sun, sky }` taken away at a point (no normal push).
   */
  function at(x, y, z) {
    const p = [x, y, z];
    let c = 0, keep = 0;
    for (const b of state.boxes) {
      const d = Math.hypot(...p.map((v, i) => Math.max(b.min[i] - v, v - b.max[i], 0)));
      const t = Math.min(1, Math.max(0, d / uniforms.uCvFall.value));
      const k = 1 - t * t * (3 - 2 * t);
      if (k > c) { c = k; keep = b.sky ?? 0; }
    }
    if (c <= 0) return { sun: 0, sky: 0 };
    const s = uniforms.uCvSun.value.toArray();
    let shaft = 0;
    for (const o of state.openings) {
      if (p.some((v, i) => v < o.reach.min[i] || v > o.reach.max[i])) continue;
      const ax = AXIS[o.axis];
      if (Math.abs(s[ax]) < 1e-4) continue;
      const t = (o.at - p[ax]) / s[ax];
      if (t <= 0) continue;
      const q = p.map((v, i) => v + s[i] * t);
      const uv = q.filter((_, i) => i !== ax);
      const e = Math.min(uv[0] - o.lo[0], o.hi[0] - uv[0], uv[1] - o.lo[1], o.hi[1] - uv[1]);
      const u = Math.min(1, Math.max(0, e / uniforms.uCvSoft.value));
      shaft = Math.max(shaft, u * u * (3 - 2 * u));
    }
    return { sun: c * (1 - shaft), sky: c * (1 - keep) };
  }

  const state = { boxes: [], openings: [] };
  set(boxes, openings);
  return { uniforms, set, apply, applyTo, at, get boxes() { return state.boxes; }, get openings() { return state.openings; } };
}
