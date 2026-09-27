/**
 * surfaces.js — Ligar's weather, applied once to everything that was built.
 *
 * A quarry at the foot of a volcano is not a clean place. Four things happen
 * to every object that stands in it for forty years, and a surface that shows
 * none of them reads as a render:
 *
 *  - ASH settles on whatever faces up — ledges, lids, the tops of drums, the
 *    upper faces of a truss — patchily, thickest where the wind drops it.
 *  - The FOOT is dark: the splash line of every rain, damp for days after,
 *    with grit caked into it. It climbs higher on stone than on steel.
 *  - LICHEN grows on stone that has been left alone (never on steel): orange
 *    crusts and grey-green rosettes, on up-facing and shaded faces.
 *  - IRON WEEPS: water running down a face from every joint and bolt leaves a
 *    rust streak, narrow at the top and fanning below.
 *
 * `applyLigarWeather` patches a MeshStandardMaterial in place (chaining any
 * existing onBeforeCompile). It reads the walking surface under every pixel
 * from a baked height texture, so the damp line follows the ground — the
 * plateau, the ramp and the quarry floor alike.
 */

import * as THREE from 'three';

/** The extent of the ground-height texture the weather shader reads. */
export const GROUND_HALF = 140;

/**
 * The walking surface baked to a half-float texture, so a fragment shader can
 * ask how far above the ground it is. Half floats filter linearly on every
 * WebGL2 device, which an 8-bit encoding of a twenty-metre range would not
 * survive (eight centimetre steps in the damp line).
 */
export function createGroundHeightTexture(heightAt, { n = 320, half = GROUND_HALF } = {}) {
  const data = new Uint16Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + (i + 0.5) / n * half * 2;
      const z = -half + (j + 0.5) / n * half * 2;
      data[j * n + i] = THREE.DataUtils.toHalfFloat(heightAt(x, z));
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const WEATHER_NOISE = /* glsl */ `
  float wH(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.231); }
  float wN(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float wF(vec2 p) { return 0.55 * wN(p) + 0.3 * wN(p * 2.3 + 7.1) + 0.15 * wN(p * 5.1 - 3.7); }
`;

/**
 * Weather a material.
 *
 * @param {THREE.Material} mat a MeshStandardMaterial (anything else is left alone)
 * @param {object} o
 *   ground  — the height texture from `createGroundHeightTexture`
 *   ash     — how much settles on what faces up (0…1)
 *   damp    — how high the dark foot climbs (m)
 *   lichen  — stone only: how much grows (0…1)
 *   weep    — rust streaks down steep faces (0…1)
 */
export function applyLigarWeather(mat, { ground, ash = 0.5, damp = 0.35, lichen = 0, weep = 0.2 } = {}) {
  if (!mat || !mat.isMeshStandardMaterial || mat.userData.ligarWeather) return;
  if (mat.transparent || mat.userData.noWeather) return;
  mat.userData.ligarWeather = true;
  const uniforms = {
    uWGround: { value: ground },
    uWHalf: { value: GROUND_HALF },
    uWAsh: { value: ash },
    uWDamp: { value: damp },
    uWLichen: { value: lichen },
    uWWeep: { value: weep }
  };
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWW;
        varying vec3 vWN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 wp = vec4(transformed, 1.0);
          vec3 wn = objectNormal;
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
            wn = mat3(instanceMatrix) * wn;
          #endif
          vWW = (modelMatrix * wp).xyz;
          vWN = normalize(mat3(modelMatrix) * wn);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uWGround;
        uniform float uWHalf;
        uniform float uWAsh;
        uniform float uWDamp;
        uniform float uWLichen;
        uniform float uWWeep;
        varying vec3 vWW;
        varying vec3 vWN;
        float wAsh = 0.0;
        float wDampK = 0.0;
        ${WEATHER_NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 gUv = (vWW.xz + uWHalf) / (2.0 * uWHalf);
          float g = texture2D(uWGround, gUv).r;
          float above = vWW.y - g;
          vec3 N = normalize(vWN);
          float n1 = wF(vWW.xz * 1.9 + vWW.y * 1.3);
          float n2 = wF(vec2(vWW.x + vWW.z, vWW.y) * 0.6);

          // Iron weep: streaks down steep faces, narrow above, fanning below.
          float steep = 1.0 - abs(N.y);
          float along = dot(vWW.xz, normalize(vec2(-N.z, N.x) + 1e-4));
          float streak = wN(vec2(along * 5.0, vWW.y * 0.25 + n2)) * wN(vec2(along * 1.7, vWW.y * 0.1));
          float weep = smoothstep(0.42, 0.62, streak) * steep * uWWeep;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.35, 0.8, 0.55) + vec3(0.03, 0.01, 0.0), weep * 0.6);

          // Lichen: stone only, up-facing and shaded faces, never at the foot.
          float lich = smoothstep(0.64, 0.8, wF(vWW.xz * 0.8 + vWW.y * 0.9 + 3.3)) * uWLichen;
          lich *= smoothstep(-0.3, 0.3, N.y + 0.2) * smoothstep(0.3, 0.9, above);
          vec3 lichC = mix(vec3(0.36, 0.14, 0.04), vec3(0.2, 0.21, 0.15), step(0.55, wN(vWW.xz * 0.3 + vWW.y)));
          diffuseColor.rgb = mix(diffuseColor.rgb, lichC, lich * 0.7);

          // Ash on what faces up.
          float up = smoothstep(0.55, 0.92, N.y);
          wAsh = up * uWAsh * smoothstep(0.3, 0.7, n1 + (n2 - 0.5) * 0.5);
          vec3 ashC = vec3(0.14, 0.118, 0.095) * (0.85 + 0.3 * n1);
          diffuseColor.rgb = mix(diffuseColor.rgb, ashC, wAsh * 0.85);

          // The dark foot: the splash line of every rain, with grit caked in.
          float line = uWDamp * (0.55 + 0.8 * n2);
          wDampK = 1.0 - smoothstep(line * 0.4, line, above + (n1 - 0.5) * 0.1);
          wDampK *= smoothstep(-1.5, -0.1, above + 1.2);
          diffuseColor.rgb *= 1.0 - wDampK * 0.45;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.042, 0.035), wDampK * smoothstep(0.08, 0.0, above) * 0.6);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.97, wAsh);
        roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.7, wDampK * 0.6);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, wAsh);`);
  };
  const key = `${prevKey}|ligar-weather:${ash}:${damp}:${lichen}:${weep}`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}
