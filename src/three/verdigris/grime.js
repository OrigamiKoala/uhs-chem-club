/**
 * verdigris/grime.js — What standing water leaves on the fort's stone and the boardwalks' timber, baked into the
 * masonry and the decks (the realism pass, `docs/plans/realism-verdigris.md`).
 *
 * Everything that stands in the swamp stands in the SAME water (`WATER`), so its marks are measured from one height:
 *
 *   under the water the stone and timber are dark and green;
 *   an ALGAE BAND from the water up about 40 cm, near black-green and slick, its top edge ragged;
 *   a DAMP zone above it, darkening that fades over the next metre;
 *   an OLD HIGH-WATER LINE a metre up, a thin pale band of lime and dried scum from when the swamp stood higher,
 *   broken along its length.
 *
 * Only faces that look out over the water carry the marks: the masonry and the decks carry `vdOut` (1 out, 0 into a
 * room), set by `terrain.js` as each block is finished. Anything without the attribute (the hosts, the far country)
 * reads 0 and is left clean. Nothing is lit and no texture is added; the marks are drawn from the attribute and the
 * fragment's world position.
 */

import { WATER } from './fort-plan.js';

const GRIMED = new WeakMap();

/**
 * A clone of `m` that draws the waterline's marks. One clone per source material.
 * @param {THREE.Material} m
 * @param {{ algae?: number, damp?: number, line?: number }} opts how dark the algae band and the damp go (0..1), how
 *   pale the old high-water line
 */
export function grimed(m, { algae = 0.85, damp = 0.4, line = 0.45 } = {}) {
  if (!m) return m;
  if (GRIMED.has(m)) return GRIMED.get(m);
  // `clone` copies userData through JSON, which would serialise every canvas map listed in it: lift it off first.
  const ud = m.userData;
  m.userData = {};
  const c = m.clone();
  m.userData = ud;
  c.name = `${m.name || 'masonry'}-waterline`;
  c.userData = { ...m.userData, grimeOf: m };
  addWaterline(c, { algae, damp, line });
  GRIMED.set(m, c);
  return c;
}

/** The patch itself. Chains any `onBeforeCompile` already on the material and keeps every `#include` it touches. */
export function addWaterline(material, { algae = 0.85, damp = 0.4, line = 0.45 } = {}) {
  if (!material || material.userData.waterline) return material;
  material.userData.waterline = true;
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uVdWater = { value: WATER };
    shader.uniforms.uVdAlgae = { value: algae };
    shader.uniforms.uVdDamp = { value: damp };
    shader.uniforms.uVdLine = { value: line };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float vdOut;
        varying float vVdOut;
        varying vec3 vVdWPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vVdOut = vdOut;
        vVdWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uVdWater, uVdAlgae, uVdDamp, uVdLine;
        varying float vVdOut;
        varying vec3 vVdWPos;
        float vdWet = 0.0;
        float vdgH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vdgN(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(vdgH(i), vdgH(i + vec2(1.0, 0.0)), f.x), mix(vdgH(i + vec2(0.0, 1.0)), vdgH(i + vec2(1.0, 1.0)), f.x), f.y);
        }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        if (vVdOut > 0.5) {
          // Along a wall: every wall runs north-south or east-west, so x + z is a distance along any of them.
          float s = vVdWPos.x * 0.91 + vVdWPos.z;
          float h = vVdWPos.y - uVdWater;
          // The algae band: its top wanders a few centimetres and drips down in short tongues.
          float top = 0.4 + (vdgN(vec2(s * 1.7, 2.1)) - 0.5) * 0.16 + vdgN(vec2(s * 9.0, 5.3)) * 0.14;
          float algae = 1.0 - smoothstep(top - 0.05, top + 0.03, h);
          float under = 1.0 - smoothstep(-0.05, 0.02, h);
          float dampV = exp(-max(h - top, 0.0) / 0.7) * (1.0 - algae);
          // Slime darkens and greens what is under it; the stone's own grain still shows through.
          vec3 slime = vec3(0.24, 0.31, 0.19) * (0.8 + 0.4 * vdgN(vec2(s * 3.0, h * 12.0)));
          diffuseColor.rgb *= mix(vec3(1.0), slime, algae * uVdAlgae);
          diffuseColor.rgb *= 1.0 - under * 0.25;
          diffuseColor.rgb *= 1.0 - dampV * uVdDamp;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 1.0, 0.88), dampV * 0.6);
          // The old high-water line, broken and wandering between 1.0 and 1.3 m.
          float l0 = 1.15 + (vdgN(vec2(s * 0.23, 7.7)) - 0.5) * 0.3;
          float band = smoothstep(l0 - 0.03, l0, h) * (1.0 - smoothstep(l0 + 0.02, l0 + 0.09 + 0.06 * vdgN(vec2(s * 2.1, 3.0)), h));
          band *= smoothstep(0.35, 0.7, vdgN(vec2(s * 1.9, 1.0)) * 0.7 + vdgN(vec2(s * 0.5, 4.0)) * 0.5);
          // Dried scum is patchy across its own width too, and thins where it ran down the face.
          band *= 0.55 + 0.45 * vdgN(vec2(s * 11.0, h * 30.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.64, 0.56), band * uVdLine);
          vdWet = max(algae, max(under, dampV * 0.5));
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(mix(roughnessFactor, 0.32, vdWet * 0.75), 0.04, 1.0);`);
  };
  const key = `${prevKey}|vdwaterline:${algae}:${damp}:${line}`;
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
  return material;
}
