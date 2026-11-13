/**
 * quicklight/atmosphere.js — Storm-belt dusk sky and lighting for Quicklight (unit11).
 */

import * as THREE from 'three';
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
  const key = new THREE.DirectionalLight(new THREE.Color('#f3d4a4'), 1.9);
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
  const hemi = new THREE.HemisphereLight(new THREE.Color('#8da0b8'), new THREE.Color('#5a5144'), 1.3);
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
