/**
 * effects.js — the air over Ligar, moving.
 *
 *  - ASH at the eye: fine flakes hanging in the low sun and falling, slowly,
 *    all the time — the volcano on the horizon is still putting it up. Wrapped
 *    round the player so there is always some to catch the light.
 *  - GRIT streaming over the pavement in gusts: the wind made visible at the
 *    boots. Never over the open pit.
 *  - ASH DEVILS walking the far plain: dark, tall, slow.
 *  - SMOKE from every stack that still draws, leaning downwind and catching
 *    the sunset on the side that faces it.
 *  - EMBERS off the forge in the tube, and its thin smoke out of the flue.
 *
 * The ground-stream shader and the puff sprites are the technique Erebus and
 * Tallow use; the colours, the wind and the fire are Ligar's.
 */

import * as THREE from 'three';
import { canvas2d } from '../materials/pbr-kit.js';
import { rng } from '../erebus/noise.js';

/** Ligar's wind, out of the west-south-west: smoke leans north-east. */
export const LIGAR_WIND = Object.freeze({ x: Math.cos(-0.42), z: Math.sin(-0.42) });

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

const STREAM_VERT = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const STREAM_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2 uWind;
  uniform vec3 uColor;
  uniform float uStrength;
  uniform vec4 uPit;
  varying vec3 vW;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
  void main() {
    // Cheapest tests first: distance, then the open pit, then one gust fbm.
    float d = distance(vW, cameraPosition);
    float reach = smoothstep(1.5, 5.0, d) * (1.0 - smoothstep(28.0, 65.0, d));
    if (reach <= 0.0) discard;
    if (vW.x > uPit.x && vW.x < uPit.y && vW.z > uPit.z && vW.z < uPit.w) discard;
    vec2 perp = vec2(-uWind.y, uWind.x);
    vec2 q = vec2(dot(vW.xz, uWind), dot(vW.xz, perp));
    float gust = fb(vec2(q.x * 0.03 - uTime * 0.35, q.y * 0.05 + uTime * 0.025));
    float gate = smoothstep(0.4, 0.66, gust);
    if (gate <= 0.0) discard;
    float snake = fb(vec2(q.x * 0.03 - uTime * 0.2, q.y * 0.045)) * 3.0;
    float rib = fb(vec2(q.x * 0.08 - uTime * 1.9, q.y * 0.7 + snake));
    float a = smoothstep(0.5, 0.78, rib) * gate * reach;
    gl_FragColor = vec4(uColor, a * uStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * @param {object} o
 *   heightAt(x, z)  the walking surface
 *   t4              full fidelity
 *   vents           [{ x, y, z, rate, size }] stack mouths in world space
 *   hearth          world position of the forge's coals, or null
 *   forge           world position of the forge flue's mouth, or null
 *   pit             { minX, maxX, minZ, maxZ } where no ground streams run
 */
export function createLigarEffects({ heightAt, t4, vents = [], hearth = null, forge = null, pit = null }) {
  const group = new THREE.Group();
  group.name = 'ligar-air';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;
  const dot = softDot();
  const puff = softDot(128, 0.55);
  const r = rng(0x1a9a);
  const disposables = [dot, puff];

  /* ---- ash at the eye, falling ---- */
  const BOX = { x: 60, y: 18, z: 60 };
  const nAsh = t4 ? 2200 : 800;
  const aPos = new Float32Array(nAsh * 3);
  const aPhase = new Float32Array(nAsh);
  const aFall = new Float32Array(nAsh);
  for (let i = 0; i < nAsh; i++) {
    aPos[i * 3] = (r() - 0.5) * BOX.x;
    aPos[i * 3 + 1] = r() * BOX.y;
    aPos[i * 3 + 2] = (r() - 0.5) * BOX.z;
    aPhase[i] = r() * 100;
    aFall[i] = 0.12 + r() * 0.3;
  }
  const aGeo = new THREE.BufferGeometry();
  aGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nAsh * 3), 3));
  const aMat = new THREE.PointsMaterial({
    color: 0xd9b48f, size: 0.035, map: dot, transparent: true, opacity: 0.5,
    depthWrite: false, sizeAttenuation: true
  });
  const ash = new THREE.Points(aGeo, aMat);
  ash.frustumCulled = false;
  group.add(ash);
  disposables.push(aGeo, aMat);

  /* ---- grit streaming over the pavement ---- */
  const HALF = 88, STEP = 2.5;
  const sGeo = new THREE.PlaneGeometry(HALF * 2, HALF * 2, Math.round(HALF * 2 / STEP), Math.round(HALF * 2 / STEP));
  sGeo.rotateX(-Math.PI / 2);
  const sp = sGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), z = sp.getZ(i);
    const inPit = pit && x > pit.minX - 2 && x < pit.maxX + 2 && z > pit.minZ - 2 && z < pit.maxZ + 12;
    sp.setY(i, (inPit ? heightAt(x, pit.maxZ + 14) : heightAt(x, z)) + 0.08);
  }
  sGeo.computeBoundingSphere();
  const streamU = {
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector2(LIGAR_WIND.x, LIGAR_WIND.z) },
    uColor: { value: new THREE.Color('#8a725c') },
    uStrength: { value: 0.3 },
    uPit: { value: pit ? new THREE.Vector4(pit.minX - 2, pit.maxX + 2, pit.minZ - 2, pit.maxZ + 12) : new THREE.Vector4(1, -1, 1, -1) }
  };
  const sMat = new THREE.ShaderMaterial({
    uniforms: streamU, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG,
    transparent: true, depthWrite: false, fog: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4
  });
  const streams = new THREE.Mesh(sGeo, sMat);
  streams.renderOrder = 2;
  group.add(streams);
  disposables.push(sGeo, sMat);

  /* ---- ash devils on the far plain ---- */
  const devils = [];
  const nDev = t4 ? 2 : 1;
  const PER = t4 ? 420 : 200;
  const spawnDevil = (d, initial) => {
    const a = r() * Math.PI * 2;
    const dist = 120 + r() * 140;
    d.x = Math.cos(a) * dist;
    d.z = Math.sin(a) * dist;
    if (!initial) {
      d.x = -LIGAR_WIND.x * (140 + r() * 60) + (r() - 0.5) * 240;
      d.z = -LIGAR_WIND.z * (140 + r() * 60) + (r() - 0.5) * 240;
    }
    d.height = 22 + r() * 30;
    d.life = 0;
    d.span = 35 + r() * 40;
    d.speed = 1.8 + r() * 2;
    d.spin = 1.1 + r() * 1.2;
  };
  for (let k = 0; k < nDev; k++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PER * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0x6e5a4a, size: 2.2, map: dot, transparent: true, opacity: 0.0,
      depthWrite: false, sizeAttenuation: true
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group.add(pts);
    disposables.push(geo, mat);
    const d = { pts, mat, seeds: Array.from({ length: PER }, () => [r(), r(), r()]) };
    spawnDevil(d, true);
    d.life = r() * d.span;
    devils.push(d);
  }

  /* ---- smoke ---- */
  const plumeU = {
    uPuff: { value: puff },
    uViewH: { value: 900 },
    uHaze: { value: new THREE.Color('#86695a') },
    uLit: { value: new THREE.Color('#d8a27a') },
    uShade: { value: new THREE.Color('#4f4545') }
  };
  const plumeMat = new THREE.ShaderMaterial({
    uniforms: plumeU,
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      attribute float aAge;
      attribute float aSize;
      uniform float uViewH;
      varying float vAge;
      varying float vDist;
      void main() {
        vAge = aAge;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        gl_PointSize = aSize * (0.25 + 1.9 * aAge) * projectionMatrix[1][1] * uViewH * 0.5 / max(-mv.z, 1.0);
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
      void main() {
        float a = texture2D(uPuff, gl_PointCoord).a;
        // Lit on the sunset side of each puff (screen left-ish, low), grey in its own shade.
        float lit = clamp(0.45 + (0.5 - gl_PointCoord.x) * 0.7 + (gl_PointCoord.y - 0.5) * 0.3, 0.0, 1.0);
        vec3 c = mix(uShade, uLit, lit * (1.0 - vAge * 0.4));
        c = mix(c, uHaze, 1.0 - exp(-vDist / 500.0));
        float alpha = a * smoothstep(0.0, 0.06, vAge) * pow(1.0 - vAge, 1.5) * 0.38;
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  disposables.push(plumeMat);
  const plumeSets = [];
  const allVents = [...vents];
  if (forge) allVents.push({ ...forge, rate: 0.5, size: 0.18, thin: true });
  for (const p of allVents) {
    const N = Math.round((t4 ? 80 : 36) * (p.rate ?? 1));
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    const age = new Float32Array(N);
    const size = new Float32Array(N);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    geo.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const pts = new THREE.Points(geo, plumeMat);
    pts.frustumCulled = false;
    pts.renderOrder = 3;
    group.add(pts);
    disposables.push(geo);
    const seeds = Array.from({ length: N }, () => [r(), r(), r()]);
    for (let i = 0; i < N; i++) size[i] = (5 + seeds[i][2] * 4) * (p.size ?? 1);
    plumeSets.push({ p, geo, arr, age, N, seeds });
  }

  /* ---- embers off the forge ---- */
  let embers = null;
  if (hearth) {
    const N = t4 ? 90 : 40;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff8a3a, size: 0.035, map: dot, transparent: true, opacity: 0.9,
      depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending, fog: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group.add(pts);
    disposables.push(geo, mat);
    embers = { pts, geo, N, seeds: Array.from({ length: N }, () => [r(), r(), r(), r()]) };
  }

  const cam = new THREE.Vector3();
  function update(delta, time, camPos) {
    cam.copy(camPos);
    streamU.uTime.value = time;

    const out = aGeo.attributes.position.array;
    const wx = LIGAR_WIND.x * 1.2 * delta, wz = LIGAR_WIND.z * 1.2 * delta;
    for (let i = 0; i < nAsh; i++) {
      const ph = aPhase[i] + time * 0.35;
      aPos[i * 3] += wx + Math.sin(ph) * 0.18 * delta;
      aPos[i * 3 + 1] -= aFall[i] * delta - Math.sin(ph * 1.3) * 0.05 * delta;
      aPos[i * 3 + 2] += wz + Math.cos(ph * 0.9) * 0.18 * delta;
      if (aPos[i * 3 + 1] < 0) aPos[i * 3 + 1] += BOX.y;
      let x = aPos[i * 3] - cam.x, z = aPos[i * 3 + 2] - cam.z;
      x = ((x + BOX.x / 2) % BOX.x + BOX.x) % BOX.x - BOX.x / 2;
      z = ((z + BOX.z / 2) % BOX.z + BOX.z) % BOX.z - BOX.z / 2;
      aPos[i * 3] = x + cam.x;
      aPos[i * 3 + 2] = z + cam.z;
      out[i * 3] = x + cam.x;
      out[i * 3 + 1] = cam.y - 3.0 + aPos[i * 3 + 1];
      out[i * 3 + 2] = z + cam.z;
    }
    aGeo.attributes.position.needsUpdate = true;

    for (const d of devils) {
      d.life += delta;
      if (d.life > d.span) spawnDevil(d, false);
      d.x += LIGAR_WIND.x * d.speed * delta;
      d.z += LIGAR_WIND.z * d.speed * delta;
      const life = d.life / d.span;
      const fade = Math.min(1, life * 5) * Math.min(1, (1 - life) * 4);
      d.mat.opacity = 0.16 * fade;
      const gy = heightAt(d.x, d.z);
      const p = d.pts.geometry.attributes.position.array;
      for (let i = 0; i < d.seeds.length; i++) {
        const [a, b, c] = d.seeds[i];
        const hh = Math.pow(a, 1.4) * d.height;
        const t = hh / d.height;
        const rad = 0.7 + t * t * 7 + (c - 0.5) * 1.1 * (0.3 + t);
        const ang = b * Math.PI * 2 + time * d.spin * (1.6 - t);
        const lean = t * t * 7;
        p[i * 3] = d.x + Math.cos(ang) * rad + LIGAR_WIND.x * lean;
        p[i * 3 + 1] = gy + hh;
        p[i * 3 + 2] = d.z + Math.sin(ang) * rad + LIGAR_WIND.z * lean;
      }
      d.pts.geometry.attributes.position.needsUpdate = true;
    }

    // A plume is a stream of puffs, each on its own clock: rising, swelling,
    // bending downwind, thinning out.
    for (const set of plumeSets) {
      const { p, arr, age, N, seeds } = set;
      const life = p.thin ? 12 : 26;
      const k = p.size ?? 1;
      const riseK = p.thin ? 18 : 48;
      for (let i = 0; i < N; i++) {
        const [a, b, c] = seeds[i];
        const t = (time / life + a) % 1;
        const rise = (1 - Math.pow(1 - t, 1.8)) * riseK * Math.max(k, 0.35);
        const drift = t * t * 70 * k;
        const spread = (0.5 + t * 7) * k;
        arr[i * 3] = p.x + LIGAR_WIND.x * drift + Math.cos(b * 6.283 + t * 2) * spread * (c - 0.5);
        arr[i * 3 + 1] = p.y + rise + Math.sin(b * 6.283) * spread * 0.25;
        arr[i * 3 + 2] = p.z + LIGAR_WIND.z * drift + Math.sin(b * 6.283 + t * 2) * spread * (c - 0.5);
        age[i] = t;
      }
      set.geo.attributes.position.needsUpdate = true;
      set.geo.attributes.aAge.needsUpdate = true;
    }

    // Embers: up off the coals, wandering, gone under the barrel.
    if (embers) {
      const e = embers.geo.attributes.position.array;
      for (let i = 0; i < embers.N; i++) {
        const [a, b, c, dd] = embers.seeds[i];
        const life = 1.4 + dd * 1.6;
        const t = ((time + a * 10) / life) % 1;
        e[i * 3] = hearth.x + (b - 0.5) * 1.1 + Math.sin(time * 3 + a * 20) * 0.12 * t;
        e[i * 3 + 1] = hearth.y + 0.05 + t * (1.4 + c * 1.6);
        e[i * 3 + 2] = hearth.z + (c - 0.5) * 0.7 + Math.cos(time * 2.3 + b * 20) * 0.12 * t;
      }
      embers.geo.attributes.position.needsUpdate = true;
      embers.pts.material.opacity = 0.75 + Math.sin(time * 9) * 0.15;
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
