/**
 * bellows/atmosphere.js — The sky over Bellows, the cloud sea under it, and the
 * light between them.
 *
 * Bellows is a deck in thin air above a sea of cloud. The sky is deep and dark at
 * the top because there is little air over it to scatter anything, the horizon is
 * a band of pale haze, the sun stands high and white, and below the deck the
 * cloud runs level to the edge of the world, lit from above and blue where it is
 * in its own shadow. It is the one world with no ground: what you stand on is a
 * plate, and what is under the plate is weather.
 *
 * ONE SKY FUNCTION. `bwSky` draws the dome, and the same shader is rendered once
 * into a cube to make the environment the deck's metal reflects. The cloud sea is
 * a plane of its own (`createCloudSea`) that carries its own haze, because it
 * must meet the dome at the horizon in the SAME colour or there is a seam.
 *
 * THE SUN IS NOT A LAMP. It is a bright patch with a halo and no disc, drawn the
 * way Tallow's is: a disc would be the loudest light in the world and would bloom
 * (CLAUDE.md §1, "nothing blooms").
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';

export const BWSKY = {
  zenith: new THREE.Color('#0b1c52'),
  mid: new THREE.Color('#2e62b0'),
  horizon: new THREE.Color('#c8d6ea'),
  haze: new THREE.Color('#ead9bd'),
  sea: new THREE.Color('#dfe7f3')
};

/** Where the sun stands: 34 degrees up, west-south-west. */
const SUN_EL = THREE.MathUtils.degToRad(34);
const SUN_AZ = THREE.MathUtils.degToRad(250);
export const SUN_DIR = new THREE.Vector3(
  Math.sin(SUN_AZ) * Math.cos(SUN_EL), Math.sin(SUN_EL), Math.cos(SUN_AZ) * Math.cos(SUN_EL)
).normalize();

/** Shared by the dome, the environment cube and the cloud sea: one clock, one sun. */
export const bwSkyUniforms = {
  uBwTime: { value: 0 },
  uBwZenith: { value: BWSKY.zenith },
  uBwMid: { value: BWSKY.mid },
  uBwHorizon: { value: BWSKY.horizon },
  uBwHaze: { value: BWSKY.haze },
  uBwSea: { value: BWSKY.sea },
  uBwSun: { value: SUN_DIR }
};

export const BW_NOISE_GLSL = /* glsl */ `
  float bwHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float bwNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bwHash(i), bwHash(i + vec2(1, 0)), u.x),
               mix(bwHash(i + vec2(0, 1)), bwHash(i + vec2(1, 1)), u.x), u.y);
  }
  float bwFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * bwNoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }
`;

export const BW_SKY_GLSL = /* glsl */ `
  uniform float uBwTime;
  uniform vec3 uBwZenith;
  uniform vec3 uBwMid;
  uniform vec3 uBwHorizon;
  uniform vec3 uBwHaze;
  uniform vec3 uBwSea;
  uniform vec3 uBwSun;
  ${BW_NOISE_GLSL}

  vec3 bwSky(vec3 d) {
    float h = d.y;
    // Thin air: the sky goes deep blue fast, and a band of haze hangs on the horizon.
    vec3 col = mix(uBwHorizon, uBwMid, smoothstep(0.0, 0.22, h));
    col = mix(col, uBwZenith, smoothstep(0.18, 0.85, h));

    // The sun: a hot patch and a wide halo, with no disc to it.
    float s = max(dot(d, normalize(uBwSun)), 0.0);
    col += uBwHaze * (pow(s, 6.0) * 0.38 + pow(s, 48.0) * 0.55);
    col += vec3(1.0, 0.97, 0.9) * pow(s, 700.0) * 2.4;

    // High cirrus: long streaks combed by the wind, thin enough to see the dark through.
    if (h > 0.04) {
      vec2 q = d.xz / (h + 0.18);
      float c = bwFbm(vec2(q.x * 1.4 + uBwTime * 0.004, q.y * 9.0));
      col = mix(col, vec3(0.82, 0.88, 0.97), smoothstep(0.58, 0.86, c) * 0.22 * smoothstep(0.04, 0.3, h));
    }

    // Below the horizon the sea of cloud: the dome shows its far colour, never a seam.
    float below = 1.0 - smoothstep(-0.06, 0.0, h);
    return mix(col, uBwSea, below);
  }
`;

export function createBwSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: bwSkyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w * 0.999999;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      ${BW_SKY_GLSL}
      void main() {
        vec3 c = bwSky(normalize(vDir));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'bellows-sky';
  dome.frustumCulled = false;
  // Drawn after everything that writes depth, so early-z throws away every fragment
  // the deck or the cloud sea has already covered (sky-order.js).
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/**
 * A dome that follows whatever camera draws it, so the sky never parallaxes.
 * Takes the eye's position (what `update(delta, cameraPos)` is handed by the
 * stage and the voyage), or a camera.
 */
export function followCamera(dome, eye) {
  const pos = eye?.isVector3 ? eye : eye?.position;
  if (pos) dome.position.copy(pos);
}

/**
 * The cloud sea: a level plane of cumulus tops, lit by the sun from the side they
 * face and blue in their own shadow, running to the horizon in the haze's colour.
 * It is one draw call and one noise function; the parallax the eye wants comes
 * from the cloud heads standing out of it (`props.js`).
 */
export function createCloudSea({ radius = 1500, y = -46 } = {}) {
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { ...bwSkyUniforms, uBwEye: { value: new THREE.Vector3() } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      uniform vec3 uBwEye;
      ${BW_SKY_GLSL}
      void main() {
        vec3 to = vWorld - uBwEye;
        float dist = length(to);
        vec2 p = vWorld.xz * 0.011 + vec2(uBwTime * 0.006, uBwTime * 0.003);
        // Billows: a warped fbm, with a second sample displaced toward the sun for the shading.
        vec2 warp = vec2(bwFbm(p * 0.7 + 3.1), bwFbm(p * 0.7 + 8.7)) - 0.5;
        float n = bwFbm(p + warp * 1.6);
        vec2 sunStep = normalize(uBwSun.xz + 1e-4) * 0.045;
        float nSun = bwFbm(p + warp * 1.6 + sunStep);
        float body = smoothstep(0.30, 0.74, n);
        float shade = clamp(0.62 + (n - nSun) * 7.5, 0.0, 1.0);
        vec3 shadowC = vec3(0.50, 0.60, 0.80);
        vec3 litC = vec3(0.97, 0.97, 0.99);
        vec3 deepC = vec3(0.24, 0.36, 0.60);
        vec3 col = mix(shadowC, litC, shade);
        col = mix(deepC, col, body);
        // Fine rime on the tops, so a cloud is not a smooth plastic.
        col += (bwNoise(vWorld.xz * 0.18) - 0.5) * 0.04 * body;
        // The haze takes the far sea into the sky's own horizon colour.
        float far = smoothstep(260.0, 1350.0, dist);
        col = mix(col, uBwSea, far);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const geo = new THREE.CircleGeometry(radius, 64);
  geo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geo, mat);
  sea.name = 'bellows-cloud-sea';
  sea.position.y = y;
  sea.frustumCulled = false;
  sea.userData.phys = 'ground';
  sea.userData.noWeather = true;
  return sea;
}

/**
 * The light on the deck. A white sun high in the west and a hemisphere fill that
 * is the deep sky above and, below, the bright cloud sea throwing the sun back up
 * at the underside of everything.
 */
export function createBwLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#fff0d6'), 2.3);
  key.position.copy(SUN_DIR).multiplyScalar(160);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    const s = 60;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 420 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#5d8bd0'), new THREE.Color('#e3eaf5'), 1.5);
  return { key, hemi };
}

const _dir = new THREE.Vector3();
const _snap = new THREE.Vector3();

/**
 * The sun's shadow box follows the player in whole texels, so nothing swims, and
 * reports whether it moved (so the shadow is only re-drawn then).
 */
export function followBwShadow(key, focus, step = 0) {
  if (!key.castShadow) return false;
  const cam = key.shadow.camera;
  const texel = (cam.right - cam.left) / key.shadow.mapSize.x;
  const q = Math.max(1, Math.round(step / texel)) * texel;
  _dir.copy(key.position).sub(key.target.position).normalize();
  const right = _snap.set(0, 1, 0).cross(_dir).normalize().clone();
  const up = new THREE.Vector3().copy(_dir).cross(right).normalize();
  const a = Math.round(focus.dot(right) / q) * q;
  const b = Math.round(focus.dot(up) / q) * q;
  const c = Math.round(focus.dot(_dir) / 0.5) * 0.5;
  const target = new THREE.Vector3().copy(right).multiplyScalar(a).addScaledVector(up, b).addScaledVector(_dir, c);
  if (target.equals(key.target.position)) return false;
  key.target.position.copy(target);
  key.position.copy(target).addScaledVector(_dir, 240);
  key.target.updateMatrixWorld();
  return true;
}

/** The sky and a floor of bright cloud rendered into a cube and filtered, for the deck's metal to reflect. */
export function createBwEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createBwSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#dfe7f3').multiplyScalar(0.8) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  dome.geometry.dispose();
  dome.material.dispose();
  floor.geometry.dispose();
  floor.material.dispose();
  return rt;
}
