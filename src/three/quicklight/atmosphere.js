/**
 * quicklight/atmosphere.js — Storm-belt dusk sky and lighting for Quicklight (unit11), and the lightning.
 *
 * THE WEATHER is a storm that stands over the refinery. Now and then a bolt comes down to one of the rod pylons, and for that
 * moment the sky under the cloud brightens and the hemisphere's fill with it. The bolt is the one thing on Quicklight that gives
 * light and is not a lamp: an unlit mesh (it is drawn bright, it lights nothing), declared here and counted by
 * `verify:quicklight`. No PointLight comes or goes with it.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followQlShadow, followCamera } from '../ember/atmosphere.js';

export const QUICKLIGHT_SUN = new THREE.Vector3(-0.75, 0.34, 0.56).normalize();

export const QLSKY = {
  zenith: new THREE.Color('#273548'),
  upper: new THREE.Color('#4a5d74'),
  horizon: new THREE.Color('#b6976e'),
  haze: new THREE.Color('#9f8b6d'),
  ground: new THREE.Color('#3b4048'),
  sunGlow: new THREE.Color('#f5c57a'),
  veilLit: new THREE.Color('#c8b08e'),
  veilBody: new THREE.Color('#4d5c6e')
};

export const qlSkyUniforms = {
  uQlTime: { value: 0 },
  uQlFlash: { value: 0 },
  uQlSun: { value: QUICKLIGHT_SUN },
  uQlZenith: { value: QLSKY.zenith },
  uQlUpper: { value: QLSKY.upper },
  uQlHorizon: { value: QLSKY.horizon },
  uQlHaze: { value: QLSKY.haze },
  uQlGround: { value: QLSKY.ground },
  uQlSunGlow: { value: QLSKY.sunGlow },
  uQlVeilLit: { value: QLSKY.veilLit },
  uQlVeilBody: { value: QLSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uQlTime;
  uniform float uQlFlash;
  uniform vec3 uQlSun, uQlZenith, uQlUpper, uQlHorizon, uQlHaze, uQlGround, uQlSunGlow, uQlVeilLit, uQlVeilBody;
  float qlHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float qlNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(qlHash(i), qlHash(i + vec2(1, 0)), u.x), mix(qlHash(i + vec2(0, 1)), qlHash(i + vec2(1, 1)), u.x), u.y);
  }
  float qlFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * qlNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 qlAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uQlSun), 0.0);
    vec3 col = mix(uQlHorizon, uQlUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uQlZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uQlHaze, exp(-abs(d.y) * 12.0) * 0.55);
    col += uQlSunGlow * (pow(mu, 4.0) * 0.22 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.14);
    return col;
  }
  vec3 qlSky(vec3 d) {
    vec3 col = qlAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uQlTime * 0.012, -uQlTime * 0.005);
      float cover = smoothstep(0.28, 0.62, qlFbm(p) * 0.8 + qlFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uQlVeilBody, uQlVeilLit, smoothstep(-0.2, 0.9, dot(d, uQlSun)));
      col = mix(col, veil, cover * 0.6);
      col = mix(col, qlAir(d), exp(-d.y * 10.0) * 0.45);
      // A strike lights the cloud's underside from inside, most where the cloud is thickest.
      col += vec3(0.62, 0.6, 0.7) * uQlFlash * (0.25 + cover * 0.9);
    }
    return mix(col, uQlGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createQlSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: qlSkyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w * 0.999999;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      ${SKY_GLSL}
      void main() {
        gl_FragColor = vec4(qlSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'quicklight-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

export function createQlLights({ shadows }) {
  // The realism pass: a stronger sun and a lower, darker fill, so shade has depth. The bounce is the colour of what it
  // bounces off (black basalt and grey concrete: dark and cool-neutral), well under the sky's.
  const key = new THREE.DirectionalLight(new THREE.Color('#f3d4a4'), 2.35);
  key.position.copy(QUICKLIGHT_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#8b9cb3'), new THREE.Color('#3d3c3b'), 1.0);
  return { key, hemi };
}

export function createQlEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createQlSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#4a4e57') })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  for (const o of [dome, floor]) { o.geometry.dispose(); o.material.dispose(); }
  return rt;
}

/* ================================================================== the lightning */

const BOLT_COLOUR = 0xe6e3ee;

/** One bolt from the cloud base down to `tip`, jagged, with two short branches: thin quads facing every way, merged. */
function boltGeometry(tip, seed) {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const top = [tip[0] + (rnd() - 0.5) * 60, tip[1] + 170 + rnd() * 50, tip[2] + (rnd() - 0.5) * 60];
  const parts = [];
  const strand = (a, b, n, w, jag) => {
    const pts = [a];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * jag, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * jag]);
    }
    pts.push(b);
    for (let i = 0; i < pts.length - 1; i++) {
      const p = new THREE.Vector3(...pts[i]), q = new THREE.Vector3(...pts[i + 1]);
      for (const rot of [0, Math.PI / 2]) {
        const g = new THREE.PlaneGeometry(w, p.distanceTo(q));
        g.rotateY(rot);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()));
        g.translate((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2);
        parts.push(g.toNonIndexed());
        g.dispose();
      }
    }
    return pts;
  };
  const trunk = strand(top, tip, 14, 0.9, 16);
  for (const k of [4, 8]) {
    const a = trunk[k];
    strand(a, [a[0] + (rnd() - 0.5) * 50, a[1] - 30 - rnd() * 30, a[2] + (rnd() - 0.5) * 50], 5, 0.5, 9);
  }
  const g = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return g;
}

/**
 * The lightning: one bolt per rod tip, hidden until it strikes. A strike every 5 to 13 s (the same order every visit), shown for
 * a flicker of three pulses over a quarter second; the sky and the hemisphere's fill rise with it.
 * @param {object} w the world (`own`, `hemi`)
 * @param {number[][]} tips the rod pylons' tips, [x, y, z]
 * @returns {{ group: THREE.Group, update(t): void, strikes: number }}
 */
export function buildLightning(w, tips) {
  const group = new THREE.Group();
  group.name = 'lightning';
  group.userData.noMerge = true;
  group.userData.phys = 'ambient';
  const mat = w.own(new THREE.MeshBasicMaterial({ color: BOLT_COLOUR, side: THREE.DoubleSide, fog: false, transparent: true, opacity: 0.95, depthWrite: false }));
  mat.userData.weather = 'lightning';
  const bolts = tips.map((tip, i) => {
    const m = new THREE.Mesh(w.own(boltGeometry(tip, i + 1)), mat);
    m.name = 'lightning-bolt';
    m.visible = false;
    m.frustumCulled = false;
    m.renderOrder = 3;
    m.userData.noWeather = true;
    group.add(m);
    return m;
  });
  const baseHemi = w.hemi ? w.hemi.intensity : 0;
  // The strikes' timing: deterministic, so a visit always has the same weather.
  const times = [];
  let t = 4;
  for (let i = 0; i < 400; i++) { t += 5 + ((i * 7919) % 97) / 97 * 8; times.push(t); }
  let shown = -1;
  const api = {
    group, strikes: times.length,
    update(time) {
      const period = times[times.length - 1] + 6;
      const tt = time % period;
      let k = -1;
      for (let i = 0; i < times.length; i++) { if (times[i] <= tt && tt < times[i] + 0.3) { k = i; break; } if (times[i] > tt) break; }
      let flash = 0;
      if (k >= 0) {
        const dt = tt - times[k];
        flash = (dt < 0.06 ? 1 : dt < 0.1 ? 0.25 : dt < 0.16 ? 0.85 : dt < 0.2 ? 0.2 : 0.6) * (1 - dt / 0.3);
      }
      const which = k >= 0 && flash > 0.15 ? k % bolts.length : -1;
      if (which !== shown) {
        if (shown >= 0) bolts[shown].visible = false;
        if (which >= 0) bolts[which].visible = true;
        shown = which;
      }
      qlSkyUniforms.uQlFlash.value = flash;
      if (w.hemi) w.hemi.intensity = baseHemi + flash * 0.7;
    }
  };
  return api;
}
