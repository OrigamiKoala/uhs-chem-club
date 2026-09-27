/**
 * effects.js — the air over Tallow, moving.
 *
 *  - Motes at the eye: fine salt hanging in the column, wrapped round the
 *    player so there is always some to catch the light and none is wasted.
 *  - Grit streaming over the crust in gusts: the wind made visible at the
 *    boots, several times faster than the haze above it.
 *  - Salt devils walking the far flats: white, tall, slow.
 *  - Plumes: vapour off the stacks that still vent, leaning downwind. They are
 *    the only thing on the horizon that moves, which is what tells a player
 *    the plant is not quite dead.
 *
 * The ground-stream shader and the dust sprites are the same technique Erebus
 * uses; the colours, the wind and the plumes are Tallow's.
 */

import * as THREE from 'three';
import { canvas2d } from '../materials/pbr-kit.js';
import { rng } from '../erebus/noise.js';

/** Tallow's wind, from the west-north-west, the way the ruts' drifts lie. */
export const TALLOW_WIND = Object.freeze({ x: Math.cos(0.32), z: Math.sin(0.32) });

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
  varying vec3 vW;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
  void main() {
    // Cheapest test first. The sheet is 180 m across and only its middle
    // hundred-odd metres ever show, and a gust covers well under half of that:
    // everything else is discarded before the twelve octaves of noise it
    // used to pay for and then multiply by zero.
    float d = distance(vW, cameraPosition);
    float reach = smoothstep(1.5, 5.0, d) * (1.0 - smoothstep(30.0, 70.0, d));
    if (reach <= 0.0) discard;
    vec2 perp = vec2(-uWind.y, uWind.x);
    vec2 q = vec2(dot(vW.xz, uWind), dot(vW.xz, perp));
    // Gusts: patches a few tens of metres across where the wind is up,
    // running downwind through the ribbons.
    float gust = fb(vec2(q.x * 0.03 - uTime * 0.35, q.y * 0.05 + uTime * 0.025));
    float gate = smoothstep(0.38, 0.64, gust);
    if (gate <= 0.0) discard;
    // Ribbons: long along the wind, thin across it, racing downwind.
    float snake = fb(vec2(q.x * 0.03 - uTime * 0.2, q.y * 0.045)) * 3.0;
    float rib = fb(vec2(q.x * 0.08 - uTime * 1.9, q.y * 0.7 + snake));
    float a = smoothstep(0.5, 0.78, rib) * gate * reach;
    gl_FragColor = vec4(uColor, a * uStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * @param {{ heightAt: Function, t4: boolean, plumes?: Array<{x,y,z,rate,size}> }} o
 *   plumes — vent mouths in world space; `size` scales the plume.
 * @param {(x:number, z:number) => boolean} [o.skip] where ground streams must not be drawn (the pit)
 */
export function createTallowEffects({ heightAt, t4, plumes = [] }) {
  const group = new THREE.Group();
  group.name = 'tallow-air';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;
  const dot = softDot();
  const puff = softDot(128, 0.55);
  const r = rng(0x5a17);
  const disposables = [dot, puff];

  /* ---- motes at the eye ---- */
  const BOX = { x: 64, y: 16, z: 64 };
  const nDust = t4 ? 1800 : 700;
  const dPos = new Float32Array(nDust * 3);
  const dPhase = new Float32Array(nDust);
  for (let i = 0; i < nDust; i++) {
    dPos[i * 3] = (r() - 0.5) * BOX.x;
    dPos[i * 3 + 1] = Math.pow(r(), 2.0) * BOX.y;
    dPos[i * 3 + 2] = (r() - 0.5) * BOX.z;
    dPhase[i] = r() * 100;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nDust * 3), 3));
  const dMat = new THREE.PointsMaterial({
    color: 0xf2ece0, size: 0.04, map: dot, transparent: true, opacity: 0.5,
    depthWrite: false, sizeAttenuation: true
  });
  const dust = new THREE.Points(dGeo, dMat);
  dust.frustumCulled = false;
  group.add(dust);
  disposables.push(dGeo, dMat);

  /* ---- grit streaming over the crust ---- */
  // A 3 m grid on every tier: the pan under the sheet is flat to a few
  // centimetres over that span, and a finer one only cost triangles.
  const HALF = 88, STEP = 3;
  const sGeo = new THREE.PlaneGeometry(HALF * 2, HALF * 2, Math.round(HALF * 2 / STEP), Math.round(HALF * 2 / STEP));
  sGeo.rotateX(-Math.PI / 2);
  const sp = sGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const h = heightAt(sp.getX(i), sp.getZ(i));
    // Over the pit the ground is four metres down; the streams stay on the
    // surface and simply thin out there (the shader fades by distance).
    sp.setY(i, (h < -1 ? 0 : h) + 0.07);
  }
  sGeo.computeBoundingSphere();
  const streamU = {
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector2(TALLOW_WIND.x, TALLOW_WIND.z) },
    uColor: { value: new THREE.Color('#f4efe4') },
    uStrength: { value: 0.34 }
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

  /* ---- salt devils ---- */
  const devils = [];
  const nDev = t4 ? 3 : 1;
  const PER = t4 ? 480 : 240;
  const spawnDevil = (d, initial) => {
    const a = r() * Math.PI * 2;
    const dist = 130 + r() * 200;
    d.x = Math.cos(a) * dist;
    d.z = Math.sin(a) * dist;
    if (!initial) {
      d.x = -TALLOW_WIND.x * (160 + r() * 90) + (r() - 0.5) * 300;
      d.z = -TALLOW_WIND.z * (160 + r() * 90) + (r() - 0.5) * 300;
    }
    d.height = 30 + r() * 45;
    d.life = 0;
    d.span = 40 + r() * 50;
    d.speed = 2 + r() * 2.5;
    d.spin = 1.1 + r() * 1.2;
  };
  for (let k = 0; k < nDev; k++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PER * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe7e0d2, size: 2.6, map: dot, transparent: true, opacity: 0.0,
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

  /* ---- plumes ---- */
  // Each puff carries its own age, so it can swell and thin as it rises. A
  // PointsMaterial draws every puff alike, which reads as a string of beads.
  const plumeU = {
    uPuff: { value: puff },
    uViewH: { value: 900 },
    uHaze: { value: new THREE.Color('#ddd4c3') },
    uLit: { value: new THREE.Color('#fbf6ee') },
    uShade: { value: new THREE.Color('#b9b6ae') }
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
      varying float vSide;
      void main() {
        vAge = aAge;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        vSide = fract(sin(dot(position.xz, vec2(12.9, 78.2))) * 437.5);
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
      varying float vSide;
      void main() {
        float a = texture2D(uPuff, gl_PointCoord).a;
        // Lit on the sun's side of each puff, grey in its own shadow.
        float lit = clamp(0.55 + (0.5 - gl_PointCoord.x) * 0.6 + (0.5 - gl_PointCoord.y) * 0.5, 0.0, 1.0);
        vec3 c = mix(uShade, uLit, lit);
        c = mix(c, uHaze, 1.0 - exp(-vDist / 700.0));
        float alpha = a * smoothstep(0.0, 0.06, vAge) * pow(1.0 - vAge, 1.6) * 0.32;
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  disposables.push(plumeMat);
  const plumeSets = [];
  for (const p of plumes) {
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

  const cam = new THREE.Vector3();
  function update(delta, time, camPos) {
    cam.copy(camPos);
    streamU.uTime.value = time;

    const out = dGeo.attributes.position.array;
    const wx = TALLOW_WIND.x * 1.4 * delta, wz = TALLOW_WIND.z * 1.4 * delta;
    for (let i = 0; i < nDust; i++) {
      const ph = dPhase[i] + time * 0.4;
      dPos[i * 3] += wx + Math.sin(ph) * 0.15 * delta;
      dPos[i * 3 + 1] += Math.sin(ph * 1.3) * 0.08 * delta;
      dPos[i * 3 + 2] += wz + Math.cos(ph * 0.9) * 0.15 * delta;
      let x = dPos[i * 3] - cam.x, z = dPos[i * 3 + 2] - cam.z;
      x = ((x + BOX.x / 2) % BOX.x + BOX.x) % BOX.x - BOX.x / 2;
      z = ((z + BOX.z / 2) % BOX.z + BOX.z) % BOX.z - BOX.z / 2;
      dPos[i * 3] = x + cam.x;
      dPos[i * 3 + 2] = z + cam.z;
      out[i * 3] = x + cam.x;
      out[i * 3 + 1] = cam.y - 1.55 + dPos[i * 3 + 1];
      out[i * 3 + 2] = z + cam.z;
    }
    dGeo.attributes.position.needsUpdate = true;

    for (const d of devils) {
      d.life += delta;
      if (d.life > d.span) spawnDevil(d, false);
      d.x += TALLOW_WIND.x * d.speed * delta;
      d.z += TALLOW_WIND.z * d.speed * delta;
      const life = d.life / d.span;
      const fade = Math.min(1, life * 5) * Math.min(1, (1 - life) * 4);
      d.mat.opacity = 0.13 * fade;
      const gy = heightAt(d.x, d.z);
      const p = d.pts.geometry.attributes.position.array;
      for (let i = 0; i < d.seeds.length; i++) {
        const [a, b, c] = d.seeds[i];
        const hh = Math.pow(a, 1.4) * d.height;
        const t = hh / d.height;
        const rad = 0.8 + t * t * 9 + (c - 0.5) * 1.2 * (0.3 + t);
        const ang = b * Math.PI * 2 + time * d.spin * (1.6 - t);
        const lean = t * t * 8;
        p[i * 3] = d.x + Math.cos(ang) * rad + TALLOW_WIND.x * lean;
        p[i * 3 + 1] = gy + hh;
        p[i * 3 + 2] = d.z + Math.sin(ang) * rad + TALLOW_WIND.z * lean;
      }
      d.pts.geometry.attributes.position.needsUpdate = true;
    }

    // A plume is a stream of puffs, each on its own clock: rising, swelling,
    // bending downwind, thinning out.
    for (const set of plumeSets) {
      const { p, arr, age, N, seeds } = set;
      const life = 24;
      const k = p.size ?? 1;
      for (let i = 0; i < N; i++) {
        const [a, b, c] = seeds[i];
        const t = (time / life + a) % 1;
        const rise = (1 - Math.pow(1 - t, 1.8)) * 48 * k;
        const drift = t * t * 80 * k;
        const spread = (0.5 + t * 7) * k;
        arr[i * 3] = p.x + TALLOW_WIND.x * drift + Math.cos(b * 6.283 + t * 2) * spread * (c - 0.5);
        arr[i * 3 + 1] = p.y + rise + Math.sin(b * 6.283) * spread * 0.25;
        arr[i * 3 + 2] = p.z + TALLOW_WIND.z * drift + Math.sin(b * 6.283 + t * 2) * spread * (c - 0.5);
        age[i] = t;
      }
      set.geo.attributes.position.needsUpdate = true;
      set.geo.attributes.aAge.needsUpdate = true;
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
