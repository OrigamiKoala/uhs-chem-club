/**
 * mirrowen/effects.js — The moving air over Mirrowen.
 *
 *  - STEAM off the boiler house's stack, the distillery's condenser and the pumping station's standpipe:
 *    soft puffs on their own clocks, rising, swelling, leaning with the wind and thinning out, lit on the
 *    side that faces the sun and grey in their own shade.
 *  - SEA SMOKE on the open water: a low mist that lifts off the basin and the canal, which is colder than
 *    the air over it, and rolls downwind.
 *  - DIAMOND DUST at the eye: fine ice crystals hanging in the cold air.
 *
 * They are SOFT and DIM: nothing blooms, and no puff or mote is bright enough to read as a lamp. All of
 * it is one group tagged `ambient`, so the overlap check leaves it alone.
 */

import * as THREE from 'three';
import { canvas2d } from '../materials/pbr-kit.js';
import { MIRROWEN_SUN } from './atmosphere.js';

/** Mirrowen's wind, out of the north-west: steam leans south-east. */
export const MIRROWEN_WIND = Object.freeze((() => { const x = 0.7, z = 0.7; const n = Math.hypot(x, z); return { x: x / n, z: z / n }; })());

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

/**
 * @param {object} o
 *   heightAt(x, z)  the walking surface
 *   t4              full fidelity
 *   vents           [{ x, y, z, size, rate, rise, life, alpha, lean }] mouths in world space
 *   mist            [{ x, z, y, r }] discs of open water the sea smoke lifts off
 */
export function createMirrowenEffects({ heightAt, t4 = false, vents = [], mist = [] } = {}) {
  const group = new THREE.Group();
  group.name = 'mirrowen-air';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;
  group.userData.noWeather = true;
  const dot = softDot();
  const puff = softDot(128, 0.55);
  const r = rng(0x31770);
  const disposables = [dot, puff];

  const sets = [];
  let total = 0;
  for (const p of vents) {
    const N = Math.max(6, Math.round((t4 ? 54 : 22) * (p.rate ?? 1)));
    sets.push({ p, start: total, N, seeds: Array.from({ length: N }, () => [r(), r(), r()]) });
    total += N;
  }
  const smokes = [];
  for (const m of mist) {
    const N = t4 ? 12 : 5;
    smokes.push({ m, start: total, N, seeds: Array.from({ length: N }, () => [r(), r(), r(), r()]) });
    total += N;
  }
  const arr = new Float32Array(total * 3);
  const age = new Float32Array(total);
  const size = new Float32Array(total);
  const alpha = new Float32Array(total);
  for (const s of sets) {
    for (let i = 0; i < s.N; i++) {
      size[s.start + i] = (4.2 + s.seeds[i][2] * 3.5) * (s.p.size ?? 1);
      alpha[s.start + i] = s.p.alpha ?? 0.34;
    }
  }
  for (const s of smokes) {
    for (let i = 0; i < s.N; i++) {
      size[s.start + i] = 4.5 + s.seeds[i][2] * 4;
      alpha[s.start + i] = 0.16;
    }
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  pgeo.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
  pgeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  pgeo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const plumeU = {
    uPuff: { value: puff },
    uViewH: { value: 900 },
    uSun: { value: MIRROWEN_SUN },
    uHaze: { value: new THREE.Color('#ccd7da') },
    uLit: { value: new THREE.Color('#f4f8fa') },
    uShade: { value: new THREE.Color('#a3b0b6') }
  };
  const pmat = new THREE.ShaderMaterial({
    uniforms: plumeU,
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      attribute float aAge;
      attribute float aSize;
      attribute float aAlpha;
      uniform float uViewH;
      uniform vec3 uSun;
      varying float vAge;
      varying float vDist;
      varying float vAlpha;
      varying vec2 vSunScr;
      void main() {
        vAge = aAge;
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
      varying float vAge;
      varying float vDist;
      varying float vAlpha;
      varying vec2 vSunScr;
      void main() {
        float a = texture2D(uPuff, gl_PointCoord).a;
        vec2 off = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y);
        float lit = clamp(0.5 + dot(off, vSunScr) * 1.3, 0.0, 1.0);
        vec3 c = mix(uShade, uLit, lit * (1.0 - vAge * 0.35));
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

  /* ---- diamond dust at the eye ---- */
  const BOX = { x: 44, y: 12, z: 44 };
  const nMote = t4 ? 700 : 240;
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
    color: 0xe4f0f6, size: 0.03, map: dot, transparent: true, opacity: 0.42,
    depthWrite: false, sizeAttenuation: true
  });
  const motes = new THREE.Points(mGeo, mMat);
  motes.frustumCulled = false;
  group.add(motes);
  disposables.push(mGeo, mMat);

  const W = MIRROWEN_WIND;
  function update(delta, time, camPos) {
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
      }
    }
    for (const s of smokes) {
      const { m } = s;
      for (let i = 0; i < s.N; i++) {
        const [a, b, c, d] = s.seeds[i];
        const t = (time / (16 + d * 8) + a) % 1;
        const rr = Math.sqrt(b) * m.r * 0.9;
        const ang = c * 6.283;
        const j = s.start + i;
        arr[j * 3] = m.x + Math.sin(ang) * rr + W.x * t * 10;
        arr[j * 3 + 1] = m.y + 0.2 + t * (1.6 + d * 2.5);
        arr[j * 3 + 2] = m.z + Math.cos(ang) * rr + W.z * t * 10;
        age[j] = t;
      }
    }
    pgeo.attributes.position.needsUpdate = true;
    pgeo.attributes.aAge.needsUpdate = true;

    if (camPos) {
      const out = mGeo.attributes.position.array;
      const ground = heightAt ? heightAt(camPos.x, camPos.z) : 0;
      for (let i = 0; i < nMote; i++) {
        const ph = mPhase[i] + time * 0.3;
        mPos[i * 3] += W.x * 0.5 * delta + Math.sin(ph) * 0.1 * delta;
        mPos[i * 3 + 1] += Math.sin(ph * 1.3) * 0.05 * delta - 0.05 * delta;
        mPos[i * 3 + 2] += W.z * 0.5 * delta + Math.cos(ph * 0.9) * 0.1 * delta;
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
