/**
 * effects.js — The air moving over Erebus.
 *
 * Three things, and each is something a desert wind actually does:
 *
 *   - DUST AT THE EYE. Fine grains hanging in the air round the player and
 *     drifting downwind, soft round motes a few millimetres to a centimetre
 *     across. They travel with the camera (the box wraps round it), so there is
 *     always air between the player and the thing they are looking at.
 *   - SAND STREAMING OVER THE GROUND. Saltation: the wind lifts grains a hand's
 *     breadth and they skitter downwind in long snaking ribbons that come and
 *     go with the gusts. A transparent sheet laid just over the walk area,
 *     whose alpha is streaks of noise combed along `WIND` and scrolled with it.
 *   - DUST DEVILS. Out on the far flats, a few slow-turning columns of dust
 *     walking downwind, fading in and out as they form and die.
 *
 * All of it is `phys: 'ambient'` and transparent: none of it is a body.
 */

import * as THREE from 'three';
import { canvas2d } from '../materials/pbr-kit.js';
import { WIND } from './terrain.js';
import { rng } from './noise.js';

function softDot(size = 64) {
  const c = canvas2d(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient?.(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (g) {
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
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
    vec2 perp = vec2(-uWind.y, uWind.x);
    vec2 q = vec2(dot(vW.xz, uWind), dot(vW.xz, perp));
    // Ribbons: long along the wind, thin across it, racing downwind.
    float snake = fb(vec2(q.x * 0.035 - uTime * 0.25, q.y * 0.05)) * 3.0;
    float rib = fb(vec2(q.x * 0.09 - uTime * 2.2, q.y * 0.75 + snake));
    // Gusts: patches a few tens of metres across where the wind is up,
    // running downwind through the ribbons.
    float gust = fb(vec2(q.x * 0.035 - uTime * 0.45, q.y * 0.05 + uTime * 0.03));
    float a = smoothstep(0.47, 0.76, rib) * smoothstep(0.33, 0.6, gust);
    float d = distance(vW, cameraPosition);
    a *= smoothstep(1.5, 5.0, d) * (1.0 - smoothstep(35.0, 75.0, d));
    gl_FragColor = vec4(uColor, a * uStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createEffects({ heightAt, t4 }) {
  const group = new THREE.Group();
  group.name = 'erebus-air';
  group.userData.phys = 'ambient';
  const dot = softDot();
  const r = rng(0xd057);

  /* ---- dust at the eye ---- */
  const BOX = { x: 70, y: 18, z: 70 };
  const nDust = t4 ? 2200 : 900;
  const dPos = new Float32Array(nDust * 3);
  const dPhase = new Float32Array(nDust);
  for (let i = 0; i < nDust; i++) {
    dPos[i * 3] = (r() - 0.5) * BOX.x;
    dPos[i * 3 + 1] = Math.pow(r(), 2.2) * BOX.y;
    dPos[i * 3 + 2] = (r() - 0.5) * BOX.z;
    dPhase[i] = r() * 100;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nDust * 3), 3));
  const dMat = new THREE.PointsMaterial({
    color: 0xdcb88c, size: 0.045, map: dot, transparent: true, opacity: 0.55,
    depthWrite: false, sizeAttenuation: true
  });
  const dust = new THREE.Points(dGeo, dMat);
  dust.frustumCulled = false;
  group.add(dust);

  /* ---- sand streaming over the ground ---- */
  const HALF = 92, STEP = t4 ? 1.5 : 3;
  const sGeo = new THREE.PlaneGeometry(HALF * 2, HALF * 2, Math.round(HALF * 2 / STEP), Math.round(HALF * 2 / STEP));
  sGeo.rotateX(-Math.PI / 2);
  const sp = sGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setY(i, heightAt(sp.getX(i), sp.getZ(i)) + 0.09);
  sGeo.computeBoundingSphere();
  const streamU = {
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector2(WIND.x, WIND.z) },
    uColor: { value: new THREE.Color('#e2c095') },
    uStrength: { value: 0.42 }
  };
  const sMat = new THREE.ShaderMaterial({
    uniforms: streamU, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG,
    transparent: true, depthWrite: false, fog: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4
  });
  const streams = new THREE.Mesh(sGeo, sMat);
  streams.renderOrder = 2;
  group.add(streams);

  /* ---- dust devils ---- */
  const devils = [];
  const nDev = t4 ? 3 : 1;
  const PER = t4 ? 520 : 260;
  const spawnDevil = (d, initial) => {
    const a = r() * Math.PI * 2;
    const dist = 110 + r() * 170;
    d.x = Math.cos(a) * dist;
    d.z = Math.sin(a) * dist;
    if (!initial) {   // re-form upwind of the basin
      d.x = -WIND.x * (140 + r() * 90) + (r() - 0.5) * 260;
      d.z = -WIND.z * (140 + r() * 90) + (r() - 0.5) * 260;
    }
    d.height = 25 + r() * 35;
    d.life = 0;
    d.span = 40 + r() * 50;
    d.speed = 2 + r() * 2.5;
    d.spin = 1.2 + r() * 1.2;
  };
  for (let k = 0; k < nDev; k++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PER * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xc9a176, size: 2.4, map: dot, transparent: true, opacity: 0.0,
      depthWrite: false, sizeAttenuation: true
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group.add(pts);
    const d = { pts, mat, seeds: Array.from({ length: PER }, () => [r(), r(), r()]) };
    spawnDevil(d, true);
    d.life = r() * d.span;
    devils.push(d);
  }

  const cam = new THREE.Vector3();
  function update(delta, time, camPos) {
    cam.copy(camPos);
    streamU.uTime.value = time;

    // Dust: drift downwind with a slow swirl, wrapped into a box round the eye.
    const out = dGeo.attributes.position.array;
    const wx = WIND.x * 1.6 * delta, wz = WIND.z * 1.6 * delta;
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
      // Heights ride with the eye rather than the ground: a mote that ends up
      // under a dune is simply hidden by it, and the ground is not sampled
      // two thousand times a frame.
      out[i * 3] = x + cam.x;
      out[i * 3 + 1] = cam.y - 1.55 + dPos[i * 3 + 1];
      out[i * 3 + 2] = z + cam.z;
    }
    dGeo.attributes.position.needsUpdate = true;

    // Devils: walk downwind, turn, rise, and fade in and out over a life.
    for (const d of devils) {
      d.life += delta;
      if (d.life > d.span) spawnDevil(d, false);
      d.x += WIND.x * d.speed * delta;
      d.z += WIND.z * d.speed * delta;
      const life = d.life / d.span;
      const fade = Math.min(1, life * 5) * Math.min(1, (1 - life) * 4);
      d.mat.opacity = 0.16 * fade;
      const gy = heightAt(d.x, d.z);
      const p = d.pts.geometry.attributes.position.array;
      for (let i = 0; i < d.seeds.length; i++) {
        const [a, b, c] = d.seeds[i];
        const hh = Math.pow(a, 1.4) * d.height;
        const t = hh / d.height;
        // A funnel: tight at the ground, flaring and leaning downwind with height.
        const rad = 0.8 + t * t * 9 + (c - 0.5) * 1.2 * (0.3 + t);
        const ang = b * Math.PI * 2 + time * d.spin * (1.6 - t);
        const lean = t * t * 8;
        p[i * 3] = d.x + Math.cos(ang) * rad + WIND.x * lean;
        p[i * 3 + 1] = gy + hh;
        p[i * 3 + 2] = d.z + Math.sin(ang) * rad + WIND.z * lean;
      }
      d.pts.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { group, update };
}
