/**
 * terrain.js — The ground of Erebus: one height function, one mesh, one surface.
 *
 * THE SHAPE. The Charge Gardens are a dry basin: a flat clay lakebed (a playa)
 * in the middle, a gentle bowl round it, a rim the twenty pylons stand on, and
 * outside the rim a dune sea that climbs away in every direction toward the
 * buttes on the horizon. Every one of those is a term below, and every one is a
 * thing wind and water actually make:
 *
 *   - the playa is FLAT because it is the floor of a lake that dried, and it is
 *     cracked into polygons because clay shrinks as it dries;
 *   - dunes are ASYMMETRIC — a long windward slope and a short slip face at the
 *     angle of repose — and they all face the same way, because one wind built
 *     them (`WIND`, which the ripples in the sand texture and the blowing dust
 *     both follow too);
 *   - small dunes ride on big ones (draa), which is what stops a dune field from
 *     reading as corrugated iron;
 *   - sand drifts up against anything that stands in the wind, so each outcrop
 *     sits in an apron of its own.
 *
 * ONE MESH TO THE HORIZON. The ground is a single grid whose spacing is a metre
 * across the 200 m square the player walks and then grows geometrically out to
 * the horizon, clipped to a disc. There is no seam between "the world" and "the
 * backdrop" because there is no second mesh: the dune the player can walk up to
 * is the same surface as the dune eight hundred metres off in the haze. The
 * voyage reads `hasFarTerrain` and does not lay its own far ring over it.
 *
 * `getTerrainHeight` is analytic and pure, so the walk, the landing solver and
 * the Node checks all stand on exactly the ground that is drawn.
 */

import * as THREE from 'three';
import { noise2, fbm2, ridged2, smoothstep, lerp } from './noise.js';

/** The prevailing wind, as a unit vector on the ground (x, z). */
// It matches the ripples drawn in the sand texture (desertSand combs them at
// 0.42 rad in canvas space, which lands at -0.42 on the ground).
export const WIND = Object.freeze({ x: Math.cos(-0.42), z: Math.sin(-0.42) });
const PERP = { x: -WIND.z, z: WIND.x };

export const BASIN_R = 45.5;          // where the rim crest runs (the pylons stand on it)
export const PLAYA_R = 25;            // the dry lakebed in the middle
export const HORIZON_R = 880;         // where the ground ends; the camera sees 1000 m

/**
 * A dune's cross-section. `f` is 0…1 through one wavelength along the wind:
 * the windward slope climbs, convex, to the crest at `a`; the slip face drops
 * straight at the angle of repose and flattens into the next trough.
 */
function duneProfile(f, a = 0.74) {
  if (f < a) {
    const u = f / a;
    return 1 - (1 - u) * (1 - u) * (1 - 0.35 * u);
  }
  const d = (f - a) / (1 - a);
  return Math.pow(1 - d, 1.35);
}

/**
 * Build the height field for a world description. The closure owns the list of
 * sand aprons (from the landmarks), so a rock moved in the JSON takes its drift
 * with it.
 */
export function makeHeightField(data) {
  const mounds = [];
  for (const lm of data.landmarks || []) {
    if (!lm.apron) continue;
    mounds.push({ x: lm.pos[0], z: lm.pos[2], r: lm.apron[0], h: lm.apron[1] });
  }
  // Every pylon has a tongue of sand in its lee, where the wind drops what it
  // was carrying.
  for (const s of data.sites || []) {
    mounds.push({ x: s.pos[0] + WIND.x * 1.9, z: s.pos[2] + WIND.z * 1.9, r: 1.3, h: 0.28 });
  }

  /**
   * Everything about a point on the ground. `height` is what the walk stands
   * on; `rock`, `tone` and `playa` are what the surface shader paints there.
   */
  function sample(x, z, out) {
    const r = Math.hypot(x, z);
    const s = x * WIND.x + z * WIND.z;       // along the wind
    const t = x * PERP.x + z * PERP.z;       // across it

    /* 1. The regional surface: bowl, rim, and the long climb outward. */
    let h;
    if (r < BASIN_R) {
      h = -2.55 * Math.cos((r / BASIN_R) * (Math.PI / 2));
    } else {
      h = 0;
    }
    const rimD = r - BASIN_R;
    h += 3.0 * Math.exp(-(rimD * rimD) / 105);
    h += 8.5 * smoothstep(49, 128, r) + 20 * smoothstep(150, 520, r);

    /* 2. The playa: a lakebed dries flat, whatever the bowl under it did. */
    const edgeWobble = fbm2(x * 0.045, z * 0.045, 3) * 7;
    const playa = 1 - smoothstep(PLAYA_R - 4, PLAYA_R + 5, r + edgeWobble);
    const playaH = -2.12 + fbm2(x * 0.02, z * 0.02, 2) * 0.05;
    h = lerp(h, playaH, playa);

    // Gentle undulation over the bowl between the lakebed and the rim — sheet
    // sand the wind has laid over the old shore. Held down on the pylon line.
    const bowlBand = smoothstep(PLAYA_R, PLAYA_R + 8, r) * (1 - smoothstep(38, 42, r));
    h += fbm2(x * 0.06 + 3.1, z * 0.06, 3) * 0.55 * bowlBand;

    /* 3. Dunes. Small transverse dunes outside the rim, riding on draa. */
    const warp = fbm2(x * 0.006, z * 0.006, 3);
    const nearA = 2.7 * smoothstep(55, 76, r) * (0.55 + 0.9 * (fbm2(t * 0.012, s * 0.004, 3) + 0.5));
    const nearPhase = s / 31 + warp * 3.2 + fbm2(t * 0.02, s * 0.01, 2) * 0.6;
    const nearF = nearPhase - Math.floor(nearPhase);
    const nearP = duneProfile(nearF);

    const farA = 17 * smoothstep(95, 240, r) * (0.6 + 0.8 * (fbm2(t * 0.003 + 7, s * 0.002, 3) + 0.5));
    const farPhase = s / 170 + warp * 1.4 + fbm2(t * 0.004, 2.2, 2) * 0.5;
    const farF = farPhase - Math.floor(farPhase);
    const farP = duneProfile(farF, 0.7);
    // Crests break up across the wind: a dune line is a chain of dunes.
    const chain = 0.65 + 0.35 * Math.cos(t / 57 + warp * 4);
    h += nearA * nearP * chain + farA * farP;

    /* 4. Bedrock breaking through the sand, far out: stepped, stratified. */
    const rockField = smoothstep(0.6, 0.74, ridged2(x * 0.0065 + 4.2, z * 0.0065 - 1.3, 3))
      * smoothstep(120, 230, r);
    if (rockField > 0) {
      const lift = fbm2(x * 0.012, z * 0.012, 3) + 0.5;
      const raw = lift * 26;
      const step = Math.floor(raw / 4.5) * 4.5 + Math.pow((raw % 4.5) / 4.5, 5) * 4.5;
      h += rockField * step;
    }

    /* 5. Drift against whatever stands in the wind. */
    for (let i = 0; i < mounds.length; i++) {
      const m = mounds[i];
      const dx = x - m.x, dz = z - m.z;
      // Longer in the lee than in the teeth of the wind.
      const along = dx * WIND.x + dz * WIND.z;
      const across = dx * PERP.x + dz * PERP.z;
      const stretch = along > 0 ? 1.7 : 1.0;
      const d2 = (along / stretch) ** 2 + across * across;
      h += m.h * Math.exp(-d2 / (m.r * m.r));
    }

    /* 6. Fine relief everywhere outside the lakebed — the ground is never a plane. */
    h += fbm2(x * 0.11, z * 0.11, 3) * 0.16 * (1 - playa);

    if (out) {
      out.height = h;
      out.rock = Math.min(1, rockField * 1.4);
      // Grain sorting: pale coarse sand on crests, dark fines in the troughs.
      const tone = (nearA * nearP * chain + farA * farP * 0.35) / (nearA * chain + farA * 0.35 + 0.001);
      out.tone = (nearA + farA) > 0.2 ? tone : 0.5 + noise2(x * 0.05, z * 0.05) * 0.25;
      out.playa = playa;
    }
    return h;
  }

  return { sample, height: (x, z) => sample(x, z, null) };
}

/**
 * The grid's axis: a metre apart across the walked square, then each step a
 * little longer than the last until the horizon.
 */
function axis(inner, step, growth, outer) {
  const pos = [];
  for (let v = -inner; v <= inner + 1e-6; v += step) pos.push(+v.toFixed(4));
  let d = step, v = inner;
  const tail = [];
  while (v < outer) {
    d *= growth;
    v += d;
    tail.push(Math.min(v, outer * 1.45));
  }
  return [...tail.map(x => -x).reverse(), ...pos, ...tail];
}

/** The terrain mesh's geometry: positions, normals, world-scaled uvs and the paint masks. */
export function buildTerrainGeometry(field, { step = 1.0, growth = 1.075, tile = 10 } = {}) {
  const ax = axis(100, step, growth, HORIZON_R);
  const n = ax.length;
  const pos = new Float32Array(n * n * 3);
  const uv = new Float32Array(n * n * 2);
  const mask = new Float32Array(n * n * 3);
  const s = { height: 0, rock: 0, tone: 0, playa: 0 };
  let k = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      let x = ax[i], z = ax[j];
      // Clip the square to a disc: the far corners fold in onto the horizon.
      const r = Math.hypot(x, z);
      if (r > HORIZON_R) { x *= HORIZON_R / r; z *= HORIZON_R / r; }
      field.sample(x, z, s);
      let y = s.height;
      // The rim of the world tips down under the haze, so its edge is never
      // seen against the sky as an edge.
      y -= 40 * smoothstep(HORIZON_R * 0.86, HORIZON_R, Math.hypot(x, z));
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      uv[k * 2] = x / tile; uv[k * 2 + 1] = z / tile;
      mask[k * 3] = s.rock; mask[k * 3 + 1] = s.tone; mask[k * 3 + 2] = s.playa;
      k++;
    }
  }
  const idx = new Uint32Array((n - 1) * (n - 1) * 6);
  let q = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b;
      idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aMask', new THREE.BufferAttribute(mask, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * The ground's surface: sand, lakebed clay and bedrock, painted by the masks
 * the height field wrote, on one MeshStandardMaterial so it takes the sun, the
 * shadows and the haze like everything else standing on it.
 *
 * @param {object} maps { sand, playa, macro, strata } — `sand`/`playa` are
 *   buildMaterial-style { map, normalMap, roughnessMap, aoMap } sets.
 */
export function createTerrainMaterial({ sand, playa, macro, strata }) {
  const mat = new THREE.MeshStandardMaterial({
    map: sand.map,
    normalMap: sand.normalMap,
    roughnessMap: sand.roughnessMap,
    aoMap: sand.aoMap,
    aoMapIntensity: 0.8,
    roughness: 1.0,
    metalness: 0.0,
    // pbr-kit's normal maps carry green inverted relative to three's
    // tangent frame (a bump reads as a dimple), so v is flipped here.
    normalScale: new THREE.Vector2(0.7, -0.7)
  });
  mat.userData.surfaceMaps = [sand.map, sand.normalMap, sand.roughnessMap, sand.aoMap, playa.map, playa.normalMap, macro, strata].filter(Boolean);

  const uniforms = {
    uPlaya: { value: playa.map },
    uPlayaN: { value: playa.normalMap },
    uMacro: { value: macro },
    uStrata: { value: strata }
  };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aMask;
        varying vec3 vMask;
        varying vec3 vTW;
        varying vec3 vTN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vMask = aMask;
        vTW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTN = normalize(mat3(modelMatrix) * objectNormal);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uPlaya;
        uniform sampler2D uPlayaN;
        uniform sampler2D uMacro;
        uniform sampler2D uStrata;
        varying vec3 vMask;
        varying vec3 vTW;
        varying vec3 vTN;
        float eMacro;
        float eCamD;`)
      .replace('#include <map_fragment>', `
        eCamD = distance(cameraPosition, vTW);
        eMacro = texture2D(uMacro, vTW.xz / 380.0).r;
        float eMacro2 = texture2D(uMacro, vTW.xz / 57.0 + 0.37).r;
        // Two scales of the same sand, so the tile is never the thing the eye finds.
        vec3 sandA = texture2D(map, vMapUv).rgb;
        vec3 sandB = texture2D(map, vMapUv * 0.43 + vec2(0.37, 0.61)).rgb;
        // The ripples are drawn by the normal map; the albedo keeps only a
        // trace of them, as real grain sorting does.
        vec3 sandAvg = vec3(dot(sandA + sandB, vec3(0.5 / 3.0)));
        vec3 sand = mix(sandA, sandB, 0.35 * eMacro2);
        sand = mix(sand, sandAvg * vec3(1.18, 0.98, 0.78), 0.45);
        // Grain sorting across a dune, and the long drift of colour across the sea.
        sand *= mix(0.8, 1.12, clamp(vMask.y, 0.0, 1.0));
        sand *= 0.86 + 0.28 * eMacro;
        sand = mix(sand, sand * vec3(1.06, 0.94, 0.84), smoothstep(0.55, 0.8, eMacro2) * 0.6);
        vec3 ground = sand;
        // Clay: the lakebed, bleached where the last water stood. Only
        // sampled where there is lakebed.
        if (vMask.z > 0.002) {
          vec3 clay = texture2D(uPlaya, vTW.xz / 9.0).rgb;
          clay *= 0.9 + 0.2 * eMacro2;
          ground = mix(sand, clay, vMask.z);
        }
        // Bedrock where the sand is thin and the slope is steep: the same beds,
        // at the same altitudes, as every rock (rocks.js STRATA).
        if (vMask.x > 0.002) {
          float slope = 1.0 - clamp(normalize(vTN).y, 0.0, 1.0);
          float rockAmt = clamp(vMask.x * smoothstep(0.08, 0.3, slope + vMask.x * 0.12), 0.0, 1.0);
          vec3 bed = texture2D(uStrata, vec2(0.5, (vTW.y + 40.0) / 256.0 + eMacro * 0.02)).rgb;
          bed *= 0.75 + 0.35 * eMacro2;
          ground = mix(ground, bed, rockAmt);
        }
        vec4 sampledDiffuseColor = vec4(ground, 1.0);
        diffuseColor *= sampledDiffuseColor;
      `)
      .replace('#include <normal_fragment_maps>', `
        #ifdef USE_NORMALMAP_TANGENTSPACE
          vec3 mapN = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
          if (vMask.z > 0.002) {
            vec3 nClay = texture2D(uPlayaN, vTW.xz / 9.0).xyz * 2.0 - 1.0;
            mapN = normalize(mix(mapN, nClay, vMask.z));
          }
          // Ripples fade with distance: past a hundred metres they are grain, not shape.
          mapN.xy *= normalScale * (1.0 - 0.85 * smoothstep(40.0, 220.0, eCamD));
          normal = normalize(tbn * mapN);
        #endif
      `);
  };
  mat.customProgramCacheKey = () => 'erebus-terrain-v1';
  return mat;
}

/**
 * A coarse copy of the walked square that exists only for the sun's shadow
 * pass. The drawn ground is two hundred thousand triangles out to the horizon;
 * re-drawing all of them into the shadow map every frame to shade a 110 m box
 * round the player is waste. This is a 2 m grid over the walk, sunk a hand's
 * breadth so it never shades the surface it copies, on a layer only the
 * shadow camera sees.
 */
export function buildShadowCaster(field, { half = 104, step = 2, layer = 1 } = {}) {
  const n = Math.round((half * 2) / step);
  const geo = new THREE.PlaneGeometry(half * 2, half * 2, n, n);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, field.height(p.getX(i), p.getZ(i)) - 0.18);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  mesh.name = 'erebus-shadow-caster';
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.layers.set(layer);
  // Not a body: it is the ground's shadow, not a second ground.
  mesh.userData.phys = 'ground';
  mesh.userData.noMerge = true;
  return mesh;
}
