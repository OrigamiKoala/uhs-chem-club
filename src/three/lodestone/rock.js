/**
 * lodestone/rock.js — The banded iron the canyon is cut through, drawn per pixel by where it lies in the world.
 *
 * WHAT THE ROCK IS. Banded iron formation: beds laid down flat, a few centimetres to a metre thick, of red jasper and
 * pale chert alternating with dark iron oxide (steel-grey hematite that catches the light, black magnetite that does
 * not). The beds are flat over the whole site, with a gentle warp, so a band seen on one wall is at the same height on
 * the wall opposite and round the next bend. That is how the rock is drawn: the colour of a rock face is a function of
 * its HEIGHT IN THE WORLD (and a little of x and z, for the warp), never of its texture coordinates, so the bands run
 * level and unbroken across the ground mesh, the canyon's faces and the alcoves' roofs, however they were built.
 *
 * WHAT THE FLOOR IS. Where a surface faces up it is the dry wash's floor: the canyon's own gravel (the texture map), with
 * black iron sand gathered along the runnel down the middle of a run, where water last ran.
 *
 * `bandRock(material)` adds this to a MeshStandardMaterial (its map supplies grain); it chains any `onBeforeCompile`, and
 * the cover mask (`lib/cover.js`) chains after it. `bandAt(y)` is the same banding in plain JS, for the hosts to colour
 * a seam or a core box the colour of the band it was cut from.
 */

import * as THREE from 'three';

/**
 * What stains or crosses a face, by index (the second number of a geometry's `lsStain` attribute; the first is how
 * much): 0 copper's blue-green, 1 iron's ochre, 2 the black of manganese and magnetite. A geometry with no `lsStain`
 * reads 0 for both, so it is unstained.
 */
export const STAIN = [[0.07, 0.2, 0.17], [0.42, 0.22, 0.06], [0.022, 0.021, 0.024]];

/** The four rocks of the formation, in linear colour. */
export const ROCK = {
  jasper: [0.42, 0.13, 0.085],
  chert: [0.5, 0.37, 0.31],
  hematite: [0.2, 0.19, 0.2],
  magnetite: [0.055, 0.053, 0.058]
};

const GLSL = /* glsl */ `
  varying vec3 vLsWorld;
  varying vec3 vLsNormal;
  float lsH1(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
  float lsN1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(lsH1(i), lsH1(i + 1.0), f); }
  float lsH2(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
  float lsN2(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(lsH2(i), lsH2(i + vec2(1, 0)), u.x), mix(lsH2(i + vec2(0, 1)), lsH2(i + vec2(1, 1)), u.x), u.y);
  }
  // The beds: x is how much iron oxide (0 jasper or chert, 1 iron), y is 1 for magnetite and 0 for hematite, z is chert.
  vec3 lsBeds(vec3 p) {
    float y = p.y + (lsN2(p.xz * 0.035) - 0.5) * 1.1 + (lsN2(p.xz * 0.19) - 0.5) * 0.08;
    float meso = lsN1(y * 1.25 + 3.0);
    float micro = fract(y * 9.0 + lsN1(y * 2.7) * 1.7);
    float iron = step(micro, mix(0.18, 0.62, smoothstep(0.35, 0.8, meso)));
    float mag = step(0.58, lsN1(y * 0.9 + 11.0));
    float chert = smoothstep(0.45, 0.75, lsN1(y * 3.1 + 7.0));
    return vec3(iron, mag, chert);
  }
`;

/**
 * Put the banded rock on a material. `floorTint` colours the gravel's map where a surface faces up; `faceGrain` how
 * much of the map's grain shows on a face.
 */
export function bandRock(material, { floorTint = [0.86, 0.72, 0.66], faceGrain = 0.55 } = {}) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec2 lsStain;
        varying vec3 vLsWorld;
        varying vec3 vLsNormal;
        varying vec2 vLsStain;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vLsStain = lsStain;
        {
          vec4 lsP = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            lsP = instanceMatrix * lsP;
          #endif
          vLsWorld = (modelMatrix * lsP).xyz;
          vLsNormal = normalize(mat3(modelMatrix) * objectNormal);
        }`);
    const J = ROCK.jasper, C = ROCK.chert, H = ROCK.hematite, M = ROCK.magnetite;
    const v3 = a => `vec3(${a.map(n => n.toFixed(4)).join(', ')})`;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        ${GLSL}
        varying vec2 vLsStain;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float lsFace = 1.0 - smoothstep(0.55, 0.82, normalize(vLsNormal).y);
        vec3 lsB = lsBeds(vLsWorld);
        float lsGrain = dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2));
        vec3 lsStone = mix(${v3(J)}, ${v3(C)}, lsB.z * 0.8);
        vec3 lsIron = mix(${v3(H)}, ${v3(M)}, lsB.y);
        vec3 lsRock = mix(lsStone, lsIron, lsB.x) * (1.0 - ${faceGrain.toFixed(2)} + ${faceGrain.toFixed(2)} * lsGrain * 2.6);
        // What has seeped down or crosses a face: a stain or a seam (\`lsStain\`: how much, and which).
        vec3 lsStainC = vLsStain.y < 0.5 ? ${v3(STAIN[0])} : (vLsStain.y < 1.5 ? ${v3(STAIN[1])} : ${v3(STAIN[2])});
        lsRock = mix(lsRock, lsStainC * (0.75 + lsGrain * 0.9), clamp(vLsStain.x, 0.0, 1.0));
        // The dry wash's floor: its gravel, darker with iron sand where a surface lies lowest in its run.
        vec3 lsFloor = diffuseColor.rgb * ${v3(floorTint)};
        float lsSand = smoothstep(0.55, 0.85, lsN2(vLsWorld.xz * 0.45)) * 0.35;
        lsFloor = mix(lsFloor, ${v3(M)} * 2.2, lsSand * (1.0 - lsFace));
        diffuseColor.rgb = mix(lsFloor, lsRock, lsFace);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.55, lsFace * lsB.x * (1.0 - lsB.y));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.48, lsFace * lsB.x * (1.0 - lsB.y));`);
  };
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.customProgramCacheKey = () => `${prevKey}|lodestone-rock`;
  material.userData.bandedRock = true;
  material.needsUpdate = true;
  return material;
}

/** The band at height `y` (no warp), in plain JS: 'jasper' | 'chert' | 'hematite' | 'magnetite'. */
export function bandAt(y) {
  const h1 = n => { const v = Math.sin(n * 91.3458) * 47453.5453; return v - Math.floor(v); };
  const n1 = x => { const i = Math.floor(x); let f = x - i; f = f * f * (3 - 2 * f); return h1(i) + (h1(i + 1) - h1(i)) * f; };
  const meso = n1(y * 1.25 + 3);
  const micro = ((y * 9 + n1(y * 2.7) * 1.7) % 1 + 1) % 1;
  const t = Math.min(1, Math.max(0, (meso - 0.35) / 0.45));
  const iron = micro < 0.18 + (0.62 - 0.18) * t * t * (3 - 2 * t);
  if (iron) return n1(y * 0.9 + 11) > 0.58 ? 'magnetite' : 'hematite';
  return n1(y * 3.1 + 7) > 0.6 ? 'chert' : 'jasper';
}

/** A colour for a band, as a THREE.Color (linear). */
export const bandColor = name => new THREE.Color(...ROCK[name]);
