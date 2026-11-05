/**
 * verdigris/atmosphere.js — The sky over the acid marsh, and the light it throws.
 *
 * A humid, windless afternoon under a low green-grey haze: the horizon is a pale lichen grey, deepening upward to a
 * damp slate, a thick veil of cloud covering most of the sky, and a low sun that is only a brighter patch in the
 * cloud, with no hard disc. The air does not shimmer. Nothing blooms. The same function is the fog colour and the
 * environment map the cladding and the water reflect. The sun's shadow box and the dome that follows the eye are
 * Ember Reach's own (`followErShadow`, `followCamera`): they know nothing about a particular world.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followVdShadow, followCamera } from '../ember/atmosphere.js';

/** Toward the sun: west-south-west, fourteen degrees up. */
export const VERDIGRIS_SUN = new THREE.Vector3(-0.8, 0.3, 0.5).normalize();

export const VDSKY = {
  zenith: new THREE.Color('#5f6f69'),
  upper: new THREE.Color('#7f9087'),
  horizon: new THREE.Color('#a9b4a6'),
  haze: new THREE.Color('#b6beac'),
  ground: new THREE.Color('#7d8a7c'),
  sunGlow: new THREE.Color('#e9e4c4'),
  veilLit: new THREE.Color('#c3cabc'),
  veilBody: new THREE.Color('#78867e')
};

export const vdSkyUniforms = {
  uVdTime: { value: 0 },
  uVdSun: { value: VERDIGRIS_SUN },
  uVdZenith: { value: VDSKY.zenith },
  uVdUpper: { value: VDSKY.upper },
  uVdHorizon: { value: VDSKY.horizon },
  uVdHaze: { value: VDSKY.haze },
  uVdGround: { value: VDSKY.ground },
  uVdSunGlow: { value: VDSKY.sunGlow },
  uVdVeilLit: { value: VDSKY.veilLit },
  uVdVeilBody: { value: VDSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uVdTime;
  uniform vec3 uVdSun, uVdZenith, uVdUpper, uVdHorizon, uVdHaze, uVdGround, uVdSunGlow, uVdVeilLit, uVdVeilBody;
  float vdHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vdNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(vdHash(i), vdHash(i + vec2(1, 0)), u.x), mix(vdHash(i + vec2(0, 1)), vdHash(i + vec2(1, 1)), u.x), u.y);
  }
  float vdFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * vdNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 vdAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uVdSun), 0.0);
    vec3 col = mix(uVdHorizon, uVdUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uVdZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uVdHaze, exp(-abs(d.y) * 12.0) * 0.6);
    col += uVdSunGlow * (pow(mu, 4.0) * 0.2 + pow(mu, 22.0) * 0.25 + pow(mu, 140.0) * 0.12);
    return col;
  }
  vec3 vdSky(vec3 d) {
    vec3 col = vdAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uVdTime * 0.008, -uVdTime * 0.003);
      float cover = smoothstep(0.3, 0.62, vdFbm(p) * 0.8 + vdFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uVdVeilBody, uVdVeilLit, smoothstep(-0.2, 0.9, dot(d, uVdSun)));
      col = mix(col, veil, cover * 0.85);
      col = mix(col, vdAir(d), exp(-d.y * 10.0) * 0.5);
    }
    return mix(col, uVdGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createVdSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: vdSkyUniforms,
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
        gl_FragColor = vec4(vdSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'verdigris-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;     // drawn last of the opaques (sky-order.js)
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** The sun (the only shadow) and a hemisphere fill: damp sky above, the mud's dull bounce below. */
export function createVdLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#f1ead2'), 1.9);
  key.position.copy(VERDIGRIS_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#aebdb2'), new THREE.Color('#6f7a66'), 1.25);
  return { key, hemi };
}

/** The sky rendered into a cube and filtered, for the cladding and the water to reflect. */
export function createVdEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createVdSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#8b9886').multiplyScalar(0.6) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  for (const o of [dome, floor]) { o.geometry.dispose(); o.material.dispose(); }
  return rt;
}
