/**
 * thornmere/atmosphere.js — Thornmere's sky and light (unit13): grey daylight under a high overcast, a pale break low in the north, mist on the tar.
 * The sky shader is Lodestone's, re-tinted; the light is flatter and cooler so the rooms' own lamps are the warm thing in the picture.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followTmShadow, followCamera } from '../ember/atmosphere.js';

export const THORNMERE_SUN = new THREE.Vector3(-0.3, 0.62, 0.72).normalize();

export const TMSKY = {
  zenith: new THREE.Color('#4b4f4e'),
  upper: new THREE.Color('#6f736f'),
  horizon: new THREE.Color('#b4b3a6'),
  haze: new THREE.Color('#8f9087'),
  ground: new THREE.Color('#2a2b28'),
  sunGlow: new THREE.Color('#d8d2bc'),
  veilLit: new THREE.Color('#a9a89c'),
  veilBody: new THREE.Color('#55584f')
};

export const tmSkyUniforms = {
  uTmTime: { value: 0 },
  uTmSun: { value: THORNMERE_SUN },
  uTmZenith: { value: TMSKY.zenith },
  uTmUpper: { value: TMSKY.upper },
  uTmHorizon: { value: TMSKY.horizon },
  uTmHaze: { value: TMSKY.haze },
  uTmGround: { value: TMSKY.ground },
  uTmSunGlow: { value: TMSKY.sunGlow },
  uTmVeilLit: { value: TMSKY.veilLit },
  uTmVeilBody: { value: TMSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uTmTime;
  uniform vec3 uTmSun, uTmZenith, uTmUpper, uTmHorizon, uTmHaze, uTmGround, uTmSunGlow, uTmVeilLit, uTmVeilBody;
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
    float mu = max(dot(d, uTmSun), 0.0);
    vec3 col = mix(uTmHorizon, uTmUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uTmZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uTmHaze, exp(-abs(d.y) * 12.0) * 0.55);
    col += uTmSunGlow * (pow(mu, 4.0) * 0.22 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.14);
    return col;
  }
  vec3 tmSky(vec3 d) {
    vec3 col = lsAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uTmTime * 0.012, -uTmTime * 0.005);
      float cover = smoothstep(0.28, 0.62, lsFbm(p) * 0.8 + lsFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uTmVeilBody, uTmVeilLit, smoothstep(-0.2, 0.9, dot(d, uTmSun)));
      col = mix(col, veil, cover * 0.6);
      col = mix(col, lsAir(d), exp(-d.y * 10.0) * 0.45);
    }
    return mix(col, uTmGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createTmSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: tmSkyUniforms,
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
        gl_FragColor = vec4(tmSky(normalize(vDir)), 1.0);
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

export function createTmLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#d9d6c8'), 1.25);
  key.position.copy(THORNMERE_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#9a9c94'), new THREE.Color('#34322c'), 1.35);
  return { key, hemi };
}

export function createTmEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createTmSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#2c2c28') })
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
