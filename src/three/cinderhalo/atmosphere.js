/**
 * cinderhalo/atmosphere.js — Cinder Halo's sky and light (unit14): an ash dusk with a low brown sun in the west and the planet's ring, the
 * halo the world is named for, arcing across the sky from north-east to south-west, its shadowed gap clear. The sky shader is Thornmere's
 * (Lodestone's, re-tinted) with the ring added; the light is low and dim so the cells' own lamps are the warm thing in the picture.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followChShadow, followCamera } from '../ember/atmosphere.js';

export const CINDER_SUN = new THREE.Vector3(-0.82, 0.3, 0.18).normalize();
/** The ring's plane, through the planet: its normal. The ring is the band of sky directions nearly square to it. */
export const RING_NORMAL = new THREE.Vector3(0.42, 0.55, -0.72).normalize();

export const CHSKY = {
  zenith: new THREE.Color('#25262b'),
  upper: new THREE.Color('#45434a'),
  horizon: new THREE.Color('#8b7b6a'),
  haze: new THREE.Color('#6d6259'),
  ground: new THREE.Color('#1a1816'),
  sunGlow: new THREE.Color('#c79a6a'),
  veilLit: new THREE.Color('#8a7866'),
  veilBody: new THREE.Color('#3a3634'),
  ring: new THREE.Color('#b9b1a2')
};

export const chSkyUniforms = {
  uChTime: { value: 0 },
  uChSun: { value: CINDER_SUN },
  uChZenith: { value: CHSKY.zenith },
  uChUpper: { value: CHSKY.upper },
  uChHorizon: { value: CHSKY.horizon },
  uChHaze: { value: CHSKY.haze },
  uChGround: { value: CHSKY.ground },
  uChSunGlow: { value: CHSKY.sunGlow },
  uChVeilLit: { value: CHSKY.veilLit },
  uChVeilBody: { value: CHSKY.veilBody },
  uChRing: { value: CHSKY.ring },
  uChRingN: { value: RING_NORMAL }
};

const SKY_GLSL = /* glsl */ `
  uniform float uChTime;
  uniform vec3 uChSun, uChZenith, uChUpper, uChHorizon, uChHaze, uChGround, uChSunGlow, uChVeilLit, uChVeilBody, uChRing, uChRingN;
  float lsHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float lsNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(lsHash(i), lsHash(i + vec2(1, 0)), u.x), mix(lsHash(i + vec2(0, 1)), lsHash(i + vec2(1, 1)), u.x), u.y);
  }
  float lsFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * lsNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 lsAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uChSun), 0.0);
    vec3 col = mix(uChHorizon, uChUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uChZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uChHaze, exp(-abs(d.y) * 12.0) * 0.55);
    col += uChSunGlow * (pow(mu, 4.0) * 0.22 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.14);
    return col;
  }
  vec3 chSky(vec3 d) {
    vec3 col = lsAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uChTime * 0.012, -uChTime * 0.005);
      float cover = smoothstep(0.28, 0.62, lsFbm(p) * 0.8 + lsFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uChVeilBody, uChVeilLit, smoothstep(-0.2, 0.9, dot(d, uChSun)));
      col = mix(col, veil, cover * 0.45);
      col = mix(col, lsAir(d), exp(-d.y * 10.0) * 0.45);
      // The ring: a band of directions nearly square to its plane's normal, banded into lanes, with a dark gap; dim near the horizon.
      float s = dot(d, uChRingN);
      float band = smoothstep(0.075, 0.06, abs(s)) * smoothstep(0.004, 0.012, abs(s - 0.018));
      float lanes = 0.55 + 0.45 * sin(s * 420.0) * sin(s * 133.0 + 1.3);
      float lit = band * lanes * smoothstep(0.02, 0.18, d.y) * (1.0 - cover * 0.6);
      col = mix(col, uChRing, lit * 0.55);
    }
    return mix(col, uChGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createChSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: chSkyUniforms,
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
        gl_FragColor = vec4(chSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'cinderhalo-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

export function createChLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#d1a57c'), 1.05);
  key.position.copy(CINDER_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#7c7670'), new THREE.Color('#2a2622'), 1.15);
  return { key, hemi };
}

export function createChEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createChSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#1f1d1b') })
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
