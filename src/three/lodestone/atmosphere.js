/**
 * quicklight/atmosphere.js — Rust-dusk canyon sky and lighting for Lodestone (unit12).
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followLsShadow, followCamera } from '../ember/atmosphere.js';

export const LODESTONE_SUN = new THREE.Vector3(0.35, 0.42, 0.84).normalize();

export const LSSKY = {
  zenith: new THREE.Color('#2a1d1a'),
  upper: new THREE.Color('#5a3a2c'),
  horizon: new THREE.Color('#c08158'),
  haze: new THREE.Color('#a06a4a'),
  ground: new THREE.Color('#3a2a24'),
  sunGlow: new THREE.Color('#f2b070'),
  veilLit: new THREE.Color('#c8956e'),
  veilBody: new THREE.Color('#5a3c32')
};

export const lsSkyUniforms = {
  uLsTime: { value: 0 },
  uLsSun: { value: LODESTONE_SUN },
  uLsZenith: { value: LSSKY.zenith },
  uLsUpper: { value: LSSKY.upper },
  uLsHorizon: { value: LSSKY.horizon },
  uLsHaze: { value: LSSKY.haze },
  uLsGround: { value: LSSKY.ground },
  uLsSunGlow: { value: LSSKY.sunGlow },
  uLsVeilLit: { value: LSSKY.veilLit },
  uLsVeilBody: { value: LSSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uLsTime;
  uniform vec3 uLsSun, uLsZenith, uLsUpper, uLsHorizon, uLsHaze, uLsGround, uLsSunGlow, uLsVeilLit, uLsVeilBody;
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
    float mu = max(dot(d, uLsSun), 0.0);
    vec3 col = mix(uLsHorizon, uLsUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uLsZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uLsHaze, exp(-abs(d.y) * 12.0) * 0.55);
    col += uLsSunGlow * (pow(mu, 4.0) * 0.22 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.14);
    return col;
  }
  vec3 lsSky(vec3 d) {
    vec3 col = lsAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uLsTime * 0.012, -uLsTime * 0.005);
      float cover = smoothstep(0.28, 0.62, lsFbm(p) * 0.8 + lsFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uLsVeilBody, uLsVeilLit, smoothstep(-0.2, 0.9, dot(d, uLsSun)));
      col = mix(col, veil, cover * 0.6);
      col = mix(col, lsAir(d), exp(-d.y * 10.0) * 0.45);
    }
    return mix(col, uLsGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createLsSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: lsSkyUniforms,
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
        gl_FragColor = vec4(lsSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'lodestone-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

export function createLsLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#f0c49a'), 1.85);
  key.position.copy(LODESTONE_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#b08a74'), new THREE.Color('#4a3428'), 1.25);
  return { key, hemi };
}

export function createLsEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createLsSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#4e3a30') })
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
