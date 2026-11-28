/**
 * teeter/grime.js — What brine and weather leave on the terraces' stone, baked into the masonry (the realism pass,
 * `docs/plans/realism-teeter.md`).
 *
 * A wall that holds up a salt pan is wet from behind. Brine creeps through it and dries on its face, so every
 * terrace wall in a working salt garden carries the same three marks, measured from the ground in front of it:
 *
 *   a DAMP BAND at the foot, darkest where the wall meets the dike and fading over the first metre;
 *   a SALT TIDE LINE above it, a ragged white band where the creeping brine dries out (efflorescence);
 *   STREAKS down the face under the coping, where brine has overflowed and run (pbr-kit `addWorldVariation`).
 *
 * The masonry carries the height of the ground in front of each block as a vertex attribute (`ttFoot`, set by
 * `terrain.js` when the block is built), so the bands follow each wall's own foot whatever terrace it stands on. A
 * block with no ground in front of it (a floor, a roof, a coping stone high over the dike) carries `NO_FOOT` and is
 * left clean. The marks are drawn from that attribute and the fragment's world position; nothing is lit and no
 * texture is added. Only the masonry's own grimed clones (`grimed`) carry this patch: the kit's slabs elsewhere (the
 * spring house, the hosts' plinths) have no `ttFoot` and keep the plain materials.
 */

/** The `ttFoot` of a block that has no ground in front of it: far enough down that no band reaches it. */
export const NO_FOOT = -1000;

const GRIMED = new WeakMap();

/**
 * A clone of `m` that draws the foot's damp band and salt line. One clone per source material.
 * @param {THREE.Material} m
 * @param {{ damp?: number, salt?: number }} opts how dark the damp band goes (0..1) and how white the salt line
 */
export function grimed(m, { damp = 0.36, salt = 0.38 } = {}) {
  if (!m) return m;
  if (GRIMED.has(m)) return GRIMED.get(m);
  // `clone` copies userData through JSON, which would serialise every canvas map listed in it: lift it off first.
  const ud = m.userData;
  m.userData = {};
  const c = m.clone();
  m.userData = ud;
  c.name = `${m.name || 'masonry'}-grimed`;
  c.userData = { ...m.userData, grimeOf: m };
  addFootGrime(c, { damp, salt });
  GRIMED.set(m, c);
  return c;
}

/** The patch itself. Chains any `onBeforeCompile` already on the material and keeps every `#include` it touches. */
export function addFootGrime(material, { damp = 0.36, salt = 0.5 } = {}) {
  if (!material || material.userData.footGrime) return material;
  material.userData.footGrime = true;
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uTtDamp = { value: damp };
    shader.uniforms.uTtSalt = { value: salt };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float ttFoot;
        varying float vTtFootH;
        varying vec3 vTtFPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 ttw = modelMatrix * vec4(transformed, 1.0);
          vTtFPos = ttw.xyz;
          vTtFootH = ttw.y - ttFoot;
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTtDamp;
        uniform float uTtSalt;
        varying float vTtFootH;
        varying vec3 vTtFPos;
        float ttDampV = 0.0;
        float ttSaltV = 0.0;
        float ttgH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float ttgN(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(ttgH(i), ttgH(i + vec2(1.0, 0.0)), f.x), mix(ttgH(i + vec2(0.0, 1.0)), ttgH(i + vec2(1.0, 1.0)), f.x), f.y);
        }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          // Along the wall: the walls run north-south or east-west, so x + z is a distance along any of them.
          float s = vTtFPos.x * 0.83 + vTtFPos.z;
          float h = vTtFootH + (ttgN(vec2(s * 0.9, 1.3)) - 0.5) * 0.14;
          float hp = max(h, 0.0);
          ttDampV = (exp(-hp / 0.26) * 0.75 + exp(-hp / 1.05) * 0.25) * step(-3.0, h);
          // The tide line wanders up and down the wall (0.4 to 0.9 m) and thins and breaks along it.
          float t0 = 0.62 + (ttgN(vec2(s * 0.21, 7.1)) - 0.5) * 0.5;
          float top = t0 + 0.18 + 0.38 * ttgN(vec2(s * 1.3, 3.3));
          float band = smoothstep(t0 - 0.06, t0 + 0.02, h) * (1.0 - smoothstep(t0 + 0.05, top, h));
          band *= smoothstep(0.25, 0.75, ttgN(vec2(s * 2.7, h * 5.0)) * 0.6 + ttgN(vec2(s * 0.6, 9.0)) * 0.6);
          ttSaltV = band * uTtSalt;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.89, 0.85), ttSaltV);
          diffuseColor.rgb *= 1.0 - ttDampV * uTtDamp;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor - ttDampV * uTtDamp * 0.45 + ttSaltV * 0.1, 0.04, 1.0);`);
  };
  const key = `${prevKey}|ttgrime:${damp}:${salt}`;
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
  return material;
}
