/**
 * ember/ground.js — the photographed ground of Ember Reach (realism pass, `docs/plans/realism-ember.md`).
 *
 * The terrain mesh's uvs are planar in x and z, so a photograph laid on them smears down every cliff. This patch
 * samples the ground in WORLD METRES instead:
 *  - flat and gentle ground takes crushed cinder (pack `cinder`) projected from above,
 *  - steep ground and cliffs take broken basalt (pack `basalt`) projected on all three axes (triplanar), so a
 *    vertical face is as sharp as a level one,
 *  - the boundary between them is broken up with noise, so the road shoulder frays into rock rather than ruling a line,
 *  - a second, rotated, coarser sample is blended in patches (anti-tile) and a much coarser one takes over far away,
 *    so the 2 m photograph never repeats visibly from anywhere on the walk.
 * The vertex paint (strata, sulphur, scoria) still sets the colour: each photograph is divided by its own mean, so it
 * adds grain and relief, not tone.
 *
 * CONTACT. Ground that meets a wall or a standing thing is darker at the foot (the sky cannot reach it, and dust and
 * damp collect there): boxes [cx, cz, halfX, halfZ] and circles [x, z, r, strength], as distance fields.
 *
 * The patch is installed when the world is built, with 1×1 stand-ins and `uEGOn` = 0, so the procedural maps draw
 * until the packs land; then the textures are handed in as uniforms and `uEGOn` set, which changes no program.
 */

import * as THREE from 'three';

export const MAX_CONTACT_BOXES = 24;
export const MAX_CONTACT_CIRCLES = 40;

/** Real size (m) of one tile of each photograph (public/textures/ember/LICENSE.md). */
export const GROUND_TILE = { cinder: 1.81, basalt: 2.0 };
/** Mean albedo of each graded photograph (tools/textures/prep_ember.py prints them). */
const GROUND_MEAN = { cinder: [0.627, 0.481, 0.35], basalt: [0.318, 0.3, 0.28] };

function standIn(rgb) {
  const t = new THREE.DataTexture(new Uint8Array([...rgb, 255]), 1, 1, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}

/**
 * Install the patch on the terrain material. Returns the uniforms (also on `mat.userData.groundUniforms`).
 * @param {THREE.MeshStandardMaterial} mat
 */
export function patchEmberGround(mat) {
  const grey = standIn([128, 128, 128]), flat = standIn([128, 128, 255]), arm = standIn([255, 230, 0]);
  const lumOf = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const u = {
    uEGOn: { value: 0 },
    uCinderAlb: { value: grey }, uCinderNor: { value: flat }, uCinderArm: { value: arm },
    uBasaltAlb: { value: grey }, uBasaltNor: { value: flat }, uBasaltArm: { value: arm },
    uCinderTile: { value: GROUND_TILE.cinder },
    uBasaltTile: { value: GROUND_TILE.basalt },
    // Divide each photograph by its luminance mean, keeping its own hue (red cinder grains stay red).
    uCinderGain: { value: 1 / lumOf(GROUND_MEAN.cinder) },
    uBasaltGain: { value: 1 / lumOf(GROUND_MEAN.basalt) },
    uContactBox: { value: Array.from({ length: MAX_CONTACT_BOXES }, () => new THREE.Vector4()) },
    uContactCirc: { value: Array.from({ length: MAX_CONTACT_CIRCLES }, () => new THREE.Vector4()) },
    uContactN: { value: 0 },
    uContactCN: { value: 0 }
  };
  mat.userData.groundUniforms = u;
  mat.userData.groundStandIns = [grey, flat, arm];
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vEGPos;
        varying vec3 vEGN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vEGPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vEGN = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uEGOn;
        uniform sampler2D uCinderAlb, uCinderNor, uCinderArm, uBasaltAlb, uBasaltNor, uBasaltArm;
        uniform float uCinderTile, uBasaltTile, uCinderGain, uBasaltGain;
        uniform vec4 uContactBox[${MAX_CONTACT_BOXES}];
        uniform vec4 uContactCirc[${MAX_CONTACT_CIRCLES}];
        uniform int uContactN, uContactCN;
        varying vec3 vEGPos;
        varying vec3 vEGN;
        float egH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float egNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(egH(i), egH(i + vec2(1, 0)), f.x), mix(egH(i + vec2(0, 1)), egH(i + vec2(1, 1)), f.x), f.y);
        }
        // Per-fragment ground state, filled once in map_fragment and read by the later chunks.
        float egRockW = 0.0;
        float egContact = 0.0;
        vec3 egArm = vec3(1.0, 0.9, 0.0);
        vec3 egNorW = vec3(0.0, 1.0, 0.0);
        const mat2 EG_ROT = mat2(0.8, -0.6, 0.6, 0.8);

        // Whiteout-blended triplanar normal (world space) and albedo/arm for the basalt.
        void egBasalt(vec3 p, vec3 n, vec3 w, out vec3 alb, out vec3 armv, out vec3 nrm) {
          vec2 ux = p.zy / uBasaltTile, uy = p.xz / uBasaltTile, uz = p.xy / uBasaltTile;
          alb = texture2D(uBasaltAlb, ux).rgb * w.x + texture2D(uBasaltAlb, uy).rgb * w.y + texture2D(uBasaltAlb, uz).rgb * w.z;
          armv = texture2D(uBasaltArm, ux).rgb * w.x + texture2D(uBasaltArm, uy).rgb * w.y + texture2D(uBasaltArm, uz).rgb * w.z;
          vec3 tx = texture2D(uBasaltNor, ux).xyz * 2.0 - 1.0;
          vec3 ty = texture2D(uBasaltNor, uy).xyz * 2.0 - 1.0;
          vec3 tz = texture2D(uBasaltNor, uz).xyz * 2.0 - 1.0;
          tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x);
          ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y);
          tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
          nrm = normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
        }

        float egContactAt(vec3 p) {
          float c = 0.0;
          for (int i = 0; i < ${MAX_CONTACT_BOXES}; i++) {
            if (i >= uContactN) break;
            vec4 b = uContactBox[i];
            vec2 d = abs(p.xz - b.xy) - b.zw;
            float out_ = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
            c = max(c, 1.0 - smoothstep(0.0, 1.6, max(out_, 0.0)));
          }
          for (int i = 0; i < ${MAX_CONTACT_CIRCLES}; i++) {
            if (i >= uContactCN) break;
            vec4 k = uContactCirc[i];
            float d = length(p.xz - k.xy) - k.z;
            c = max(c, (1.0 - smoothstep(0.0, 1.2 + k.z * 0.25, max(d, 0.0))) * k.w);
          }
          return c;
        }`)
      .replace('#include <map_fragment>', `
        egContact = egContactAt(vEGPos);
        if (uEGOn < 0.5) {
          #include <map_fragment>
          diffuseColor.rgb *= 1.0 - egContact * 0.4;
        } else {
          vec3 n = normalize(vEGN);
          vec3 p = vEGPos;
          float dist = length(p - cameraPosition);
          // Cinder from above, two samples blended in patches, a third far away.
          vec2 uc = p.xz / uCinderTile;
          vec2 uc2 = EG_ROT * uc * 0.41 + vec2(0.37, 0.11);
          float mixA = smoothstep(0.3, 0.7, egNoise(p.xz * 0.11 + 3.0));
          vec3 cAlb = mix(texture2D(uCinderAlb, uc).rgb, texture2D(uCinderAlb, uc2).rgb, mixA);
          vec3 cArm = mix(texture2D(uCinderArm, uc).rgb, texture2D(uCinderArm, uc2).rgb, mixA);
          vec3 cNt = mix(texture2D(uCinderNor, uc).xyz, texture2D(uCinderNor, uc2).xyz, mixA) * 2.0 - 1.0;
          vec3 far = texture2D(uCinderAlb, EG_ROT * p.xz / (uCinderTile * 9.0)).rgb;
          cAlb = mix(cAlb, far, smoothstep(35.0, 120.0, dist) * 0.6);
          vec3 cN = normalize(vec3(cNt.x + n.x, abs(cNt.z) * n.y, cNt.y + n.z));
          cN = normalize(mix(n, cN, 0.85));
          // Basalt on every axis.
          vec3 w = pow(abs(n), vec3(4.0));
          w /= (w.x + w.y + w.z);
          vec3 bAlb, bArm, bN;
          egBasalt(p, n, w, bAlb, bArm, bN);
          vec3 bFar;
          { vec3 a2, r2, n2; egBasalt(p * 0.13 + 17.0, n, w, a2, r2, n2); bFar = a2; }
          bAlb = mix(bAlb, mix(bAlb, bFar, 0.5), smoothstep(25.0, 90.0, dist));
          // Slope decides the blend; noise frays the edge.
          float slope = 1.0 - n.y;
          float fray = (egNoise(p.xz * 0.35) - 0.5) * 0.22 + (egNoise(p.xz * 1.7) - 0.5) * 0.08;
          egRockW = smoothstep(0.2, 0.42, slope + fray);
          // The cinder keeps 60% of its own colour: red grains among black, under the paint's grey-brown.
          cAlb = mix(vec3(dot(cAlb, vec3(0.2126, 0.7152, 0.0722))), cAlb, 0.6);
          vec3 alb = mix(cAlb * uCinderGain, bAlb * uBasaltGain, egRockW);
          egArm = mix(cArm, bArm, egRockW);
          egNorW = normalize(mix(cN, bN, egRockW));
          // Cavity darkening from the photographs' own occlusion (dirt in every joint and between every stone).
          alb *= mix(1.0, egArm.r, 0.6);
          // Contact: a dark, slightly damp band at every wall and standing thing.
          alb *= 1.0 - egContact * 0.45;
          diffuseColor.rgb *= clamp(alb, 0.0, 2.2);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if (uEGOn > 0.5) roughnessFactor = clamp(mix(egArm.g, 0.72, 0.25) - egContact * 0.12, 0.3, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uEGOn > 0.5) normal = normalize((viewMatrix * vec4(egNorW, 0.0)).xyz);`)
      .replace('#include <aomap_fragment>', `
        if (uEGOn < 0.5) {
          #include <aomap_fragment>
          reflectedLight.indirectDiffuse *= 1.0 - egContact * 0.5;
        } else {
          float egAo = mix(1.0, egArm.r, 0.7) * (1.0 - egContact * 0.55);
          reflectedLight.indirectDiffuse *= egAo;
          reflectedLight.indirectSpecular *= egAo;
        }`);
  };
  const key = `${prevKey}|emberGround:v1`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
  return u;
}

/** Hand the ground its photographs (each a `{ diff, nor, arm }` from `texture-pack.js`) and switch them on. */
export function setEmberGroundPacks(mat, { cinder, basalt }) {
  const u = mat?.userData.groundUniforms;
  if (!u || !cinder?.diff || !basalt?.diff) return;
  u.uCinderAlb.value = cinder.diff; u.uCinderNor.value = cinder.nor || u.uCinderNor.value; u.uCinderArm.value = cinder.arm || u.uCinderArm.value;
  u.uBasaltAlb.value = basalt.diff; u.uBasaltNor.value = basalt.nor || u.uBasaltNor.value; u.uBasaltArm.value = basalt.arm || u.uBasaltArm.value;
  u.uEGOn.value = 1;
}

/** The footprints the ground darkens round: boxes [cx, cz, halfX, halfZ] and circles [x, z, r, strength]. */
export function setEmberContacts(mat, { boxes = [], circles = [] }) {
  const u = mat?.userData.groundUniforms;
  if (!u) return;
  const nb = Math.min(boxes.length, MAX_CONTACT_BOXES), nc = Math.min(circles.length, MAX_CONTACT_CIRCLES);
  for (let i = 0; i < nb; i++) u.uContactBox.value[i].set(...boxes[i]);
  for (let i = 0; i < nc; i++) u.uContactCirc.value[i].set(...circles[i]);
  u.uContactN.value = nb;
  u.uContactCN.value = nc;
}
