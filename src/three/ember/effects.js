/**
 * ember/effects.js — The moving air over Ember Reach.
 *
 *  - STEAM off every vent that breathes: the fumaroles, the plant's silencers,
 *    cooling cells and separator, the geyser between eruptions. Each plume is
 *    a stream of soft puffs on their own clocks, rising, swelling, leaning
 *    east-north-east with the wind and thinning out, lit on the side that faces
 *    the sun and grey in their own shade.
 *  - FUME off the lava lake and the cone, far below and beyond the rim: the
 *    same puffs, many times larger, with their bellies lit orange by the melt.
 *  - MIST lying on the hot spring, lifting off the water and rolling downwind.
 *  - THE GEYSER, which erupts every forty-odd seconds for a few seconds: a
 *    column of water thrown up and falling back, and a burst of steam after it.
 *  - SULPHUR MOTES at the eye: fine pale grit hanging in the air.
 *
 * They are SOFT and DIM: nothing blooms, and no puff or mote is bright enough to
 * read as a lamp (CLAUDE.md §1). All of it is one group tagged `ambient`, so
 * the overlap check leaves it alone.
 */

import * as THREE from 'three';
import { canvas2d } from '../materials/pbr-kit.js';
import { EMBER_SUN } from './atmosphere.js';

/** Ember Reach's wind, out of the west-south-west: steam leans east-north-east. */
export const EMBER_WIND = Object.freeze((() => { const x = 0.9, z = -0.42; const n = Math.hypot(x, z); return { x: x / n, z: z / n }; })());

/** How long the geyser sleeps between eruptions, and how long one lasts (seconds). */
export const GEYSER = Object.freeze({ period: 46, burst: 8, first: 14 });

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softDot(size = 64, falloff = 0.35) {
  const c = canvas2d(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient?.(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (g) {
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(falloff, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#fff';
  }
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** How far into its eruption the geyser is at `time`: 0..1 while it plays, -1 while it sleeps. */
export function geyserPhase(time) {
  const t = time - GEYSER.first;
  if (t < 0) return -1;
  const k = t % GEYSER.period;
  return k < GEYSER.burst ? k / GEYSER.burst : -1;
}

/**
 * @param {object} o
 *   heightAt(x, z)  the walking surface
 *   t4              full fidelity
 *   vents           [{ x, y, z, size, rate, rise, life, tint, alpha }] mouths in world space
 *   geyser          { x, y, z } the geyser's vent, or null
 *   spring          { x, y, z, radius } the hot spring's water, or null
 */
export function createEmberEffects({ heightAt, t4 = false, vents = [], geyser = null, spring = null } = {}) {
  const group = new THREE.Group();
  group.name = 'ember-air';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;
  group.userData.noWeather = true;
  const dot = softDot();
  const puff = softDot(128, 0.55);
  const r = rng(0xe5ea);
  const disposables = [dot, puff];

  /* ---- the puffs: every plume, the fume and the mist, in ONE draw ---- */
  const sets = [];
  const plumes = [...vents];
  if (geyser) plumes.push({ ...geyser, size: 0.9, rate: 0.9, rise: 22, life: 14, alpha: 0.35, isGeyser: true });
  let total = 0;
  for (const p of plumes) {
    const N = Math.max(6, Math.round((t4 ? 54 : 22) * (p.rate ?? 1)));
    sets.push({ p, start: total, N, seeds: Array.from({ length: N }, () => [r(), r(), r()]) });
    total += N;
  }
  let mist = null;
  if (spring) {
    const N = t4 ? 70 : 26;
    mist = { start: total, N, seeds: Array.from({ length: N }, () => [r(), r(), r(), r()]) };
    total += N;
  }
  const arr = new Float32Array(total * 3);
  const age = new Float32Array(total);
  const size = new Float32Array(total);
  const tint = new Float32Array(total);
  const alpha = new Float32Array(total);
  for (const s of sets) {
    for (let i = 0; i < s.N; i++) {
      size[s.start + i] = (4.2 + s.seeds[i][2] * 3.5) * (s.p.size ?? 1);
      tint[s.start + i] = s.p.tint ?? 0;
      alpha[s.start + i] = s.p.alpha ?? 0.34;
    }
  }
  if (mist) {
    for (let i = 0; i < mist.N; i++) {
      size[mist.start + i] = 4.5 + mist.seeds[i][2] * 4;
      alpha[mist.start + i] = 0.2;
    }
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  pgeo.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
  pgeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  pgeo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
  pgeo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const plumeU = {
    uPuff: { value: puff },
    uViewH: { value: 900 },
    uSun: { value: EMBER_SUN },
    uHaze: { value: new THREE.Color('#a68b69') },
    uLit: { value: new THREE.Color('#f1dcc0') },
    uShade: { value: new THREE.Color('#7d7268') },
    uGlow: { value: new THREE.Color('#d5602a') }
  };
  const pmat = new THREE.ShaderMaterial({
    uniforms: plumeU,
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      attribute float aAge;
      attribute float aSize;
      attribute float aTint;
      attribute float aAlpha;
      uniform float uViewH;
      uniform vec3 uSun;
      varying float vAge;
      varying float vDist;
      varying float vTint;
      varying float vAlpha;
      varying vec2 vSunScr;
      void main() {
        vAge = aAge;
        vTint = aTint;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        vec3 s = (viewMatrix * vec4(uSun, 0.0)).xyz;
        vSunScr = normalize(s.xy + vec2(1e-4));
        gl_PointSize = aSize * (0.3 + 1.8 * aAge) * projectionMatrix[1][1] * uViewH * 0.5 / max(-mv.z, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uPuff;
      uniform vec3 uHaze;
      uniform vec3 uLit;
      uniform vec3 uShade;
      uniform vec3 uGlow;
      varying float vAge;
      varying float vDist;
      varying float vTint;
      varying float vAlpha;
      varying vec2 vSunScr;
      void main() {
        float a = texture2D(uPuff, gl_PointCoord).a;
        vec2 off = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y);
        // Lit on the side that faces the sun, grey in its own shade.
        float lit = clamp(0.5 + dot(off, vSunScr) * 1.3, 0.0, 1.0);
        vec3 c = mix(uShade, uLit, lit * (1.0 - vAge * 0.35));
        // Over the melt, the belly of a puff takes its glow.
        c = mix(c, uGlow, vTint * smoothstep(0.15, -0.45, off.y) * (1.0 - vAge * 0.6));
        c = mix(c, uHaze, 1.0 - exp(-vDist / 650.0));
        float alpha = a * smoothstep(0.0, 0.06, vAge) * pow(1.0 - vAge, 1.5) * vAlpha;
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const pts = new THREE.Points(pgeo, pmat);
  pts.frustumCulled = false;
  pts.renderOrder = 3;
  group.add(pts);
  disposables.push(pgeo, pmat);

  /* ---- the geyser's water ---- */
  let water = null;
  if (geyser) {
    const N = t4 ? 420 : 160;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf2efe8, size: 0.16, map: dot, transparent: true, opacity: 0.8,
      depthWrite: false, sizeAttenuation: true
    });
    const w = new THREE.Points(geo, mat);
    w.frustumCulled = false;
    w.renderOrder = 4;
    group.add(w);
    disposables.push(geo, mat);
    water = { geo, mat, N, seeds: Array.from({ length: N }, () => [r(), r(), r(), r()]) };
  }

  /* ---- sulphur motes at the eye ---- */
  const BOX = { x: 44, y: 12, z: 44 };
  const nMote = t4 ? 900 : 300;
  const mPos = new Float32Array(nMote * 3);
  const mPhase = new Float32Array(nMote);
  for (let i = 0; i < nMote; i++) {
    mPos[i * 3] = (r() - 0.5) * BOX.x;
    mPos[i * 3 + 1] = r() * BOX.y;
    mPos[i * 3 + 2] = (r() - 0.5) * BOX.z;
    mPhase[i] = r() * 100;
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nMote * 3), 3));
  const mMat = new THREE.PointsMaterial({
    color: 0xe6d6a6, size: 0.03, map: dot, transparent: true, opacity: 0.42,
    depthWrite: false, sizeAttenuation: true
  });
  const motes = new THREE.Points(mGeo, mMat);
  motes.frustumCulled = false;
  group.add(motes);
  disposables.push(mGeo, mMat);

  const W = EMBER_WIND;
  function update(delta, time, camPos) {
    const phase = geyserPhase(time);
    // After a burst the vent keeps steaming hard for a while, then settles.
    const sinceBurst = (() => {
      const t = time - GEYSER.first;
      if (t < 0) return 99;
      const k = t % GEYSER.period;
      return k < GEYSER.burst ? 0 : k - GEYSER.burst;
    })();

    for (const s of sets) {
      const { p, start, N, seeds } = s;
      const life = p.life ?? 12;
      const k = p.size ?? 1;
      const rise = p.rise ?? 16;
      const lean = p.lean ?? 1;
      for (let i = 0; i < N; i++) {
        const [a, b, c] = seeds[i];
        const t = (time / life + a) % 1;
        const up = (1 - Math.pow(1 - t, 1.8)) * rise;
        const drift = t * t * rise * 1.4 * lean;
        const spread = (0.4 + t * 6) * k;
        const j = start + i;
        arr[j * 3] = p.x + W.x * drift + Math.cos(b * 6.283 + t * 2) * spread * (c - 0.5);
        arr[j * 3 + 1] = p.y + up + Math.sin(b * 6.283) * spread * 0.25;
        arr[j * 3 + 2] = p.z + W.z * drift + Math.sin(b * 6.283 + t * 2) * spread * (c - 0.5);
        age[j] = t;
        if (p.isGeyser) alpha[j] = phase >= 0 ? 0.75 : 0.18 + 0.55 * Math.exp(-sinceBurst / 6);
      }
    }
    if (mist) {
      for (let i = 0; i < mist.N; i++) {
        const [a, b, c, d] = mist.seeds[i];
        const t = (time / (14 + d * 6) + a) % 1;
        const rr = Math.sqrt(b) * spring.radius * 0.9;
        const ang = c * 6.283;
        const j = mist.start + i;
        arr[j * 3] = spring.x + Math.sin(ang) * rr + W.x * t * 9;
        arr[j * 3 + 1] = spring.y + 0.3 + t * (2.5 + d * 3);
        arr[j * 3 + 2] = spring.z + Math.cos(ang) * rr + W.z * t * 9;
        age[j] = t;
      }
    }
    pgeo.attributes.position.needsUpdate = true;
    pgeo.attributes.aAge.needsUpdate = true;
    if (geyser) pgeo.attributes.aAlpha.needsUpdate = true;

    // The column: thrown up hard and fast while the burst lasts, falling back as spray.
    if (water) {
      const e = water.geo.attributes.position.array;
      const live = phase >= 0;
      const strength = live ? Math.sin(Math.min(1, phase * 1.15) * Math.PI) : 0;
      for (let i = 0; i < water.N; i++) {
        const [a, b, c, d] = water.seeds[i];
        const fl = 1.3 + d * 1.1;
        const t = ((time + a * 10) % fl);
        if (!live) { e[i * 3] = geyser.x; e[i * 3 + 1] = geyser.y - 50; e[i * 3 + 2] = geyser.z; continue; }
        const v0 = (9 + c * 9) * (0.45 + 0.55 * strength);
        const ang = b * 6.283;
        const lateral = (0.25 + c * 0.9) * t;
        const y = v0 * t - 4.9 * t * t;
        e[i * 3] = geyser.x + Math.cos(ang) * lateral + W.x * t * t * 1.6;
        e[i * 3 + 1] = y < -0.2 ? geyser.y - 50 : geyser.y + y;
        e[i * 3 + 2] = geyser.z + Math.sin(ang) * lateral + W.z * t * t * 1.6;
      }
      water.geo.attributes.position.needsUpdate = true;
    }

    if (camPos) {
      const out = mGeo.attributes.position.array;
      const ground = heightAt ? heightAt(camPos.x, camPos.z) : 0;
      for (let i = 0; i < nMote; i++) {
        const ph = mPhase[i] + time * 0.3;
        mPos[i * 3] += W.x * 0.7 * delta + Math.sin(ph) * 0.12 * delta;
        mPos[i * 3 + 1] += Math.sin(ph * 1.3) * 0.05 * delta - 0.03 * delta;
        mPos[i * 3 + 2] += W.z * 0.7 * delta + Math.cos(ph * 0.9) * 0.12 * delta;
        if (mPos[i * 3 + 1] < 0) mPos[i * 3 + 1] += BOX.y;
        let x = mPos[i * 3] - camPos.x, z = mPos[i * 3 + 2] - camPos.z;
        x = ((x + BOX.x / 2) % BOX.x + BOX.x) % BOX.x - BOX.x / 2;
        z = ((z + BOX.z / 2) % BOX.z + BOX.z) % BOX.z - BOX.z / 2;
        mPos[i * 3] = x + camPos.x;
        mPos[i * 3 + 2] = z + camPos.z;
        out[i * 3] = x + camPos.x;
        out[i * 3 + 1] = ground + 0.2 + mPos[i * 3 + 1];
        out[i * 3 + 2] = z + camPos.z;
      }
      mGeo.attributes.position.needsUpdate = true;
    }
  }

  /** The drawing buffer's height, so a puff's size is in the same units everywhere. */
  function setViewportHeight(h) {
    if (h > 0) plumeU.uViewH.value = h;
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
  }

  return { group, update, dispose, setViewportHeight };
}
