/**
 * lib/cover.js — the cover mask for stock materials: inside a roofed room the sun and the sky do not reach.
 *
 * A phone has no shadow map, so without this a roofed room is as bright as open ground. A world declares its rooms as boxes; a fragment
 * inside one has the directional light, the hemisphere and the environment taken away, with a short falloff outside each box so a doorway
 * is dim rather than cut. Lamps (the pool's point lights) are left alone, so inside a room the lamps are the light. The boxes are uniforms
 * set once, never per frame. Lifted from Ligar's `ligarCover` (`ligar/atmosphere.js`), which keeps its own copy with its own fog.
 *
 * OPT-IN: nothing changes for a world that does not call `createCover`. Use:
 *   const cover = createCover(8); cover.set(boxes); cover.apply(material)   // for every lit material of the world
 */

import * as THREE from 'three';

export function createCover(count = 8, fall = 1.4) {
  const far = v => new THREE.Vector3(v, v, v);
  const uniforms = {
    uCoverLo: { value: Array.from({ length: count }, () => far(1e6)) },
    uCoverHi: { value: Array.from({ length: count }, () => far(-1e6)) },
    uCoverFall: { value: fall }
  };
  const pars = /* glsl */ `
    uniform vec3 uCoverLo[${count}];
    uniform vec3 uCoverHi[${count}];
    uniform float uCoverFall;
    varying vec3 vCoverWorld;
    float coverAt(vec3 p) {
      float c = 0.0;
      for (int i = 0; i < ${count}; i++) {
        vec3 d = max(max(uCoverLo[i] - p, p - uCoverHi[i]), 0.0);
        c = max(c, 1.0 - smoothstep(0.0, uCoverFall, length(d)));
      }
      return c;
    }`;
  const begin = THREE.ShaderChunk.lights_fragment_begin
    .replace('IncidentLight directLight;', 'IncidentLight directLight;\n float coverK = coverAt(vCoverWorld);')
    .replace('getDirectionalLightInfo( directionalLight, directLight );', 'getDirectionalLightInfo( directionalLight, directLight );\n directLight.color *= 1.0 - coverK;');
  const end = `${THREE.ShaderChunk.lights_fragment_end}
    reflectedLight.indirectDiffuse *= 1.0 - coverK * 0.94;
    reflectedLight.indirectSpecular *= 1.0 - coverK * 0.94;`;

  return {
    uniforms,
    /** Give the mask its boxes: `[{ min: [x, y, z], max: [x, y, z] }, ...]`, at most `count`. */
    set(boxes) {
      if (boxes.length > count) throw new Error(`cover: ${boxes.length} boxes, the mask holds ${count}`);
      uniforms.uCoverLo.value.forEach(v => v.setScalar(1e6));
      uniforms.uCoverHi.value.forEach(v => v.setScalar(-1e6));
      boxes.forEach((b, i) => { uniforms.uCoverLo.value[i].set(...b.min); uniforms.uCoverHi.value[i].set(...b.max); });
    },
    /** Patch one lit material (MeshStandardMaterial and its kin). Chains an existing onBeforeCompile; safe to call twice. */
    apply(mat) {
      if (!mat || mat.userData.covered || mat.isShaderMaterial || mat.isMeshBasicMaterial || !mat.isMaterial) return;
      mat.userData.covered = true;
      const prev = mat.onBeforeCompile;
      const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : null;
      mat.onBeforeCompile = (shader, renderer) => {
        prev?.call(mat, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vCoverWorld;')
          .replace('#include <project_vertex>', `#include <project_vertex>
            vec4 coverPos = vec4( transformed, 1.0 );
            #ifdef USE_INSTANCING
              coverPos = instanceMatrix * coverPos;
            #endif
            vCoverWorld = ( modelMatrix * coverPos ).xyz;`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>\n${pars}`)
          .replace('#include <lights_fragment_begin>', begin)
          .replace('#include <lights_fragment_end>', end);
      };
      mat.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}|cover${count}`;
      mat.needsUpdate = true;
    }
  };
}

/** Is a point inside any of the boxes? For checks. */
export const covered = (boxes, [x, y, z]) => boxes.some(b => x >= b.min[0] && x <= b.max[0] && y >= b.min[1] && y <= b.max[1] && z >= b.min[2] && z <= b.max[2]);
