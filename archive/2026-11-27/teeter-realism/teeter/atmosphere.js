/**
 * teeter/atmosphere.js — The sky over the salt pans, and the light it throws.
 *
 * A bright afternoon under a pale haze: the horizon is nearly white, paling upward to a washed blue-grey, a thin
 * veil drifting from the west, and a low flat sun with a wide skirt and no hard disc. Just above the horizon the
 * air shimmers, a slow band of evaporation that moves the sky's own colours and nothing else. Nothing blooms.
 * The same function is the fog colour and the environment map the cladding and the brine reflect. The sun's
 * shadow box and the dome that follows the eye are Ember Reach's own (`followErShadow`, `followCamera`): they
 * know nothing about a particular world.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';
export { followErShadow as followTtShadow, followCamera } from '../ember/atmosphere.js';

/** Toward the sun: west-south-west, fourteen degrees up. */
export const TEETER_SUN = new THREE.Vector3(-0.86, 0.25, 0.44).normalize();

export const TTSKY = {
  zenith: new THREE.Color('#7f949f'),
  upper: new THREE.Color('#aebcc0'),
  horizon: new THREE.Color('#dedacb'),
  haze: new THREE.Color('#e8e4d6'),
  ground: new THREE.Color('#c8c3b0'),
  sunGlow: new THREE.Color('#fbe7c0'),
  veilLit: new THREE.Color('#f1ecde'),
  veilBody: new THREE.Color('#a7aeb0')
};

export const ttSkyUniforms = {
  uTtTime: { value: 0 },
  uTtSun: { value: TEETER_SUN },
  uTtZenith: { value: TTSKY.zenith },
  uTtUpper: { value: TTSKY.upper },
  uTtHorizon: { value: TTSKY.horizon },
  uTtHaze: { value: TTSKY.haze },
  uTtGround: { value: TTSKY.ground },
  uTtSunGlow: { value: TTSKY.sunGlow },
  uTtVeilLit: { value: TTSKY.veilLit },
  uTtVeilBody: { value: TTSKY.veilBody }
};

const SKY_GLSL = /* glsl */ `
  uniform float uTtTime;
  uniform vec3 uTtSun, uTtZenith, uTtUpper, uTtHorizon, uTtHaze, uTtGround, uTtSunGlow, uTtVeilLit, uTtVeilBody;
  float ttHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float ttNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(ttHash(i), ttHash(i + vec2(1, 0)), u.x), mix(ttHash(i + vec2(0, 1)), ttHash(i + vec2(1, 1)), u.x), u.y);
  }
  float ttFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * ttNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }
  vec3 ttAir(vec3 d) {
    float hp = max(d.y, 0.0);
    float mu = max(dot(d, uTtSun), 0.0);
    vec3 col = mix(uTtHorizon, uTtUpper, smoothstep(0.0, 0.36, pow(hp, 0.75)));
    col = mix(col, uTtZenith, smoothstep(0.35, 1.0, hp));
    col = mix(col, uTtHaze, exp(-abs(d.y) * 12.0) * 0.6);
    col += uTtSunGlow * (pow(mu, 4.0) * 0.3 + pow(mu, 22.0) * 0.45 + pow(mu, 140.0) * 0.5);
    return col;
  }
  vec3 ttSky(vec3 d) {
    // Evaporative shimmer: a slow ripple of the air just over the horizon, fading out by about six degrees up.
    float band = exp(-abs(d.y) * 34.0);
    d.y += band * 0.006 * sin(d.x * 90.0 + d.z * 70.0 + uTtTime * 0.7) * sin(d.z * 41.0 - uTtTime * 0.4);
    vec3 col = ttAir(d);
    if (d.y > 0.0) {
      vec2 p = d.xz / (d.y + 0.1) * 1.2 + vec2(uTtTime * 0.008, -uTtTime * 0.003);
      float cover = smoothstep(0.45, 0.8, ttFbm(p) * 0.8 + ttFbm(p * 2.6 + 5.0) * 0.3);
      cover *= smoothstep(0.0, 0.08, d.y) * 0.8;
      vec3 veil = mix(uTtVeilBody, uTtVeilLit, smoothstep(-0.2, 0.9, dot(d, uTtSun)));
      col = mix(col, veil, cover * 0.7);
      col = mix(col, ttAir(d), exp(-d.y * 10.0) * 0.5);
    }
    return mix(col, uTtGround, 1.0 - smoothstep(-0.1, 0.0, d.y));
  }
`;

export function createTtSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: ttSkyUniforms,
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
        gl_FragColor = vec4(ttSky(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'teeter-sky';
  dome.frustumCulled = false;
  dome.renderOrder = SKY_RENDER_ORDER;     // drawn last of the opaques (sky-order.js)
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** The sun (the only shadow) and a hemisphere fill: pale sky above, the crust's warm bounce below. */
export function createTtLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#fff1d8'), 2.3);
  key.position.copy(TEETER_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#cfd6d6'), new THREE.Color('#b9b6a6'), 1.2);
  return { key, hemi };
}

/** The sky rendered into a cube and filtered, for the cladding and the brine to reflect. */
export function createTtEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createTtSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#d9d6c8').multiplyScalar(0.6) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  for (const o of [dome, floor]) { o.geometry.dispose(); o.material.dispose(); }
  return rt;
}
