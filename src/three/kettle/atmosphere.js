/**
 * kettle/atmosphere.js — The sky over the soda flat, and the light it throws.
 *
 * An afternoon under a haze of works dust: amber on the horizon, paling upward to a warm grey, a high thin
 * veil drifting from the west, and a low sun with a wide skirt and no hard disc. Nothing blooms. The same
 * function is the fog colour and the environment map the cladding and glass reflect. The sun's shadow box
 * and the dome that follows the eye are Ember Reach's own (`followErShadow`, `followCamera`): they know
 * nothing about a particular world.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followKtShadow, followCamera } from '../ember/atmosphere.js';

/** Toward the sun: west-south-west, twenty-three degrees up. */
export const KETTLE_SUN = new THREE.Vector3(-0.8, 0.42, 0.42).normalize();

export const KTSKY = {
  zenith: new THREE.Color('#5d5b58'),
  upper: new THREE.Color('#8f8678'),
  horizon: new THREE.Color('#bfa77d'),
  haze: new THREE.Color('#c8b088'),
  ground: new THREE.Color('#9a8c76'),
  sunGlow: new THREE.Color('#f0c586'),
  veilLit: new THREE.Color('#e3cfa8'),
  veilBody: new THREE.Color('#8a8074')
};

export const ktSkyUniforms = {
  uKtTime: { value: 0 },
  uKtSun: { value: KETTLE_SUN },
  uKtZenith: { value: KTSKY.zenith },
  uKtUpper: { value: KTSKY.upper },
  uKtHorizon: { value: KTSKY.horizon },
  uKtHaze: { value: KTSKY.haze },
  uKtGround: { value: KTSKY.ground },
  uKtSunGlow: { value: KTSKY.sunGlow },
  uKtVeilLit: { value: KTSKY.veilLit },
  uKtVeilBody: { value: KTSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uKtTime;
  uniform vec3 uKtSun, uKtZenith, uKtUpper, uKtHorizon, uKtHaze, uKtGround, uKtSunGlow, uKtVeilLit, uKtVeilBody;
  float ktHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float ktNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(ktHash(i), ktHash(i + vec2(1, 0)), u.x), mix(ktHash(i + vec2(0, 1)), ktHash(i + vec2(1, 1)), u.x), u.y);
  }
  float ktFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * ktNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 ktAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uKtSun), 0.0);
    vec3 col = mix(uKtHorizon, uKtUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uKtZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uKtHaze, exp(-abs(d.y) * 12.0) * 0.6);
    col += uKtSunGlow * (pow(mu, 4.0) * 0.3 + pow(mu, 22.0) * 0.45 + pow(mu, 140.0) * 0.5);
    return col;
  }
  vec3 ktSky(vec3 d) {
    vec3 col = ktAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uKtTime * 0.008, -uKtTime * 0.003);
      float cover = smoothstep(0.45, 0.8, ktFbm(p) * 0.8 + ktFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uKtVeilBody, uKtVeilLit, smoothstep(-0.2, 0.9, dot(d, uKtSun)));
      col = mix(col, veil, cover * 0.7);
      col = mix(col, ktAir(d), exp(-d.y * 10.0) * 0.5);
    }
    return mix(col, uKtGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createKtSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: ktSkyUniforms,
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
        gl_FragColor = vec4(ktSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'kettle-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;     // drawn last of the opaques (sky-order.js)
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** The sun (the only shadow) and a hemisphere fill: pale sky above, the crust's warm bounce below. */
export function createKtLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#ffe0b0'), 2.2);
  key.position.copy(KETTLE_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#cdbf9f'), new THREE.Color('#9d9179'), 1.15);
  return { key, hemi };
}

/** The sky rendered into a cube and filtered, for the cladding and the glass to reflect. */
export function createKtEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createKtSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#cfc8b4').multiplyScalar(0.55) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  for (const o of [dome, floor]) { o.geometry.dispose(); o.material.dispose(); }
  return rt;
}
