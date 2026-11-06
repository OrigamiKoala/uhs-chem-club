/**
 * brinewire/atmosphere.js — The sky over the copper marsh, and the light it throws.
 *
 * A dry, still late afternoon over a salt flat: the horizon is a pale straw-brown where the salt throws the light back,
 * deepening upward through a dusty grey-blue to a slate zenith, thin high streaks of cloud, and a low sun that is a
 * warm patch with no hard disc. The air does not shimmer. Nothing blooms. The same function is the fog colour and the
 * environment map the cladding and the water reflect. The sun's shadow box and the dome that follows the eye are
 * Ember Reach's own (`followErShadow`, `followCamera`): they know nothing about a particular world.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followBwShadow, followCamera } from '../ember/atmosphere.js';

/** Toward the sun: west-south-west, fourteen degrees up. */
export const BRINEWIRE_SUN = new THREE.Vector3(-0.8, 0.3, 0.5).normalize();

export const BWSKY = {
  zenith: new THREE.Color('#566a78'),
  upper: new THREE.Color('#8a9ba3'),
  horizon: new THREE.Color('#c9bb9c'),
  haze: new THREE.Color('#d1c6aa'),
  ground: new THREE.Color('#9b917c'),
  sunGlow: new THREE.Color('#f1d8a4'),
  veilLit: new THREE.Color('#dbd2bd'),
  veilBody: new THREE.Color('#8d98a0')
};

export const bwSkyUniforms = {
  uBwTime: { value: 0 },
  uBwSun: { value: BRINEWIRE_SUN },
  uBwZenith: { value: BWSKY.zenith },
  uBwUpper: { value: BWSKY.upper },
  uBwHorizon: { value: BWSKY.horizon },
  uBwHaze: { value: BWSKY.haze },
  uBwGround: { value: BWSKY.ground },
  uBwSunGlow: { value: BWSKY.sunGlow },
  uBwVeilLit: { value: BWSKY.veilLit },
  uBwVeilBody: { value: BWSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uBwTime;
  uniform vec3 uBwSun, uBwZenith, uBwUpper, uBwHorizon, uBwHaze, uBwGround, uBwSunGlow, uBwVeilLit, uBwVeilBody;
  float bwHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float bwNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bwHash(i), bwHash(i + vec2(1, 0)), u.x), mix(bwHash(i + vec2(0, 1)), bwHash(i + vec2(1, 1)), u.x), u.y);
  }
  float bwFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * bwNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 bwAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uBwSun), 0.0);
    vec3 col = mix(uBwHorizon, uBwUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uBwZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uBwHaze, exp(-abs(d.y) * 12.0) * 0.6);
    col += uBwSunGlow * (pow(mu, 4.0) * 0.2 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.12);
    return col;
  }
  vec3 bwSky(vec3 d) {
    vec3 col = bwAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uBwTime * 0.008, -uBwTime * 0.003);
      float cover = smoothstep(0.3, 0.62, bwFbm(p) * 0.8 + bwFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uBwVeilBody, uBwVeilLit, smoothstep(-0.2, 0.9, dot(d, uBwSun)));
      col = mix(col, veil, cover * 0.55);
      col = mix(col, bwAir(d), exp(-d.y * 10.0) * 0.5);
    }
    return mix(col, uBwGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createBwSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: bwSkyUniforms,
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
        gl_FragColor = vec4(bwSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'brinewire-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;     // drawn last of the opaques (sky-order.js)
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** The sun (the only shadow) and a hemisphere fill: dusty sky above, the dry mud's bounce below. */
export function createBwLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#f4e3bd'), 1.9);
  key.position.copy(BRINEWIRE_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#bfc6c4'), new THREE.Color('#80775f'), 1.25);
  return { key, hemi };
}

/** The sky rendered into a cube and filtered, for the cladding and the water to reflect. */
export function createBwEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createBwSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9a9078').multiplyScalar(0.6) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  for (const o of [dome, floor]) { o.geometry.dispose(); o.material.dispose(); }
  return rt;
}
