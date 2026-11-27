/**
 * ship/wear.js — The dirt that forty years of crew leave on a ship.
 *
 * A texture tile repeats; dirt does not. Every lit surface aboard is patched
 * here with grime worked out from its WORLD position and facing, so it runs
 * continuously across part boundaries the way real dirt does:
 *
 *   - a broad mottle, so no two metres of wall are the same tone
 *   - scuffing and dark dirt along the bottom of everything, where boots and
 *     carts and mop water reach
 *   - drip streaks down vertical faces, under every ledge
 *   - soot on the deckhead and on the undersides of things
 *   - a film of dust on surfaces that face up, above the deck
 *   - fine relief (pitting, hairline scratches, old paint's orange-peel) in
 *     the shading normal, close to the camera only
 *
 * Grime is darkening and dulling only: it never adds light, never adds colour
 * that is not already brown-grey, and raises roughness where it lies, which is
 * what takes the showroom sheen off the metal.
 */

const VERT_DECL = /* glsl */`
varying vec3 vWearPos;
varying vec3 vWearNrm;
`;

const VERT_BODY = /* glsl */`
{
  vec4 wearLocal = vec4(transformed, 1.0);
  vec3 wearN = objectNormal;
  #ifdef USE_INSTANCING
    wearLocal = instanceMatrix * wearLocal;
    wearN = mat3(instanceMatrix) * wearN;
  #endif
  vWearPos = (modelMatrix * wearLocal).xyz;
  vWearNrm = normalize(mat3(modelMatrix) * wearN);
}
`;

const FRAG_DECL = /* glsl */`
varying vec3 vWearPos;
varying vec3 vWearNrm;
uniform float uWearDeck;
uniform float uWearCeil;

float wearHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float wearNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wearHash(i), wearHash(i + vec3(1, 0, 0)), f.x),
                 mix(wearHash(i + vec3(0, 1, 0)), wearHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(wearHash(i + vec3(0, 0, 1)), wearHash(i + vec3(1, 0, 1)), f.x),
                 mix(wearHash(i + vec3(0, 1, 1)), wearHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float wearFbm(vec3 p) {
  return wearNoise(p) * 0.55 + wearNoise(p * 2.03 + 7.1) * 0.3 + wearNoise(p * 4.11 + 3.7) * 0.15;
}

/*
 * Surface relief too fine to model: pitting, hairline scratches and the
 * orange-peel of old paint, as a height in world space. It fades out with
 * distance, where it could only shimmer.
 */
float wearRelief(vec3 p) {
  float peel = wearNoise(p * 55.0) * 0.35;
  float pits = smoothstep(0.78, 0.95, wearNoise(p * 22.0 + 3.0)) * -1.0;
  vec3 q = p * vec3(4.0, 90.0, 4.0) + vec3(p.y * 3.0, 0.0, p.x * 2.0);
  float scratch = smoothstep(0.86, 1.0, wearNoise(q)) * -0.6;
  return peel + pits + scratch;
}

/* How dirty this point is, 0..1, and how much dust lies on it. */
vec2 wearAmount() {
  vec3 p = vWearPos;
  vec3 n = normalize(vWearNrm);
  float up = n.y;
  float side = 1.0 - abs(up);
  float h = p.y - uWearDeck;

  float mottle = smoothstep(0.35, 0.85, wearFbm(p * 0.9));

  // The low band: dirt kicked and mopped up the bottom 0.6 m of everything.
  float low = (1.0 - smoothstep(0.0, 0.6, h)) * (0.55 + 0.45 * wearNoise(p * vec3(6.0, 2.0, 6.0)));

  // Drip streaks: fine across, long down, only on faces that stand upright.
  float streak = wearNoise(vec3(p.x * 14.0 + p.z * 14.0, p.y * 0.7, p.z * 3.0 - p.x * 3.0));
  streak = smoothstep(0.62, 0.95, streak) * side * smoothstep(0.3, 0.9, wearNoise(p * 0.6 + 11.0));

  // Soot under the deckhead and on the underside of everything.
  float soot = smoothstep(uWearCeil - 0.9, uWearCeil, p.y) * 0.6 + max(0.0, -up) * 0.35;

  // The deck itself: traffic-dark in patches.
  float deck = step(0.7, up) * (1.0 - smoothstep(0.02, 0.12, h)) * wearFbm(p * 1.7);

  float dirt = clamp(mottle * 0.35 + low * 0.55 + streak * 0.5 + soot * 0.5 + deck * 0.45, 0.0, 1.0);
  float dust = step(0.6, up) * smoothstep(0.15, 0.4, h) * (0.4 + 0.6 * wearFbm(p * 3.0 + 5.0));
  return vec2(dirt, dust);
}
`;

const FRAG_COLOR = /* glsl */`
vec2 wearAmt = wearAmount();
{
  vec3 grime = vec3(0.16, 0.14, 0.12);
  float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  // Dirt pulls the colour down toward brown-grey; dust pulls it toward a pale
  // flat grey and takes the saturation with it.
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * grime * 4.0, wearAmt.x * 0.55);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * 0.9 + vec3(0.05, 0.045, 0.04), wearAmt.y * 0.3);
}
`;

const FRAG_NORMAL = /* glsl */`
{
  float wearFade = 1.0 - smoothstep(2.5, 7.0, length(vViewPosition));
  if (wearFade > 0.0) {
    float hgt = wearRelief(vWearPos) * 0.0016 * wearFade;
    float dHdx = dFdx(hgt), dHdy = dFdy(hgt);
    vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
    vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
    float det = dot(sx, r1) * faceDirection;
    vec3 grad = sign(det) * (dHdx * r1 + dHdy * r2);
    normal = normalize(abs(det) * normal - grad);
  }
}
`;

const FRAG_ROUGH = /* glsl */`
roughnessFactor = clamp(roughnessFactor + wearAmt.x * 0.22 + wearAmt.y * 0.3, 0.0, 1.0);
`;

/**
 * Patch every lit material under `root` with the grime pass. `deckY` and
 * `ceilY` are the world heights of the deck and the deckhead. Materials that
 * are lamps, screens or glass are left alone.
 */
export function applyShipWear(root, { deckY = 0, ceilY = 3 } = {}) {
  const done = new Set();
  root.traverse(o => {
    if (!o.isMesh || !o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || done.has(m)) continue;
      done.add(m);
      if (!m.isMeshStandardMaterial || m.transparent || m.userData.noWear) continue;
      patch(m, deckY, ceilY);
    }
  });
}

function patch(mat, deckY, ceilY) {
  // Taken before the patch replaces onBeforeCompile: three's default key is
  // that function's source, so afterwards every patched material would claim
  // one program whatever other patch it already carried.
  const prevKey = mat.customProgramCacheKey();
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    shader.uniforms.uWearDeck = { value: deckY };
    shader.uniforms.uWearCeil = { value: ceilY };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_DECL}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_DECL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${FRAG_COLOR}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${FRAG_ROUGH}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAG_NORMAL}`);
  };
  mat.customProgramCacheKey = () => `${prevKey}|shipwear`;
  mat.needsUpdate = true;
}
