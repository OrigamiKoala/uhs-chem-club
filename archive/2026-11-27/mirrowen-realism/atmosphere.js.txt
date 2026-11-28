/**
 * mirrowen/atmosphere.js — The sky over Mirrowen, and the light it throws.
 *
 * A tidal shelf in the morning under a high white haze. The horizon is the colour of milk glass,
 * going up to a pale steel blue; a thin broken cirrus lies across it, drifting from the north-west;
 * the sun is east-south-east and about twenty-five degrees up, cold and white, a glare in the haze
 * with no hard disc. Nothing glows: it is the light of a very large, very cold room.
 *
 * ONE SKY FUNCTION. `mwSky` draws the dome, and the same shader is rendered once into a cube to
 * make the environment the water, the cladding and the ice reflect, so the canal holds the same
 * sky the player sees.
 *
 * THE FOG IS THE HORIZON'S COLOUR. Aerial perspective is three's own `Fog`, in the colour the
 * dome shows at the horizon, with `near` and `far` read by the voyage when it closes a cloud deck
 * over the world.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';

/** Toward the sun: east-south-east, twenty-five degrees up. */
export const MIRROWEN_SUN = new THREE.Vector3(0.8, 0.46, 0.42).normalize();

export const MWSKY = {
  zenith: new THREE.Color('#7f98ac'),
  upper: new THREE.Color('#a4bac8'),
  horizon: new THREE.Color('#ccd7da'),
  haze: new THREE.Color('#d6dfe1'),
  ground: new THREE.Color('#8b9ca2'),
  sunGlow: new THREE.Color('#eef3f2'),
  sun: new THREE.Color('#ffffff'),
  cloudLit: new THREE.Color('#f1f5f6'),
  cloudBody: new THREE.Color('#aebcc4')
};

/** Shared by the dome and the environment cube: one clock for the weather. */
export const mwSkyUniforms = {
  uMwTime: { value: 0 },
  uMwSun: { value: MIRROWEN_SUN },
  uMwZenith: { value: MWSKY.zenith },
  uMwUpper: { value: MWSKY.upper },
  uMwHorizon: { value: MWSKY.horizon },
  uMwHaze: { value: MWSKY.haze },
  uMwGround: { value: MWSKY.ground },
  uMwSunGlow: { value: MWSKY.sunGlow },
  uMwSunCol: { value: MWSKY.sun },
  uMwCloudLit: { value: MWSKY.cloudLit },
  uMwCloudBody: { value: MWSKY.cloudBody }
};

export const MW_SKY_GLSL = /* glsl */ `
  uniform float uMwTime;
  uniform vec3 uMwSun;
  uniform vec3 uMwZenith;
  uniform vec3 uMwUpper;
  uniform vec3 uMwHorizon;
  uniform vec3 uMwHaze;
  uniform vec3 uMwGround;
  uniform vec3 uMwSunGlow;
  uniform vec3 uMwSunCol;
  uniform vec3 uMwCloudLit;
  uniform vec3 uMwCloudBody;

  float mwHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float mwNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mwHash(i), mwHash(i + vec2(1, 0)), u.x),
               mix(mwHash(i + vec2(0, 1)), mwHash(i + vec2(1, 1)), u.x), u.y);
  }
  float mwFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * mwNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }

  /* The air toward d: the milk-glass haze on the horizon and the glare of the sun in it. No
     cloud: this is also the fog. */
  vec3 mwAir(vec3 d) {
    float h = d.y;
    float hp = max(h, 0.0);
    float mu = max(dot(d, uMwSun), 0.0);
    vec3 col = mix(uMwHorizon, uMwUpper, smoothstep(0.0, 0.38, pow(hp, 0.7)));
    col = mix(col, uMwZenith, smoothstep(0.32, 0.98, hp));
    col = mix(col, uMwHaze, exp(-abs(h) * 12.0) * 0.55);
    col += uMwSunGlow * (pow(mu, 3.0) * 0.26 + pow(mu, 16.0) * 0.4 + pow(mu, 110.0) * 0.7);
    col += uMwSunCol * pow(mu, 800.0) * 0.5;
    return col;
  }

  vec3 mwSky(vec3 d) {
    float h = d.y;
    vec3 col = mwAir(d);
    if (h > 0.0) {
      // A thin broken cirrus: long streaks drawn out along the wind.
      vec2 p = d.xz / (h + 0.1) * 1.2;
      p += vec2(uMwTime * 0.007, uMwTime * 0.0035);
      float base = mwFbm(vec2(p.x * 0.6, p.y * 1.5));
      float detail = mwFbm(vec2(p.x * 1.8, p.y * 4.2) + 9.1);
      float cover = smoothstep(0.46, 0.8, base * 0.8 + detail * 0.3);
      cover *= smoothstep(0.0, 0.07, h) * (0.5 + 0.5 * smoothstep(0.95, 0.25, h));
      float mu = dot(d, uMwSun);
      vec3 cloud = mix(uMwCloudBody, uMwCloudLit, smoothstep(-0.3, 0.9, mu) * (0.5 + 0.5 * detail));
      cloud += uMwSunGlow * pow(max(mu, 0.0), 8.0) * (1.0 - cover) * 0.3;
      col = mix(col, cloud, cover * 0.6);
      col = mix(col, mwAir(d), exp(-h * 9.0) * 0.55);
    }
    // Below the horizon: the sea's far side, faintly lit.
    col = mix(col, uMwGround, 1.0 - smoothstep(-0.1, 0.0, h));
    return col;
  }
`;

export function createMwSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: mwSkyUniforms,
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
      ${MW_SKY_GLSL}
      void main() {
        vec3 c = mwSky(normalize(vDir));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'mirrowen-sky';
  dome.frustumCulled = false;
  // Drawn last of the opaques, as every world's sky is (sky-order.js).
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** A dome that follows the eye, so the sky never parallaxes. Takes a position or a camera. */
export function followCamera(dome, eye) {
  const pos = eye?.isVector3 ? eye : eye?.position;
  if (pos) dome.position.copy(pos);
}

/**
 * The light on the shelf. A cold white sun from the east-south-east that casts the shadows, and
 * a hemisphere fill that is the pale haze above and the bounce off frost below. There is no
 * second key: the shelf has no light of its own but its lamps.
 */
export function createMwLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#edf3f7'), 2.0);
  key.position.copy(MIRROWEN_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    const s = 60;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#bdd0dc'), new THREE.Color('#7f8c90'), 1.25);
  return { key, hemi };
}

const _dir = new THREE.Vector3();
const _snap = new THREE.Vector3();

/**
 * The sun's shadow box follows the player in whole texels, so nothing swims,
 * and reports whether it moved (so the shadow is only re-drawn then).
 */
export function followMwShadow(key, focus, step = 0) {
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

/** The sky rendered into a cube and filtered, for the water, the cladding and the ice to reflect. */
export function createMwEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createMwSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#aab8bd').multiplyScalar(0.55) })
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
