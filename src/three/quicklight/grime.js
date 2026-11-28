/**
 * quicklight/grime.js — What rain, oil and fifty years leave on the refinery's concrete (the realism pass,
 * `docs/plans/realism-quicklight.md`). Two shader patches, both opt-in and keyed to world position:
 *
 *   FOOT GRIME on the cast concrete (walls, retaining faces, kerbs, skirts, plinths): a damp band at the foot of every
 *   vertical face, darkest where the wall meets its floor and fading over the first metre, a little warm where oil and
 *   rust have washed into it, and glossier (wet). Each body carries the height of the floor in front of it as a vertex
 *   attribute (`ttFoot`, set by `terrain.js`), so the band follows each wall's own floor at whatever level it stands
 *   (the yard, the plot, the bund, a sunk room). A body with no floor in front of it carries NO_FOOT and stays clean.
 *   Tops and soffits are left alone: only faces that stand up wear the band.
 *
 *   SAWN JOINTS in the paving: hardstanding is laid in bays and the joints are sawn after it sets. A thin dark line
 *   every `pitch` metres both ways, with a little dirt either side of it, drawn crisp at any distance (it fades out
 *   before it can shimmer).
 *
 * Nothing here is lit and no texture is added. Same attribute name as Teeter's patch (`teeter/grime.js`), which this
 * does not import or change.
 */

import { GRADE, PLOT, PIT, CELLAR, CAT } from './refinery-plan.js';
import * as THREE from 'three';

/** The `ttFoot` of a body with no floor in front of it: far enough down that no band reaches it. */
export const NO_FOOT = -1000;

/** Set a geometry's foot (one height for every vertex). */
export function tagFoot(geo, foot) {
  const n = geo.attributes.position.count;
  geo.setAttribute('ttFoot', new THREE.BufferAttribute(new Float32Array(n).fill(foot), 1));
  return geo;
}

/** The floor levels a cast body can stand on, highest first. */
const LEVELS = [PLOT, CAT, GRADE, CELLAR, PIT].sort((a, b) => b - a);

/**
 * The floor a body stands on, from its own base: a wall is cast from a little under its floor (0.3–0.4 m) and a
 * plinth from on it, so the highest level from its base to 0.65 m over it. NO_FOOT when it stands on none (a roof, a
 * lintel high over the floor).
 */
export function footFor(geo) {
  const p = geo.attributes.position;
  let minY = Infinity;
  for (let i = 0; i < p.count; i++) minY = Math.min(minY, p.getY(i));
  for (const L of LEVELS) if (L >= minY - 0.05 && L <= minY + 0.65) return L;
  return NO_FOOT;
}

const NOISE = `
  float qgH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float qgN(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(qgH(i), qgH(i + vec2(1.0, 0.0)), f.x), mix(qgH(i + vec2(0.0, 1.0)), qgH(i + vec2(1.0, 1.0)), f.x), f.y);
  }`;

/** A clone of `m` that draws the foot grime: one clone per source material, made once. */
const FOOT = new WeakMap();
export function footGrimed(m, opts = {}) {
  if (!m) return m;
  if (FOOT.has(m)) return FOOT.get(m);
  // `clone` copies userData through JSON, which would serialise every canvas map listed in it: lift it off first.
  const ud = m.userData;
  m.userData = {};
  const c = m.clone();
  m.userData = ud;
  c.name = `${m.name || 'concrete'}-grimed`;
  c.userData = { ...ud, grimeOf: m };
  addFootGrime(c, opts);
  FOOT.set(m, c);
  return c;
}

/** The foot grime patch. Chains any `onBeforeCompile` already on the material and keeps every `#include` it touches. */
export function addFootGrime(material, { damp = 0.4 } = {}) {
  if (!material || material.userData.qlFootGrime) return material;
  material.userData.qlFootGrime = true;
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uQgDamp = { value: damp };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float ttFoot;
        varying float vQgFootH;
        varying float vQgUp;
        varying vec3 vQgPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 qw = modelMatrix * vec4(transformed, 1.0);
          vQgPos = qw.xyz;
          vQgFootH = qw.y - ttFoot;
          vQgUp = abs(normalize(mat3(modelMatrix) * objectNormal).y);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uQgDamp;
        varying float vQgFootH;
        varying float vQgUp;
        varying vec3 vQgPos;
        float qgDampV = 0.0;
        ${NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          // Along the wall: every wall runs north-south or east-west, so x + z is a distance along any of them.
          float s = vQgPos.x * 0.83 + vQgPos.z;
          float h = vQgFootH + (qgN(vec2(s * 0.8, 1.3)) - 0.5) * 0.16 + (qgN(vec2(s * 4.0, 2.1)) - 0.5) * 0.05;
          float hp = max(h, 0.0);
          float stand = 1.0 - smoothstep(0.35, 0.75, vQgUp);
          qgDampV = (exp(-hp / 0.22) * 0.68 + exp(-hp / 0.95) * 0.32) * step(-2.0, h) * stand;
          // Splashback: the first hand's breadth is speckled where rain bounced off the floor.
          qgDampV *= 0.85 + 0.3 * qgN(vec2(s * 9.0, vQgPos.y * 9.0)) * exp(-hp / 0.2);
          diffuseColor.rgb *= 1.0 - qgDampV * uQgDamp;
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.97, 0.94, 0.89), qgDampV);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor - qgDampV * uQgDamp * 0.5, 0.04, 1.0);`);
  };
  const key = `${prevKey}|qlfoot:${damp}`;
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
  return material;
}

/** The sawn joints patch, for the paving. `pitch` the bay size (m), `offset` where the grid starts. */
export function addSawnJoints(material, { pitch = 6, offset = [1.5, 2.5], dark = 0.55 } = {}) {
  if (!material || material.userData.qlJoints) return material;
  material.userData.qlJoints = true;
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uQjPitch = { value: pitch };
    shader.uniforms.uQjOff = { value: new THREE.Vector2(...offset) };
    shader.uniforms.uQjDark = { value: dark };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vQjPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vQjPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uQjPitch;
        uniform vec2 uQjOff;
        uniform float uQjDark;
        varying vec3 vQjPos;
        float qjCut = 0.0;
        ${NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 q = (vQjPos.xz + uQjOff) / uQjPitch;
          vec2 f = abs(fract(q) - 0.5);
          vec2 d = (0.5 - f) * uQjPitch;                       // metres to the nearest joint, each way
          vec2 fw = max(fwidth(vQjPos.xz), vec2(1e-4));
          // A sawn joint is 6 mm wide and a little ragged where the blade left the edge spalled.
          float wob = (qgN(vQjPos.xz * 3.1) - 0.5) * 0.004;
          vec2 cut = 1.0 - smoothstep(vec2(0.004 + wob), vec2(0.004 + wob) + fw * 1.2, d);
          vec2 fade = clamp(0.03 / fw, 0.0, 1.0);             // gone before it can shimmer
          vec2 dirt = exp(-d / 0.05) * 0.35;
          qjCut = max(cut.x * fade.x, cut.y * fade.y);
          float grime = max(dirt.x * fade.x, dirt.y * fade.y);
          diffuseColor.rgb *= 1.0 - uQjDark * max(qjCut, grime * 0.4);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + qjCut * 0.1, 0.04, 1.0);`);
  };
  const key = `${prevKey}|qljoints:${pitch}:${offset.join(',')}:${dark}`;
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
  return material;
}
